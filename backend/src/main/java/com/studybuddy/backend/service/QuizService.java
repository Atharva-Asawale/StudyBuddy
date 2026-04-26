package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.QuizQuestionDTO;
import com.studybuddy.backend.dto.QuizResultDTO;
import com.studybuddy.backend.dto.QuizSubmitRequest;
import com.studybuddy.backend.entity.QuizResult;
import com.studybuddy.backend.entity.SyllabusNode;
import com.studybuddy.backend.entity.TopicProgress;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.QuizResultRepository;
import com.studybuddy.backend.repository.SyllabusNodeRepository;
import com.studybuddy.backend.repository.TopicProgressRepository;
import com.studybuddy.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;
import java.util.UUID;

@Service
public class QuizService {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private RagService ragService;

    @Autowired
    private SyllabusNodeRepository syllabusNodeRepository;

    @Autowired
    private TopicProgressRepository topicProgressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizResultRepository quizResultRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    // Generate quiz for a topic
    public List<QuizQuestionDTO> generateQuiz(UUID topicId, MultipartFile file) {
        SyllabusNode topic = syllabusNodeRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));

        String subjectName = getSubjectName(topic);

        if (file != null && !file.isEmpty()) {
            return generateRagQuiz(topic.getName(), subjectName, file);
        }

        return geminiService.generateQuiz(topic.getName(), subjectName);
    }

    private List<QuizQuestionDTO> generateRagQuiz(String topicName, String subjectName, MultipartFile file) {
        try {
            String rawText = ragService.extractText(file);
            String cleanedText = rawText.trim().replaceAll("\\s+", " ");
            
            List<Map<String, String>> knowledgeMap = ragService.extractCoreFacts(cleanedText);
            String keywordsJson = mapper.writeValueAsString(knowledgeMap);
            String selectedChunks = ragService.getSelectedChunks(cleanedText, knowledgeMap);

            String prompt = String.format("""
                [SYSTEM: PRECISION EXAM GENERATOR]
                You are a subject matter expert. Generate a 10-question MCQ quiz for topic "%s" in subject "%s".
                
                [CORE KNOWLEDGE MAP (JSON)]:
                %s
                
                [SOURCE MATERIAL (TEXT)]:
                %s
                
                RULES:
                1. Generate exactly 10 questions.
                2. Mix easy, medium, and hard difficulty.
                3. Each question must have 4 options and one correctIndex (0-3).
                
                FORMAT:
                [
                  {
                    "question": "...",
                    "options": ["A", "B", "C", "D"],
                    "correctIndex": 0
                  }
                ]
                """, topicName, subjectName, keywordsJson, selectedChunks);

            String response = geminiService.generatePlainText(prompt);
            return parseQuestions(response);

        } catch (Exception e) {
            throw new RuntimeException("RAG Quiz generation failed: " + e.getMessage());
        }
    }

    private List<QuizQuestionDTO> parseQuestions(String text) {
        try {
            if (text == null || text.isBlank()) return new ArrayList<>();
            
            String json = text.trim();
            if (json.startsWith("```")) {
                json = json.replaceAll("```json", "").replaceAll("```", "").trim();
            }
            int start = json.indexOf('[');
            int end = json.lastIndexOf(']');
            if (start >= 0 && end > start) json = json.substring(start, end + 1);

            JsonNode nodes = mapper.readTree(json);
            List<QuizQuestionDTO> questions = new ArrayList<>();
            for (JsonNode node : nodes) {
                QuizQuestionDTO q = new QuizQuestionDTO();
                q.setQuestion(node.path("question").asText());
                List<String> options = new ArrayList<>();
                for (JsonNode opt : node.path("options")) options.add(opt.asText());
                q.setOptions(options);
                q.setCorrectIndex(node.path("correctIndex").asInt());
                if (!q.getQuestion().isEmpty() && q.getOptions().size() == 4) {
                    questions.add(q);
                }
            }
            return questions;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    // Submit quiz and save progress
    public QuizResultDTO submitQuiz(String email, QuizSubmitRequest request,
                                    List<QuizQuestionDTO> questions) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SyllabusNode topic = syllabusNodeRepository.findById(request.getTopicId())
                .orElseThrow(() -> new RuntimeException("Topic not found"));

        // Calculate score
        int correct = 0;
        List<Integer> selected = request.getSelectedAnswers();
        for (int i = 0; i < questions.size() && i < selected.size(); i++) {
            if (questions.get(i).getCorrectIndex() == selected.get(i)) {
                correct++;
            }
        }

        double percentage = (double) correct / questions.size() * 100;
        boolean mastered = percentage >= 70;

        QuizResult quizResult = new QuizResult();
        quizResult.setUser(user);
        quizResult.setTopic(topic);
        quizResult.setScore(BigDecimal.valueOf(percentage));
        quizResult.setCorrectAnswers(correct);
        quizResult.setTotalQuestions(questions.size());
        quizResultRepository.save(quizResult);

        // Save or update topic progress
        Optional<TopicProgress> existing = topicProgressRepository
                .findByUserAndTopic(user, topic);

        TopicProgress progress = existing.orElse(new TopicProgress());
        progress.setUser(user);
        progress.setTopic(topic);
        progress.setScore(BigDecimal.valueOf(percentage));
        progress.setAttempts((progress.getAttempts() == null ? 0 : progress.getAttempts()) + 1);
        progress.setMastered(mastered);
        topicProgressRepository.save(progress);

        // Build result
        QuizResultDTO result = new QuizResultDTO();
        result.setScore(correct);
        result.setTotal(questions.size());
        result.setPercentage(percentage);
        result.setMastered(mastered);
        result.setQuestions(questions);
        result.setSelectedAnswers(selected);
        result.setFeedback(getFeedback(percentage));

        return result;
    }

    private String getFeedback(double percentage) {
        if (percentage >= 90) return "Excellent! You have mastered this topic.";
        if (percentage >= 70) return "Good job! Topic marked as mastered.";
        if (percentage >= 50) return "Fair attempt. Review weak areas and try again.";
        return "Needs improvement. Study this topic carefully and retry.";
    }

    private String getSubjectName(SyllabusNode node) {
        SyllabusNode current = node;
        while (current != null && !"SUBJECT".equals(current.getType())) {
            current = current.getParent();
        }
        return current != null ? current.getName() : "General";
    }
}
