package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class SWOTResponseDTO {
    // Rule-based topic names
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> opportunities;
    private List<String> threats;

    // AI-generated narratives
    private String strengthsAI;
    private String weaknessesAI;
    private String opportunitiesAI;
    private String threatsAI;
    private String overallAdvice;
    private String careerAdvice;
    private String detailedAnalysis;

    // Academic signals
    private double cgpaTrend;
    private String topSubject;
    private String weakestSubject;
    private int totalAttempted;
    private int totalMastered;
}
