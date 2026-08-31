package com.studybuddy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "concept_dependency_map", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"parent_topic_id", "child_topic_id"})
})
@Data
public class ConceptDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_topic_id", nullable = false)
    private SyllabusNode parentTopicNode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_topic_id", nullable = false)
    private SyllabusNode childTopicNode;

    @Column(name = "source", length = 50)
    private String source;

    @Column(name = "reason", length = 1000)
    private String reason;
}
