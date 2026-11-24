package com.example.demo.specification;

import com.example.demo.entity.Issue;
import com.example.demo.entity.IssuePriority;
import com.example.demo.entity.IssueStatus;
import com.example.demo.entity.IssueType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class IssueSpecification {
    public static Specification<Issue> filterIssues(
            Long projectId,
            IssueStatus status,
            IssuePriority priority,
            IssueType type,
            Long assigneeId,
            String search

    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("project").get("id"), projectId));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            }

                if (search != null && !search.isBlank()) {
                    String pattern = "%" + search.trim().toLowerCase() + "%";
                    Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                    Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                    predicates.add(cb.or(titleMatch, descMatch));
                }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

}
