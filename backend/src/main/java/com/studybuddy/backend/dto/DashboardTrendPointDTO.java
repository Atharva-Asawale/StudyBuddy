package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardTrendPointDTO {
    private String label;
    private double score;
}
