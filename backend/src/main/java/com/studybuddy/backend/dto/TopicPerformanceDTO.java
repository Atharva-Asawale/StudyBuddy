package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopicPerformanceDTO {
    private String topic;
    private double score;
}
