package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.DailyActivityLog;
import com.studybuddy.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DailyActivityLogRepository extends JpaRepository<DailyActivityLog, UUID> {
    List<DailyActivityLog> findByUserAndDateBetween(User user, LocalDate startDate, LocalDate endDate);
    boolean existsByUserAndDate(User user, LocalDate date);
    void deleteByUserId(UUID userId);
}
