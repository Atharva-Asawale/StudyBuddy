package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.*;
import com.studybuddy.backend.entity.*;
import com.studybuddy.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final QuizResultRepository quizResultRepository;
    private final CustomTestRepository customTestRepository;
    private final SyllabusNodeRepository syllabusNodeRepository;
    private final TopicProgressRepository topicProgressRepository;

    public AdminStatsResponse getPlatformStats() {
        long totalStudents = userRepository.countByRole("STUDENT");
        
        List<QuizResult> syllabusResults = quizResultRepository.findAll();
        List<CustomTest> customResults = customTestRepository.findAll();
        
        long totalQuizzes = syllabusResults.size() + customResults.size();
        
        double syllabusSum = syllabusResults.stream()
                .mapToDouble(r -> r.getScore().doubleValue())
                .sum();
        double customSum = customResults.stream()
                .mapToDouble(t -> t.getPercentage().doubleValue())
                .sum();
        
        double avgScore = totalQuizzes > 0 ? (syllabusSum + customSum) / totalQuizzes : 0.0;
        
        // Count mastered topics (score >= 70) from both sources
        long masteredCount = syllabusResults.stream().filter(r -> r.getScore().doubleValue() >= 70).count()
                + customResults.stream().filter(t -> t.getPercentage().doubleValue() >= 70).count();

        Map<String, Integer> branchDist = new HashMap<>();
        Map<String, Integer> semDist = new HashMap<>();
        int onboarded = 0;
        
        List<User> users = userRepository.findByRole("STUDENT");
        for (User u : users) {
            if (u.getBranch() != null) {
                branchDist.put(u.getBranch(), branchDist.getOrDefault(u.getBranch(), 0) + 1);
                onboarded++;
            }
            if (u.getCurrentSemester() != null) {
                String semKey = "Sem " + u.getCurrentSemester();
                semDist.put(semKey, semDist.getOrDefault(semKey, 0) + 1);
            }
        }

        AdminStatsResponse stats = new AdminStatsResponse();
        stats.setTotalStudents((int) totalStudents);
        stats.setTotalCSE(branchDist.getOrDefault("CSE", 0));
        stats.setTotalAIML(branchDist.getOrDefault("AIML", 0));
        stats.setAverageCgpa(8.5); // Mock overall avg cgpa
        stats.setTotalQuizzesTaken((int) totalQuizzes);
        stats.setPlatformAverageScore(avgScore);
        stats.setTotalMasteredTopics((int) masteredCount);
        stats.setBranchDistribution(branchDist);
        stats.setSemesterDistribution(semDist);
        stats.setStudentsOnboarded(onboarded);
        
        return stats;
    }

    public List<StudentListDTO> getStudents(String search, String branch, Integer semester) {
        List<User> students = userRepository.findByRole("STUDENT");
        
        return students.stream()
                .filter(s -> (search == null || s.getName().toLowerCase().contains(search.toLowerCase()) || s.getEmail().toLowerCase().contains(search.toLowerCase())))
                .filter(s -> (branch == null || branch.isEmpty() || branch.equalsIgnoreCase(s.getBranch())))
                .filter(s -> (semester == null || semester.equals(s.getCurrentSemester())))
                .map(this::mapToStudentListDTO)
                .collect(Collectors.toList());
    }

    private StudentListDTO mapToStudentListDTO(User student) {
        List<QuizResult> syllabusResults = quizResultRepository.findByUserIdOrderByAttemptedAtDesc(student.getId());
        List<CustomTest> customResults = customTestRepository.findByUserIdOrderByCreatedAtDesc(student.getId());
        
        double syllabusAvg = syllabusResults.stream().mapToDouble(r -> r.getScore().doubleValue()).average().orElse(0.0);
        double customAvg = customResults.stream().mapToDouble(t -> t.getPercentage().doubleValue()).average().orElse(0.0);
        
        double overallAvg = (syllabusResults.size() + customResults.size()) > 0 
                ? (syllabusAvg * syllabusResults.size() + customAvg * customResults.size()) / (syllabusResults.size() + customResults.size())
                : 0.0;

        long mastered = syllabusResults.stream().filter(r -> r.getScore().doubleValue() >= 70).count()
                + customResults.stream().filter(t -> t.getPercentage().doubleValue() >= 70).count();
        long weak = syllabusResults.stream().filter(r -> r.getScore().doubleValue() < 40).count()
                + customResults.stream().filter(t -> t.getPercentage().doubleValue() < 40).count();

        StudentListDTO dto = new StudentListDTO();
        dto.setUserId(student.getId());
        dto.setName(student.getName());
        dto.setEmail(student.getEmail());
        dto.setBranch(student.getBranch());
        dto.setCurrentSemester(student.getCurrentSemester());
        dto.setAverageScore(overallAvg);
        dto.setLatestCgpa(8.0 + (overallAvg > 0 ? (overallAvg / 100.0) * 2.0 : 0)); // Mocking CGPA roughly based on platform score
        dto.setTotalQuizzes(syllabusResults.size() + customResults.size());
        dto.setMasteredTopics((int) mastered);
        dto.setWeakTopics((int) weak);
        dto.setCreatedAt(student.getCreatedAt() != null ? student.getCreatedAt().toLocalDate().toString() : "Recent");
        
        return dto;
    }

    public StudentDetailDTO getStudentDetail(UUID studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<QuizResult> syllabusResults = quizResultRepository.findByUserIdOrderByAttemptedAtDesc(student.getId());
        List<CustomTest> customResults = customTestRepository.findByUserIdOrderByCreatedAtDesc(student.getId());

        List<TopicPerformanceDTO> performance = new ArrayList<>();
        
        // Add syllabus performance
        Map<String, List<QuizResult>> syllabusByTopic = syllabusResults.stream()
                .collect(Collectors.groupingBy(r -> r.getTopic().getName()));
        
        syllabusByTopic.forEach((topic, results) -> {
            double avg = results.stream().mapToDouble(r -> r.getScore().doubleValue()).average().orElse(0);
            performance.add(new TopicPerformanceDTO(topic, avg, results.size(), avg >= 70));
        });

        // Add custom performance with tag
        Map<String, List<CustomTest>> customByTopic = customResults.stream()
                .collect(Collectors.groupingBy(t -> "[Custom Test] " + t.getTopicName()));
        
        customByTopic.forEach((topic, results) -> {
            double avg = results.stream().mapToDouble(t -> t.getPercentage().doubleValue()).average().orElse(0);
            performance.add(new TopicPerformanceDTO(topic, avg, results.size(), avg >= 70));
        });

        StudentDetailDTO dto = new StudentDetailDTO();
        dto.setId(student.getId());
        dto.setName(student.getName());
        dto.setEmail(student.getEmail());
        dto.setBranch(student.getBranch());
        dto.setSemester(student.getCurrentSemester());
        dto.setPerformance(performance);
        
        return dto;
    }

    public List<WeakTopicDTO> getPlatformWeakTopics() {
        List<QuizResult> allSyllabus = quizResultRepository.findAll();
        List<CustomTest> allCustom = customTestRepository.findAll();
        
        Map<String, List<Double>> scoresByTopic = new HashMap<>();
        
        allSyllabus.forEach(r -> {
            scoresByTopic.computeIfAbsent(r.getTopic().getName(), k -> new ArrayList<>())
                    .add(r.getScore().doubleValue());
        });
        
        allCustom.forEach(t -> {
            scoresByTopic.computeIfAbsent("[Custom] " + t.getTopicName(), k -> new ArrayList<>())
                    .add(t.getPercentage().doubleValue());
        });

        return scoresByTopic.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
                    return new WeakTopicDTO(e.getKey(), avg, e.getValue().size());
                })
                .filter(w -> w.getAvgScore() < 60)
                .sorted(Comparator.comparingDouble(WeakTopicDTO::getAvgScore))
                .limit(10)
                .collect(Collectors.toList());
    }
}
