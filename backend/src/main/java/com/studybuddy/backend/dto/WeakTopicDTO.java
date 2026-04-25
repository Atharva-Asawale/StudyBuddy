package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WeakTopicDTO {
    private String topicName;
    private Long weakCount;
    private Double avgScore;
}
