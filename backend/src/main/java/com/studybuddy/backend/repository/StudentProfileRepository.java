package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {
    boolean existsByUserId(UUID userId);
}