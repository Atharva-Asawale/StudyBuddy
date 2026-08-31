package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.ResourceRecommendationCache;
import com.studybuddy.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResourceRecommendationCacheRepository extends JpaRepository<ResourceRecommendationCache, Long> {
    Optional<ResourceRecommendationCache> findByStudent(User student);
    void deleteByStudent(User student);
}
