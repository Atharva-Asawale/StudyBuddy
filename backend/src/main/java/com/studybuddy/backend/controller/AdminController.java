package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.*;
import com.studybuddy.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            log.info("Admin {} fetching stats", adminEmail);
            return ResponseEntity.ok(adminService.getAdminStats());
        } catch (Exception e) {
            log.error("Error fetching admin stats", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/students")
    public ResponseEntity<?> getStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String sortBy) {
        try {
            return ResponseEntity.ok(adminService.getAllStudents(search, branch, sortBy));
        } catch (Exception e) {
            log.error("Error fetching students list", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/students/{userId}")
    public ResponseEntity<?> getStudentDetail(@PathVariable UUID userId) {
        try {
            return ResponseEntity.ok(adminService.getStudentDetail(userId));
        } catch (Exception e) {
            log.error("Error fetching student detail: {}", userId, e);
            return ResponseEntity.status(404).body(Map.of("message", "Student not found or error: " + e.getMessage()));
        }
    }

    @GetMapping("/weak-topics")
    public ResponseEntity<?> getWeakTopics() {
        try {
            return ResponseEntity.ok(adminService.getWeakTopics());
        } catch (Exception e) {
            log.error("Error fetching weak topics", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
