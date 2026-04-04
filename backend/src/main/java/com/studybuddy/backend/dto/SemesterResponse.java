package com.studybuddy.backend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class SemesterResponse {
    private UUID id;
    private Integer semesterNumber;
    private BigDecimal cgpa;
    private List<SubjectDTO> subjects;
}