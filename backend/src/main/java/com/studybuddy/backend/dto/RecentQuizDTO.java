package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RecentQuizDTO {
    private String quiz;
    private double score;
    private String date;
}
