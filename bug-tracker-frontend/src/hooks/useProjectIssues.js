import { useState, useEffect, useCallback } from 'react';
import { issueApi } from '../api/issueApi';

export function useProjectIssues(projectId, filters) {
  const [issuesPage, setIssuesPage] = useState({ content: [], totalPages: 0, totalElements: 0, number: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || '');

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search || '');
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchIssues = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const params = {
        page: filters.page || 0,
        size: filters.size || 10,
      };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.type) params.type = filters.type;
      if (filters.assigneeId) params.assigneeId = filters.assigneeId;
      if (filters.assignedToMe) params.assignedToMe = true;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const data = await issueApi.getProjectIssues(projectId, params);
      setIssuesPage(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [
    projectId,
    filters.status,
    filters.priority,
    filters.type,
    filters.assigneeId,
    filters.assignedToMe,
    filters.page,
    filters.size,
    debouncedSearch,
  ]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return { issuesPage, loading, error, refetch: fetchIssues };
}
