package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.ConceptDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface ConceptDependencyRepository extends JpaRepository<ConceptDependency, UUID> {

    /** Used by analyzeAndCacheDebt to check existing deps for a single topic. */
    List<ConceptDependency> findByParentTopicNodeId(UUID parentTopicNodeId);

    /** Bulk fetch — used by getGraph and getHierarchyGraph to eliminate N+1 queries. */
    List<ConceptDependency> findByParentTopicNodeIdIn(Collection<UUID> parentIds);

    /**
     * Bulk fetch with JOIN FETCH so parentTopicNode and childTopicNode are
     * initialized in the same query — prevents lazy-loading N+1 when the
     * caller accesses the node relationships.
     */
    @Query("SELECT d FROM ConceptDependency d " +
           "JOIN FETCH d.parentTopicNode " +
           "JOIN FETCH d.childTopicNode " +
           "WHERE d.parentTopicNode.id IN :parentIds")
    List<ConceptDependency> findAllWithNodesByParentIds(@Param("parentIds") Set<UUID> parentIds);

    /** Efficient check: does a dependency parent → child already exist? */
    boolean existsByParentTopicNodeIdAndChildTopicNodeId(UUID parentTopicNodeId, UUID childTopicNodeId);
}

