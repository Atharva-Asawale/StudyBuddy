package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.SubjectPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SubjectPerformanceRepository extends JpaRepository<SubjectPerformance, UUID> {
    List<SubjectPerformance> findBySemesterId(UUID semesterId);
}