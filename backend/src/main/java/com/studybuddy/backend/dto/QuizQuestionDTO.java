package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class QuizQuestionDTO {
    private String question;
    private List<String> options;
    private int correctIndex;
    private String difficulty;
    private String explanation;
}