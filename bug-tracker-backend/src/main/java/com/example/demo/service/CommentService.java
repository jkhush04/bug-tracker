package com.example.demo.service;

import com.example.demo.dto.CommentRequest;
import com.example.demo.dto.CommentResponse;
import com.example.demo.dto.UserSummary;

import com.example.demo.entity.*;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.IssueRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final IssueService issueService;


    @Transactional
    public CommentResponse addComment(Long issueId, CommentRequest request, User currentUser) {
        Issue issue = findIssueOrThrow(issueId);
        issueService.loadProjectAndVerifyMember(issue.getProject().getId(), currentUser);

        User author = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = Comment.builder()
                .content(request.content())
                .issue(issue)
                .author(author)
                .build();

        return mapToResponse(commentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsForIssue(Long issueId, User currentUser) {
        Issue issue = findIssueOrThrow(issueId);
        issueService.loadProjectAndVerifyMember(issue.getProject().getId(), currentUser);

        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, CommentRequest request, User currentUser) {
        Comment comment = findCommentOrThrow(commentId);
        issueService.loadProjectAndVerifyMember(comment.getIssue().getProject().getId(), currentUser);

        // Rule: Only the comment's author can edit it
        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied: only the comment author can edit this comment");
        }

        comment.setContent(request.content());
        return mapToResponse(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, User currentUser) {
        Comment comment = findCommentOrThrow(commentId);
        Project project = issueService.loadProjectAndVerifyMember(comment.getIssue().getProject().getId(), currentUser);

        boolean isAuthor = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isProjectOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        // Rule: Author, project owner, or ADMIN can delete it
        if (!isAuthor && !isProjectOwner && !isAdmin) {
            throw new AccessDeniedException("Access denied: you do not have permission to delete this comment");
        }

        commentRepository.delete(comment);
    }

    private Issue findIssueOrThrow(Long issueId) {
        return issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + issueId));
    }

    private Comment findCommentOrThrow(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
    }

    private CommentResponse mapToResponse(Comment comment) {
        User author = comment.getAuthor();
        UserSummary authorSummary = new UserSummary(author.getId(), author.getName(), author.getEmail());

        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                authorSummary,
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
