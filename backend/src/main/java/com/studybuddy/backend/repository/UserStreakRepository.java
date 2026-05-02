package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.entity.UserStreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserStreakRepository extends JpaRepository<UserStreak, UUID> {
    Optional<UserStreak> findByUser(User user);
    void deleteByUserId(UUID userId);
}
