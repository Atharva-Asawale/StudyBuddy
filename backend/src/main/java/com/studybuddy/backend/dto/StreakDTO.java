package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StreakDTO {
    private int currentStreak;
    private int longestStreak;
    private int totalActiveDays;
    private List<LocalDate> last30DaysActivity;
}
