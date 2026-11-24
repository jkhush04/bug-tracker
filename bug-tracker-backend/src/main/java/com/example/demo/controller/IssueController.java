package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.entity.IssuePriority;
import com.example.demo.entity.IssueStatus;
import com.example.demo.entity.IssueType;
import com.example.demo.entity.User;
import com.example.demo.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class IssueController {


    private final IssueService issueService;

     @PostMapping("/projects/{projectId}/issues")
     public ResponseEntity<IssueResponse> createIssue(@PathVariable Long projectId, @Valid @RequestBody IssueRequest request, @AuthenticationPrincipal User currentUser){
         return new ResponseEntity<>(issueService.createIssue(projectId,request, currentUser), HttpStatus.CREATED);
     }

    @GetMapping("/issues/{issueId}")
    public ResponseEntity<IssueResponse> getIssueById(@PathVariable Long issueId, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(issueService.getIssueById(issueId, currentUser));
    }


    @PutMapping("/issues/{issueId}")
    public ResponseEntity<IssueResponse> updateIssue(@PathVariable Long issueId, @RequestBody UpdateIssueRequest request , @AuthenticationPrincipal User currentUser){
         return ResponseEntity.ok(issueService.updateIssue(issueId, request, currentUser));
    }

    @PatchMapping("/issues/{issueId}/assign")
    public ResponseEntity<IssueResponse> assignIssue(@PathVariable Long issueId, @Valid @RequestBody AssignRequest request, @AuthenticationPrincipal User currentUser){
         return ResponseEntity.ok(issueService.assignIssue(issueId, request,currentUser));
    }

    @PatchMapping("/issues/{issueId}/status")
    public ResponseEntity<IssueResponse> updateStatus(@PathVariable Long issueId, @Valid @RequestBody StatusUpdateRequest request , @AuthenticationPrincipal User currentUser){
         return ResponseEntity.ok(issueService.updateStatus(issueId, request, currentUser));
    }

    @DeleteMapping("/issues/{issueId}")
    public ResponseEntity<Void> deleteIssue(@PathVariable Long issueId, @AuthenticationPrincipal User currentUser){
         issueService.deleteIssue(issueId ,currentUser);
         return ResponseEntity.noContent().build();
    }

    @GetMapping("/projects/{projectId}/issues")
    public ResponseEntity<Page<IssueResponse>> getProjectIssues(
            @PathVariable Long projectId,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssuePriority priority,
            @RequestParam(required = false) IssueType type,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Boolean assignedToMe,
            @RequestParam(required = false) String search,
            @org.springdoc.core.annotations.ParameterObject
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal User currentUser
    ) {
        Page<IssueResponse> issues = issueService.getFilteredProjectIssues(projectId, status, priority, type, assigneeId, assignedToMe, search, pageable, currentUser);
        return ResponseEntity.ok(issues);
    }


    @GetMapping("/projects/{projectId}/issues/all")
    public ResponseEntity<List<IssueResponse>> getAllProjectIssuesForBoard(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(issueService.getAllProjectIssuesUnpaged(projectId, currentUser));
    }


    @GetMapping("/projects/{projectId}/board")
    public ResponseEntity<Map<IssueStatus, List<IssueResponse>>> getProjectBoard(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(issueService.getProjectBoard(projectId, currentUser));
    }

}
