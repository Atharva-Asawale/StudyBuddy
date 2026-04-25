package com.studybuddy.backend.dto;

import java.math.BigDecimal;

public class ProfileResponse {
    private String name;
    private String email;
    private String branch;
    private Integer currentSemester;
    private Integer studyHoursPerDay;
    private Integer consistencyScore;
    private Integer stressLevel;
    private String preferredStudyTime;
    private BigDecimal tenthPercentage;
    private BigDecimal twelfthPercentage;

    // getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public Integer getCurrentSemester() { return currentSemester; }
    public void setCurrentSemester(Integer s) { this.currentSemester = s; }
    public Integer getStudyHoursPerDay() { return studyHoursPerDay; }
    public void setStudyHoursPerDay(Integer h) { this.studyHoursPerDay = h; }
    public Integer getConsistencyScore() { return consistencyScore; }
    public void setConsistencyScore(Integer c) { this.consistencyScore = c; }
    public Integer getStressLevel() { return stressLevel; }
    public void setStressLevel(Integer s) { this.stressLevel = s; }
    public String getPreferredStudyTime() { return preferredStudyTime; }
    public void setPreferredStudyTime(String t) { this.preferredStudyTime = t; }
    public BigDecimal getTenthPercentage() { return tenthPercentage; }
    public void setTenthPercentage(BigDecimal t) { this.tenthPercentage = t; }
    public BigDecimal getTwelfthPercentage() { return twelfthPercentage; }
    public void setTwelfthPercentage(BigDecimal t) { this.twelfthPercentage = t; }
}