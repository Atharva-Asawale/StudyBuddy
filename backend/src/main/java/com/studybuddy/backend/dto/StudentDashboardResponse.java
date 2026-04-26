package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class StudentDashboardResponse {
    private double averageScore;
    private double highestScore;
    private int totalQuizzes;
    private int masteredTopics;
    private List<DashboardTrendPointDTO> performanceTrend;
    private List<RecentQuizDTO> recentQuizzes;
    private List<TopicPerformanceDTO> topicPerformance;
}
