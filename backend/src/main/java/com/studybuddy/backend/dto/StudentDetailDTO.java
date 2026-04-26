package com.studybuddy.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class StudentDetailDTO {
    private UUID id;
    private String name;
    private String email;
    private String branch;
    private Integer currentSemester;
    private double latestCgpa;
    private int totalQuizzes;
    private int masteredTopics;
    private int weakTopics;
    private BigDecimal tenthPercentage;
    private BigDecimal twelfthPercentage;
    private Integer studyHoursPerDay;
    private Integer stressLevel;
    private String preferredStudyTime;
    private Integer consistencyScore;
    
    private List<SemesterData> semesters;
    private List<TopicProgressItem> topicProgress;
    
    @Data
    public static class SemesterData {
        private int semesterNumber;
        private double cgpa;
        private List<SubjectData> subjects;
    }
    
    @Data
    public static class SubjectData {
        private String subjectName;
        private double score;
    }
    
    @Data
    public static class TopicProgressItem {
        private String topicId;
        private String topicName;
        private boolean mastered;
        private double score;
    }
}
