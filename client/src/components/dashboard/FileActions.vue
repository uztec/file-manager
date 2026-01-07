<template>
  <div>
    <div class="flex items-center gap-2">
      <button
        @click="showNewFolder = true"
        class="px-4 py-2 border border-border rounded-md hover:bg-accent flex items-center gap-2"
      >
        <FolderPlus class="h-4 w-4" />
        <span class="hidden sm:inline">Nova pasta</span>
      </button>
      
      <button
        @click="fileInputRef?.click()"
        :disabled="isUploading"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
      >
        <Loader2 v-if="isUploading" class="h-4 w-4 animate-spin" />
        <Upload v-else class="h-4 w-4" />
        <span class="hidden sm:inline">
          {{ isUploading ? 'Enviando...' : 'Upload' }}
        </span>
      </button>
      
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- Create Folder Dialog -->
    <div v-if="showNewFolder" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="showNewFolder = false">
      <div class="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border" @click.stop>
        <h3 class="text-lg font-semibold mb-2">Criar nova pasta</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Digite o nome para a nova pasta
        </p>
        <input
          v-model="folderName"
          @keydown.enter="handleCreateFolder"
          placeholder="Nome da pasta"
          class="w-full px-4 py-2 border border-border rounded-md bg-background mb-4"
          autofocus
        />
        <div class="flex gap-2 justify-end">
          <button @click="showNewFolder = false" class="px-4 py-2 border border-border rounded-md hover:bg-accent">
            Cancelar
          </button>
          <button
            @click="handleCreateFolder"
            :disabled="isCreating || !folderName.trim()"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {{ isCreating ? 'Criando...' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { FolderPlus, Upload, Loader2 } from 'lucide-vue-next';

const emit = defineEmits(['create-folder', 'upload-file']);

const showNewFolder = ref(false);
const folderName = ref('');
const isCreating = ref(false);
const isUploading = ref(false);
const fileInputRef = ref(null);

const handleCreateFolder = async () => {
  if (!folderName.value.trim()) return;
  isCreating.value = true;
  try {
    await emit('create-folder', folderName.value.trim());
    showNewFolder.value = false;
    folderName.value = '';
  } finally {
    isCreating.value = false;
  }
};

const handleFileSelect = async (e) => {
  const files = e.target.files;
  if (!files?.length) return;
  
  isUploading.value = true;
  try {
    for (const file of Array.from(files)) {
      await emit('upload-file', file);
    }
  } finally {
    isUploading.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};
</script>

