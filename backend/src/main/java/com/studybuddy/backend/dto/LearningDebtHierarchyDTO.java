package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningDebtHierarchyDTO {

    private String id;
    private String name;
    private String type; // ROOT, SUBJECT, TOPIC, SUBTOPIC
    private Double debtScore;
    private String masteryLevel; // LOW, MEDIUM, HIGH
    private List<LearningDebtHierarchyDTO> children = new ArrayList<>();
}
