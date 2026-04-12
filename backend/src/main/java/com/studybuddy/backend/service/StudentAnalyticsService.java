package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.AiSubjectInsightDTO;
import com.studybuddy.backend.dto.AiSwotInputDTO;
import com.studybuddy.backend.dto.DashboardTrendPointDTO;
import com.studybuddy.backend.dto.RecentQuizDTO;
import com.studybuddy.backend.dto.StudentDashboardResponse;
import com.studybuddy.backend.dto.StudentSwotResponse;
import com.studybuddy.backend.dto.SwotAnalysisDTO;
import com.studybuddy.backend.dto.TopicPerformanceDTO;
import com.studybuddy.backend.entity.QuizResult;
import com.studybuddy.backend.entity.SyllabusNode;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.QuizResultRepository;
import com.studybuddy.backend.repository.SyllabusNodeRepository;
import com.studybuddy.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentAnalyticsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizResultRepository quizResultRepository;

    @Autowired
    private SyllabusNodeRepository syllabusNodeRepository;

    @Autowired
    private GeminiService geminiService;

    public StudentDashboardResponse getDashboard(String email) {
        User user = getUserByEmail(email);
        List<QuizResult> quizResults = quizResultRepository.findByUserOrderByAttemptedAtAsc(user);
        List<TopicAggregate> topicAggregates = buildTopicAggregates(quizResults);

        StudentDashboardResponse response = new StudentDashboardResponse();
        response.setTotalQuizzes(quizResults.size());
        response.setAverageScore(round(calculateAverageScore(quizResults)));
        response.setHighestScore(round(calculateHighestScore(quizResults)));
        response.setRecentQuizzes(buildRecentQuizzes(user));
        response.setPerformanceTrend(buildTrendData(quizResults));
        response.setTopicPerformance(buildTopicPerformance(topicAggregates));
        return response;
    }

    public StudentSwotResponse getSwot(String email) {
        User user = getUserByEmail(email);
        List<QuizResult> quizResults = quizResultRepository.findByUserOrderByAttemptedAtAsc(user);
        List<TopicAggregate> topicAggregates = buildTopicAggregates(quizResults);

        SwotAnalysisDTO ruleBased = buildRuleBasedSwot(user, quizResults, topicAggregates);
        AiSwotInputDTO aiInput = buildAiInput(quizResults, topicAggregates);
        SwotAnalysisDTO aiBased = quizResults.isEmpty() ? null : geminiService.generateSwotAnalysis(aiInput);

        StudentSwotResponse response = new StudentSwotResponse();
        response.setRuleBased(ruleBased);
        response.setAiBased(aiBased);
        return response;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private double calculateAverageScore(List<QuizResult> quizResults) {
        return quizResults.stream()
                .map(QuizResult::getScore)
                .filter(score -> score != null)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0);
    }

    private double calculateHighestScore(List<QuizResult> quizResults) {
        return quizResults.stream()
                .map(QuizResult::getScore)
                .filter(score -> score != null)
                .mapToDouble(BigDecimal::doubleValue)
                .max()
                .orElse(0);
    }

    private List<RecentQuizDTO> buildRecentQuizzes(User user) {
        return quizResultRepository.findTop5ByUserOrderByAttemptedAtDesc(user).stream()
                .map(result -> new RecentQuizDTO(
                        result.getTopic().getName(),
                        round(result.getScore().doubleValue()),
                        result.getAttemptedAt().toString()
                ))
                .toList();
    }

    private List<DashboardTrendPointDTO> buildTrendData(List<QuizResult> quizResults) {
        int startIndex = Math.max(0, quizResults.size() - 8);
        List<QuizResult> recent = quizResults.subList(startIndex, quizResults.size());
        List<DashboardTrendPointDTO> trend = new ArrayList<>();

        for (int index = 0; index < recent.size(); index++) {
            QuizResult result = recent.get(index);
            trend.add(new DashboardTrendPointDTO(
                    "Quiz " + (index + 1),
                    round(result.getScore().doubleValue())
            ));
        }

        return trend;
    }

    private List<TopicPerformanceDTO> buildTopicPerformance(List<TopicAggregate> topicAggregates) {
        return topicAggregates.stream()
                .sorted(Comparator.comparing(TopicAggregate::averageScore).reversed())
                .limit(6)
                .map(aggregate -> new TopicPerformanceDTO(
                        aggregate.topicName(),
                        round(aggregate.averageScore())
                ))
                .toList();
    }

    private SwotAnalysisDTO buildRuleBasedSwot(User user,
                                               List<QuizResult> quizResults,
                                               List<TopicAggregate> topicAggregates) {
        SwotAnalysisDTO analysis = new SwotAnalysisDTO();
        analysis.setStrengths(buildStrengths(topicAggregates));
        analysis.setWeaknesses(buildWeaknesses(topicAggregates));
        analysis.setOpportunities(buildOpportunities(user, topicAggregates));
        analysis.setThreats(buildThreats(quizResults, topicAggregates));
        analysis.setSummary(buildRuleBasedSummary(quizResults, topicAggregates));
        return analysis;
    }

    private List<String> buildStrengths(List<TopicAggregate> topicAggregates) {
        List<String> strengths = topicAggregates.stream()
                .filter(aggregate -> aggregate.averageScore() >= 70)
                .sorted(Comparator.comparing(TopicAggregate::averageScore).reversed())
                .limit(3)
                .map(aggregate -> aggregate.topicName() + " is a strong area at "
                        + Math.round(aggregate.averageScore()) + "% across "
                        + aggregate.attempts() + " attempts.")
                .toList();

        return strengths.isEmpty()
                ? List.of("No strong topics are established yet because more quiz data is needed.")
                : strengths;
    }

    private List<String> buildWeaknesses(List<TopicAggregate> topicAggregates) {
        List<String> weaknesses = topicAggregates.stream()
                .filter(aggregate -> aggregate.averageScore() < 40
                        || (aggregate.attempts() >= 2 && aggregate.lowScoreCount() >= 2))
                .sorted(Comparator.comparing(TopicAggregate::averageScore))
                .limit(3)
                .map(aggregate -> aggregate.topicName() + " is underperforming at "
                        + Math.round(aggregate.averageScore()) + "% with "
                        + aggregate.lowScoreCount() + " low-scoring attempts.")
                .toList();

        return weaknesses.isEmpty()
                ? List.of("No severe weak topics are visible from the current quiz history.")
                : weaknesses;
    }

    private List<String> buildOpportunities(User user, List<TopicAggregate> topicAggregates) {
        if (user.getBranch() == null || user.getCurrentSemester() == null) {
            return List.of("Complete onboarding details so the system can suggest syllabus-based opportunities.");
        }

        Map<String, TopicAggregate> aggregateByTopic = topicAggregates.stream()
                .collect(Collectors.toMap(TopicAggregate::topicName, aggregate -> aggregate, (left, right) -> left));

        List<SyllabusNode> availableTopics = syllabusNodeRepository
                .findByBranchAndSemesterLessThanEqualAndTypeOrderBySemesterAsc(
                        user.getBranch(),
                        user.getCurrentSemester(),
                        "TOPIC"
                );

        List<String> opportunities = new ArrayList<>();
        long notAttemptedCount = availableTopics.stream()
                .filter(topic -> !aggregateByTopic.containsKey(topic.getName()))
                .count();

        if (notAttemptedCount > 0) {
            opportunities.add(notAttemptedCount + " syllabus topics are still untouched and can broaden coverage.");
        }

        topicAggregates.stream()
                .filter(aggregate -> aggregate.attempts() == 1)
                .limit(2)
                .forEach(aggregate -> opportunities.add(aggregate.topicName()
                        + " has only been attempted once and needs more practice for a reliable pattern."));

        if (opportunities.isEmpty()) {
            opportunities.add("Most tracked topics already have repeat attempts, so the next opportunity is targeted revision of weaker areas.");
        }

        return opportunities;
    }

    private List<String> buildThreats(List<QuizResult> quizResults, List<TopicAggregate> topicAggregates) {
        LinkedHashSet<String> threats = new LinkedHashSet<>();

        String overallTrend = calculateTrend(quizResults);
        if ("decreasing".equals(overallTrend)) {
            threats.add("Your overall quiz trend is declining, which can compound gaps if revision is delayed.");
        }

        topicAggregates.stream()
                .filter(aggregate -> aggregate.attempts() >= 3 && aggregate.latestAverage() + 8 < aggregate.earlyAverage())
                .limit(2)
                .forEach(aggregate -> threats.add(aggregate.topicName()
                        + " shows a downward score pattern between earlier and recent attempts."));

        topicAggregates.stream()
                .filter(aggregate -> aggregate.lowScoreCount() >= 2)
                .limit(2)
                .forEach(aggregate -> threats.add(aggregate.topicName()
                        + " has repeated low scores, which raises the risk of persistent conceptual gaps."));

        if (threats.isEmpty()) {
            threats.add("No major threat pattern is visible right now from your current quiz history.");
        }

        return new ArrayList<>(threats);
    }

    private String buildRuleBasedSummary(List<QuizResult> quizResults, List<TopicAggregate> topicAggregates) {
        if (quizResults.isEmpty()) {
            return "No quiz history is available yet. Start attempting topic quizzes to unlock stronger dashboard and SWOT insights.";
        }

        String trend = calculateTrend(quizResults);
        long strongTopics = topicAggregates.stream().filter(aggregate -> aggregate.averageScore() >= 70).count();
        long weakTopics = topicAggregates.stream().filter(aggregate -> aggregate.averageScore() < 40).count();

        if (quizResults.size() < 5) {
            return "You have only " + quizResults.size()
                    + " recorded tests so far. Attempt more quizzes to make the performance pattern more reliable.";
        }

        return "Your average performance is " + Math.round(calculateAverageScore(quizResults))
                + "% with a " + trend + " trend, " + strongTopics + " strong topic areas, and "
                + weakTopics + " topics that still need attention.";
    }

    private AiSwotInputDTO buildAiInput(List<QuizResult> quizResults, List<TopicAggregate> topicAggregates) {
        AiSwotInputDTO input = new AiSwotInputDTO();
        input.setOverallAverage(round(calculateAverageScore(quizResults)));
        input.setTotalTests(quizResults.size());
        input.setTrend(calculateTrend(quizResults));
        input.setSubjects(topicAggregates.stream()
                .sorted(Comparator.comparing(TopicAggregate::attempts).reversed()
                        .thenComparing(TopicAggregate::averageScore, Comparator.reverseOrder()))
                .limit(8)
                .map(aggregate -> new AiSubjectInsightDTO(
                        aggregate.topicName(),
                        round(aggregate.averageScore()),
                        aggregate.attempts()
                ))
                .toList());
        return input;
    }

    private List<TopicAggregate> buildTopicAggregates(List<QuizResult> quizResults) {
        Map<String, List<QuizResult>> resultsByTopic = new LinkedHashMap<>();

        for (QuizResult quizResult : quizResults) {
            resultsByTopic.computeIfAbsent(quizResult.getTopic().getName(), key -> new ArrayList<>())
                    .add(quizResult);
        }

        List<TopicAggregate> aggregates = new ArrayList<>();
        for (Map.Entry<String, List<QuizResult>> entry : resultsByTopic.entrySet()) {
            List<QuizResult> topicResults = entry.getValue();
            topicResults.sort(Comparator.comparing(QuizResult::getAttemptedAt));

            double averageScore = topicResults.stream()
                    .mapToDouble(result -> result.getScore().doubleValue())
                    .average()
                    .orElse(0);
            long attempts = topicResults.size();
            long lowScoreCount = topicResults.stream()
                    .filter(result -> result.getScore().doubleValue() < 40)
                    .count();

            int middleIndex = Math.max(1, topicResults.size() / 2);
            double earlyAverage = topicResults.subList(0, middleIndex).stream()
                    .mapToDouble(result -> result.getScore().doubleValue())
                    .average()
                    .orElse(averageScore);
            double latestAverage = topicResults.subList(middleIndex, topicResults.size()).stream()
                    .mapToDouble(result -> result.getScore().doubleValue())
                    .average()
                    .orElse(averageScore);

            aggregates.add(new TopicAggregate(
                    entry.getKey(),
                    averageScore,
                    attempts,
                    lowScoreCount,
                    earlyAverage,
                    latestAverage
            ));
        }

        return aggregates;
    }

    private String calculateTrend(List<QuizResult> quizResults) {
        if (quizResults.size() < 3) {
            return "stable";
        }

        int midpoint = quizResults.size() / 2;
        double earlierAverage = quizResults.subList(0, midpoint).stream()
                .mapToDouble(result -> result.getScore().doubleValue())
                .average()
                .orElse(0);
        double latestAverage = quizResults.subList(midpoint, quizResults.size()).stream()
                .mapToDouble(result -> result.getScore().doubleValue())
                .average()
                .orElse(0);

        if (latestAverage >= earlierAverage + 5) {
            return "improving";
        }
        if (latestAverage <= earlierAverage - 5) {
            return "decreasing";
        }
        return "stable";
    }

    private double round(double value) {
        return BigDecimal.valueOf(value)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private record TopicAggregate(
            String topicName,
            double averageScore,
            long attempts,
            long lowScoreCount,
            double earlyAverage,
            double latestAverage
    ) {
    }
}
