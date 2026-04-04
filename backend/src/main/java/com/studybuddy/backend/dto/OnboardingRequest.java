package com.studybuddy.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OnboardingRequest {

    // Student Profile
    private Integer studyHoursPerDay;
    private Integer consistencyScore;
    private Integer stressLevel;
    private String preferredStudyTime;

    // Academic Baseline
    private BigDecimal tenthPercentage;
    private BigDecimal twelfthPercentage;
}