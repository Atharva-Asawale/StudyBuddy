package com.studybuddy.backend.controller;

import com.studybuddy.backend.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }
            passwordResetService.sendOtp(email);
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String otp = body.get("otp");
            if (email == null || otp == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required"));
            }
            String verificationToken = passwordResetService.verifyOtp(email, otp);
            return ResponseEntity.ok(Map.of(
                    "verificationToken", verificationToken,
                    "message", "OTP verified"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String verificationToken = body.get("verificationToken");
            String newPassword = body.get("newPassword");
            if (verificationToken == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Verification token and new password are required"));
            }
            passwordResetService.resetPassword(verificationToken, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
