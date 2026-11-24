package com.example.demo.dto;

import com.example.demo.entity.Role;
import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(
       @NotNull Role role
) {

}
