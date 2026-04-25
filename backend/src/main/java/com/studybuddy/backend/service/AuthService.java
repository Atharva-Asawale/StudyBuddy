package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.AuthResponse;
import com.studybuddy.backend.dto.LoginRequest;
import com.studybuddy.backend.dto.RegisterRequest;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.UserRepository;
import com.studybuddy.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setBranch(request.getBranch());
        user.setCurrentSemester(request.getCurrentSemester());
        user.setRole("STUDENT");

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole());

        return new AuthResponse(
                token,
                saved.getName(),
                saved.getEmail(),
                saved.getBranch(),
                saved.getCurrentSemester(),
                saved.getId().toString(),
                saved.getRole()
        );
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return new AuthResponse(
                token,
                user.getName(),
                user.getEmail(),
                user.getBranch(),
                user.getCurrentSemester(),
                user.getId().toString(),
                user.getRole()
        );
    }
}