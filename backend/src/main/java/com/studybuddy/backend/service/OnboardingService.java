package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.OnboardingRequest;
import com.studybuddy.backend.entity.AcademicBaseline;
import com.studybuddy.backend.entity.StudentProfile;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.AcademicBaselineRepository;
import com.studybuddy.backend.repository.StudentProfileRepository;
import com.studybuddy.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class OnboardingService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private AcademicBaselineRepository academicBaselineRepository;

    public void saveOnboarding(String email, OnboardingRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Save Student Profile
        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        profile.setStudyHoursPerDay(request.getStudyHoursPerDay());
        profile.setConsistencyScore(request.getConsistencyScore());
        profile.setStressLevel(request.getStressLevel());
        profile.setPreferredStudyTime(request.getPreferredStudyTime());
        studentProfileRepository.save(profile);

        // Save Academic Baseline
        AcademicBaseline baseline = new AcademicBaseline();
        baseline.setUser(user);
        baseline.setTenthPercentage(request.getTenthPercentage());
        baseline.setTwelfthPercentage(request.getTwelfthPercentage());
        academicBaselineRepository.save(baseline);
    }

    public boolean isOnboardingComplete(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return studentProfileRepository.existsByUserId(user.getId());
    }
}