package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studybuddy.backend.dto.CustomQuizQuestionDTO;
import com.studybuddy.backend.dto.CustomTestResultDTO;
import com.studybuddy.backend.dto.CustomTestSubmitRequest;
import com.studybuddy.backend.entity.CustomTest;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.CustomTestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomTestService {

    @Autowired
    private CustomTestRepository customTestRepository;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private RagService ragService;

    private final ObjectMapper mapper = new ObjectMapper();

    public List<CustomQuizQuestionDTO> generateQuiz(MultipartFile file, int easyCount, int mediumCount, int hardCount, String topicName) throws IOException {
        // Step 1: Validate inputs
        int total = easyCount + mediumCount + hardCount;
        if (total < 1 || total > 20) {
            throw new IllegalArgumentException("Total questions must be between 1 and 20.");
        }
        if (easyCount < 0 || mediumCount < 0 || hardCount < 0) {
            throw new IllegalArgumentException("Counts cannot be negative.");
        }

        // Step 2: Extract text
        String rawText = ragService.extractText(file);
        String cleanedText = rawText.trim().replaceAll("\\s+", " ");
        if (cleanedText.length() < 300) {
            throw new IllegalArgumentException("Document has too little content to generate a quiz.");
        }

        // Step 3: Hybrid 50-50 Analysis (Local)
        // 3.1 Extract Core Facts (Metadata)
        List<Map<String, String>> knowledgeMap = ragService.extractCoreFacts(cleanedText);
        String keywordsJson = "";
        try {
            keywordsJson = mapper.writeValueAsString(knowledgeMap);
        } catch (Exception ignored) {}

        // 3.2 Smart dense selection (Stratified)
        String selectedChunks = ragService.getSelectedChunks(cleanedText, knowledgeMap);

        // Step 4: Generate questions (Metadata-First Prompt)
        List<CustomQuizQuestionDTO> allQuestions = new ArrayList<>();
        
        String prompt = String.format("""
                [SYSTEM: PRECISION EXAM GENERATOR]
                You are a subject matter expert generating a technical academic exam.
                
                [CORE KNOWLEDGE MAP (JSON)]:
                %s
                
                [SOURCE MATERIAL (TEXT)]:
                %s
                
                [REQUIRED QUESTION DISTRIBUTION]:
                - Easy Questions: %d
                - Medium Questions: %d
                - Hard Questions: %d
                - TOTAL: %d
                
                [DIFFICULTY CRITERIA]:
                - easy: Direct recall of facts or definitions from the Knowledge Map.
                - medium: Requires understanding of how concepts relate or simple application.
                - hard: Requires deep inference, complex problem solving, or synthesis of multiple parts of the Source Material.
                
                [STRICT GUIDELINES]:
                1. MANDATORY: You MUST generate EXACTLY the numbers specified in the Distribution above.
                2. If you fail to generate the correct count for 'hard' questions, the quiz is invalid.
                3. ACCURACY: Every option must be plausible but only one is correct based on the text.
                4. NO HALLUCINATION: Only use information provided in the JSON or Text.
                5. Each question must include a "difficulty" field that matches the criteria.
                
                OUTPUT: RAW JSON ARRAY ONLY.
                [
                  {
                    "question": "...",
                    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
                    "answer": "A. ...",
                    "difficulty": "easy/medium/hard",
                    "explanation": "..."
                  }
                ]
                """, keywordsJson, selectedChunks, easyCount, mediumCount, hardCount, total, total);

        try {
            String response = geminiService.generatePlainText(prompt);
            if (response == null || response.isBlank()) throw new RuntimeException("AI returned empty response.");

            String text = response.trim();
            if (text.startsWith("```")) {
                text = text.replaceAll("```json", "").replaceAll("```", "").trim();
            }

            int start = text.indexOf('[');
            int end = text.lastIndexOf(']');
            if (start >= 0 && end > start) text = text.substring(start, end + 1);

            JsonNode nodes = mapper.readTree(text);
            for (JsonNode node : nodes) {
                CustomQuizQuestionDTO q = new CustomQuizQuestionDTO();
                q.setQuestion(node.path("question").asText());
                List<String> options = new ArrayList<>();
                for (JsonNode opt : node.path("options")) options.add(opt.asText());
                q.setOptions(options);
                q.setAnswer(node.path("answer").asText());
                q.setExplanation(node.path("explanation").asText());
                q.setDifficulty(node.path("difficulty").asText().toLowerCase());

                if (!q.getQuestion().isBlank() && !q.getOptions().isEmpty() && !q.getAnswer().isBlank()) {
                    allQuestions.add(q);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("AI generation failed or output was malformed: " + e.getMessage());
        }

        if (allQuestions.isEmpty()) {
            throw new RuntimeException("Could not generate any questions from this document.");
        }

        Collections.shuffle(allQuestions);
        return allQuestions;
    }

    public CustomTestResultDTO saveResult(CustomTestSubmitRequest request, User user) {
        // Rolling limit: delete oldest if count >= 20
        if (customTestRepository.countByUserId(user.getId()) >= 20) {
            customTestRepository.findFirstByUserIdOrderByCreatedAtAsc(user.getId())
                    .ifPresent(oldest -> customTestRepository.delete(oldest));
        }

        CustomTest test = new CustomTest();
        test.setUser(user);
        test.setTopicName(request.getTopicName());
        test.setEasyCount(request.getEasyCount());
        test.setMediumCount(request.getMediumCount());
        test.setHardCount(request.getHardCount());
        test.setScore(request.getScore());
        test.setTotal(request.getTotal());
        test.setPercentage(request.getPercentage());
        test.setQuestionsJson(request.getQuestionsJson());
        test.setCreatedAt(LocalDateTime.now());

        CustomTest saved = customTestRepository.save(test);
        return mapToDTO(saved);
    }

    public List<CustomTestResultDTO> getHistory(User user) {
        return customTestRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public void deleteHistory(UUID id, User user) {
        customTestRepository.findById(id).ifPresent(test -> {
            if (test.getUser().getId().equals(user.getId())) {
                customTestRepository.delete(test);
            }
        });
    }

    private CustomTestResultDTO mapToDTO(CustomTest test) {
        return new CustomTestResultDTO(
                test.getId(),
                test.getTopicName(),
                test.getEasyCount(),
                test.getMediumCount(),
                test.getHardCount(),
                test.getScore(),
                test.getTotal(),
                test.getPercentage(),
                test.getCreatedAt()
        );
    }
}
