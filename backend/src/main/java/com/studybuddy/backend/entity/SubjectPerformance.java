package com.studybuddy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "subject_performance")
@Data
public class SubjectPerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(name = "subject_name", nullable = false)
    private String subjectName;

    @Column(name = "grade")
    private String grade;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;
}