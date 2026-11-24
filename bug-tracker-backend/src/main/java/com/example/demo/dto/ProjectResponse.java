package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.List;


public record ProjectResponse(
        Long id,
        String name,
        String description,
        String projectKey,
        LocalDateTime createdAt,
        UserSummary owner,
        List<UserResponse> members

) {
}
