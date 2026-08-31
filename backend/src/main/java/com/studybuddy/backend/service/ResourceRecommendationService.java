package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studybuddy.backend.dto.LearningDebtHierarchyDTO;
import com.studybuddy.backend.dto.ResourceRecommendationDTO;
import com.studybuddy.backend.dto.SWOTResponseDTO;
import com.studybuddy.backend.entity.ResourceRecommendationCache;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.ResourceRecommendationCacheRepository;
import com.studybuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ResourceRecommendationService {

    private final UserRepository userRepository;
    private final ResourceRecommendationCacheRepository cacheRepository;
    private final LearningDebtService learningDebtService;
    private final SWOTService swotService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    @Transactional(readOnly = true)
    public ResourceRecommendationDTO getLatestRecommendations(String email) {
        User user = findUser(email);
        Optional<ResourceRecommendationCache> cacheOpt = cacheRepository.findByStudent(user);
        if (cacheOpt.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(cacheOpt.get().getPayload(), ResourceRecommendationDTO.class);
        } catch (Exception e) {
            System.err.println("Failed to parse cached recommendations: " + e.getMessage());
            return null;
        }
    }

    @Transactional
    public ResourceRecommendationDTO generateRecommendations(String email) {
        User user = findUser(email);

        // a. Gather weak topics from Learning Debt hierarchy
        LearningDebtHierarchyDTO hierarchy = learningDebtService.getHierarchyGraph(email);
        List<String> weakTopicsSummary = new ArrayList<>();
        extractWeakTopics(hierarchy, weakTopicsSummary);

        // b. Gather SWOT & performance data
        SWOTResponseDTO swot = swotService.generateSWOT(user);
        List<String> weaknesses = swot.getWeaknesses() != null ? swot.getWeaknesses() : new ArrayList<>();
        List<String> threats = swot.getThreats() != null ? swot.getThreats() : new ArrayList<>();

        String perfTrend = "CGPA Trend: " + String.format("%.2f", swot.getCgpaTrend())
                + ", Top Subject: " + (swot.getTopSubject() != null ? swot.getTopSubject() : "N/A")
                + ", Weakest Subject: " + (swot.getWeakestSubject() != null ? swot.getWeakestSubject() : "N/A");


        // Build compact JSON summary for prompt
        String prompt = """
                You are the StudyBuddy AI Resource Recommender.
                Analyze this student profile and recommend targeted study resources:

                Branch: %s
                Semester: %d
                Performance Trend: %s
                Weak Topics / Learning Debt: %s
                SWOT Weaknesses: %s
                SWOT Threats: %s

                Task:
                Generate resource recommendations tailored to their weak areas.
                Return ONLY valid JSON (no markdown, no preamble) shaped like:
                {
                  "overallInsight": "1-2 sentence summary of the student's learning pattern",
                  "recommendations": [
                    {
                      "topic": "Topic Name",
                      "priority": "HIGH",
                      "reason": "Clear explanation of why this topic and resource type fits their pattern",
                      "resourceType": "VIDEO"
                    }
                  ]
                }

                Rules:
                - priority must be one of: HIGH, MEDIUM, LOW
                - resourceType must be one of: VIDEO, PRACTICE, READING, MIXED
                - limit to 3 to 6 high-value recommendations
                - return raw JSON only
                """.formatted(
                user.getBranch() != null ? user.getBranch() : "Engineering",
                user.getCurrentSemester() != null ? user.getCurrentSemester() : 1,
                perfTrend,
                weakTopicsSummary.isEmpty() ? "None recorded" : String.join(", ", weakTopicsSummary),
                weaknesses.isEmpty() ? "None" : String.join(", ", weaknesses),
                threats.isEmpty() ? "None" : String.join(", ", threats)
        );

        String aiResponse = geminiService.generatePlainText(prompt);
        ResourceRecommendationDTO result = parseAndBuildRecommendations(aiResponse, weakTopicsSummary);

        // Append search links deterministically
        for (ResourceRecommendationDTO.RecommendationItem item : result.getRecommendations()) {
            String topic = item.getTopic() != null ? item.getTopic() : "Study Topic";
            try {
                item.setYoutubeSearchUrl("https://www.youtube.com/results?search_query=" + URLEncoder.encode(topic + " tutorial", StandardCharsets.UTF_8));
                item.setGeeksforgeeksSearchUrl("https://www.geeksforgeeks.org/?s=" + URLEncoder.encode(topic, StandardCharsets.UTF_8));
                item.setNptelSearchUrl("https://nptel.ac.in/search?q=" + URLEncoder.encode(topic, StandardCharsets.UTF_8));
            } catch (Exception e) {
                // Ignore URL encoding errors
            }
        }

        // Save/Update cache row for student
        cacheRepository.deleteByStudent(user);
        try {
            ResourceRecommendationCache cache = new ResourceRecommendationCache();
            cache.setStudent(user);
            cache.setGeneratedAt(LocalDateTime.now());
            cache.setPayload(objectMapper.writeValueAsString(result));
            cacheRepository.save(cache);
        } catch (Exception e) {
            System.err.println("Failed to cache recommendations: " + e.getMessage());
        }

        return result;
    }

    private void extractWeakTopics(LearningDebtHierarchyDTO node, List<String> list) {
        if (node == null) return;
        if ("LOW".equalsIgnoreCase(node.getMasteryLevel()) || (node.getDebtScore() != null && node.getDebtScore() > 0.40)) {
            if (node.getName() != null && !list.contains(node.getName())) {
                list.add(node.getName() + " (debt: " + node.getDebtScore() + ")");
            }
        }
        if (node.getChildren() != null) {
            for (LearningDebtHierarchyDTO child : node.getChildren()) {
                extractWeakTopics(child, list);
            }
        }
    }

    private ResourceRecommendationDTO parseAndBuildRecommendations(String aiResponse, List<String> fallbackTopics) {
        ResourceRecommendationDTO dto = new ResourceRecommendationDTO();
        dto.setOverallInsight("Focus on reinforcing foundational topics to bridge your current learning debt.");
        List<ResourceRecommendationDTO.RecommendationItem> items = new ArrayList<>();

        if (aiResponse != null && !aiResponse.isBlank()) {
            try {
                String text = aiResponse.trim();
                if (text.startsWith("```")) {
                    text = text.replaceAll("```json", "").replaceAll("```", "").trim();
                }
                int start = text.indexOf('{');
                int end = text.lastIndexOf('}');
                if (start >= 0 && end > start) {
                    text = text.substring(start, end + 1);
                }

                JsonNode root = objectMapper.readTree(text);
                if (root.has("overallInsight") && !root.path("overallInsight").asText().isBlank()) {
                    dto.setOverallInsight(root.path("overallInsight").asText());
                }

                JsonNode recsNode = root.path("recommendations");
                if (recsNode.isArray()) {
                    for (JsonNode r : recsNode) {
                        ResourceRecommendationDTO.RecommendationItem item = new ResourceRecommendationDTO.RecommendationItem();
                        item.setTopic(r.path("topic").asText("Core Topic"));
                        item.setPriority(r.path("priority").asText("HIGH").toUpperCase());
                        item.setReason(r.path("reason").asText("Key topic identified for progress improvement."));
                        item.setResourceType(r.path("resourceType").asText("VIDEO").toUpperCase());
                        items.add(item);
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to parse Gemini recommendation JSON: " + e.getMessage());
            }
        }

        if (items.isEmpty()) {
            // Fallback items if AI didn't return any
            for (String t : fallbackTopics) {
                String cleanName = t.split(" \\(")[0];
                ResourceRecommendationDTO.RecommendationItem item = new ResourceRecommendationDTO.RecommendationItem();
                item.setTopic(cleanName);
                item.setPriority("HIGH");
                item.setReason("High learning debt detected in this topic.");
                item.setResourceType("VIDEO");
                items.add(item);
            }
            if (items.isEmpty()) {
                ResourceRecommendationDTO.RecommendationItem item = new ResourceRecommendationDTO.RecommendationItem();
                item.setTopic("General Fundamentals");
                item.setPriority("HIGH");
                item.setReason("Complete your semester topic quizzes to receive tailored resource recommendations.");
                item.setResourceType("MIXED");
                items.add(item);
            }
        }

        dto.setRecommendations(items);
        return dto;
    }
}
