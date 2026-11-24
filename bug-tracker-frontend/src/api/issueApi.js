import api from './axios';

export const issueApi = {
  // Paginated + filtered list (params: { status, priority, type, assigneeId, assignedToMe, search, page, size, sort })
  getProjectIssues: async (projectId, params = {}) => {
    const response = await api.get(`/api/projects/${projectId}/issues`, { params });
    return response.data; // Page<IssueResponse>
  },

  // Grouped by status (TODO, IN_PROGRESS, DONE) for Kanban board
  getProjectBoard: async (projectId) => {
    const response = await api.get(`/api/projects/${projectId}/board`);
    return response.data;
  },

  getIssueById: async (issueId) => {
    const response = await api.get(`/api/issues/${issueId}`);
    return response.data;
  },

  createIssue: async (projectId, issueData) => {
    const response = await api.post(`/api/projects/${projectId}/issues`, issueData);
    return response.data;
  },

  updateIssue: async (issueId, issueData) => {
    const response = await api.put(`/api/issues/${issueId}`, issueData);
    return response.data;
  },

  assignIssue: async (issueId, assigneeId) => {
    const response = await api.patch(`/api/issues/${issueId}/assign`, { assigneeId });
    return response.data;
  },

  updateStatus: async (issueId, status) => {
    const response = await api.patch(`/api/issues/${issueId}/status`, { status });
    return response.data;
  },

  deleteIssue: async (issueId) => {
    await api.delete(`/api/issues/${issueId}`);
  },
};
