package com.example.demo.controller;

import com.example.demo.dto.RoleUpdateRequest;
import com.example.demo.dto.UserResponse;
import com.example.demo.dto.UserSummary;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import jakarta.persistence.PrePersist;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;


    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers()
    {
        List<UserResponse> users = userRepository.findAll().stream().map(u-> new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole())).toList();
        return ResponseEntity.ok(users);

    }


    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserRole(@PathVariable Long id, @Valid @RequestBody RoleUpdateRequest request)
    {
        User user =userRepository.findById(id).orElseThrow(()->new ResourceNotFoundException("User not found with id: "+id));

        user.setRole(request.role());
        userRepository.save(user);

        return ResponseEntity.ok(new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole()));
    }



    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal User user){
        return ResponseEntity.ok(new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole()));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<UserSummary>> searchUsersByEmail(@RequestParam String email) {
        List<UserSummary> results = userRepository.findByEmailContainingIgnoreCase(email).stream()
                .map(u -> new UserSummary(u.getId(), u.getName(), u.getEmail()))
                .toList();
        return ResponseEntity.ok(results);
    }

}
