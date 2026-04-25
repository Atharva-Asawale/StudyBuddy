package com.studybuddy.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CustomTestSubmitRequest {
    private String topicName;
    private int easyCount;
    private int mediumCount;
    private int hardCount;
    private int score;
    private int total;
    private BigDecimal percentage;
    private String questionsJson;
}
