package com.example.demo.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String content,
        UserSummary author,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
