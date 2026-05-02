package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.SyllabusNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface SyllabusNodeRepository extends JpaRepository<SyllabusNode, UUID> {

    // OLD methods kept for compatibility
    List<SyllabusNode> findByBranchAndSemesterAndTypeAndParentIsNull(
        String branch, Integer semester, String type
    );

    List<SyllabusNode> findByBranchAndSemesterLessThanEqualAndTypeOrderBySemesterAsc(
        String branch, Integer semester, String type
    );

    List<SyllabusNode> findByParentId(UUID parentId);

    List<SyllabusNode> findByCreatedByIdAndIsCustomTrue(UUID userId);

    List<SyllabusNode> findByBranchAndSemesterGreaterThanEqual(String branch, Integer semester);

    // NEW — fetch ALL nodes in one query
    @Query("SELECT n FROM SyllabusNode n LEFT JOIN FETCH n.parent " +
           "WHERE n.branch = :branch AND n.semester <= :semester " +
           "ORDER BY n.semester ASC")
    List<SyllabusNode> findByBranchAndSemesterLessThanEqualOrderBySemesterAsc(
        @Param("branch") String branch,
        @Param("semester") Integer semester
    );

    @Query("SELECT n FROM SyllabusNode n LEFT JOIN FETCH n.parent WHERE n.branch = :branch AND n.semester = :semester")
    List<SyllabusNode> findByBranchAndSemester(
        @Param("branch") String branch,
        @Param("semester") Integer semester
    );

    List<SyllabusNode> findByBranchAndType(String branch, String type);
    void deleteByCreatedById(UUID userId);
}