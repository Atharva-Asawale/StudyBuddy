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
    private final StudentProfileRepository studentProfileRepository;
    private final AcademicBaselineRepository academicBaselineRepository;
    private final SemesterRepository semesterRepository;

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

        double totalCgpa = 0;
        int cgpaCount = 0;
        for (User u : users) {
            List<Semester> sems = semesterRepository.findByUserIdOrderBySemesterNumberAsc(u.getId());
            if (!sems.isEmpty()) {
                Semester last = sems.get(sems.size() - 1);
                if (last.getCgpa() != null) {
                    totalCgpa += last.getCgpa().doubleValue();
                    cgpaCount++;
                }
            }
        }

        AdminStatsResponse stats = new AdminStatsResponse();
        stats.setTotalStudents((int) totalStudents);
        stats.setTotalCSE(branchDist.getOrDefault("CSE", 0));
        stats.setTotalAIML(branchDist.getOrDefault("AIML", 0));
        stats.setAverageCgpa(cgpaCount > 0 ? totalCgpa / cgpaCount : 0.0);
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

        List<Semester> semesters = semesterRepository.findByUserIdOrderBySemesterNumberAsc(student.getId());
        double latestCgpa = 0.0;
        if (!semesters.isEmpty()) {
            Semester last = semesters.get(semesters.size() - 1);
            if (last.getCgpa() != null) {
                latestCgpa = last.getCgpa().doubleValue();
            }
        }

        StudentListDTO dto = new StudentListDTO();
        dto.setUserId(student.getId());
        dto.setName(student.getName());
        dto.setEmail(student.getEmail());
        dto.setBranch(student.getBranch());
        dto.setCurrentSemester(student.getCurrentSemester());
        dto.setAverageScore(overallAvg);
        dto.setLatestCgpa(latestCgpa);
        dto.setTotalQuizzes(syllabusResults.size() + customResults.size());
        dto.setMasteredTopics((int) mastered);
        dto.setWeakTopics((int) weak);
        dto.setCreatedAt(student.getCreatedAt() != null ? student.getCreatedAt().toLocalDate().toString() : "Recent");
        
        return dto;
    }

    @Transactional(readOnly = true)
    public StudentDetailDTO getStudentDetail(UUID studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<QuizResult> syllabusResults = quizResultRepository.findByUserIdOrderByAttemptedAtDesc(student.getId());
        List<CustomTest> customResults = customTestRepository.findByUserIdOrderByCreatedAtDesc(student.getId());

        List<StudentDetailDTO.TopicProgressItem> topicProgress = new ArrayList<>();
        
        long mastered = 0;
        long weak = 0;
        
        Map<String, List<QuizResult>> syllabusByTopic = syllabusResults.stream()
                .collect(Collectors.groupingBy(r -> r.getTopic().getName()));
        
        for (Map.Entry<String, List<QuizResult>> entry : syllabusByTopic.entrySet()) {
            double avg = entry.getValue().stream().mapToDouble(r -> r.getScore().doubleValue()).average().orElse(0);
            StudentDetailDTO.TopicProgressItem item = new StudentDetailDTO.TopicProgressItem();
            item.setTopicId(UUID.randomUUID().toString());
            item.setTopicName(entry.getKey());
            item.setScore(avg);
            item.setMastered(avg >= 70);
            topicProgress.add(item);
            if (avg >= 70) mastered++;
            if (avg < 40) weak++;
        }

        Map<String, List<CustomTest>> customByTopic = customResults.stream()
                .collect(Collectors.groupingBy(t -> "[Custom Test] " + t.getTopicName()));
        
        for (Map.Entry<String, List<CustomTest>> entry : customByTopic.entrySet()) {
            double avg = entry.getValue().stream().mapToDouble(t -> t.getPercentage().doubleValue()).average().orElse(0);
            StudentDetailDTO.TopicProgressItem item = new StudentDetailDTO.TopicProgressItem();
            item.setTopicId(UUID.randomUUID().toString());
            item.setTopicName(entry.getKey());
            item.setScore(avg);
            item.setMastered(avg >= 70);
            topicProgress.add(item);
            if (avg >= 70) mastered++;
            if (avg < 40) weak++;
        }

        StudentDetailDTO dto = new StudentDetailDTO();
        dto.setId(student.getId());
        dto.setName(student.getName());
        dto.setEmail(student.getEmail());
        dto.setBranch(student.getBranch());
        dto.setCurrentSemester(student.getCurrentSemester());
        dto.setTotalQuizzes(syllabusResults.size() + customResults.size());
        dto.setMasteredTopics((int) mastered);
        dto.setWeakTopics((int) weak);
        
        StudentProfile profile = studentProfileRepository.findById(student.getId()).orElse(null);
        if (profile != null) {
            dto.setStudyHoursPerDay(profile.getStudyHoursPerDay());
            dto.setStressLevel(profile.getStressLevel());
            dto.setPreferredStudyTime(profile.getPreferredStudyTime());
            dto.setConsistencyScore(profile.getConsistencyScore());
        }
        
        AcademicBaseline baseline = academicBaselineRepository.findById(student.getId()).orElse(null);
        if (baseline != null) {
            dto.setTenthPercentage(baseline.getTenthPercentage());
            dto.setTwelfthPercentage(baseline.getTwelfthPercentage());
        }
        
        List<Semester> semesters = semesterRepository.findByUserIdOrderBySemesterNumberAsc(student.getId());
        List<StudentDetailDTO.SemesterData> semDataList = new ArrayList<>();
        double latestCgpa = 0.0;
        
        for (Semester sem : semesters) {
            StudentDetailDTO.SemesterData semData = new StudentDetailDTO.SemesterData();
            semData.setSemesterNumber(sem.getSemesterNumber());
            semData.setCgpa(sem.getCgpa() != null ? sem.getCgpa().doubleValue() : 0.0);
            latestCgpa = semData.getCgpa();
            
            List<StudentDetailDTO.SubjectData> subDataList = new ArrayList<>();
            if (sem.getSubjects() != null) {
                for (SubjectPerformance sp : sem.getSubjects()) {
                    StudentDetailDTO.SubjectData subData = new StudentDetailDTO.SubjectData();
                    subData.setSubjectName(sp.getSubjectName());
                    subData.setScore(sp.getScore() != null ? sp.getScore().doubleValue() : 0.0);
                    subDataList.add(subData);
                }
            }
            semData.setSubjects(subDataList);
            semDataList.add(semData);
        }
        
        dto.setLatestCgpa(latestCgpa);
        dto.setSemesters(semDataList);
        dto.setTopicProgress(topicProgress);
        
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
