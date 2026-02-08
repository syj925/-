import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('admin_token') || null,
    user: JSON.parse(localStorage.getItem('admin_user') || 'null')
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getToken: (state) => state.token
  },
  actions: {
    setAuth(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    },
    initFromStorage() {
      this.token = localStorage.getItem('admin_token') || null;
      this.user = JSON.parse(localStorage.getItem('admin_user') || 'null');
    }
  }
});