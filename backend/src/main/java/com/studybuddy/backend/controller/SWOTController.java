package com.studybuddy.backend.controller;

import com.studybuddy.backend.dto.SWOTResponseDTO;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.UserRepository;
import com.studybuddy.backend.service.SWOTService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/swot")
@RequiredArgsConstructor
public class SWOTController {

    private final SWOTService swotService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<SWOTResponseDTO> getSWOT(@AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(swotService.generateSWOT(user));
    }
}
