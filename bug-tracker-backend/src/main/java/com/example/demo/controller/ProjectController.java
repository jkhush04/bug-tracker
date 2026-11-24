package com.example.demo.controller;


import com.example.demo.dto.AddMemberRequest;
import com.example.demo.dto.ProjectRequest;
import com.example.demo.dto.ProjectResponse;
import com.example.demo.entity.User;
import com.example.demo.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects")
public class ProjectController {

     private final ProjectService projectService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request, @AuthenticationPrincipal User currentUser){
        return new ResponseEntity<>(projectService.createProject(request, currentUser), HttpStatus.CREATED);
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<ProjectResponse> addMember(@PathVariable Long projectId, @Valid @RequestBody AddMemberRequest request , @AuthenticationPrincipal User currentUser ){
        return ResponseEntity.ok(projectService.addMember(projectId, request , currentUser));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProjectResponse>> getAllProjects(){
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long projectId ,@AuthenticationPrincipal User currentUser ) {
        return ResponseEntity.ok(projectService.getProjectById(projectId, currentUser));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long projectId , @Valid @RequestBody ProjectRequest request, @AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(projectService.updateProject(projectId, request, currentUser));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long projectId, @AuthenticationPrincipal User currentUser){
        projectService.deleteProject(projectId, currentUser);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(
            @AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(projectService.getMyProjects(currentUser));
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<ProjectResponse> removeMember(@PathVariable Long projectId , @PathVariable Long userId, @AuthenticationPrincipal User currentUser ){
        return ResponseEntity.ok(projectService.removeMember(projectId,userId,currentUser));
    }
}
