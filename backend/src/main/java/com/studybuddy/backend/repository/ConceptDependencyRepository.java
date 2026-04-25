package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.ConceptDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConceptDependencyRepository extends JpaRepository<ConceptDependency, UUID> {
    
    List<ConceptDependency> findByParentTopicNodeId(UUID parentTopicNodeId);
    
    // Custom query to delete AI dependencies for a given user's weak topics?
    // User wants AI dependencies "created" but we should only keep the latest per user?
    // Wait, the concept map is global. Topics depend on topics. If user A triggers AI, 
    // it finds what topic A depends on, which acts globally. It is better to just have the dependencies as global.
}
