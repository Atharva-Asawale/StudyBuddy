package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.CustomNodeRequest;
import com.studybuddy.backend.dto.SyllabusNodeDTO;
import com.studybuddy.backend.entity.SyllabusNode;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.SyllabusNodeRepository;
import com.studybuddy.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SyllabusService {

    @Autowired
    private SyllabusNodeRepository syllabusNodeRepository;

    @Autowired
    private UserRepository userRepository;

    public List<SyllabusNodeDTO> getSyllabusTree(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String branch = user.getBranch();
        Integer currentSemester = user.getCurrentSemester();

        // Load ALL nodes for this branch at once — single query
        List<SyllabusNode> allNodes = syllabusNodeRepository
                .findByBranchAndSemesterLessThanEqualOrderBySemesterAsc(
                        branch, currentSemester
                );

        // Build tree in memory — no more recursive DB calls
        return buildTreeInMemory(allNodes);
    }

    public SyllabusNodeDTO addCustomNode(String email, CustomNodeRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SyllabusNode node = new SyllabusNode();
        node.setName(request.getName());
        node.setType(request.getType());
        node.setBranch(request.getBranch());
        node.setSemester(request.getSemester());
        node.setIsCustom(true);
        node.setCreatedBy(user);

        if (request.getParentId() != null) {
            SyllabusNode parent = syllabusNodeRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent node not found"));
            node.setParent(parent);
        }

        SyllabusNode saved = syllabusNodeRepository.save(node);
        return toDTO(saved);
    }

    public SyllabusNodeDTO editCustomNode(String email, UUID nodeId, CustomNodeRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SyllabusNode node = syllabusNodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        if (!node.getIsCustom() || !node.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        node.setName(request.getName());
        SyllabusNode saved = syllabusNodeRepository.save(node);
        return toDTO(saved);
    }

    public void deleteCustomNode(String email, UUID nodeId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SyllabusNode node = syllabusNodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        if (!node.getIsCustom() || !node.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        syllabusNodeRepository.delete(node);
    }

    // ─── Build tree in memory from flat list ───────────────
    private List<SyllabusNodeDTO> buildTreeInMemory(List<SyllabusNode> allNodes) {
        // Convert all to DTOs
        Map<UUID, SyllabusNodeDTO> dtoMap = new LinkedHashMap<>();
        for (SyllabusNode node : allNodes) {
            dtoMap.put(node.getId(), toDTO(node));
        }

        // Build parent-child relationships
        List<SyllabusNodeDTO> roots = new ArrayList<>();
        for (SyllabusNode node : allNodes) {
            SyllabusNodeDTO dto = dtoMap.get(node.getId());
            if (node.getParent() == null) {
                roots.add(dto);
            } else {
                SyllabusNodeDTO parentDTO = dtoMap.get(node.getParent().getId());
                if (parentDTO != null) {
                    if (parentDTO.getChildren() == null) {
                        parentDTO.setChildren(new ArrayList<>());
                    }
                    parentDTO.getChildren().add(dto);
                }
            }
        }

        return roots;
    }

    private SyllabusNodeDTO toDTO(SyllabusNode node) {
        SyllabusNodeDTO dto = new SyllabusNodeDTO();
        dto.setId(node.getId());
        dto.setName(node.getName());
        dto.setType(node.getType());
        dto.setBranch(node.getBranch());
        dto.setSemester(node.getSemester());
        dto.setIsCustom(node.getIsCustom());
        return dto;
    }
}