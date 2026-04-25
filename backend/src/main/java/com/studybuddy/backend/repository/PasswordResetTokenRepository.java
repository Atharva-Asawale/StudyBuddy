package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByEmailAndOtpAndUsedFalse(String email, String otp);
    void deleteByEmail(String email);
    List<PasswordResetToken> findByExpiresAtBefore(LocalDateTime now);
}
