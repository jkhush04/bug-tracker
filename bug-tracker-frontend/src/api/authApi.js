import api from './axios';


export const authApi = {

       login  : async (credentials) => {
       const response = await api.post('/api/auth/login' , credentials);
       return response.data;
       },

       register  : async (userData) => {
       const response = await api.post('/api/auth/register' , userData);
       return response.data;
       },

       getCurrentUser  : async () => {
       const response = await api.get('/api/users/me');
       return response.data;
       },

       searchUsers : async (email) => {
       const response = await api.get('/api/users/search' , { params: { email }});
       return response.data;
       },

       getAllUsers : async () => {
       const response = await api.get('/api/users');
       return response.data;
       },

       updateUserRole: async (userId, role) => {
       const response = await api.patch(`/api/users/${userId}/role`, { role });
       return response.data;
       },

};


