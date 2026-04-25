package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(String role);
    long countByRoleAndBranch(String role, String branch);
    java.util.List<User> findByRole(String role);
}