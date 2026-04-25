package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.ProfileResponse;
import com.studybuddy.backend.dto.ProfileUpdateRequest;
import com.studybuddy.backend.entity.AcademicBaseline;
import com.studybuddy.backend.entity.StudentProfile;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.AcademicBaselineRepository;
import com.studybuddy.backend.repository.StudentProfileRepository;
import com.studybuddy.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    @Autowired private UserRepository userRepository;
    @Autowired private StudentProfileRepository studentProfileRepository;
    @Autowired private AcademicBaselineRepository academicBaselineRepository;

    public ProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ProfileResponse response = new ProfileResponse();
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setBranch(user.getBranch());
        response.setCurrentSemester(user.getCurrentSemester());

        studentProfileRepository.findByUserId(user.getId()).ifPresent(sp -> {
            response.setStudyHoursPerDay(sp.getStudyHoursPerDay());
            response.setConsistencyScore(sp.getConsistencyScore());
            response.setStressLevel(sp.getStressLevel());
            response.setPreferredStudyTime(sp.getPreferredStudyTime());
        });

        academicBaselineRepository.findByUserId(user.getId()).ifPresent(ab -> {
            response.setTenthPercentage(ab.getTenthPercentage());
            response.setTwelfthPercentage(ab.getTwelfthPercentage());
        });

        return response;
    }

    @Transactional
    public ProfileResponse updateProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update user table
        if (request.getName() != null && !request.getName().isBlank())
            user.setName(request.getName());
        if (request.getBranch() != null && !request.getBranch().isBlank())
            user.setBranch(request.getBranch());
        if (request.getCurrentSemester() != null)
            user.setCurrentSemester(request.getCurrentSemester());
        userRepository.save(user);

        // Update student_profiles
        StudentProfile sp = studentProfileRepository.findByUserId(user.getId())
                .orElse(new StudentProfile());
        sp.setUserId(user.getId());
        if (request.getStudyHoursPerDay() != null)
            sp.setStudyHoursPerDay(request.getStudyHoursPerDay());
        if (request.getConsistencyScore() != null)
            sp.setConsistencyScore(request.getConsistencyScore());
        if (request.getStressLevel() != null)
            sp.setStressLevel(request.getStressLevel());
        if (request.getPreferredStudyTime() != null)
            sp.setPreferredStudyTime(request.getPreferredStudyTime());
        studentProfileRepository.save(sp);

        // Update academic_baseline
        AcademicBaseline ab = academicBaselineRepository.findByUserId(user.getId())
                .orElse(new AcademicBaseline());
        ab.setUserId(user.getId());
        if (request.getTenthPercentage() != null)
            ab.setTenthPercentage(request.getTenthPercentage());
        if (request.getTwelfthPercentage() != null)
            ab.setTwelfthPercentage(request.getTwelfthPercentage());
        academicBaselineRepository.save(ab);

        return getProfile(email);
    }
}