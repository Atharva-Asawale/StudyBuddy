package com.studybuddy.backend.dto;

import lombok.Data;

@Data
public class StudentSwotResponse {
    private SwotAnalysisDTO ruleBased;
    private SwotAnalysisDTO aiBased;
}
