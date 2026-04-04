package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.SemesterRequest;
import com.studybuddy.backend.dto.SemesterResponse;
import com.studybuddy.backend.dto.SubjectDTO;
import com.studybuddy.backend.entity.Semester;
import com.studybuddy.backend.entity.SubjectPerformance;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.SemesterRepository;
import com.studybuddy.backend.repository.SubjectPerformanceRepository;
import com.studybuddy.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SemesterService {

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private SubjectPerformanceRepository subjectPerformanceRepository;

    @Autowired
    private UserRepository userRepository;

    public SemesterResponse addSemester(String email, SemesterRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Semester semester = new Semester();
        semester.setUser(user);
        semester.setSemesterNumber(request.getSemesterNumber());
        semester.setCgpa(request.getCgpa());
        Semester saved = semesterRepository.save(semester);

        saveSubjects(saved, request);
        return buildResponse(saved);
    }

    public List<SemesterResponse> getAllSemesters(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return semesterRepository
                .findByUserIdOrderBySemesterNumberAsc(user.getId())
                .stream()
                .map(this::buildResponse)
                .collect(Collectors.toList());
    }

    public SemesterResponse updateSemester(String email, UUID id, SemesterRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        // Make sure semester belongs to this user
        if (!semester.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        semester.setSemesterNumber(request.getSemesterNumber());
        semester.setCgpa(request.getCgpa());
        Semester saved = semesterRepository.save(semester);

        // Delete old subjects and re-save
        List<SubjectPerformance> oldSubjects =
                subjectPerformanceRepository.findBySemesterId(saved.getId());
        subjectPerformanceRepository.deleteAll(oldSubjects);

        saveSubjects(saved, request);
        return buildResponse(saved);
    }

    public void deleteSemester(String email, UUID id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        if (!semester.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        semesterRepository.delete(semester);
    }

    private void saveSubjects(Semester semester, SemesterRequest request) {
        if (request.getSubjects() != null) {
            for (SubjectDTO dto : request.getSubjects()) {
                SubjectPerformance sp = new SubjectPerformance();
                sp.setSemester(semester);
                sp.setSubjectName(dto.getSubjectName());
                sp.setGrade(dto.getGrade());
                sp.setScore(dto.getScore());
                subjectPerformanceRepository.save(sp);
            }
        }
    }

    private SemesterResponse buildResponse(Semester semester) {
        List<SubjectDTO> subjects = subjectPerformanceRepository
                .findBySemesterId(semester.getId())
                .stream()
                .map(sp -> {
                    SubjectDTO dto = new SubjectDTO();
                    dto.setSubjectName(sp.getSubjectName());
                    dto.setGrade(sp.getGrade());
                    dto.setScore(sp.getScore());
                    return dto;
                })
                .collect(Collectors.toList());

        return new SemesterResponse(
                semester.getId(),
                semester.getSemesterNumber(),
                semester.getCgpa(),
                subjects
        );
    }
}