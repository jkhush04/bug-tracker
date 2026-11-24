package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "issues")
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
@Builder
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private IssueStatus status =  IssueStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
     private IssueType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
     private IssuePriority priority;


    @Column(name = "created_at", nullable = false, updatable = false)
     private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
     private LocalDateTime updatedAt;

     @ManyToOne(fetch = FetchType.LAZY, optional = false)
     @JoinColumn(name="project_id", nullable = false)
     private Project project;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name="reporter_id", nullable = false)
     private User reporter;

     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name="assignee_id")
     private User assignee;

    @PrePersist
    protected void onCreate(){
        LocalDateTime now=LocalDateTime.now();
        this.createdAt=now;
        this.updatedAt=now;
    }

    @PreUpdate
    protected void onUpdate(){
        this.updatedAt=LocalDateTime.now();
    }

}