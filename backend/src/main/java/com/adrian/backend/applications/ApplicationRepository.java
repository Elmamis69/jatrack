package com.adrian.backend.applications;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    @Query("""
        SELECT a FROM Application a
        WHERE (:status IS NULL OR a.status = :status)
          AND (
                :q IS NULL
             OR LOWER(a.company)      LIKE LOWER(CONCAT('%', :q, '%'))
             OR LOWER(a.roleTitle)    LIKE LOWER(CONCAT('%', :q, '%'))
             OR LOWER(COALESCE(a.notes, '')) LIKE LOWER(CONCAT('%', :q, '%'))
             OR LOWER(COALESCE(a.contactEmail, '')) LIKE LOWER(CONCAT('%', :q, '%'))
          )
        """)
    Page<Application> search(
            @Param("status") ApplicationStatus status,
            @Param("q") String q,
            Pageable pageable);
}
