package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentSwotResponse {
    private SwotAnalysisDTO ruleBased;
    private SwotAnalysisDTO aiBased;
}
