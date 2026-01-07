<template>
  <div class="min-h-screen bg-background">
    <DashboardHeader />
    
    <main class="container mx-auto px-4 py-6 md:px-6">
      <div class="mb-6 flex items-center gap-4">
        <button
          @click="$router.push('/dashboard')"
          class="p-2 hover:bg-accent rounded-md"
        >
          <ArrowLeft class="h-4 w-4" />
        </button>
        <h1 class="text-2xl font-bold">Administração</h1>
      </div>

      <!-- Tabs -->
      <div class="border-b border-border mb-6">
        <div class="flex gap-4">
          <button
            @click="activeTab = 'users'"
            :class="[
              'px-4 py-2 border-b-2 transition-colors',
              activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            ]"
          >
            <Users class="h-4 w-4 inline mr-2" />
            Usuários
          </button>
          <button
            @click="activeTab = 'permissions'"
            :class="[
              'px-4 py-2 border-b-2 transition-colors',
              activeTab === 'permissions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            ]"
          >
            <FolderLock class="h-4 w-4 inline mr-2" />
            Permissões
          </button>
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="space-y-4">
        <div v-if="isLoading" class="flex items-center justify-center py-16">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
        
        <div v-else class="rounded-lg border border-border bg-card">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border">
                <th class="px-4 py-3 text-left text-sm font-medium">Nome</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Role</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Criado em</th>
                <th class="px-4 py-3 text-right text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="border-b border-border hover:bg-accent/50">
                <td class="px-4 py-3">{{ user.name }}</td>
                <td class="px-4 py-3">{{ user.email }}</td>
                <td class="px-4 py-3">
                  <span :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  ]">
                    {{ user.role === 'admin' ? 'Admin' : 'Usuário' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-muted-foreground">
                  {{ formatDate(user.createdAt) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    @click="handleChangeRole(user)"
                    class="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent"
                  >
                    {{ user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Permissions Tab -->
      <div v-if="activeTab === 'permissions'" class="space-y-4">
        <p class="text-muted-foreground">Gerenciamento de permissões em desenvolvimento...</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '@/services/api';
import { useToast } from '@/composables/useToast';
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue';
import { ArrowLeft, Users, FolderLock, Loader2 } from 'lucide-vue-next';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const router = useRouter();
const { toast } = useToast();

const activeTab = ref('users');
const users = ref([]);
const isLoading = ref(true);

const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
};

const loadUsers = async () => {
  isLoading.value = true;
  try {
    users.value = await adminApi.listUsers();
  } catch (err) {
    toast({ title: 'Erro', description: 'Erro ao carregar usuários', variant: 'destructive' });
  } finally {
    isLoading.value = false;
  }
};

const handleChangeRole = async (user) => {
  const newRole = user.role === 'admin' ? 'user' : 'admin';
  try {
    await adminApi.updateUserRole(user.id, newRole);
    toast({ title: 'Sucesso', description: `Role atualizado para ${newRole}` });
    await loadUsers();
  } catch (err) {
    toast({ title: 'Erro', description: 'Erro ao atualizar role', variant: 'destructive' });
  }
};

onMounted(() => {
  loadUsers();
});
</script>

