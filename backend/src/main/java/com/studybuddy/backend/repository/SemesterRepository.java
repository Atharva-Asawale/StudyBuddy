package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SemesterRepository extends JpaRepository<Semester, UUID> {
    List<Semester> findByUserIdOrderBySemesterNumberAsc(UUID userId);
}