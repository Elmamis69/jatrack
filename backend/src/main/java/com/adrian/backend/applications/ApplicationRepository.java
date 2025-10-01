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
                  OR lower(a.company)        LIKE lower(:qp)
                  OR lower(a.roleTitle)      LIKE lower(:qp)
                  OR lower(coalesce(a.notes, ''))         LIKE lower(:qp)
                  OR lower(coalesce(a.contactEmail, ''))  LIKE lower(:qp)
                  OR lower(coalesce(a.jobUrl, ''))        LIKE lower(:qp)
                )
            """)
    Page<Application> search(
            @Param("status") ApplicationStatus status,
            @Param("q") String q, // solo para el check de null
            @Param("qp") String qp, // patrón ya con %...%
            Pageable pageable);

}
