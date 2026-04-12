package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiSubjectInsightDTO {
    private String name;
    private double avgScore;
    private long attempts;
}
