package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceRecommendationDTO {

    private String overallInsight;
    private List<RecommendationItem> recommendations = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationItem {
        private String topic;
        private String priority; // HIGH, MEDIUM, LOW
        private String reason;
        private String resourceType; // VIDEO, PRACTICE, READING, MIXED
        private String youtubeSearchUrl;
        private String geeksforgeeksSearchUrl;
        private String nptelSearchUrl;
    }
}
