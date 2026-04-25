package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.CustomNodeRequest;
import com.studybuddy.backend.dto.SyllabusNodeDTO;
import com.studybuddy.backend.service.SyllabusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/syllabus")
public class SyllabusController {

    @Autowired
    private SyllabusService syllabusService;

    @GetMapping
    public ResponseEntity<List<SyllabusNodeDTO>> getSyllabus(
            @AuthenticationPrincipal String email,
            @RequestParam(required = false) Integer semester) {
        try {
            List<SyllabusNodeDTO> tree = syllabusService.getSyllabusTree(email, semester);
            return ResponseEntity.ok(tree);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/custom")
    public ResponseEntity<SyllabusNodeDTO> addCustomNode(
            @AuthenticationPrincipal String email,
            @RequestBody CustomNodeRequest request) {
        try {
            SyllabusNodeDTO node = syllabusService.addCustomNode(email, request);
            return ResponseEntity.ok(node);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/custom/{id}")
    public ResponseEntity<SyllabusNodeDTO> editCustomNode(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id,
            @RequestBody CustomNodeRequest request) {
        try {
            SyllabusNodeDTO node = syllabusService.editCustomNode(email, id, request);
            return ResponseEntity.ok(node);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/custom/{id}")
    public ResponseEntity<String> deleteCustomNode(
            @AuthenticationPrincipal String email,
            @PathVariable UUID id) {
        try {
            syllabusService.deleteCustomNode(email, id);
            return ResponseEntity.ok("Node deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}