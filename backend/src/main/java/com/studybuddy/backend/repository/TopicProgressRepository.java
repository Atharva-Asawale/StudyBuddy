package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.TopicProgress;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.entity.SyllabusNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopicProgressRepository extends JpaRepository<TopicProgress, UUID> {
    List<TopicProgress> findByUser(User user);

    /**
     * Loads a user's TopicProgress rows together with their SyllabusNode topic
     * in a single query. Used by LearningDebtService to avoid the per-row
     * eager topic load (one syllabus_nodes query per progress row) caused by
     * the default EAGER @ManyToOne on TopicProgress.topic.
     */
    @Query("SELECT tp FROM TopicProgress tp " +
           "JOIN FETCH tp.topic " +
           "WHERE tp.user = :user")
    List<TopicProgress> findByUserWithTopic(@Param("user") User user);

    Optional<TopicProgress> findByUserAndTopic(User user, SyllabusNode topic);
    void deleteByUserId(UUID userId);
}