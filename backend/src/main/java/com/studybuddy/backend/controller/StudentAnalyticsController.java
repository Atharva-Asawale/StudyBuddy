package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.StudentDashboardResponse;
import com.studybuddy.backend.dto.StudentSwotResponse;
import com.studybuddy.backend.service.StudentAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class StudentAnalyticsController {

    @Autowired
    private StudentAnalyticsService studentAnalyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<StudentDashboardResponse> getDashboard(
            @AuthenticationPrincipal String email) {
        try {
            return ResponseEntity.ok(studentAnalyticsService.getDashboardData(email));
        } catch (RuntimeException exception) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/swot")
    public ResponseEntity<StudentSwotResponse> getSwot(
            @AuthenticationPrincipal String email) {
        try {
            return ResponseEntity.ok(studentAnalyticsService.getSwotData(email));
        } catch (RuntimeException exception) {
            return ResponseEntity.badRequest().build();
        }
    }
}
