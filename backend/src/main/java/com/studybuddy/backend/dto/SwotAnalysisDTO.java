package com.studybuddy.backend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class SwotAnalysisDTO {
    private List<String> strengths = new ArrayList<>();
    private List<String> weaknesses = new ArrayList<>();
    private List<String> opportunities = new ArrayList<>();
    private List<String> threats = new ArrayList<>();
    private String summary;
}
