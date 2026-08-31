package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studybuddy.backend.dto.LearningDebtHierarchyDTO;
import com.studybuddy.backend.entity.ConceptDependency;
import com.studybuddy.backend.entity.SyllabusNode;
import com.studybuddy.backend.entity.TopicProgress;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.ConceptDependencyRepository;
import com.studybuddy.backend.repository.SyllabusNodeRepository;
import com.studybuddy.backend.repository.TopicProgressRepository;
import com.studybuddy.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Regression test for the Learning Debt hierarchy graph:
 * concept_dependency_map is a GRAPH (may contain cycles), so getHierarchyGraph()
 * must never re-link an already-visited node into the DTO tree — otherwise the
 * DTO object graph contains a cycle and Jackson serialization fails with
 * "Document nesting depth (1001) exceeds the maximum allowed (1000)".
 */
class LearningDebtServiceCycleTest {

    private ConceptDependencyRepository dependencyRepository;
    private TopicProgressRepository progressRepository;
    private SyllabusNodeRepository nodeRepository;
    private UserRepository userRepository;
    private GeminiService geminiService;
    private LearningDebtService service;

    private User user;

    @BeforeEach
    void setUp() {
        dependencyRepository = Mockito.mock(ConceptDependencyRepository.class);
        progressRepository = Mockito.mock(TopicProgressRepository.class);
        nodeRepository = Mockito.mock(SyllabusNodeRepository.class);
        userRepository = Mockito.mock(UserRepository.class);
        geminiService = Mockito.mock(GeminiService.class);
        service = new LearningDebtService(dependencyRepository, progressRepository,
                nodeRepository, userRepository, geminiService);

        user = new User();
        user.setName("Test User");
        user.setEmail("test@studybuddy.dev");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
    }

    private SyllabusNode node(String name) {
        SyllabusNode n = new SyllabusNode();
        n.setId(UUID.randomUUID());
        n.setName(name);
        n.setType("TOPIC");
        return n;
    }

    private ConceptDependency dep(SyllabusNode parent, SyllabusNode child) {
        ConceptDependency d = new ConceptDependency();
        d.setParentTopicNode(parent);
        d.setChildTopicNode(child);
        d.setSource("AI");
        d.setReason("test");
        return d;
    }

    private TopicProgress weakProgress(SyllabusNode topic, int score) {
        TopicProgress tp = new TopicProgress();
        tp.setUser(user);
        tp.setTopic(topic);
        tp.setScore(BigDecimal.valueOf(score));
        return tp;
    }

    private void stubBulkDeps(List<ConceptDependency> allDeps) {
        when(dependencyRepository.findAllWithNodesByParentIds(anySet()))
                .thenAnswer(inv -> {
                    Set<UUID> parentIds = inv.getArgument(0);
                    List<ConceptDependency> out = new ArrayList<>();
                    for (ConceptDependency d : allDeps) {
                        if (parentIds.contains(d.getParentTopicNode().getId())) {
                            out.add(d);
                        }
                    }
                    return out;
                });
    }

    @Test
    void cyclicDependencyGraphMustSerializeWithoutNestingDepthError() throws Exception {
        // Cycle: A -> B -> C -> A
        SyllabusNode a = node("TopicA");
        SyllabusNode b = node("TopicB");
        SyllabusNode c = node("TopicC");
        List<ConceptDependency> deps = List.of(dep(a, b), dep(b, c), dep(c, a));
        stubBulkDeps(deps);

        when(progressRepository.findByUserWithTopic(any(User.class)))
                .thenReturn(List.of(weakProgress(a, 40)));

        LearningDebtHierarchyDTO root = service.getHierarchyGraph("test@studybuddy.dev");

        // Serialization must succeed — this threw StreamConstraintsException
        // (nesting depth > 1000) before the cycle-skip fix.
        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(root);
        assertTrue(json != null && !json.isEmpty(), "JSON must be produced");

        // Each node must appear exactly once in the serialized tree
        assertEquals(1, countOccurrences(json, a.getId().toString()), "TopicA must appear once");
        assertEquals(1, countOccurrences(json, b.getId().toString()), "TopicB must appear once");
        assertEquals(1, countOccurrences(json, c.getId().toString()), "TopicC must appear once");

        // Tree shape: A -> [B], B -> [C], C -> [] (back-edge C -> A skipped)
        LearningDebtHierarchyDTO dtoA = root.getChildren().get(0);
        assertEquals(1, dtoA.getChildren().size());
        assertEquals(b.getId().toString(), dtoA.getChildren().get(0).getId().substring("topic-".length()));
        LearningDebtHierarchyDTO dtoB = dtoA.getChildren().get(0);
        assertEquals(1, dtoB.getChildren().size());
        LearningDebtHierarchyDTO dtoC = dtoB.getChildren().get(0);
        assertTrue(dtoC.getChildren().isEmpty(), "Back-edge to ancestor must be skipped");
    }

    @Test
    void diamondDependencyGraphMustContainEachNodeExactlyOnce() throws Exception {
        // Diamond: A -> B, A -> C, B -> D, C -> D
        SyllabusNode a = node("TopicA");
        SyllabusNode b = node("TopicB");
        SyllabusNode c = node("TopicC");
        SyllabusNode d = node("TopicD");
        List<ConceptDependency> deps = List.of(dep(a, b), dep(a, c), dep(b, d), dep(c, d));
        stubBulkDeps(deps);

        when(progressRepository.findByUserWithTopic(any(User.class)))
                .thenReturn(List.of(weakProgress(a, 50)));

        LearningDebtHierarchyDTO root = service.getHierarchyGraph("test@studybuddy.dev");

        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(root);

        assertEquals(1, countOccurrences(json, a.getId().toString()), "TopicA must appear once");
        assertEquals(1, countOccurrences(json, b.getId().toString()), "TopicB must appear once");
        assertEquals(1, countOccurrences(json, c.getId().toString()), "TopicC must appear once");
        assertEquals(1, countOccurrences(json, d.getId().toString()), "TopicD must appear once (no duplicate link)");

        // A has both children B and C; D is attached only under its first discoverer (B)
        LearningDebtHierarchyDTO dtoA = root.getChildren().get(0);
        assertEquals(2, dtoA.getChildren().size());
        LearningDebtHierarchyDTO dtoB = dtoA.getChildren().get(0);
        assertEquals(1, dtoB.getChildren().size());
        LearningDebtHierarchyDTO dtoC = dtoA.getChildren().get(1);
        assertTrue(dtoC.getChildren().isEmpty(), "Second edge into D must be skipped");
        assertFalse(json.isEmpty());
    }

    private static int countOccurrences(String haystack, String needle) {
        int count = 0;
        int idx = 0;
        while ((idx = haystack.indexOf(needle, idx)) != -1) {
            count++;
            idx += needle.length();
        }
        return count;
    }
}