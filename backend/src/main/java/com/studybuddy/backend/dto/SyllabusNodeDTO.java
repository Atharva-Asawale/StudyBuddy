package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SyllabusNodeDTO {
    private UUID id;
    private String name;
    private String type;
    private String branch;
    private Integer semester;
    private Boolean isCustom;
    private List<SyllabusNodeDTO> children;
}