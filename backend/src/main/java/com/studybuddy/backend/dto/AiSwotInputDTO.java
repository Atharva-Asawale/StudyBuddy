package com.studybuddy.backend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AiSwotInputDTO {
    private List<AiSubjectInsightDTO> subjects = new ArrayList<>();
    private double overallAverage;
    private long totalTests;
    private String trend;
}
