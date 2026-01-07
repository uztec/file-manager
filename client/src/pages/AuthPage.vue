<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <div class="w-full max-w-md space-y-8">
      <!-- Logo -->
      <div class="flex flex-col items-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <HardDrive class="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 class="mt-4 text-2xl font-bold text-foreground">FileShare</h1>
        <p class="text-muted-foreground">Compartilhamento seguro de arquivos</p>
      </div>

      <!-- Form Card -->
      <div class="rounded-lg border border-border bg-card shadow-xl p-6">
        <div class="space-y-1 text-center mb-6">
          <h2 class="text-xl font-semibold">
            {{ isLogin ? 'Entrar na sua conta' : 'Criar nova conta' }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ isLogin 
              ? 'Digite suas credenciais para acessar' 
              : 'Preencha os dados para se cadastrar' }}
          </p>
        </div>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <label for="username" class="text-sm font-medium">Username</label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="username"
                type="text"
                placeholder="seu_username"
                v-model="username"
                class="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
                required
              />
            </div>
          </div>

          <div v-if="!isLogin" class="space-y-2">
            <label for="email" class="text-sm font-medium">Email</label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                v-model="email"
                class="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="password" class="text-sm font-medium">Senha</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                v-model="password"
                class="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
                required
              />
            </div>
          </div>

          <div v-if="error" class="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle class="h-4 w-4" />
            <span class="text-sm">{{ error }}</span>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {{ isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar conta') }}
          </button>

          <div class="text-center">
            <button
              type="button"
              @click="isLogin = !isLogin"
              class="text-sm text-primary hover:underline"
            >
              {{ isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { HardDrive, Mail, Lock, User, AlertCircle } from 'lucide-vue-next';

const isLogin = ref(true);
const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleSubmit = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    if (isLogin.value) {
      await authStore.login(username.value, password.value);
    } else {
      if (!username.value || !email.value || !password.value) {
        error.value = 'Preencha todos os campos';
        isLoading.value = false;
        return;
      }
      await authStore.register(username.value, email.value, password.value);
    }
    
    // Verificar se está autenticado antes de redirecionar
    if (authStore.isAuthenticated) {
      // Forçar navegação
      await router.push('/dashboard');
    } else {
      error.value = 'Erro ao autenticar. Tente novamente.';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.';
  } finally {
    isLoading.value = false;
  }
};
</script>

