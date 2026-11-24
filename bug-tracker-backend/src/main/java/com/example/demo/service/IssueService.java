package com.example.demo.service;


import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.IssueRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.specification.IssueSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final  ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final CommentRepository commentRepository;

    @Transactional
    public IssueResponse createIssue(Long projectId, IssueRequest request, User currentUser){
        Project project = loadProjectAndVerifyMember(projectId, currentUser);

        User reporter = userRepository.findById(currentUser.getId()).orElseThrow(()->new ResourceNotFoundException("User not found with id: "+ currentUser.getId()));

        User assignee = resolveAndVerifyAssignee(project, request.assigneeId());

        Issue issue = Issue.builder().title(request.title()).description(request.description()).status(IssueStatus.TODO).priority(request.priority()).type(request.type()).project(project).reporter(reporter).assignee(assignee).build();
        return mapToResponse(issueRepository.save(issue));
    }


    @Transactional
    public List<IssueResponse> getProjectIssues(Long projectId , IssueStatus status, User currentUser){
         loadProjectAndVerifyMember(projectId, currentUser);

         List<Issue> issues = (status !=null) ? issueRepository.findByProjectIdAndStatus(projectId, status) : issueRepository.findByProjectId(projectId);

         return issues.stream().map(this :: mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public IssueResponse getIssueById(Long issueId,User currentUser){
         Issue issue = findIssueOrThrow(issueId);


         loadProjectAndVerifyMember(issue.getProject().getId(), currentUser);

         return mapToResponse(issue);

    }

    @Transactional
    public IssueResponse updateIssue(Long issueId, UpdateIssueRequest request , User currentUser){
        Issue issue = findIssueOrThrow(issueId);
        loadProjectAndVerifyMember(issue.getProject().getId(), currentUser);


        boolean isAdminOrManager = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.MANAGER;
        boolean isReporter = issue.getReporter().getId().equals(currentUser.getId());
        boolean isAssignee = issue.getAssignee() != null && issue.getAssignee().getId().equals(currentUser.getId());

        if (!isAdminOrManager && !isReporter && !isAssignee) {
            throw new AccessDeniedException("Only the reporter, assignee, manager, or admin can edit this issue");
        }

        issue.setTitle(request.title());
        issue.setDescription(request.description());
        issue.setPriority(request.priority());
        issue.setType(request.type());

        return mapToResponse(issueRepository.save(issue));
    }

    @Transactional
    public IssueResponse assignIssue(Long issueId, AssignRequest request, User currentUser){
        Issue issue = findIssueOrThrow(issueId);
        loadProjectAndVerifyMember(issue.getProject().getId(), currentUser);

        User assignee= resolveAndVerifyAssignee(issue.getProject(), request.assigneeId());

        issue.setAssignee(assignee);
        return mapToResponse(issueRepository.save(issue));
    }

    @Transactional
    public IssueResponse updateStatus(Long issueId, StatusUpdateRequest request, User currentUser) {
        Issue issue = findIssueOrThrow(issueId);
        loadProjectAndVerifyMember(issue.getProject().getId(), currentUser);


      /*  boolean isAdminOrManager = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.MANAGER;
        boolean isReporter = issue.getReporter().getId().equals(currentUser.getId());

        if (!isAdminOrManager && !isReporter ) {
            throw new AccessDeniedException("Only the reporter, manager, or admin can delete this issue");
        }*/

        issue.setStatus(request.status());

        return mapToResponse(issueRepository.save(issue));
    }

    @Transactional
    public void deleteIssue(Long issueId , User currentUser){

        Issue issue = findIssueOrThrow(issueId);
        loadProjectAndVerifyMember(issue.getProject().getId(), currentUser);

        boolean isAdminOrManager = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.MANAGER;
        boolean isReporter = issue.getReporter().getId().equals(currentUser.getId());

        if (!isAdminOrManager && !isReporter) {
            throw new AccessDeniedException("Only the reporter, manager, or admin can delete this issue");
        }
        commentRepository.deleteByIssueId(issueId);

            issueRepository.delete(issue);

    }


    @Transactional(readOnly = true)
    public Page<IssueResponse> getFilteredProjectIssues(
            Long projectId,
            IssueStatus status,
            IssuePriority priority,
            IssueType type,
            Long assigneeId,
            Boolean assignedToMe,
            String search,
           Pageable pageable,
            User currentUser) {

        loadProjectAndVerifyMember(projectId, currentUser);

        // If assignedToMe=true, override assigneeId with current user's ID
        Long effectiveAssigneeId = Boolean.TRUE.equals(assignedToMe) ? currentUser.getId() : assigneeId;

        Specification<Issue> spec = IssueSpecification.filterIssues(
                projectId, status, priority, type, effectiveAssigneeId, search
        );

        return issueRepository.findAll(spec, pageable)
                .map(this::mapToResponse);

    }

    @Transactional(readOnly = true)
    public List<IssueResponse> getAllProjectIssuesUnpaged(Long projectId, User currentUser) {
        loadProjectAndVerifyMember(projectId, currentUser);
        return issueRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .toList();
    }


    public Map<IssueStatus, List<IssueResponse>> getProjectBoard(Long projectId, User currentUser){
        loadProjectAndVerifyMember(projectId, currentUser);

        List<IssueResponse> allIssues = issueRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .toList();

        Map<IssueStatus , List<IssueResponse>> board = new EnumMap<>(IssueStatus.class);

        for(IssueStatus status : IssueStatus.values()){
            board.put(status, new ArrayList<>());
        }

        for(IssueResponse issue: allIssues){
            board.get(issue.status()).add(issue);
        }
        return board;
    }



    private Issue findIssueOrThrow(Long issueId){
        return issueRepository.findById(issueId).orElseThrow(()->new ResourceNotFoundException("Issue not found with id: "+ issueId));
    }

    //helper function
public Project loadProjectAndVerifyMember(Long projectId, User currentUser){
        Project project = projectRepository.findById(projectId).orElseThrow(()->new ResourceNotFoundException("Project not found with id: "+ projectId));

        boolean isMember = project.getMembers().stream().anyMatch(m->m.getId().equals(currentUser.getId()));

    boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
    boolean isAdmin = currentUser.getRole() == Role.ADMIN;


    if (!isMember && !isOwner && !isAdmin) {
        throw new AccessDeniedException("Access denied: You are not member of this project.");
    }
    return project;
}

private User resolveAndVerifyAssignee(Project project, Long assigneeId){
        if(assigneeId == null){
            return null;
        }

        User assignee = userRepository.findById(assigneeId).orElseThrow(()->new ResourceNotFoundException("User not found with id: "+ assigneeId));

        boolean isProjectManager = project.getMembers().stream().anyMatch(m->m.getId().equals(assignee.getId()))|| project.getOwner().getId().equals(assignee.getId());

        if(!isProjectManager){
            throw new IllegalArgumentException("Assignee must be a member of the project");
        }
        return assignee;
}

private IssueResponse mapToResponse(Issue issue){

        User reporter = issue.getReporter();

        UserSummary reporterSummary = new UserSummary(reporter.getId(), reporter.getName(), reporter.getEmail());
        User assignee = issue.getAssignee();

        UserSummary assigneeSummary = (assignee != null)? new UserSummary(assignee.getId(), assignee.getName(), assignee.getEmail()): null;


    long commentCount = commentRepository.countByIssueId(issue.getId());

    return new IssueResponse(
                issue.getId(),
                issue.getTitle(),
                issue.getDescription(),
                issue.getStatus(),
                issue.getPriority(),
                issue.getType(),
                issue.getProject().getId(),
                reporterSummary,
                assigneeSummary,
                commentCount,
                issue.getCreatedAt(),
                issue.getUpdatedAt()
        );
}
}


