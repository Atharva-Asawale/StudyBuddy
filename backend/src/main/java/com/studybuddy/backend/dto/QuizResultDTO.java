package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class QuizResultDTO {
    private int score;
    private int total;
    private double percentage;
    private boolean mastered;
    private List<QuizQuestionDTO> questions;
    private List<Integer> selectedAnswers;
    private String feedback;
}