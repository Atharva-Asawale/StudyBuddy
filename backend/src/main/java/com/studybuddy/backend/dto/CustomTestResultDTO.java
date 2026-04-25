package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomTestResultDTO {
    private UUID id;
    private String topicName;
    private int easyCount;
    private int mediumCount;
    private int hardCount;
    private Integer score;
    private Integer total;
    private BigDecimal percentage;
    private LocalDateTime createdAt;
}
