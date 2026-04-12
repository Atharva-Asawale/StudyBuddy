package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.QuizResult;
import com.studybuddy.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuizResultRepository extends JpaRepository<QuizResult, UUID> {
    List<QuizResult> findByUserOrderByAttemptedAtAsc(User user);
    List<QuizResult> findTop5ByUserOrderByAttemptedAtDesc(User user);
}
