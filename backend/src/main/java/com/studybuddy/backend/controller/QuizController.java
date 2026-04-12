package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.QuizQuestionDTO;
import com.studybuddy.backend.dto.QuizResultDTO;
import com.studybuddy.backend.dto.QuizSubmitRequest;
import com.studybuddy.backend.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    @Autowired
    private QuizService quizService;

    // Store generated questions temporarily in memory
    // so submit can verify answers
    private final Map<String, List<QuizQuestionDTO>> quizCache =
            new ConcurrentHashMap<>();

    @GetMapping("/generate/{topicId}")
    public ResponseEntity<List<QuizQuestionDTO>> generateQuiz(
            @AuthenticationPrincipal String email,
            @PathVariable UUID topicId) {
        try {
            List<QuizQuestionDTO> questions = quizService.generateQuiz(topicId);

            // Cache questions for this user+topic
            String cacheKey = email + ":" + topicId;
            quizCache.put(cacheKey, questions);

            // Return questions WITHOUT correct answers to frontend
            List<QuizQuestionDTO> sanitized = questions.stream().map(q -> {
                QuizQuestionDTO dto = new QuizQuestionDTO();
                dto.setQuestion(q.getQuestion());
                dto.setOptions(q.getOptions());
                dto.setCorrectIndex(-1); // hide answer
                return dto;
            }).toList();

            return ResponseEntity.ok(sanitized);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<QuizResultDTO> submitQuiz(
            @AuthenticationPrincipal String email,
            @RequestBody QuizSubmitRequest request) {
        try {
            String cacheKey = email + ":" + request.getTopicId();
            List<QuizQuestionDTO> questions = quizCache.get(cacheKey);

            if (questions == null) {
                return ResponseEntity.badRequest().build();
            }

            QuizResultDTO result = quizService.submitQuiz(email, request, questions);

            // Remove from cache after submit
            quizCache.remove(cacheKey);

            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}