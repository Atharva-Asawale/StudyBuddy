package com.studybuddy.backend.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class StudentDetailDTO extends StudentSummaryDTO {
    private List<SemesterResponse> semesters;
    private BigDecimal tenthPercentage;
    private BigDecimal twelfthPercentage;
    private Integer studyHoursPerDay;
    private Integer consistencyScore;
    private List<TopicProgressDTO> topicProgress;
}
