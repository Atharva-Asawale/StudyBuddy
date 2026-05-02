package com.studybuddy.backend.dto;

import lombok.Data;

@Data
public class AdminManagementDTO {
    private String name;
    private String email;
    private String password;
    private String role; // Optional, defaults to ADMIN
}
