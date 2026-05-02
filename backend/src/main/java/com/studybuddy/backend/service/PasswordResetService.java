package com.studybuddy.backend.service;

import com.studybuddy.backend.entity.PasswordResetToken;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.PasswordResetTokenRepository;
import com.studybuddy.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Stores verificationToken -> username/email
    private final ConcurrentHashMap<String, String> verifiedTokens = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void sendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        tokenRepository.deleteByEmail(email);

        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        
        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        token.setOtp(otp);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        tokenRepository.save(token);

        emailService.sendOtpEmail(email, otp, user.getName());
    }

    @Transactional
    public String verifyOtp(String email, String otp) {
        PasswordResetToken token = tokenRepository.findByEmailAndOtpAndUsedFalse(email, otp)
                .orElseThrow(() -> new RuntimeException("Invalid OTP"));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired, please request a new one");
        }

        String verificationToken = UUID.randomUUID().toString();
        verifiedTokens.put(verificationToken, email);
        
        // Add a cleanup mechanism if needed, but since it's a map, 
        // we could just rely on the token expiring organically when they try to use it if we save issue time, 
        // but for now memory map is fine as requested.
        return verificationToken;
    }

    @Transactional
    public void resetPassword(String verificationToken, String newPassword) {
        String email = verifiedTokens.get(verificationToken);
        if (email == null) {
            throw new RuntimeException("Session expired, please start over");
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark OTP as used
        tokenRepository.deleteByEmail(email); // Or mark used depending on choice, deleting is safer

        verifiedTokens.remove(verificationToken);
    }
}
