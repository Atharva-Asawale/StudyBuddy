package com.studybuddy.backend.dto;

import lombok.Data;

@Data
public class AdminStatsResponse {
    private int totalStudents;
    private int totalCSE;
    private int totalAIML;
    private double averageCgpa;
    private int totalQuizzesTaken;
    private int totalMasteredTopics;
    private java.util.Map<String, Integer> branchDistribution;
    private java.util.Map<String, Integer> semesterDistribution;
    private int studentsOnboarded;
    private double platformAverageScore;
}
