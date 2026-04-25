package com.studybuddy.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TopicProgressDTO {
    private UUID topicId;
    private String topicName;
    private BigDecimal score;
    private Integer attempts;
    private Boolean mastered;
}
