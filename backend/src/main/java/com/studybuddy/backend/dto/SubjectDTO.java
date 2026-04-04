package com.studybuddy.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SubjectDTO {
    private String subjectName;
    private String grade;
    private BigDecimal score;
}