import api from './axios';

export const commentApi = {
  getComments: async (issueId) => {
    const response = await api.get(`/api/issues/${issueId}/comments`);
    return response.data;
  },

  addComment: async (issueId, content) => {
    const response = await api.post(`/api/issues/${issueId}/comments`, { content });
    return response.data;
  },

  updateComment: async (commentId, content) => {
    const response = await api.put(`/api/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    await api.delete(`/api/comments/${commentId}`);
  },
};
