package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.CustomTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomTestRepository extends JpaRepository<CustomTest, UUID> {
    List<CustomTest> findByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserId(UUID userId);
    Optional<CustomTest> findFirstByUserIdOrderByCreatedAtAsc(UUID userId);
}
