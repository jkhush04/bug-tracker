package com.example.demo.dto;

import com.example.demo.entity.Issue;
import com.example.demo.entity.IssueStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
       @NotNull IssueStatus status) {

}
