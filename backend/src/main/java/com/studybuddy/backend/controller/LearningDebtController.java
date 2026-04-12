package com.studybuddy.backend.controller;

import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.UserRepository;
import com.studybuddy.backend.service.LearningDebtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/debt")
public class LearningDebtController {

    @Autowired
    private LearningDebtService learningDebtService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getLearningDebt(
            @AuthenticationPrincipal String email) {

        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> result = learningDebtService.calculateLearningDebt(user);

            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}