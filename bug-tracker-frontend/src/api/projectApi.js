import api from './axios';

export const projectApi = {
  getMyProjects: async () => {
    const response = await api.get('/api/projects/my');
    return response.data;
  },

  getProjectById: async (projectId) => {
    const response = await api.get(`/api/projects/${projectId}`);
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await api.post('/api/projects', projectData);
    return response.data;
  },

  updateProject: async (projectId, projectData) => {
    const response = await api.put(`/api/projects/${projectId}`, projectData);
    return response.data;
  },

  deleteProject: async (projectId) => {
    await api.delete(`/api/projects/${projectId}`);
  },

  addMember: async (projectId, email) => {
    const response = await api.post(`/api/projects/${projectId}/members`, { email });
    return response.data;
  },

  removeMember: async (projectId, userId) => {
    const response = await api.delete(`/api/projects/${projectId}/members/${userId}`);
    return response.data;
  },
};
