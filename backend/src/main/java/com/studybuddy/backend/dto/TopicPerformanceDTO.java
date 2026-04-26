package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TopicPerformanceDTO {
    private String topic;
    private double score;
    private int attempts;
    private boolean mastered;
}
