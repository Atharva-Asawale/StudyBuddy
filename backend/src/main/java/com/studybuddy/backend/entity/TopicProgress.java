package com.studybuddy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "topic_progress")
@Data
public class TopicProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "syllabus_node_id", nullable = false)
    private SyllabusNode topic;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    private Integer attempts;

    private Boolean mastered = false;
}