package com.studybuddy.backend.dto;

import java.math.BigDecimal;

public class ProfileUpdateRequest {
    private String name;
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
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public Integer getCurrentSemester() { return currentSemester; }
    public void setCurrentSemester(Integer currentSemester) { this.currentSemester = currentSemester; }
    public Integer getStudyHoursPerDay() { return studyHoursPerDay; }
    public void setStudyHoursPerDay(Integer studyHoursPerDay) { this.studyHoursPerDay = studyHoursPerDay; }
    public Integer getConsistencyScore() { return consistencyScore; }
    public void setConsistencyScore(Integer consistencyScore) { this.consistencyScore = consistencyScore; }
    public Integer getStressLevel() { return stressLevel; }
    public void setStressLevel(Integer stressLevel) { this.stressLevel = stressLevel; }
    public String getPreferredStudyTime() { return preferredStudyTime; }
    public void setPreferredStudyTime(String preferredStudyTime) { this.preferredStudyTime = preferredStudyTime; }
    public BigDecimal getTenthPercentage() { return tenthPercentage; }
    public void setTenthPercentage(BigDecimal tenthPercentage) { this.tenthPercentage = tenthPercentage; }
    public BigDecimal getTwelfthPercentage() { return twelfthPercentage; }
    public void setTwelfthPercentage(BigDecimal twelfthPercentage) { this.twelfthPercentage = twelfthPercentage; }
}