package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class AdminUserDTO {
    private UUID id;
    private String name;
    private String email;
    private String role;
    private String createdAt;
}
