package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class StudentDetailDTO {
    private UUID id;
    private String name;
    private String email;
    private String branch;
    private Integer semester;
    private List<TopicPerformanceDTO> performance;
}
