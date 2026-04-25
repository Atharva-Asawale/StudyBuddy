package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.Map;

@Data
public class AdminStatsDTO {
    private Integer totalStudents;
    private Integer totalCSE;
    private Integer totalAIML;
    private Double averageCgpa;
    private Integer totalQuizzesTaken;
    private Integer totalMasteredTopics;
    private Double platformAverageScore;
    private Integer studentsOnboarded;
    private Map<String, Integer> semesterDistribution;
    private Map<String, Integer> branchDistribution;
}
