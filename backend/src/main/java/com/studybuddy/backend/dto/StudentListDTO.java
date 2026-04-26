package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class StudentListDTO {
    private UUID userId;
    private String name;
    private String email;
    private String branch;
    private Integer currentSemester;
    private double averageScore;
    private double latestCgpa;
    private int totalQuizzes;
    private int masteredTopics;
    private int weakTopics;
    private String createdAt;
}
