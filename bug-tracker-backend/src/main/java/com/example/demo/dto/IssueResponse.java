package com.example.demo.dto;

import com.example.demo.entity.IssuePriority;
import com.example.demo.entity.IssueStatus;
import com.example.demo.entity.IssueType;
import com.example.demo.entity.User;

import java.time.LocalDateTime;

public record IssueResponse(
        Long id,
        String title,
        String description,
        IssueStatus  status,
        IssuePriority priority,
        IssueType type,
        Long projectId,
        UserSummary reporter,
        UserSummary assignee,
        long commentCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt

) {
}
