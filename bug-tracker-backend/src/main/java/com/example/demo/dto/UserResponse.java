package com.example.demo.dto;

import com.example.demo.entity.Role;


public record UserResponse(

        Long id,
        String name,
        String email,
        Role role

){}
