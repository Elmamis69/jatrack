package com.adrian.backend.applications;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final ApplicationRepository repo;

    public ApplicationController(ApplicationRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Application> all() {
        return repo.findAll();
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
