package com.studybuddy.backend.repository;

import com.studybuddy.backend.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface SemesterRepository extends JpaRepository<Semester, UUID> {
    List<Semester> findByUserIdOrderBySemesterNumberAsc(UUID userId);

    @Query("SELECT s FROM Semester s LEFT JOIN FETCH s.subjects WHERE s.user.id = :userId ORDER BY s.semesterNumber ASC")
    List<Semester> findByUserIdWithSubjects(@Param("userId") UUID userId);
    void deleteByUserId(UUID userId);
}