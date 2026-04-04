package com.studybuddy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String branch;

    @Column(name = "current_semester")
    private Integer currentSemester;

    @Column(nullable = false)
    private String role = "STUDENT";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}