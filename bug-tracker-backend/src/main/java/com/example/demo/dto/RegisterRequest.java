package com.example.demo.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.example.demo.entity.Role;

public record RegisterRequest(
        @NotBlank
        String name,

    @NotBlank @Email
    String email,

    @NotBlank @Size(min=6)
    String password,

    Role role
) {

}
