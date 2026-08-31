package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.LearningDebtGraphDTO;
import com.studybuddy.backend.dto.LearningDebtHierarchyDTO;
import com.studybuddy.backend.service.LearningDebtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LearningDebtController {

    private final LearningDebtService learningDebtService;

    @GetMapping("/api/learning-debt/graph")
    public ResponseEntity<LearningDebtHierarchyDTO> getLearningDebtHierarchy() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(learningDebtService.getHierarchyGraph(email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/api/debt/graph")
    public ResponseEntity<LearningDebtGraphDTO> getGraph(
            @AuthenticationPrincipal String email) {
        try {
            return ResponseEntity.ok(learningDebtService.getGraph(email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/api/debt/analyze")
    public ResponseEntity<LearningDebtGraphDTO> analyzeLearningDebt(
            @AuthenticationPrincipal String email) {
        try {
            return ResponseEntity.ok(learningDebtService.analyzeAndCacheDebt(email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

}