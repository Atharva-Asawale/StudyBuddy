package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuizResultRepository extends JpaRepository<QuizResult, UUID> {
    List<QuizResult> findByUserIdOrderByAttemptedAtAsc(UUID userId);
    List<QuizResult> findByUserIdOrderByAttemptedAtDesc(UUID userId);
    List<QuizResult> findTop5ByUserIdOrderByAttemptedAtDesc(UUID userId);
    void deleteByUserId(UUID userId);
}
