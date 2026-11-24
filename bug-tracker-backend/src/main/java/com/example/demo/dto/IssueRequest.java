package com.example.demo.dto;

import com.example.demo.entity.IssuePriority;
import com.example.demo.entity.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Optional;

public record IssueRequest(
        @NotBlank String title,
        String description,
        @NotNull IssuePriority priority,
       @NotNull IssueType type,
        Long assigneeId
) {
}
