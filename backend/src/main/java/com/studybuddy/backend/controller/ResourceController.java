package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.TopicLearningResourcesDTO;
import com.studybuddy.backend.service.TopicLearningResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final TopicLearningResourceService topicLearningResourceService;

    @GetMapping("/chapter/{chapterId}")
    public ResponseEntity<TopicLearningResourcesDTO> getChapterResources(@PathVariable UUID chapterId) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            TopicLearningResourcesDTO dto = topicLearningResourceService.getChapterResources(email, chapterId);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
