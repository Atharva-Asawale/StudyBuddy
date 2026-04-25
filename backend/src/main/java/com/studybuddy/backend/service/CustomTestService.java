package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studybuddy.backend.dto.CustomQuizQuestionDTO;
import com.studybuddy.backend.dto.CustomTestResultDTO;
import com.studybuddy.backend.dto.CustomTestSubmitRequest;
import com.studybuddy.backend.entity.CustomTest;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.CustomTestRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomTestService {

    @Autowired
    private CustomTestRepository customTestRepository;

    @Autowired
    private GeminiService geminiService;

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

        // Step 2: Extract text (ALL IN MEMORY)
        String rawText = "";
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        try {
            if (filename.endsWith(".pdf")) {
                try (PDDocument doc = PDDocument.load(file.getInputStream())) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    stripper.setSortByPosition(true);
                    rawText = stripper.getText(doc);
                }
            } else if (filename.endsWith(".docx") || filename.endsWith(".doc")) {
                try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
                    XWPFWordExtractor extractor = new XWPFWordExtractor(doc);
                    rawText = extractor.getText();
                }
            } else {
                throw new IllegalArgumentException("Unsupported file type. Please upload a PDF or DOCX file.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract text from document. " + e.getMessage());
        }

        // Clean rawText
        String cleanedText = rawText.trim().replaceAll("\\s+", " ");
        if (cleanedText.length() < 300) {
            throw new IllegalArgumentException("Document has too little content to generate a quiz.");
        }

        // Step 3: Chunk text (in memory, ~400 words per chunk)
        String[] words = cleanedText.split("\\s+");
        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();
        int wordCount = 0;

        for (String word : words) {
            currentChunk.append(word).append(" ");
            wordCount++;
            if (wordCount >= 400) {
                chunks.add(currentChunk.toString().trim());
                currentChunk = new StringBuilder();
                wordCount = 0;
            }
        }
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }

        if (chunks.isEmpty()) {
            throw new RuntimeException("Could not extract readable text from this document.");
        }

        // Step 4: Smart chunk selection
        List<String> selectedChunksList = new ArrayList<>();
        if (chunks.size() <= 8) {
            selectedChunksList = chunks;
        } else {
            Set<Integer> indices = new LinkedHashSet<>();
            indices.add(0);
            indices.add(1);
            indices.add(chunks.size() / 4);
            indices.add(chunks.size() / 2);
            indices.add((chunks.size() * 3) / 4);
            indices.add(chunks.size() - 2);
            indices.add(chunks.size() - 1);
            
            for (Integer idx : indices) {
                if (selectedChunksList.size() < 8 && idx < chunks.size()) {
                    selectedChunksList.add(chunks.get(idx));
                }
            }
        }
        String selectedChunks = String.join("\n\n---\n\n", selectedChunksList);

        // Step 5: Generate questions (Single prompt for all to maintain counts)
        List<CustomQuizQuestionDTO> allQuestions = new ArrayList<>();
        
        String prompt = String.format("""
                You are a professional academic exam generator.
                Generate a Multiple Choice Question (MCQ) quiz based ONLY on the provided context.
                
                COUNTS:
                - Easy questions: %d
                - Medium questions: %d
                - Hard questions: %d
                - TOTAL questions: %d
                
                DIFFICULTY DEFINITIONS:
                - easy: direct facts, definitions, or clear statements in the text.
                - medium: reasoning based on the text, connecting related concepts.
                - hard: complex inference, application of principles, or subtle details.
                
                STRICT RULES:
                1. Generate exactly %d questions in total. No more, no less.
                2. Do not use external knowledge.
                3. Each question must have 4 options and one clear answer.
                4. Provide a reference-based explanation for each answer.
                
                CONTEXT:
                %s
                
                OUTPUT FORMAT (RAW JSON ARRAY ONLY):
                [
                  {
                    "question": "...",
                    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
                    "answer": "A. ...",
                    "difficulty": "easy/medium/hard",
                    "explanation": "..."
                  }
                ]
                """, easyCount, mediumCount, hardCount, total, total, selectedChunks);

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

        // Step 6: Final check
        if (allQuestions.isEmpty()) {
            throw new RuntimeException("Could not generate any questions from this document.");
        }

        Collections.shuffle(allQuestions);
        return allQuestions;
    }

    // Removed generateDifficultyQuestions as it's merged into generateQuiz

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
