package com.adrian.backend.controllers;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.adrian.backend.applications.Application;
import com.adrian.backend.applications.ApplicationRepository;
import com.adrian.backend.applications.ApplicationStatus;
import com.adrian.backend.applications.PageResponse;
import com.adrian.backend.users.User;
import com.adrian.backend.users.UserRepository;

@RestController
@RequestMapping("/api/applications")
@PreAuthorize("isAuthenticated()")
public class ApplicationController {

    private final ApplicationRepository repo;
    private final UserRepository userRepo;

    public ApplicationController(ApplicationRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authentication");
        }
        var email = auth.getName();
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
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
        var user = currentUser();

        boolean noFilters = (status == null) && (q == null || q.isBlank());
        if (noFilters) {
            var pageData = repo.findByUserId(user.getId(), pageable);
            return PageResponse.of(pageData);
        }

        String qp = (q == null || q.isBlank()) ? "%" : "%" + q + "%";
        var pageData = repo.searchForUser(user.getId(), status, q, qp, pageable);
        return PageResponse.of(pageData);
    }

    @PostMapping
    public Application create(@Valid @RequestBody Application a) {
        var user = currentUser();
        a.setUser(user); // dueño
        return repo.save(a);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> one(@PathVariable Long id) {
        var user = currentUser();
        return repo.findByIdAndUserId(id, user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Application> update(@PathVariable Long id, @Valid @RequestBody Application upd) {
        var user = currentUser();
        return repo.findByIdAndUserId(id, user.getId())
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
        var user = currentUser();
        if (!repo.existsByIdAndUserId(id, user.getId())) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
