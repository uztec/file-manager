<template>
  <div class="min-h-screen bg-background">
    <DashboardHeader />
    
    <main class="container mx-auto px-4 py-6 md:px-6">
      <!-- Toolbar -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FileBreadcrumb :items="breadcrumb" @navigate="navigateToFolder" />
        
        <div class="flex items-center gap-2">
          <button
            @click="refresh"
            :disabled="isLoading"
            class="p-2 hover:bg-accent rounded-md"
            title="Atualizar"
          >
            <RefreshCw :class="['h-4 w-4', isLoading ? 'animate-spin' : '']" />
          </button>
          <FileActions @create-folder="handleCreateFolder" @upload-file="handleUploadFile" />
        </div>
      </div>

      <!-- File List -->
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
      </div>
      <FileList
        v-else
        :files="files"
        :current-folder-id="currentFolderId"
        :copied-file-ids="copiedFileIds"
        :is-cut-mode="isCutMode"
        @folder-click="navigateToFolder"
        @download="downloadFile"
        @delete="handleDelete"
        @move-file="moveFile"
        @copy-files="copyFiles"
        @paste-files="pasteFiles"
        @cut-files="cutFiles"
        @paste-cut-files="pasteCutFiles"
        @delete-files="handleDeleteFiles"
      />
    </main>

    <!-- Delete Confirmation Dialog -->
    <div v-if="deleteItem" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="deleteItem = null">
      <div class="bg-card rounded-lg p-6 max-w-md w-full mx-4" @click.stop>
        <h3 class="text-lg font-semibold mb-2">Confirmar exclusão</h3>
        <p class="text-muted-foreground mb-4">
          Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
        </p>
        <div class="flex gap-2 justify-end">
          <button @click="deleteItem = null" class="px-4 py-2 border border-border rounded-md hover:bg-accent">
            Cancelar
          </button>
          <button
            @click="confirmDelete"
            :disabled="isDeleting"
            class="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
          >
            {{ isDeleting ? 'Excluindo...' : 'Excluir' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useFiles } from '@/composables/useFiles';
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue';
import FileBreadcrumb from '@/components/dashboard/FileBreadcrumb.vue';
import FileActions from '@/components/dashboard/FileActions.vue';
import FileList from '@/components/dashboard/FileList.vue';
import { Loader2, RefreshCw } from 'lucide-vue-next';

const {
  files,
  breadcrumb,
  currentFolderId,
  isLoading,
  copiedFileIds,
  isCutMode,
  navigateToFolder,
  createFolder,
  uploadFile,
  downloadFile,
  deleteFile,
  deleteFolder,
  moveFile,
  copyFiles,
  pasteFiles,
  cutFiles,
  pasteCutFiles,
  deleteFiles,
  refresh,
} = useFiles();

const deleteItem = ref(null);
const isDeleting = ref(false);

const handleCreateFolder = async (name) => {
  try {
    await createFolder(name);
  } catch (err) {
    // Error already handled in composable
  }
};

const handleUploadFile = async (file) => {
  try {
    await uploadFile(file);
  } catch (err) {
    // Error already handled in composable
  }
};

const handleDelete = (item) => {
  deleteItem.value = item;
};

const confirmDelete = async () => {
  if (!deleteItem.value) return;
  isDeleting.value = true;
  try {
    if (deleteItem.value.type === 'folder') {
      await deleteFolder(deleteItem.value.id);
    } else {
      await deleteFile(deleteItem.value.id);
    }
    deleteItem.value = null;
  } finally {
    isDeleting.value = false;
  }
};

const handleDeleteFiles = async (fileIds) => {
  try {
    await deleteFiles(fileIds);
    // Limpar seleção após deletar
  } catch (err) {
    // Error already handled in composable
  }
};
</script>

