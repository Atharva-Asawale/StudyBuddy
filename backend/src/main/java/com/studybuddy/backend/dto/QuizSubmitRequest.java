package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class QuizSubmitRequest {
    private UUID topicId;
    private List<Integer> selectedAnswers;
}