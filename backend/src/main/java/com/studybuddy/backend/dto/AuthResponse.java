package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String name;
    private String email;
    private String branch;
    private Integer currentSemester;
    private String userId;
    private String role;
}