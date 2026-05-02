package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.DashboardTrendPointDTO;
import com.studybuddy.backend.dto.RecentQuizDTO;
import com.studybuddy.backend.dto.StudentDashboardResponse;
import com.studybuddy.backend.dto.StudentSwotResponse;
import com.studybuddy.backend.dto.SwotAnalysisDTO;
import com.studybuddy.backend.dto.TopicPerformanceDTO;
import com.studybuddy.backend.entity.CustomTest;
import com.studybuddy.backend.entity.QuizResult;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.CustomTestRepository;
import com.studybuddy.backend.repository.QuizResultRepository;
import com.studybuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentAnalyticsService {

    private final QuizResultRepository quizResultRepository;
    private final CustomTestRepository customTestRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;

    public StudentDashboardResponse getDashboardData(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<QuizResult> syllabusResults = quizResultRepository.findByUserIdOrderByAttemptedAtAsc(user.getId());
        List<CustomTest> customResults = customTestRepository.findByUserIdOrderByCreatedAtAsc(user.getId());

        List<UnifiedAttempt> allAttempts = unifyResults(syllabusResults, customResults);

        if (allAttempts.isEmpty()) {
            return createEmptyDashboard();
        }

        double avgScore = allAttempts.stream()
                .mapToDouble(UnifiedAttempt::getPercentage)
                .average()
                .orElse(0.0);

        double highestScore = allAttempts.stream()
                .mapToDouble(UnifiedAttempt::getPercentage)
                .max()
                .orElse(0.0);

        List<RecentQuizDTO> recentQuizzes = allAttempts.stream()
                .sorted(Comparator.comparing(UnifiedAttempt::getTimestamp).reversed())
                .limit(5)
                .map(a -> new RecentQuizDTO(
                        a.getTopicName(),
                        a.getPercentage(),
                        a.getTimestamp().toString()))
                .collect(Collectors.toList());

        List<DashboardTrendPointDTO> trend = allAttempts.stream()
                .sorted(Comparator.comparing(UnifiedAttempt::getTimestamp))
                .map(a -> new DashboardTrendPointDTO(
                        a.getTimestamp().toLocalDate().toString(),
                        a.getPercentage()))
                .collect(Collectors.toList());

        Map<String, TopicAggregate> topicStats = calculateTopicStats(allAttempts);

        List<TopicPerformanceDTO> performance = topicStats.entrySet().stream()
                .map(e -> new TopicPerformanceDTO(
                        e.getKey(),
                        e.getValue().getAvgScore(),
                        e.getValue().getAttempts(),
                        e.getValue().isMastered()))
                .sorted(Comparator.comparingDouble(TopicPerformanceDTO::getScore).reversed())
                .collect(Collectors.toList());

        StudentDashboardResponse response = new StudentDashboardResponse();
        response.setAverageScore(avgScore);
        response.setHighestScore(highestScore);
        response.setTotalQuizzes(allAttempts.size());
        response.setMasteredTopics((int) topicStats.values().stream().filter(TopicAggregate::isMastered).count());
        response.setPerformanceTrend(trend);
        response.setRecentQuizzes(recentQuizzes);
        response.setTopicPerformance(performance);

        return response;
    }

    private List<UnifiedAttempt> unifyResults(List<QuizResult> syllabus, List<CustomTest> custom) {
        List<UnifiedAttempt> unified = new ArrayList<>();
        for (QuizResult r : syllabus) {
            unified.add(new UnifiedAttempt(
                    r.getTopic().getName(),
                    r.getScore().doubleValue(),
                    r.getAttemptedAt(),
                    r.getScore().doubleValue() >= 70
            ));
        }
        for (CustomTest t : custom) {
            unified.add(new UnifiedAttempt(
                    "[Custom Test] " + t.getTopicName(),
                    t.getPercentage().doubleValue(),
                    t.getCreatedAt(),
                    t.getPercentage().doubleValue() >= 70
            ));
        }
        return unified.stream()
                .sorted(Comparator.comparing(UnifiedAttempt::getTimestamp))
                .collect(Collectors.toList());
    }

    private Map<String, TopicAggregate> calculateTopicStats(List<UnifiedAttempt> attempts) {
        Map<String, List<UnifiedAttempt>> grouped = attempts.stream()
                .collect(Collectors.groupingBy(UnifiedAttempt::getTopicName));

        Map<String, TopicAggregate> stats = new HashMap<>();
        grouped.forEach((topic, list) -> {
            double avg = list.stream().mapToDouble(UnifiedAttempt::getPercentage).average().orElse(0);
            boolean mastered = list.stream().anyMatch(UnifiedAttempt::isMastered);
            stats.put(topic, new TopicAggregate(avg, list.size(), mastered));
        });
        return stats;
    }

    private StudentDashboardResponse createEmptyDashboard() {
        StudentDashboardResponse r = new StudentDashboardResponse();
        r.setAverageScore(0);
        r.setHighestScore(0);
        r.setTotalQuizzes(0);
        r.setMasteredTopics(0);
        r.setPerformanceTrend(new ArrayList<>());
        r.setRecentQuizzes(new ArrayList<>());
        r.setTopicPerformance(new ArrayList<>());
        return r;
    }

    public StudentSwotResponse getSwotData(String email) {
        StudentDashboardResponse dash = getDashboardData(email);
        List<TopicPerformanceDTO> perf = dash.getTopicPerformance();

        List<String> strengths = perf.stream().filter(p -> p.getScore() >= 80).map(TopicPerformanceDTO::getTopic).limit(4).collect(Collectors.toList());
        List<String> weaknesses = perf.stream().filter(p -> p.getScore() < 60).map(TopicPerformanceDTO::getTopic).limit(4).collect(Collectors.toList());
        List<String> opportunities = perf.stream().filter(p -> p.getScore() >= 60 && p.getScore() < 80).map(TopicPerformanceDTO::getTopic).limit(4).collect(Collectors.toList());
        List<String> threats = perf.stream().filter(p -> p.getAttempts() > 2 && p.getScore() < 70).map(TopicPerformanceDTO::getTopic).limit(4).collect(Collectors.toList());

        SwotAnalysisDTO ruleBased = new SwotAnalysisDTO(strengths, weaknesses, opportunities, threats, 
            "Keep focusing on your weaknesses while maintaining your core strengths.");
        
        // Attempt AI analysis
        SwotAnalysisDTO aiBased = null;
        try {
            com.studybuddy.backend.dto.AiSwotInputDTO aiInput = new com.studybuddy.backend.dto.AiSwotInputDTO();
            aiInput.setOverallAverage(dash.getAverageScore());
            aiInput.setTotalTests(dash.getTotalQuizzes());
            
            // Map performance to AI insights
            Map<String, List<TopicPerformanceDTO>> bySubject = perf.stream()
                .collect(Collectors.groupingBy(p -> (String) inferSubjectFromTopic(p.getTopic())));
                
            List<com.studybuddy.backend.dto.AiSubjectInsightDTO> subjectInsights = new ArrayList<>();
            for (Map.Entry<String, List<TopicPerformanceDTO>> entry : bySubject.entrySet()) {
                double avg = entry.getValue().stream().mapToDouble(TopicPerformanceDTO::getScore).average().orElse(0.0);
                com.studybuddy.backend.dto.AiSubjectInsightDTO insight = new com.studybuddy.backend.dto.AiSubjectInsightDTO();
                insight.setSubject(entry.getKey());
                insight.setScore(avg);
                subjectInsights.add(insight);
            }
            aiInput.setSubjects(subjectInsights);
            
            aiBased = geminiService.generateSwotAnalysis(aiInput);
        } catch (Exception e) {
            // Fallback to null for AI part
        }

        return new StudentSwotResponse(ruleBased, aiBased);
    }

    private String inferSubjectFromTopic(String topicName) {
        String text = String.valueOf(topicName).toLowerCase();
        if (text.contains("math")) return "Mathematics";
        if (text.contains("physics")) return "Physics";
        if (text.contains("chem")) return "Chemistry";
        if (text.contains("algo") || text.contains("data structure") || text.contains("dbms") || text.contains("os") || text.contains("network")) return "Computer Science";
        return "General";
    }

    private static class UnifiedAttempt {
        private final String topicName;
        private final double percentage;
        private final java.time.LocalDateTime timestamp;
        private final boolean mastered;

        public UnifiedAttempt(String topicName, double percentage, java.time.LocalDateTime timestamp, boolean mastered) {
            this.topicName = topicName;
            this.percentage = percentage;
            this.timestamp = timestamp;
            this.mastered = mastered;
        }

        public String getTopicName() { return topicName; }
        public double getPercentage() { return percentage; }
        public java.time.LocalDateTime getTimestamp() { return timestamp; }
        public boolean isMastered() { return mastered; }
    }

    private static class TopicAggregate {
        private final double avgScore;
        private final int attempts;
        private final boolean mastered;

        public TopicAggregate(double avgScore, int attempts, boolean mastered) {
            this.avgScore = avgScore;
            this.attempts = attempts;
            this.mastered = mastered;
        }

        public double getAvgScore() { return avgScore; }
        public int getAttempts() { return attempts; }
        public boolean isMastered() { return mastered; }
    }
}
