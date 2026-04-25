package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.StreakDTO;
import com.studybuddy.backend.entity.DailyActivityLog;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.entity.UserStreak;
import com.studybuddy.backend.repository.DailyActivityLogRepository;
import com.studybuddy.backend.repository.UserRepository;
import com.studybuddy.backend.repository.UserStreakRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StreakService {

    @Autowired
    private UserStreakRepository userStreakRepository;

    @Autowired
    private DailyActivityLogRepository dailyActivityLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void updateStreakForEmail(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return;

        User user = userOpt.get();
        LocalDate today = LocalDate.now();

        // Check if already updated today to save DB logic overhead
        if (dailyActivityLogRepository.existsByUserAndDate(user, today)) {
            return; // Already processed today
        }

        // Add daily login log
        DailyActivityLog log = new DailyActivityLog();
        log.setUser(user);
        log.setDate(today);
        log.setActivityType("LOGIN");
        dailyActivityLogRepository.save(log);

        // Process Streak
        UserStreak streak = userStreakRepository.findByUser(user).orElse(new UserStreak());
        if (streak.getUser() == null) {
            streak.setUser(user);
        }

        if (streak.getLastLoginDate() == null) {
            // First time ever
            streak.setCurrentStreak(1);
            streak.setLongestStreak(1);
            streak.setTotalActiveDays(1);
        } else {
            long daysBetween = ChronoUnit.DAYS.between(streak.getLastLoginDate(), today);

            if (daysBetween == 1) {
                // Continuation
                streak.setCurrentStreak(streak.getCurrentStreak() + 1);
                if (streak.getCurrentStreak() > streak.getLongestStreak()) {
                    streak.setLongestStreak(streak.getCurrentStreak());
                }
            } else if (daysBetween > 1) {
                // Broken streak
                streak.setCurrentStreak(1);
            }
            // Add to total active days regardless
            streak.setTotalActiveDays(streak.getTotalActiveDays() + 1);
        }

        streak.setLastLoginDate(today);
        userStreakRepository.save(streak);
    }

    @Transactional(readOnly = true)
    public StreakDTO getStreak(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        UserStreak streak = userStreakRepository.findByUser(user).orElse(new UserStreak());

        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);
        List<DailyActivityLog> logs = dailyActivityLogRepository.findByUserAndDateBetween(user, thirtyDaysAgo, today);
        List<LocalDate> activityDates = logs.stream().map(DailyActivityLog::getDate).collect(Collectors.toList());

        return new StreakDTO(
                streak.getCurrentStreak(),
                streak.getLongestStreak(),
                streak.getTotalActiveDays(),
                activityDates
        );
    }
}
