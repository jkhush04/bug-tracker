package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name="projects")
@Getter
@Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
     private String name;

     private String description;

    @Column(name="project_key",nullable = false , unique = true)
    private String projectKey;

    @Column(name = "created_at" ,nullable = false , updatable = false)
     private LocalDateTime createdAt;

     @ManyToOne(fetch = FetchType.LAZY)
     private User owner;

     @ManyToMany
     @JoinTable(
             name = "project_members",
             joinColumns = @JoinColumn(name = "project_id"),
             inverseJoinColumns =  @JoinColumn(name = "user_id")
     )
     @Builder.Default
     private Set<User> members = new HashSet<>();

     @PrePersist
     protected void onCreate(){
         this.createdAt = LocalDateTime.now();
     }
}
