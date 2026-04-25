package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.AcademicBaseline;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.Optional;
public interface AcademicBaselineRepository extends JpaRepository<AcademicBaseline, UUID> {
 Optional<AcademicBaseline> findByUserId(UUID userId); 
}