package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.studybuddy.backend.dto.LearningDebtGraphDTO;
import com.studybuddy.backend.dto.LearningDebtHierarchyDTO;
import com.studybuddy.backend.entity.ConceptDependency;
import com.studybuddy.backend.entity.SyllabusNode;
import com.studybuddy.backend.entity.TopicProgress;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.ConceptDependencyRepository;
import com.studybuddy.backend.repository.SyllabusNodeRepository;
import com.studybuddy.backend.repository.TopicProgressRepository;
import com.studybuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningDebtService {

    /** Simple triple holder for BFS entries: (SyllabusNode, DTO, depth). */
    private record BfsTriple(SyllabusNode node, LearningDebtHierarchyDTO dto, int depth) {}

    private final ConceptDependencyRepository dependencyRepository;
    private final TopicProgressRepository progressRepository;
    private final SyllabusNodeRepository nodeRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final ObjectMapper mapper = new ObjectMapper();

    /** Maximum BFS depth when traversing concept_dependency_map */
    private static final int MAX_DEPTH = 5;

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    // -------------------------------------------------------------------------
    // getGraph() — used by GET /api/debt/graph (Dashboard summary)
    // -------------------------------------------------------------------------
    public LearningDebtGraphDTO getGraph(String email) {
        User user = findUser(email);

        // JOIN FETCH variant: loads every TopicProgress together with its
        // SyllabusNode topic in one query, avoiding the per-row eager topic
        // load (one syllabus_nodes query per progress row).
        List<TopicProgress> progresses = progressRepository.findByUserWithTopic(user);

        return buildGraphDto(progresses);
    }

    /**
     * Builds the graph DTO from already-loaded progress rows. Shared by
     * getGraph() and analyzeAndCacheDebt() so the analyze flow reuses the
     * user and progress data it already loaded instead of re-fetching both.
     * The dependency bulk query intentionally runs here — after any newly
     * inserted dependencies — so the response always reflects current data.
     */
    private LearningDebtGraphDTO buildGraphDto(List<TopicProgress> progresses) {
        // Find weak topics (score < 60)
        List<TopicProgress> weakTopics = progresses.stream()
                .filter(p -> p.getScore() != null && p.getScore().compareTo(BigDecimal.valueOf(60)) < 0)
                .collect(Collectors.toList());

        LearningDebtGraphDTO result = new LearningDebtGraphDTO();
        List<LearningDebtGraphDTO.WeakTopicDTO> weakTopicsList = new ArrayList<>();
        if (weakTopics.isEmpty()) {
            result.setWeakTopics(weakTopicsList);
            return result;
        }

        // Bulk-load dependencies for ALL weak topics in one query (with nodes
        // fetch-joined to avoid lazy-loading queries), then group in memory.
        Set<UUID> weakTopicIds = weakTopics.stream()
                .map(wp -> wp.getTopic().getId())
                .collect(Collectors.toSet());
        List<ConceptDependency> allDeps = dependencyRepository.findAllWithNodesByParentIds(weakTopicIds);
        Map<UUID, List<ConceptDependency>> depsByParent = allDeps.stream()
                .collect(Collectors.groupingBy(d -> d.getParentTopicNode().getId()));

        for (TopicProgress wp : weakTopics) {
            SyllabusNode weakNode = wp.getTopic();

            List<ConceptDependency> dependencies =
                    depsByParent.getOrDefault(weakNode.getId(), Collections.emptyList());

            LearningDebtGraphDTO.WeakTopicDTO wDto = new LearningDebtGraphDTO.WeakTopicDTO();
            wDto.setId(weakNode.getId());
            wDto.setName(weakNode.getName());
            wDto.setScore(wp.getScore());

            List<LearningDebtGraphDTO.AffectedTopicDTO> affectedList = new ArrayList<>();
            for (ConceptDependency dep : dependencies) {
                if (dep.getChildTopicNode() != null) {
                    LearningDebtGraphDTO.AffectedTopicDTO aDto = new LearningDebtGraphDTO.AffectedTopicDTO();
                    aDto.setId(dep.getChildTopicNode().getId());
                    aDto.setName(dep.getChildTopicNode().getName());
                    aDto.setReason(dep.getReason());
                    aDto.setSource(dep.getSource() != null ? dep.getSource() : "db");
                    affectedList.add(aDto);
                }
            }
            wDto.setAffects(affectedList);
            weakTopicsList.add(wDto);
        }

        result.setWeakTopics(weakTopicsList);
        return result;
    }

    // -------------------------------------------------------------------------
    // analyzeAndCacheDebt() — POST /api/debt/analyze
    // Calls Gemini ONLY when DB dependencies are missing/incomplete for a topic.
    // Never calls Gemini when the DB already has dependencies for the weak topic.
    // -------------------------------------------------------------------------
    @Transactional
    public LearningDebtGraphDTO analyzeAndCacheDebt(String email) {
        User user = findUser(email);

        List<TopicProgress> progresses = progressRepository.findByUserWithTopic(user);

        List<TopicProgress> weakTopics = progresses.stream()
                .filter(p -> p.getScore() != null && p.getScore().compareTo(BigDecimal.valueOf(60)) < 0)
                .collect(Collectors.toList());

        Integer semester = user.getCurrentSemester() != null ? user.getCurrentSemester() : 1;
        String branch = user.getBranch() != null ? user.getBranch() : "";

        // Build progress map for quick lookup
        Map<UUID, BigDecimal> progressMap = new HashMap<>();
        for (TopicProgress tp : progresses) {
            if (tp.getTopic() != null && tp.getScore() != null) {
                progressMap.put(tp.getTopic().getId(), tp.getScore());
            }
        }

        // Fetch valid student syllabus topics (same branch, up to current semester and beyond)
        // Use existing nodes from student's branch — these are the only valid target topics
        List<SyllabusNode> studentSyllabusNodes = nodeRepository.findByBranchAndSemesterGreaterThanEqual(branch, semester);
        if (studentSyllabusNodes.isEmpty()) {
            studentSyllabusNodes = nodeRepository.findAll();
        }

        // Build a lookup map of valid topic IDs for Gemini validation (Check 2)
        Set<UUID> validTopicIds = studentSyllabusNodes.stream()
                .map(SyllabusNode::getId)
                .collect(Collectors.toSet());

        // Also include all topics (not just future) for the syllabus JSON context
        // We send relevant topics: exclude the weak topic itself, include the rest
        List<SyllabusNode> allBranchNodes = new ArrayList<>(studentSyllabusNodes);
        // Add current semester topics too if not included
        List<SyllabusNode> currentSemNodes = nodeRepository.findByBranchAndSemesterLessThanEqualOrderBySemesterAsc(branch, semester);
        for (SyllabusNode n : currentSemNodes) {
            if (!validTopicIds.contains(n.getId())) {
                validTopicIds.add(n.getId());
                allBranchNodes.add(n);
            }
        }

        // In-memory lookup of valid syllabus nodes — avoids nodeRepository.findById()
        // for every Gemini-suggested dependency.
        Map<UUID, SyllabusNode> nodeById = allBranchNodes.stream()
                .collect(Collectors.toMap(SyllabusNode::getId, n -> n, (a, b) -> a));

        // Bulk-load existing dependencies for all weak topics in one query and
        // group in memory — avoids a per-weak-topic dependency query and lets
        // duplicate checks run without touching the database.
        Set<UUID> weakTopicIds = weakTopics.stream()
                .map(wp -> wp.getTopic().getId())
                .collect(Collectors.toSet());
        List<ConceptDependency> existingDepsAll = weakTopicIds.isEmpty()
                ? Collections.emptyList()
                : dependencyRepository.findAllWithNodesByParentIds(weakTopicIds);
        Map<UUID, List<ConceptDependency>> existingDepsByParent = existingDepsAll.stream()
                .collect(Collectors.groupingBy(d -> d.getParentTopicNode().getId()));

        for (TopicProgress wp : weakTopics) {
            SyllabusNode weakNode = wp.getTopic();
            if (weakNode == null) continue;

            UUID weakNodeId = weakNode.getId();

            // Check existing DB dependencies for this weak topic (from in-memory bulk map)
            List<ConceptDependency> existingDeps =
                    existingDepsByParent.getOrDefault(weakNodeId, Collections.emptyList());

            // KEY RULE: Only call Gemini if NO dependencies exist in DB for this topic
            if (!existingDeps.isEmpty()) {
                // DB already has dependencies — skip Gemini for this topic
                continue;
            }

            // No DB dependencies — ask Gemini to discover some
            // Build existing dependencies JSON (empty in this case, but maintain structure)
            ArrayNode existingDepsJson = mapper.createArrayNode();
            // (empty since existingDeps is empty here)

            // Build constrained syllabus JSON — only valid topics from student's branch
            // Exclude the weak topic itself and send only topic-type nodes
            ArrayNode syllabusJson = mapper.createArrayNode();
            for (SyllabusNode fn : allBranchNodes) {
                if (fn.getId().equals(weakNodeId)) continue; // skip weak topic itself
                if (!"TOPIC".equalsIgnoreCase(fn.getType()) && fn.getType() != null) {
                    // Also include subtopics if type is null or TOPIC
                    // We include all non-subject nodes to give Gemini more choices
                }
                ObjectNode obj = mapper.createObjectNode();
                obj.put("id", fn.getId().toString());
                obj.put("name", fn.getName());
                if (fn.getSemester() != null) obj.put("semester", fn.getSemester());
                syllabusJson.add(obj);
            }

            if (syllabusJson.isEmpty()) continue;

            // Build the Gemini payload context
            String existingDepsString = existingDepsJson.toString();
            String syllabusString = syllabusJson.toString();

            // Call Gemini with existing method
            List<LearningDebtGraphDTO.AffectedTopicDTO> aiAffects = geminiService.analyzeLearningDebt(
                    weakNode.getName(),
                    weakNodeId.toString(),
                    branch,
                    semester,
                    syllabusString,
                    wp.getScore().doubleValue()
            );

            Set<String> batchInserted = new HashSet<>();

            for (LearningDebtGraphDTO.AffectedTopicDTO affect : aiAffects) {
                if (affect.getId() == null) continue;

                // Check 2: childTopicId must exist in student's valid syllabus
                if (!validTopicIds.contains(affect.getId())) {
                    System.err.println("Gemini suggested invalid topic ID: " + affect.getId() + " — rejected");
                    continue;
                }

                // Check 4: Prevent self-dependency
                if (weakNodeId.equals(affect.getId())) continue;

                // Check 5: Prevent batch duplicates
                String pairKey = weakNodeId + "->" + affect.getId();
                if (batchInserted.contains(pairKey)) continue;
                batchInserted.add(pairKey);

                // Check 1+2: Verify child node exists (in-memory lookup, no DB query)
                SyllabusNode childNode = nodeById.get(affect.getId());
                if (childNode == null) {
                    System.err.println("Gemini suggested ID not found in syllabus_nodes: " + affect.getId() + " — rejected");
                    continue;
                }

                // Check 3: Prevent duplicate in concept_dependency_map
                boolean alreadyExists = existingDeps.stream()
                        .anyMatch(d -> d.getChildTopicNode() != null
                                && d.getChildTopicNode().getId().equals(affect.getId()));
                if (alreadyExists) continue;

                // All checks passed — persist
                ConceptDependency newDep = new ConceptDependency();
                newDep.setParentTopicNode(weakNode);
                newDep.setChildTopicNode(childNode);
                newDep.setSource("AI");
                newDep.setReason(affect.getReason());
                dependencyRepository.save(newDep);
            }
        }

        // Return the (now-updated) simple graph DTO. Reuse the user and
        // progress rows already loaded above instead of re-running
        // getGraph(email); buildGraphDto re-queries dependencies so the
        // newly inserted ones are included in the response.
        return buildGraphDto(progresses);
    }

    // -------------------------------------------------------------------------
    // getHierarchyGraph() — GET /api/learning-debt/graph
    // Returns only the weak topic dependency subgraph in the hierarchical format
    // that the existing LearningDebtGraph.jsx UI component expects.
    //
    // The format is:
    //   root (ROOT)
    //     └── TopicA (TOPIC)   ← weak, depth 0
    //           └── TopicB (TOPIC)  ← depth 1 dependent
    //                 └── TopicC (TOPIC)  ← depth 2 dependent
    //     └── TopicX (TOPIC)   ← another weak root
    //           └── TopicY (TOPIC)
    //
    // Only topics reachable via concept_dependency_map from the student's
    // current weak topics (score < 60) appear in this graph.
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public LearningDebtHierarchyDTO getHierarchyGraph(String email) {
        User user = findUser(email);

        List<TopicProgress> progresses = progressRepository.findByUserWithTopic(user);

        // Build a score lookup map
        Map<UUID, BigDecimal> progressMap = new HashMap<>();
        for (TopicProgress tp : progresses) {
            if (tp.getTopic() != null && tp.getScore() != null) {
                progressMap.put(tp.getTopic().getId(), tp.getScore());
            }
        }

        // 1. Identify weak starting nodes (score < 60)
        List<TopicProgress> weakTopicProgresses = progresses.stream()
                .filter(p -> p.getScore() != null && p.getScore().compareTo(BigDecimal.valueOf(60)) < 0)
                .collect(Collectors.toList());

        // 2. Build hierarchy using BFS with bulk dependency loading per level (no N+1)
        Map<UUID, LearningDebtHierarchyDTO> nodeMap = new LinkedHashMap<>();
        Queue<BfsTriple> queue = new ArrayDeque<>();
        Set<UUID> visited = new LinkedHashSet<>();

        // Seed BFS with weak topic roots (depth 0)
        for (TopicProgress wp : weakTopicProgresses) {
            SyllabusNode weakNode = wp.getTopic();
            if (weakNode == null) continue;
            UUID nodeId = weakNode.getId();
            if (visited.contains(nodeId)) continue;
            visited.add(nodeId);
            LearningDebtHierarchyDTO dto = buildNodeDto(weakNode, progressMap, "topic-" + nodeId);
            nodeMap.put(nodeId, dto);
            queue.add(new BfsTriple(weakNode, dto, 0));
        }

        // BFS: one bulk dependency query per depth level (at most MAX_DEPTH queries total)
        while (!queue.isEmpty()) {
            int currentDepth = queue.peek().depth();
            if (currentDepth >= MAX_DEPTH) break;

            // Drain all entries at the same depth
            List<BfsTriple> sameDepth = new ArrayList<>();
            while (!queue.isEmpty() && queue.peek().depth() == currentDepth) {
                sameDepth.add(queue.poll());
            }

            // Bulk fetch all dependencies for this level's parent IDs — single DB call
            Set<UUID> parentIds = sameDepth.stream()
                    .map(t -> t.node().getId())
                    .collect(Collectors.toSet());
            List<ConceptDependency> deps = dependencyRepository.findAllWithNodesByParentIds(parentIds);
            Map<UUID, List<ConceptDependency>> depsByParent = deps.stream()
                    .collect(Collectors.groupingBy(d -> d.getParentTopicNode().getId()));

            int nextDepth = currentDepth + 1;
            for (BfsTriple entry : sameDepth) {
                LearningDebtHierarchyDTO parentDto = entry.dto();
                List<ConceptDependency> childDeps =
                        depsByParent.getOrDefault(entry.node().getId(), Collections.emptyList());
                for (ConceptDependency dep : childDeps) {
                    SyllabusNode childNode = dep.getChildTopicNode();
                    if (childNode == null) continue;
                    UUID childId = childNode.getId();
                    // Cycle/DAG safety: every syllabus node appears in the
                    // hierarchy exactly once. If this edge points to an
                    // already-visited node (an ancestor or a node already
                    // placed elsewhere in the tree), skip the edge entirely —
                    // re-linking the existing DTO here would create a cycle
                    // in the object graph and blow Jackson's serialization
                    // nesting-depth limit (HttpMessageNotWritableException).
                    if (visited.contains(childId)) continue;
                    visited.add(childId);
                    LearningDebtHierarchyDTO childDto =
                            buildNodeDto(childNode, progressMap, "topic-" + childId);
                    nodeMap.put(childId, childDto);
                    parentDto.getChildren().add(childDto);
                    queue.add(new BfsTriple(childNode, childDto, nextDepth));
                }
            }
        }

        // 3. Assemble root
        LearningDebtHierarchyDTO root = new LearningDebtHierarchyDTO();
        root.setId("root");
        root.setType("ROOT");
        root.setName((user.getName() != null ? user.getName() : "Student") + "'s Learning Debt");

        if (weakTopicProgresses.isEmpty()) {
            root.setDebtScore(0.0);
            root.setMasteryLevel("HIGH");
            root.setChildren(new ArrayList<>());
        } else {
            List<LearningDebtHierarchyDTO> topLevelNodes = new ArrayList<>();
            for (TopicProgress wp : weakTopicProgresses) {
                SyllabusNode weakNode = wp.getTopic();
                if (weakNode == null) continue;
                LearningDebtHierarchyDTO dto = nodeMap.get(weakNode.getId());
                if (dto != null) topLevelNodes.add(dto);
            }
            root.setChildren(topLevelNodes);
            double totalDebt = topLevelNodes.stream()
                    .mapToDouble(n -> n.getDebtScore() != null ? n.getDebtScore() : 0.0)
                    .average()
                    .orElse(0.0);
            root.setDebtScore(Math.round(totalDebt * 100.0) / 100.0);
            root.setMasteryLevel(totalDebt > 0.4 ? "LOW" : totalDebt > 0.2 ? "MEDIUM" : "HIGH");
        }

        return root;
    }

    /**
     * Builds a LearningDebtHierarchyDTO for a single SyllabusNode,
     * computing its debtScore and masteryLevel from the student's current progress.
     */
    private LearningDebtHierarchyDTO buildNodeDto(SyllabusNode node, Map<UUID, BigDecimal> progressMap, String id) {
        LearningDebtHierarchyDTO dto = new LearningDebtHierarchyDTO();
        dto.setId(id);
        dto.setName(node.getName());
        dto.setType("TOPIC");
        dto.setChildren(new ArrayList<>());

        BigDecimal score = progressMap.get(node.getId());
        if (score != null) {
            double scoreVal = score.doubleValue();
            double debtVal = Math.max(0.0, Math.min(1.0, (100.0 - scoreVal) / 100.0));
            dto.setDebtScore(Math.round(debtVal * 100.0) / 100.0);
            dto.setMasteryLevel(debtVal > 0.40 ? "LOW" : debtVal > 0.20 ? "MEDIUM" : "HIGH");
        } else {
            // Topic has no score — mark as medium risk (affected but not yet assessed)
            dto.setDebtScore(0.3);
            dto.setMasteryLevel("MEDIUM");
        }

        return dto;
    }
}