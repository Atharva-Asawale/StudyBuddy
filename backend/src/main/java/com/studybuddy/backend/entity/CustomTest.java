package com.studybuddy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "custom_tests")
@Data
public class CustomTest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "topic_name", nullable = false)
    private String topicName;

    @Column(name = "easy_count", nullable = false)
    private int easyCount;

    @Column(name = "medium_count", nullable = false)
    private int mediumCount;

    @Column(name = "hard_count", nullable = false)
    private int hardCount;

    private Integer score;
    private Integer total;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "questions_json", columnDefinition = "TEXT", nullable = false)
    private String questionsJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
