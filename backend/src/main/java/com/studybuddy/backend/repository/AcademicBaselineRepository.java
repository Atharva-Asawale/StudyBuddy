package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.AcademicBaseline;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AcademicBaselineRepository extends JpaRepository<AcademicBaseline, UUID> {
}