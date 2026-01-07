import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isLoading = ref(true);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      isLoading.value = false;
      return;
    }

    try {
      const currentUser = await authApi.getCurrentUser();
      user.value = currentUser;
    } catch {
      localStorage.removeItem('auth_token');
      user.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (username, password) => {
    const response = await authApi.login(username, password);
    localStorage.setItem('auth_token', response.token);
    user.value = response.user;
    isLoading.value = false;
    return response;
  };

  const register = async (username, email, password) => {
    const response = await authApi.register(username, email, password);
    localStorage.setItem('auth_token', response.token);
    user.value = response.user;
    isLoading.value = false;
    return response;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    user.value = null;
    isLoading.value = false;
  };

  // Initialize: check auth on store creation
  checkAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    checkAuth,
  };
});

