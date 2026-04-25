package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.LearningDebtGraphDTO;
import com.studybuddy.backend.service.LearningDebtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/debt")
@RequiredArgsConstructor
public class LearningDebtController {

    private final LearningDebtService learningDebtService;

    @GetMapping("/graph")
    public ResponseEntity<LearningDebtGraphDTO> getGraph(
            @AuthenticationPrincipal String email) {
        try {
            return ResponseEntity.ok(learningDebtService.getGraph(email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/analyze")
    public ResponseEntity<LearningDebtGraphDTO> analyzeLearningDebt(
            @AuthenticationPrincipal String email) {
        try {
            return ResponseEntity.ok(learningDebtService.analyzeAndCacheDebt(email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

}