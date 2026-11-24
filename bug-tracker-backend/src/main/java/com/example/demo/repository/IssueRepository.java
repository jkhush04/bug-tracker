package com.example.demo.repository;

import com.example.demo.entity.Issue;
import com.example.demo.entity.IssueStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> , JpaSpecificationExecutor<Issue> {

    @EntityGraph(attributePaths = {"reporter", "assignee", "project"})
    List<Issue> findByProjectId(Long projectId);

    @EntityGraph(attributePaths = {"reporter", "assignee", "project"})
    List<Issue> findByProjectIdAndStatus(Long projectId, IssueStatus status);


    @EntityGraph(attributePaths = {"reporter", "assignee", "project"})
    @Override
    Page<Issue> findAll(Specification<Issue> spec, Pageable pageable);

}
