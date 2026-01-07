<template>
  <header class="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
    <div class="flex h-16 items-center justify-between px-4 md:px-6">
      <!-- Logo -->
      <router-link to="/dashboard" class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <HardDrive class="h-5 w-5 text-primary-foreground" />
        </div>
        <span class="hidden text-lg font-semibold text-foreground md:block">
          FileShare
        </span>
      </router-link>

      <!-- User Menu -->
      <div class="relative">
        <button
          @click="showMenu = !showMenu"
          class="flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-md"
        >
          <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
            {{ getInitials(authStore.user?.name || 'U') }}
          </div>
          <div class="hidden text-left md:block">
            <p class="text-sm font-medium">{{ authStore.user?.name }}</p>
            <p class="text-xs text-muted-foreground">{{ authStore.user?.email }}</p>
          </div>
        </button>
        
        <div v-if="showMenu" class="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg z-50">
          <div class="flex items-center gap-2 p-2 border-b border-border">
            <div class="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              {{ getInitials(authStore.user?.name || 'U') }}
            </div>
            <div class="flex-1 truncate">
              <p class="text-sm font-medium">{{ authStore.user?.name }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ authStore.user?.email }}</p>
            </div>
          </div>
          <div class="p-1">
            <button @click="showMenu = false" class="w-full text-left px-2 py-1.5 hover:bg-accent rounded-sm flex items-center gap-2">
              <User class="h-4 w-4" />
              Meu perfil
            </button>
            <button @click="showMenu = false" class="w-full text-left px-2 py-1.5 hover:bg-accent rounded-sm flex items-center gap-2">
              <Settings class="h-4 w-4" />
              Configurações
            </button>
            <template v-if="authStore.isAdmin">
              <div class="h-px bg-border my-1"></div>
              <button @click="goToAdmin" class="w-full text-left px-2 py-1.5 hover:bg-accent rounded-sm flex items-center gap-2">
                <Shield class="h-4 w-4" />
                Administração
              </button>
            </template>
            <div class="h-px bg-border my-1"></div>
            <button @click="handleLogout" class="w-full text-left px-2 py-1.5 hover:bg-accent rounded-sm flex items-center gap-2 text-destructive">
              <LogOut class="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { HardDrive, LogOut, Settings, User, Shield } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const showMenu = ref(false);

const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const handleLogout = async () => {
  authStore.logout();
  router.push('/auth');
};

const goToAdmin = () => {
  showMenu.value = false;
  router.push('/admin');
};
</script>

