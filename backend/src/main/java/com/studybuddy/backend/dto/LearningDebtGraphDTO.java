package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;

@Data
public class LearningDebtGraphDTO {
    private List<WeakTopicDTO> weakTopics;

    @Data
    public static class WeakTopicDTO {
        private UUID id;
        private String name;
        private BigDecimal score;
        private List<AffectedTopicDTO> affects;
    }

    @Data
    public static class AffectedTopicDTO {
        private UUID id;
        private String name;
        private String reason;
        private String source;
    }
}
