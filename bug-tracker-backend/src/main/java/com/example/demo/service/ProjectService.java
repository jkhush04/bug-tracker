package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.Project;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.entity.Issue;
import com.example.demo.repository.*;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.ResourceNotFoundException;
import java.util.List;



@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final CommentRepository commentRepository;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, User currentUser) {
        String normalizedKey = request.projectKey().toUpperCase().trim();

        if (projectRepository.existsByProjectKey(normalizedKey)) {
            throw new IllegalArgumentException("Project key already exists");
        }

        User projectowner = userRepository.findById(currentUser.getId()).orElseThrow(() -> new RuntimeException("Owner not found"));

        Project project = Project.builder().name(request.name()).description(request.description()).projectKey(normalizedKey).owner(projectowner).build();

        project.getMembers().add(projectowner);

       Project savedProject =  projectRepository.save(project);
        return mapToResponse(savedProject);
    }


    @Transactional
    public ProjectResponse addMember(Long projectId , AddMemberRequest request , User currentUser){
          Project project = findProjectOrThrow(projectId);

          verifyOwnerOrAdmin(project , currentUser);
          User user = userRepository.findByEmail(request.email()).orElseThrow(()-> new ResourceNotFoundException("User not found with email: "+ request.email()));

          boolean alreadyMember = project.getMembers().stream().anyMatch(member -> member.getId().equals(user.getId()));

          if(alreadyMember){
              throw new IllegalArgumentException("User is already a member of the project");
          }

          project.getMembers().add(user);
          return mapToResponse(projectRepository.save(project));
    }


    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects(User currentUser){
       return projectRepository.findALlByOwnerIdOrMemberId(currentUser.getId()).stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
   public List<ProjectResponse> getAllProjects(){
        return projectRepository.findAll().stream().map(this::mapToResponse).toList();
   }


   @Transactional(readOnly = true)
   public ProjectResponse getProjectById(Long projectId, User currentUser){
           Project project = findProjectOrThrow(projectId);

           boolean isMember = project.getMembers().stream().anyMatch(member -> member.getId().equals(currentUser.getId()));

           boolean isOwner = project.getOwner().getId().equals(currentUser.getId());

           boolean isAdmin = currentUser.getRole() == Role.ADMIN;

           if(!isMember && !isOwner && !isAdmin){
               throw new AccessDeniedException("Access denied: User is not a member of this project");
           }

       return mapToResponse(project);
   }


   @Transactional
   public ProjectResponse updateProject(Long projectId , ProjectRequest request , User currentUser) {
              Project project =findProjectOrThrow(projectId);
              verifyOwnerOrAdmin(project , currentUser);


       String normalizedKey = request.projectKey().toUpperCase().trim();

         if (!project.getProjectKey().equals(normalizedKey) && projectRepository.existsByProjectKey(normalizedKey)) {
              throw new IllegalArgumentException("Project key already exists");
         }


       project.setName(request.name());
       project.setDescription(request.description());
       project.setProjectKey(normalizedKey);

       return mapToResponse(projectRepository.save(project));
   }


    @Transactional
    public void deleteProject(Long projectId, User currentUser) {
        Project project = findProjectOrThrow(projectId);
        verifyOwnerOrAdmin(project, currentUser);


        List<Issue> issues = issueRepository.findByProjectId(projectId);
        for(Issue issue : issues){
            commentRepository.deleteByIssueId(issue.getId());
        }

        issueRepository.deleteAll(issues);

        projectRepository.delete(project);
    }

    @Transactional
    public ProjectResponse removeMember(Long projectId, Long userId, User currentUser) {
        Project project = findProjectOrThrow(projectId);
        verifyOwnerOrAdmin(project, currentUser);

        if (project.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot remove the project owner from the project");
        }
        boolean isMember = project.getMembers().stream().anyMatch(member -> member.getId().equals(userId));

        if (!isMember) {
            throw new ResourceNotFoundException("User is not a member of this project");
        }

        project.getMembers().removeIf(member -> member.getId().equals(userId));
        return mapToResponse(projectRepository.save(project));
    }


    private Project findProjectOrThrow(Long projectId) {
         return projectRepository.findById(projectId).orElseThrow(()->new ResourceNotFoundException("Project not found with id: "+ projectId));
    }


    private void verifyOwnerOrAdmin(Project project , User currentUser) {
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Access denied: User is not the owner or an admin");
        }

    }
   private ProjectResponse mapToResponse(Project project){

          User owner = project.getOwner();
          UserSummary ownerSummary = new UserSummary(owner.getId(),owner.getName(),owner.getEmail());

          List<UserResponse> memberList = project.getMembers().stream().map(m-> new UserResponse(m.getId(), m.getName(), m.getEmail(), m.getRole())).toList();
          return new ProjectResponse(
                  project.getId(),
                  project.getName(),
                  project.getDescription(),
                  project.getProjectKey(),
                  project.getCreatedAt(),
                  ownerSummary, memberList);
   }
}
