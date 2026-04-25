package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.*;
import com.studybuddy.backend.entity.*;
import com.studybuddy.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final AcademicBaselineRepository academicRepository;
    private final SemesterRepository semesterRepository;
    private final TopicProgressRepository progressRepository;
    private final SyllabusNodeRepository syllabusRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");

    public AdminStatsDTO getAdminStats() {
        AdminStatsDTO stats = new AdminStatsDTO();
        
        long totalStudents = userRepository.countByRole("STUDENT");
        stats.setTotalStudents((int) totalStudents);
        stats.setTotalCSE((int) userRepository.countByRoleAndBranch("STUDENT", "CSE"));
        stats.setTotalAIML((int) userRepository.countByRoleAndBranch("STUDENT", "AIML"));

        List<Semester> allSemesters = semesterRepository.findAll();
        double avgCgpa = allSemesters.stream()
                .filter(s -> s.getCgpa() != null)
                .mapToDouble(s -> s.getCgpa().doubleValue())
                .average()
                .orElse(0.0);
        stats.setAverageCgpa(avgCgpa);

        List<TopicProgress> allProgress = progressRepository.findAll();
        stats.setTotalQuizzesTaken(allProgress.size());
        stats.setTotalMasteredTopics((int) allProgress.stream().filter(TopicProgress::getMastered).count());
        
        double avgScore = allProgress.stream()
                .filter(p -> p.getScore() != null)
                .mapToDouble(p -> p.getScore().doubleValue())
                .average()
                .orElse(0.0);
        stats.setPlatformAverageScore(avgScore);

        stats.setStudentsOnboarded((int) profileRepository.count());

        // Distributions
        List<User> students = userRepository.findByRole("STUDENT");
        Map<String, Integer> semDist = new HashMap<>();
        Map<String, Integer> branchDist = new HashMap<>();

        for (User s : students) {
            String semKey = "Sem " + (s.getCurrentSemester() != null ? s.getCurrentSemester() : "?");
            semDist.put(semKey, semDist.getOrDefault(semKey, 0) + 1);
            
            String branch = s.getBranch() != null ? s.getBranch() : "Unknown";
            branchDist.put(branch, branchDist.getOrDefault(branch, 0) + 1);
        }
        stats.setSemesterDistribution(semDist);
        stats.setBranchDistribution(branchDist);

        return stats;
    }

    public List<StudentSummaryDTO> getAllStudents(String search, String branch, String sortBy) {
        List<User> students = userRepository.findByRole("STUDENT");

        // Filter
        return students.stream()
                .filter(u -> branch == null || branch.isEmpty() || "All".equalsIgnoreCase(branch) || branch.equalsIgnoreCase(u.getBranch()))
                .filter(u -> search == null || search.isEmpty() || 
                        u.getName().toLowerCase().contains(search.toLowerCase()) || 
                        u.getEmail().toLowerCase().contains(search.toLowerCase()))
                .map(this::mapToSummary)
                // Sort
                .sorted((s1, s2) -> {
                    String sort = sortBy != null ? sortBy : "createdAt";
                    switch (sort) {
                        case "name": return s1.getName().compareToIgnoreCase(s2.getName());
                        case "cgpa": return compareNullable(s2.getLatestCgpa(), s1.getLatestCgpa());
                        case "quizzes": return s2.getTotalQuizzes().compareTo(s1.getTotalQuizzes());
                        case "weakTopics": return s2.getWeakTopics().compareTo(s1.getWeakTopics());
                        default: return s2.getCreatedAt().compareTo(s1.getCreatedAt()); // Default: newest first
                    }
                })
                .collect(Collectors.toList());
    }

    public StudentDetailDTO getStudentDetail(UUID userId) {
        User user = userRepository.findById(userId)
                .filter(u -> "STUDENT".equals(u.getRole()))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        StudentDetailDTO detail = new StudentDetailDTO();
        // Map common fields from mapToSummary
        StudentSummaryDTO summary = mapToSummary(user);
        detail.setUserId(summary.getUserId());
        detail.setName(summary.getName());
        detail.setEmail(summary.getEmail());
        detail.setBranch(summary.getBranch());
        detail.setCurrentSemester(summary.getCurrentSemester());
        detail.setLatestCgpa(summary.getLatestCgpa());
        detail.setTotalQuizzes(summary.getTotalQuizzes());
        detail.setMasteredTopics(summary.getMasteredTopics());
        detail.setWeakTopics(summary.getWeakTopics());
        detail.setAverageScore(summary.getAverageScore());
        detail.setCreatedAt(summary.getCreatedAt());
        detail.setPreferredStudyTime(summary.getPreferredStudyTime());
        detail.setStressLevel(summary.getStressLevel());

        // Specific fields
        detail.setSemesters(semesterRepository.findByUserIdOrderBySemesterNumberAsc(userId).stream()
                .map(s -> new SemesterResponse(s.getId(), s.getSemesterNumber(), s.getCgpa(), 
                        s.getSubjects() != null ? s.getSubjects().stream().map(sp -> {
                            SubjectDTO sd = new SubjectDTO();
                            sd.setSubjectName(sp.getSubjectName());
                            sd.setGrade(sp.getGrade());
                            sd.setScore(sp.getScore());
                            return sd;
                        }).collect(Collectors.toList()) : Collections.emptyList()))
                .collect(Collectors.toList()));

        AcademicBaseline academic = academicRepository.findById(userId).orElse(null);
        if (academic != null) {
            detail.setTenthPercentage(academic.getTenthPercentage());
            detail.setTwelfthPercentage(academic.getTwelfthPercentage());
        }

        StudentProfile profile = profileRepository.findById(userId).orElse(null);
        if (profile != null) {
            detail.setStudyHoursPerDay(profile.getStudyHoursPerDay());
            detail.setConsistencyScore(profile.getConsistencyScore());
        }

        List<TopicProgress> progress = progressRepository.findByUser(user);
        detail.setTopicProgress(progress.stream().map(p -> {
            TopicProgressDTO d = new TopicProgressDTO();
            if (p.getTopic() != null) {
                d.setTopicId(p.getTopic().getId());
                d.setTopicName(p.getTopic().getName());
            } else {
                d.setTopicName("Unknown Topic");
            }
            d.setScore(p.getScore());
            d.setAttempts(p.getAttempts());
            d.setMastered(p.getMastered());
            return d;
        }).collect(Collectors.toList()));

        return detail;
    }

    public List<WeakTopicDTO> getWeakTopics() {
        // Simple manual aggregation since we're using repositories
        List<TopicProgress> allWeak = progressRepository.findAll().stream()
                .filter(p -> p.getScore() != null && p.getScore().doubleValue() < 60)
                .collect(Collectors.toList());

        Map<String, List<TopicProgress>> grouped = allWeak.stream()
                .filter(p -> p.getTopic() != null)
                .collect(Collectors.groupingBy(p -> p.getTopic().getName()));

        return grouped.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream()
                            .mapToDouble(p -> p.getScore().doubleValue())
                            .average()
                            .orElse(0.0);
                    return new WeakTopicDTO(e.getKey(), (long) e.getValue().size(), avg);
                })
                .sorted((w1, w2) -> w2.getWeakCount().compareTo(w1.getWeakCount()))
                .limit(15)
                .collect(Collectors.toList());
    }

    private StudentSummaryDTO mapToSummary(User student) {
        StudentSummaryDTO dto = new StudentSummaryDTO();
        dto.setUserId(student.getId());
        dto.setName(student.getName());
        dto.setEmail(student.getEmail());
        dto.setBranch(student.getBranch());
        dto.setCurrentSemester(student.getCurrentSemester());
        dto.setCreatedAt(student.getCreatedAt().format(DATE_FORMATTER));

        // Profile
        profileRepository.findById(student.getId()).ifPresent(p -> {
            dto.setPreferredStudyTime(p.getPreferredStudyTime());
            dto.setStressLevel(p.getStressLevel());
        });

        // Semester / CGPA
        List<Semester> sems = semesterRepository.findByUserIdOrderBySemesterNumberAsc(student.getId());
        if (!sems.isEmpty()) {
            dto.setLatestCgpa(sems.get(sems.size() - 1).getCgpa());
        }

        // Progress
        List<TopicProgress> progress = progressRepository.findByUser(student);
        dto.setTotalQuizzes(progress.size());
        dto.setMasteredTopics((int) progress.stream().filter(TopicProgress::getMastered).count());
        dto.setWeakTopics((int) progress.stream().filter(p -> p.getScore() != null && p.getScore().doubleValue() < 60).count());
        
        double avg = progress.stream()
                .filter(p -> p.getScore() != null)
                .mapToDouble(p -> p.getScore().doubleValue())
                .average()
                .orElse(0.0);
        dto.setAverageScore(avg);

        return dto;
    }

    private <T extends Comparable<T>> int compareNullable(T a, T b) {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return a.compareTo(b);
    }
}
