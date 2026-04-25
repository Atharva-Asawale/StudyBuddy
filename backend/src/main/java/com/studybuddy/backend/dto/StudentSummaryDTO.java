package com.studybuddy.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class StudentSummaryDTO {
    private UUID userId;
    private String name;
    private String email;
    private String branch;
    private Integer currentSemester;
    private BigDecimal latestCgpa;
    private Integer totalQuizzes;
    private Integer masteredTopics;
    private Integer weakTopics;
    private Double averageScore;
    private String createdAt;
    private String preferredStudyTime;
    private Integer stressLevel;
}
