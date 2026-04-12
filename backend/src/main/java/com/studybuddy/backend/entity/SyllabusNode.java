package com.studybuddy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "syllabus_nodes")
@Data
public class SyllabusNode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private SyllabusNode parent;

    private String branch;

    private Integer semester;

    @Column(name = "is_custom")
    private Boolean isCustom = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    private List<SyllabusNode> children;
}