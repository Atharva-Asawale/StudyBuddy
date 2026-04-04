package com.studybuddy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "student_profiles")
@Data
public class StudentProfile {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @MapsId
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "study_hours_per_day")
    private Integer studyHoursPerDay;

    @Column(name = "consistency_score")
    private Integer consistencyScore;

    @Column(name = "stress_level")
    private Integer stressLevel;

    @Column(name = "preferred_study_time")
    private String preferredStudyTime;
}