package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.TopicProgress;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.entity.SyllabusNode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopicProgressRepository extends JpaRepository<TopicProgress, UUID> {
    List<TopicProgress> findByUser(User user);
    Optional<TopicProgress> findByUserAndTopic(User user, SyllabusNode topic);
    void deleteByUserId(UUID userId);
}