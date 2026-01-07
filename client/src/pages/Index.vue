<template>
  <div class="flex min-h-screen flex-col bg-background">
    <!-- Header -->
    <header class="border-b border-border bg-card">
      <div class="container mx-auto flex h-16 items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <HardDrive class="h-5 w-5 text-primary-foreground" />
          </div>
          <span class="text-lg font-semibold text-foreground">FileShare</span>
        </div>
        <button @click="$router.push('/auth')" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Entrar
          <ArrowRight class="ml-2 h-4 w-4 inline" />
        </button>
      </div>
    </header>

    <!-- Hero -->
    <main class="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div class="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
        <HardDrive class="h-10 w-10 text-primary-foreground" />
      </div>
      
      <h1 class="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        Compartilhamento de Arquivos
        <span class="block text-primary">Seguro e Simples</span>
      </h1>
      
      <p class="mb-8 max-w-2xl text-lg text-muted-foreground">
        Transfira arquivos entre servidores virtuais de forma segura. 
        Controle de acesso por pasta, upload/download simplificado, 
        tudo em uma interface moderna e intuitiva.
      </p>

      <div class="mb-12 flex flex-col gap-4 sm:flex-row">
        <button @click="$router.push('/auth')" class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Começar agora
          <ArrowRight class="ml-2 h-5 w-5 inline" />
        </button>
        <button class="px-6 py-3 border border-border rounded-md hover:bg-accent">
          Saiba mais
        </button>
      </div>

      <!-- Features -->
      <div class="grid max-w-4xl gap-6 md:grid-cols-3">
        <div class="rounded-xl border border-border bg-card p-6 text-left">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Shield class="h-6 w-6 text-primary" />
          </div>
          <h3 class="mb-2 font-semibold text-foreground">Acesso Seguro</h3>
          <p class="text-sm text-muted-foreground">
            Autenticação robusta e controle de permissões por usuário e pasta
          </p>
        </div>
        
        <div class="rounded-xl border border-border bg-card p-6 text-left">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Upload class="h-6 w-6 text-primary" />
          </div>
          <h3 class="mb-2 font-semibold text-foreground">Upload Fácil</h3>
          <p class="text-sm text-muted-foreground">
            Envie arquivos de qualquer tamanho com interface drag-and-drop
          </p>
        </div>
        
        <div class="rounded-xl border border-border bg-card p-6 text-left">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen class="h-6 w-6 text-primary" />
          </div>
          <h3 class="mb-2 font-semibold text-foreground">Organização</h3>
          <p class="text-sm text-muted-foreground">
            Estrutura de pastas hierárquica para manter tudo organizado
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border py-6 text-center text-sm text-muted-foreground">
      <p>FileShare — Compartilhamento seguro de arquivos entre servidores</p>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { HardDrive, ArrowRight, Shield, Upload, FolderOpen } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  if (!authStore.isLoading && authStore.isAuthenticated) {
    router.push('/dashboard');
  }
});
</script>

