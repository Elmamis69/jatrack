package com.adrian.backend.controllers;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.adrian.backend.applications.Application;
import com.adrian.backend.applications.ApplicationRepository;
import com.adrian.backend.applications.ApplicationStatus;
import com.adrian.backend.applications.PageResponse;

//import java.util.List;
@PreAuthorize("isAuthenticated()")
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationRepository repo;

    public ApplicationController(ApplicationRepository repo) {
        this.repo = repo;
    }
 
    @GetMapping
    public PageResponse<Application> search(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appliedDate,desc") String sort) {
        var parts = sort.split(",", 2);
        var sortObj = (parts.length == 2 && "desc".equalsIgnoreCase(parts[1]))
                ? org.springframework.data.domain.Sort.by(parts[0]).descending()
                : org.springframework.data.domain.Sort.by(parts[0]).ascending();

        var pageable = org.springframework.data.domain.PageRequest.of(page, size, sortObj);

        // 👉 Si no hay filtros, evita la query compleja
        boolean noFilters = (status == null) && (q == null || q.isBlank());
        if (noFilters) {
            var pageData = repo.findAll(pageable);
            return PageResponse.of(pageData);
        }

        // 👉 Pasa el patrón ya armado; si q es null no se usa, pero manda algo seguro
        String qp = (q == null || q.isBlank()) ? "%" : "%" + q + "%";
        var pageData = repo.search(status, q, qp, pageable);
        return PageResponse.of(pageData);
    }

    @PostMapping
    public Application create(@Valid @RequestBody Application a) {
        return repo.save(a);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> one(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Application> update(@PathVariable Long id, @Valid @RequestBody Application upd) {
        return repo.findById(id)
                .map(a -> {
                    a.setCompany(upd.getCompany());
                    a.setRoleTitle(upd.getRoleTitle());
                    a.setStatus(upd.getStatus());
                    a.setAppliedDate(upd.getAppliedDate());
                    a.setContactEmail(upd.getContactEmail());
                    a.setJobUrl(upd.getJobUrl());
                    a.setNotes(upd.getNotes());
                    return ResponseEntity.ok(repo.save(a));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}
