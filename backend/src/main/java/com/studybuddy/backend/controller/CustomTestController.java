package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.CustomQuizQuestionDTO;
import com.studybuddy.backend.dto.CustomTestResultDTO;
import com.studybuddy.backend.dto.CustomTestSubmitRequest;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.UserRepository;
import com.studybuddy.backend.service.CustomTestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/custom-test")
public class CustomTestController {

    @Autowired
    private CustomTestService customTestService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/generate-from-file")
    public ResponseEntity<?> generateFromFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("easyCount") int easyCount,
            @RequestParam("mediumCount") int mediumCount,
            @RequestParam("hardCount") int hardCount,
            @RequestParam("topicName") String topicName) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please upload a file.");
        }
        if (topicName == null || topicName.isBlank()) {
            return ResponseEntity.badRequest().body("Please provide a topic name.");
        }
        if (easyCount + mediumCount + hardCount < 1 || easyCount + mediumCount + hardCount > 20) {
            return ResponseEntity.badRequest().body("Total questions must be between 1 and 20.");
        }

        try {
            List<CustomQuizQuestionDTO> questions = customTestService.generateQuiz(file, easyCount, mediumCount, hardCount, topicName);
            return ResponseEntity.ok(questions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<CustomTestResultDTO> submit(@RequestBody CustomTestSubmitRequest request) {
        User user = getCurrentUser();
        CustomTestResultDTO result = customTestService.saveResult(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/history")
    public ResponseEntity<List<CustomTestResultDTO>> getHistory() {
        User user = getCurrentUser();
        return ResponseEntity.ok(customTestService.getHistory(user));
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable UUID id) {
        User user = getCurrentUser();
        customTestService.deleteHistory(id, user);
        return ResponseEntity.ok().build();
    }
}
