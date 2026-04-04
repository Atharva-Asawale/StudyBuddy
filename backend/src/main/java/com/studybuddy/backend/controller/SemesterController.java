package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.SemesterRequest;
import com.studybuddy.backend.dto.SemesterResponse;
import com.studybuddy.backend.service.SemesterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/semesters")
public class SemesterController {

    @Autowired
    private SemesterService semesterService;

    @PostMapping
    public ResponseEntity<SemesterResponse> addSemester(
            @AuthenticationPrincipal String email,
            @RequestBody SemesterRequest request) {
        try {
            SemesterResponse response = semesterService.addSemester(email, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<SemesterResponse>> getAllSemesters(
            @AuthenticationPrincipal String email) {
        try {
            List<SemesterResponse> response = semesterService.getAllSemesters(email);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SemesterResponse> updateSemester(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id,
            @RequestBody SemesterRequest request) {
        try {
            SemesterResponse response = semesterService.updateSemester(email, id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSemester(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        try {
            semesterService.deleteSemester(email, id);
            return ResponseEntity.ok("Semester deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}