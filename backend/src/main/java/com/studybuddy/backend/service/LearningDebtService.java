package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.studybuddy.backend.dto.LearningDebtGraphDTO;
import com.studybuddy.backend.entity.ConceptDependency;
import com.studybuddy.backend.entity.SyllabusNode;
import com.studybuddy.backend.entity.TopicProgress;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.ConceptDependencyRepository;
import com.studybuddy.backend.repository.SyllabusNodeRepository;
import com.studybuddy.backend.repository.TopicProgressRepository;
import com.studybuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningDebtService {

    private final ConceptDependencyRepository dependencyRepository;
    private final TopicProgressRepository progressRepository;
    private final SyllabusNodeRepository nodeRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final ObjectMapper mapper = new ObjectMapper();

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    public LearningDebtGraphDTO getGraph(String email) {
        User user = findUser(email);

        List<TopicProgress> progresses = progressRepository.findByUser(user);

        // Find weak topics (score < 60)
        List<TopicProgress> weakTopics = progresses.stream()
                .filter(p -> p.getScore() != null && p.getScore().compareTo(BigDecimal.valueOf(60)) < 0)
                .collect(Collectors.toList());

        LearningDebtGraphDTO result = new LearningDebtGraphDTO();
        List<LearningDebtGraphDTO.WeakTopicDTO> weakTopicsList = new ArrayList<>();

        for (TopicProgress wp : weakTopics) {
            SyllabusNode weakNode = wp.getTopic();

            List<ConceptDependency> dependencies = dependencyRepository.findByParentTopicNodeId(weakNode.getId());

            LearningDebtGraphDTO.WeakTopicDTO wDto = new LearningDebtGraphDTO.WeakTopicDTO();
            wDto.setId(weakNode.getId());
            wDto.setName(weakNode.getName());
            wDto.setScore(wp.getScore());

            List<LearningDebtGraphDTO.AffectedTopicDTO> affectedList = new ArrayList<>();
            for (ConceptDependency dep : dependencies) {
                if (dep.getChildTopicNode() != null) {
                    LearningDebtGraphDTO.AffectedTopicDTO aDto = new LearningDebtGraphDTO.AffectedTopicDTO();
                    aDto.setId(dep.getChildTopicNode().getId());
                    aDto.setName(dep.getChildTopicNode().getName());
                    aDto.setReason(dep.getReason());
                    aDto.setSource(dep.getSource() != null ? dep.getSource() : "db");
                    affectedList.add(aDto);
                }
            }
            wDto.setAffects(affectedList);
            weakTopicsList.add(wDto);
        }

        result.setWeakTopics(weakTopicsList);
        return result;
    }

    @Transactional
    public LearningDebtGraphDTO analyzeAndCacheDebt(String email) {
        User user = findUser(email);

        List<TopicProgress> progresses = progressRepository.findByUser(user);

        List<TopicProgress> weakTopics = progresses.stream()
                .filter(p -> p.getScore() != null && p.getScore().compareTo(BigDecimal.valueOf(60)) < 0)
                .collect(Collectors.toList());

        Integer semester = user.getCurrentSemester() != null ? user.getCurrentSemester() : 1;
        String branch = user.getBranch() != null ? user.getBranch() : "";

        // Fetch future syllabus topics (same or higher semester)
        List<SyllabusNode> futureTopics = nodeRepository.findByBranchAndSemesterGreaterThanEqual(branch, semester);

        // Convert future topics to JSON
        ArrayNode futureTopicsJson = mapper.createArrayNode();
        for (SyllabusNode fn : futureTopics) {
            ObjectNode obj = mapper.createObjectNode();
            obj.put("id", fn.getId().toString());
            obj.put("name", fn.getName());
            futureTopicsJson.add(obj);
        }
        String futureTopicsString = futureTopicsJson.toString();

        for (TopicProgress wp : weakTopics) {
            SyllabusNode weakNode = wp.getTopic();

            List<LearningDebtGraphDTO.AffectedTopicDTO> aiAffects = geminiService.analyzeLearningDebt(
                    weakNode.getName(),
                    weakNode.getId().toString(),
                    branch,
                    semester,
                    futureTopicsString,
                    wp.getScore().doubleValue()
            );

            for (LearningDebtGraphDTO.AffectedTopicDTO affect : aiAffects) {
                if (affect.getId() == null) continue;

                // Only save to DB if the topic exists in syllabus_nodes (valid ID from our list)
                SyllabusNode childNode = nodeRepository.findById(affect.getId()).orElse(null);
                if (childNode == null) {
                    // Gemini invented a topic not in DB — skip caching but still returned via AI response
                    continue;
                }

                // Prevent duplicate dependencies
                boolean exists = dependencyRepository.findByParentTopicNodeId(weakNode.getId()).stream()
                        .anyMatch(d -> d.getChildTopicNode() != null
                                && d.getChildTopicNode().getId().equals(affect.getId()));

                if (!exists) {
                    ConceptDependency newDep = new ConceptDependency();
                    newDep.setParentTopicNode(weakNode);
                    newDep.setChildTopicNode(childNode);
                    newDep.setSource("ai");
                    newDep.setReason(affect.getReason());
                    dependencyRepository.save(newDep);
                }
            }
        }

        // Return the updated (merged DB + newly cached AI) graph
        return getGraph(email);
    }

}