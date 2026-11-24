package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
       @NotBlank String name,
        String description,
        @NotBlank @Size(min=2 , max=10) String projectKey
) {
}
