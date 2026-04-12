package com.studybuddy.backend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StudentDashboardResponse {
    private long totalQuizzes;
    private double averageScore;
    private double highestScore;
    private List<RecentQuizDTO> recentQuizzes = new ArrayList<>();
    private List<DashboardTrendPointDTO> performanceTrend = new ArrayList<>();
    private List<TopicPerformanceDTO> topicPerformance = new ArrayList<>();
}
