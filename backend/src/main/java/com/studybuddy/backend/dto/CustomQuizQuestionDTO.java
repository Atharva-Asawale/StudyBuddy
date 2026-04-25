package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomQuizQuestionDTO {
    private String question;
    private List<String> options;
    private String answer;
    private String explanation;
    private String difficulty;
}
