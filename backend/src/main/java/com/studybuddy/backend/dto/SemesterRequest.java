package com.studybuddy.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SemesterRequest {
    private Integer semesterNumber;
    private BigDecimal cgpa;
    private List<SubjectDTO> subjects;
}