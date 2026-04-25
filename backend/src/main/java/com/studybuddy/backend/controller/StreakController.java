package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.StreakDTO;
import com.studybuddy.backend.service.StreakService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/streak")
public class StreakController {

    @Autowired
    private StreakService streakService;

    @GetMapping
    public ResponseEntity<StreakDTO> getStreak(Authentication authentication) {
        String email = authentication.getName();
        StreakDTO streak = streakService.getStreak(email);
        return ResponseEntity.ok(streak);
    }
}
