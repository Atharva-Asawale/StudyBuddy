package com.studybuddy.backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CustomNodeRequest {
    private String name;
    private String type;
    private UUID parentId;
    private String branch;
    private Integer semester;
}