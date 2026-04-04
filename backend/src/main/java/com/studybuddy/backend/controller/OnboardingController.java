package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.OnboardingRequest;
import com.studybuddy.backend.service.OnboardingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    @Autowired
    private OnboardingService onboardingService;

    @PostMapping
    public ResponseEntity<String> saveOnboarding(
            @AuthenticationPrincipal String email,
            @RequestBody OnboardingRequest request) {
        try {
            onboardingService.saveOnboarding(email, request);
            return ResponseEntity.ok("Onboarding complete");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> checkOnboardingStatus(
            @AuthenticationPrincipal String email) {
        try {
            boolean complete = onboardingService.isOnboardingComplete(email);
            return ResponseEntity.ok(complete);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}