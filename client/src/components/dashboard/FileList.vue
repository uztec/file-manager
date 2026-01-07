<template>
  <div class="space-y-4">
    <!-- Toolbar de seleção -->
    <div v-if="hasSelection" class="flex items-center justify-between rounded-lg border border-border bg-card p-3">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium">
          {{ selectedFileIds.size }} arquivo(s) selecionado(s)
        </span>
        <button
          @click="handleCopySelected"
          class="px-4 py-2 border border-border rounded-md hover:bg-accent flex items-center gap-2"
        >
          <Copy class="h-4 w-4" />
          Copiar
        </button>
        <button
          @click="handleCutSelected"
          class="px-4 py-2 border border-border rounded-md hover:bg-accent flex items-center gap-2"
        >
          <Scissors class="h-4 w-4" />
          Cortar
        </button>
        <button
          @click="handleDeleteSelected"
          class="px-4 py-2 border border-border rounded-md hover:bg-accent text-destructive flex items-center gap-2"
        >
          <Trash2 class="h-4 w-4" />
          Excluir
        </button>
      </div>
      <button
        @click="selectedFileIds.clear()"
        class="px-4 py-2 hover:bg-accent rounded-md"
      >
        Cancelar
      </button>
    </div>

    <!-- Toolbar de visualização e seleção -->
    <div class="flex items-center justify-end gap-4">
      <!-- Checkbox de selecionar todos -->
      <div v-if="files.filter(f => f.type === 'file').length > 0" class="flex items-center gap-2 px-1 mr-auto">
        <input
          type="checkbox"
          :checked="allFilesSelected"
          @change="handleSelectAll"
          class="h-4 w-4 rounded border-border"
        />
        <span class="text-sm text-muted-foreground">
          Selecionar todos os arquivos
        </span>
      </div>
      
      <!-- Botões de visualização -->
      <div class="flex items-center gap-2 border border-border rounded-md p-1">
        <button
          @click="setViewMode('grid')"
          :class="[
            'p-2 rounded hover:bg-accent transition-colors',
            viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''
          ]"
          title="Visualização de ícones"
        >
          <Grid3x3 class="h-4 w-4" />
        </button>
        <button
          @click="setViewMode('list')"
          :class="[
            'p-2 rounded hover:bg-accent transition-colors',
            viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''
          ]"
          title="Visualização de lista"
        >
          <List class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="files.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-lg border-2 border-dashed border-border">
      <Folder class="h-16 w-16 opacity-30" />
      <p class="mt-4 text-lg font-medium">Pasta vazia</p>
      <p class="text-sm">Arraste arquivos ou crie uma nova pasta</p>
    </div>

    <!-- File Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
        v-for="file in files"
        :key="file.id"
        :data-file-item="true"
        :data-file-id="file.id"
        :draggable="file.type === 'file'"
        @dragstart="handleDragStart($event, file)"
        @dragend="handleDragEnd"
        @dragover="file.type === 'folder' ? handleDragOver($event, file.id) : undefined"
        @dragleave="file.type === 'folder' ? handleDragLeave : undefined"
        @drop="file.type === 'folder' ? handleDrop($event, file.id) : undefined"
        @contextmenu="handleContextMenu($event, file)"
        @click="handleItemClick(file)"
        :class="[
          'group relative flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:bg-accent/50',
          file.type === 'folder' ? 'cursor-pointer' : '',
          file.type === 'file' ? 'cursor-pointer' : '',
          draggedFileId === file.id ? 'opacity-50 cursor-grabbing' : '',
          dragOverFolderId === file.id && file.type === 'folder' ? 'border-primary border-2 bg-primary/10 scale-105' : '',
          selectedFileIds.has(file.id) ? 'border-primary bg-primary/5' : ''
        ]"
      >
        <!-- Checkbox for files -->
        <input
          v-if="file.type === 'file'"
          type="checkbox"
          :checked="selectedFileIds.has(file.id)"
          @change="handleSelectFile(file.id, $event.target.checked)"
          @click.stop
          class="flex-shrink-0 h-4 w-4 rounded border-border"
        />
        
        <!-- Icon or Thumbnail -->
        <div class="flex-shrink-0">
          <template v-if="file.type === 'folder'">
            <component :is="Folder" class="h-10 w-10 fill-primary/20 text-primary" />
          </template>
          <template v-else-if="file.mimeType?.startsWith('image/') && viewMode === 'grid'">
            <div class="relative h-10 w-10">
              <img
                :src="getThumbnailUrl(file)"
                :alt="file.name"
                class="h-10 w-10 object-cover rounded border border-border"
                @error="handleImageError"
                loading="lazy"
              />
              <component
                :is="getFileIcon(file)"
                :class="['h-10 w-10', getFileIconColor(file), 'absolute inset-0 hidden']"
              />
            </div>
          </template>
          <template v-else>
            <component :is="getFileIcon(file)" :class="['h-10 w-10', getFileIconColor(file)]" />
          </template>
        </div>
        
        <!-- File Info -->
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-foreground">{{ file.name }}</p>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span v-if="file.type === 'file' && file.size">{{ formatFileSize(file.size) }}</span>
            <span>{{ formatDate(file.updatedAt) }}</span>
          </div>
        </div>

        <!-- Actions Menu -->
        <div class="opacity-0 group-hover:opacity-100 transition-opacity relative">
          <button
            @click.stop="toggleMenu(file.id)"
            class="p-1 hover:bg-accent rounded"
          >
            <MoreVertical class="h-4 w-4" />
          </button>
          
          <!-- Dropdown Menu -->
          <div
            v-if="showMenu === file.id"
            :class="[
              'absolute right-0 z-50 w-48 bg-card border border-border rounded-md shadow-lg',
              isLastItemInGrid(file) ? 'bottom-full mb-1' : 'top-full mt-1'
            ]"
            @click.stop
          >
            <button
              v-if="file.type === 'file'"
              @click="handleDownload(file)"
              class="w-full text-left px-4 py-2 hover:bg-accent flex items-center gap-2"
            >
              <Download class="h-4 w-4" />
              Baixar
            </button>
            <div v-if="file.type === 'file'" class="h-px bg-border"></div>
            <button
              @click="handleDelete(file)"
              class="w-full text-left px-4 py-2 hover:bg-accent text-destructive flex items-center gap-2"
            >
              <Trash2 class="h-4 w-4" />
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- File List View -->
    <div v-else class="rounded-lg border border-border bg-card overflow-hidden">
      <table class="w-full">
        <thead class="bg-muted/50 border-b border-border">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium w-12">
              <input
                v-if="files.filter(f => f.type === 'file').length > 0"
                type="checkbox"
                :checked="allFilesSelected"
                @change="handleSelectAll"
                class="h-4 w-4 rounded border-border"
              />
            </th>
            <th class="px-4 py-3 text-left text-sm font-medium">Nome</th>
            <th class="px-4 py-3 text-left text-sm font-medium">Tipo</th>
            <th class="px-4 py-3 text-left text-sm font-medium">Tamanho</th>
            <th class="px-4 py-3 text-left text-sm font-medium">Modificado</th>
            <th class="px-4 py-3 text-right text-sm font-medium w-12"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="file in files"
            :key="file.id"
            :data-file-item="true"
            :data-file-id="file.id"
            :draggable="file.type === 'file'"
            @dragstart="handleDragStart($event, file)"
            @dragend="handleDragEnd"
            @dragover="file.type === 'folder' ? handleDragOver($event, file.id) : undefined"
            @dragleave="file.type === 'folder' ? handleDragLeave : undefined"
            @drop="file.type === 'folder' ? handleDrop($event, file.id) : undefined"
            @contextmenu="handleContextMenu($event, file)"
            @click="handleItemClick(file)"
            :class="[
              'border-b border-border hover:bg-accent/50 transition-colors cursor-pointer',
              draggedFileId === file.id ? 'opacity-50' : '',
              dragOverFolderId === file.id && file.type === 'folder' ? 'bg-primary/10' : '',
              selectedFileIds.has(file.id) ? 'bg-primary/5' : ''
            ]"
          >
            <td class="px-4 py-3">
              <input
                v-if="file.type === 'file'"
                type="checkbox"
                :checked="selectedFileIds.has(file.id)"
                @change="handleSelectFile(file.id, $event.target.checked)"
                @click.stop
                class="h-4 w-4 rounded border-border"
              />
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <template v-if="file.type === 'folder'">
                    <component :is="Folder" class="h-5 w-5 fill-primary/20 text-primary" />
                  </template>
                  <template v-else-if="file.mimeType?.startsWith('image/')">
                    <div class="relative h-8 w-8">
                      <img
                        :src="getThumbnailUrl(file)"
                        :alt="file.name"
                        class="h-8 w-8 object-cover rounded border border-border"
                        @error="handleImageError"
                        loading="lazy"
                        crossorigin="anonymous"
                      />
                      <component
                        :is="getFileIcon(file)"
                        :class="['h-5 w-5', getFileIconColor(file), 'absolute inset-0 hidden']"
                      />
                    </div>
                  </template>
                  <template v-else>
                    <component :is="getFileIcon(file)" :class="['h-5 w-5', getFileIconColor(file)]" />
                  </template>
                </div>
                <span class="font-medium text-foreground">{{ file.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-muted-foreground">
              {{ getFileTypeName(file) }}
            </td>
            <td class="px-4 py-3 text-sm text-muted-foreground">
              {{ file.type === 'file' && file.size ? formatFileSize(file.size) : '-' }}
            </td>
            <td class="px-4 py-3 text-sm text-muted-foreground">
              {{ formatDate(file.updatedAt) }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="relative">
                <button
                  @click.stop="toggleMenu(file.id, $event)"
                  class="p-1 hover:bg-accent rounded"
                >
                  <MoreVertical class="h-4 w-4" />
                </button>
                
                <!-- Dropdown Menu -->
                <div
                  v-if="showMenu === file.id"
                  :class="[
                    'z-[100] w-48 bg-card border border-border rounded-md shadow-lg',
                    menuPosition.isFixed && isLastItem(file) 
                      ? 'fixed' 
                      : 'absolute right-0',
                    !menuPosition.isFixed && isLastItem(file) ? 'bottom-full mb-1' : '',
                    !menuPosition.isFixed && !isLastItem(file) ? 'top-full mt-1' : ''
                  ]"
                  :style="menuPosition.isFixed && isLastItem(file) 
                    ? { left: menuPosition.x + 'px', top: menuPosition.y + 'px' }
                    : {}"
                  @click.stop
                >
                  <button
                    v-if="file.type === 'file'"
                    @click="handleDownload(file)"
                    class="w-full text-left px-4 py-2 hover:bg-accent flex items-center gap-2"
                  >
                    <Download class="h-4 w-4" />
                    Baixar
                  </button>
                  <div v-if="file.type === 'file'" class="h-px bg-border"></div>
                  <button
                    @click="handleDelete(file)"
                    class="w-full text-left px-4 py-2 hover:bg-accent text-destructive flex items-center gap-2"
                  >
                    <Trash2 class="h-4 w-4" />
                    Excluir
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.show"
      ref="contextMenuRef"
      class="fixed z-50 bg-card border border-border rounded-md shadow-lg p-1 min-w-[200px]"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <template v-if="contextMenu.file?.type === 'folder'">
        <button
          v-if="copiedFileIds.length > 0"
          @click="handlePaste(contextMenu.file.id)"
          class="w-full text-left px-4 py-2 hover:bg-accent rounded-sm flex items-center gap-2"
        >
          <component :is="isCutMode ? Scissors : Clipboard" class="h-4 w-4" />
          {{ isCutMode ? 'Mover aqui' : 'Colar aqui' }} (pasta: {{ contextMenu.file.name }})
        </button>
        <div v-if="copiedFileIds.length === 0" class="px-4 py-2 text-sm text-muted-foreground">
          Nenhum arquivo copiado/cortado
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileJson,
  FileType,
  Image,
  Music,
  Video,
  MoreVertical,
  Download,
  Trash2,
  Copy,
  Clipboard,
  Scissors,
  Grid3x3,
  List,
} from 'lucide-vue-next';

const props = defineProps({
  files: {
    type: Array,
    required: true,
  },
  currentFolderId: {
    type: String,
    default: null,
  },
  copiedFileIds: {
    type: Array,
    default: () => [],
  },
  isCutMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['folder-click', 'download', 'delete', 'move-file', 'copy-files', 'paste-files', 'cut-files', 'paste-cut-files', 'delete-files']);

const draggedFileId = ref(null);
const dragOverFolderId = ref(null);
const selectedFileIds = ref(new Set());
const showMenu = ref(null);
const menuPosition = ref({ x: 0, y: 0, isFixed: false });
const contextMenu = ref({ show: false, x: 0, y: 0, file: null });
const contextMenuRef = ref(null);

// View mode: 'grid' ou 'list'
const viewMode = ref(localStorage.getItem('file-view-mode') || 'grid');

// Salvar preferência de visualização
const setViewMode = (mode) => {
  viewMode.value = mode;
  localStorage.setItem('file-view-mode', mode);
};

const hasSelection = computed(() => selectedFileIds.value.size > 0);
const allFilesSelected = computed(() => {
  const fileItems = props.files.filter(f => f.type === 'file');
  return fileItems.length > 0 && fileItems.every(f => selectedFileIds.value.has(f.id));
});

// Função para obter o ícone baseado no tipo de arquivo
const getFileIcon = (file) => {
  if (file.type === 'folder') {
    return Folder;
  }
  
  const mime = file.mimeType?.toLowerCase() || '';
  const name = file.name?.toLowerCase() || '';
  
  // PDF
  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return FileText;
  }
  
  // Imagens
  if (mime.startsWith('image/')) {
    return FileImage;
  }
  
  // Vídeos
  if (mime.startsWith('video/')) {
    return FileVideo;
  }
  
  // Áudio
  if (mime.startsWith('audio/')) {
    return Music;
  }
  
  // Arquivos de texto e documentos
  if (mime.includes('text/plain') || name.endsWith('.txt')) {
    return FileText;
  }
  if (mime.includes('text/markdown') || name.endsWith('.md')) {
    return FileText;
  }
  
  // Microsoft Word
  if (mime.includes('word') || mime.includes('msword') || 
      name.endsWith('.doc') || name.endsWith('.docx')) {
    return FileText;
  }
  
  // Microsoft Excel
  if (mime.includes('excel') || mime.includes('spreadsheet') ||
      name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
    return FileText;
  }
  
  // Microsoft PowerPoint
  if (mime.includes('powerpoint') || mime.includes('presentation') ||
      name.endsWith('.ppt') || name.endsWith('.pptx')) {
    return FileType;
  }
  
  // Código
  if (mime.includes('javascript') || name.endsWith('.js') || name.endsWith('.jsx')) {
    return FileCode;
  }
  if (mime.includes('json') || name.endsWith('.json')) {
    return FileJson;
  }
  if (mime.includes('xml') || name.endsWith('.xml')) {
    return FileCode;
  }
  if (mime.includes('html') || name.endsWith('.html') || name.endsWith('.htm')) {
    return FileCode;
  }
  if (name.endsWith('.css') || name.endsWith('.scss') || name.endsWith('.sass')) {
    return FileCode;
  }
  if (name.endsWith('.ts') || name.endsWith('.tsx')) {
    return FileCode;
  }
  if (name.endsWith('.py') || name.endsWith('.java') || name.endsWith('.cpp') || 
      name.endsWith('.c') || name.endsWith('.h') || name.endsWith('.php') ||
      name.endsWith('.rb') || name.endsWith('.go') || name.endsWith('.rs')) {
    return FileCode;
  }
  
  // Arquivos compactados
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || 
      mime.includes('7z') || mime.includes('gzip') || mime.includes('compressed') ||
      name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar') ||
      name.endsWith('.gz') || name.endsWith('.7z')) {
    return FileArchive;
  }
  
  // Padrão
  return File;
};

// Função para obter a cor do ícone
const getFileIconColor = (file) => {
  if (file.type === 'folder') {
    return 'text-primary';
  }
  
  const mime = file.mimeType?.toLowerCase() || '';
  const name = file.name?.toLowerCase() || '';
  
  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return 'text-red-600';
  }
  if (mime.startsWith('image/')) {
    return 'text-pink-500';
  }
  if (mime.startsWith('video/')) {
    return 'text-purple-500';
  }
  if (mime.startsWith('audio/')) {
    return 'text-green-500';
  }
  if (mime.includes('excel') || mime.includes('spreadsheet') ||
      name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
    return 'text-green-600';
  }
  if (mime.includes('word') || mime.includes('msword') ||
      name.endsWith('.doc') || name.endsWith('.docx')) {
    return 'text-blue-600';
  }
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') ||
      name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar')) {
    return 'text-yellow-600';
  }
  if (mime.includes('javascript') || mime.includes('json') || mime.includes('xml') ||
      mime.includes('html') || name.endsWith('.js') || name.endsWith('.json') ||
      name.endsWith('.xml') || name.endsWith('.html')) {
    return 'text-blue-500';
  }
  
  return 'text-muted-foreground';
};

// Função para obter URL da miniatura (para imagens)
const getThumbnailUrl = (file) => {
  if (file.type === 'file' && file.mimeType?.startsWith('image/')) {
    const token = localStorage.getItem('auth_token');
    const BASE_URL = import.meta.env.VITE_API_URL || '/api';
    // Incluir token na query string para preview
    return `${BASE_URL}/files/${file.id}?preview=true${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  }
  return null;
};

const isArchive = (mime) => {
  if (!mime) return false;
  return mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('7z');
};

const isDocument = (mime) => {
  if (!mime) return false;
  return mime.includes('pdf') || mime.includes('document') || mime.includes('text');
};

const isCode = (mime) => {
  if (!mime) return false;
  return mime.includes('javascript') || mime.includes('json') || mime.includes('xml') || mime.includes('html');
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
};

// Handler para erro ao carregar imagem
const handleImageError = (e) => {
  const img = e.target;
  const fallback = img.nextElementSibling;
  if (fallback) {
    img.style.display = 'none';
    fallback.classList.remove('hidden');
  }
};

// Verificar se é o último item da lista
const isLastItem = (file) => {
  const index = props.files.findIndex(f => f.id === file.id);
  return index === props.files.length - 1;
};

// Verificar se é um dos últimos itens na visualização grid (últimas 2 linhas)
const isLastItemInGrid = (file) => {
  const index = props.files.findIndex(f => f.id === file.id);
  const totalItems = props.files.length;
  // Se estiver nos últimos 4 itens, pode precisar abrir para cima
  return index >= totalItems - 4;
};

// Toggle do menu dropdown
const toggleMenu = (fileId, event = null) => {
  if (showMenu.value === fileId) {
    showMenu.value = null;
    menuPosition.value = { x: 0, y: 0, isFixed: false };
  } else {
    showMenu.value = fileId;
    
    // Se for o último item na visualização de lista, usar posição fixa
    const file = props.files.find(f => f.id === fileId);
    if (file && isLastItem(file) && viewMode.value === 'list' && event) {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const menuHeight = 100; // Altura aproximada do menu (2 botões + espaçamento)
      
      menuPosition.value = {
        x: rect.right - 192, // 192px = largura do menu (w-48 = 12rem = 192px)
        y: rect.top - menuHeight - 4, // Posicionar acima do botão com margem
        isFixed: true
      };
    } else {
      menuPosition.value = { x: 0, y: 0, isFixed: false };
    }
  }
};

// Função para obter nome simplificado do tipo de arquivo
const getFileTypeName = (file) => {
  if (file.type === 'folder') {
    return 'Pasta';
  }
  
  const mime = file.mimeType?.toLowerCase() || '';
  const name = file.name?.toLowerCase() || '';
  
  // Imagens
  if (mime.startsWith('image/')) {
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'Imagem JPEG';
    if (mime.includes('png')) return 'Imagem PNG';
    if (mime.includes('gif')) return 'Imagem GIF';
    if (mime.includes('webp')) return 'Imagem WebP';
    if (mime.includes('svg')) return 'Imagem SVG';
    return 'Imagem';
  }
  
  // Vídeos
  if (mime.startsWith('video/')) {
    if (mime.includes('mp4')) return 'Vídeo MP4';
    if (mime.includes('avi')) return 'Vídeo AVI';
    if (mime.includes('mov')) return 'Vídeo MOV';
    if (mime.includes('webm')) return 'Vídeo WebM';
    return 'Vídeo';
  }
  
  // Áudio
  if (mime.startsWith('audio/')) {
    if (mime.includes('mp3')) return 'Áudio MP3';
    if (mime.includes('wav')) return 'Áudio WAV';
    if (mime.includes('ogg')) return 'Áudio OGG';
    return 'Áudio';
  }
  
  // PDF
  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return 'PDF';
  }
  
  // Documentos Word
  if (mime.includes('word') || mime.includes('msword') || 
      name.endsWith('.doc') || name.endsWith('.docx')) {
    return 'Documento Word';
  }
  
  // Planilhas Excel
  if (mime.includes('excel') || mime.includes('spreadsheet') ||
      name.endsWith('.xls') || name.endsWith('.xlsx')) {
    return 'Planilha Excel';
  }
  
  // CSV
  if (name.endsWith('.csv')) {
    return 'Planilha CSV';
  }
  
  // PowerPoint
  if (mime.includes('powerpoint') || mime.includes('presentation') ||
      name.endsWith('.ppt') || name.endsWith('.pptx')) {
    return 'Apresentação';
  }
  
  // Texto
  if (mime.includes('text/plain') || name.endsWith('.txt')) {
    return 'Texto';
  }
  if (mime.includes('text/markdown') || name.endsWith('.md')) {
    return 'Markdown';
  }
  
  // Código
  if (name.endsWith('.js') || name.endsWith('.jsx')) return 'JavaScript';
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'TypeScript';
  if (name.endsWith('.json')) return 'JSON';
  if (name.endsWith('.xml')) return 'XML';
  if (name.endsWith('.html') || name.endsWith('.htm')) return 'HTML';
  if (name.endsWith('.css')) return 'CSS';
  if (name.endsWith('.py')) return 'Python';
  if (name.endsWith('.java')) return 'Java';
  if (name.endsWith('.cpp') || name.endsWith('.c') || name.endsWith('.h')) return 'C/C++';
  if (name.endsWith('.php')) return 'PHP';
  if (name.endsWith('.rb')) return 'Ruby';
  if (name.endsWith('.go')) return 'Go';
  if (name.endsWith('.rs')) return 'Rust';
  
  // Arquivos compactados
  if (mime.includes('zip') || name.endsWith('.zip')) return 'ZIP';
  if (mime.includes('rar') || name.endsWith('.rar')) return 'RAR';
  if (mime.includes('tar') || name.endsWith('.tar')) return 'TAR';
  if (mime.includes('7z') || name.endsWith('.7z')) return '7Z';
  if (mime.includes('gzip') || name.endsWith('.gz')) return 'GZIP';
  
  // Extensão do arquivo (último recurso)
  const extension = name.split('.').pop();
  if (extension && extension !== name) {
    return extension.toUpperCase();
  }
  
  // Padrão
  return 'Arquivo';
};

const handleDragStart = (e, file) => {
  if (file.type === 'file') {
    draggedFileId.value = file.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
  }
};

const handleDragEnd = () => {
  draggedFileId.value = null;
  dragOverFolderId.value = null;
};

const handleDragOver = (e, folderId) => {
  if (draggedFileId.value) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverFolderId.value = folderId;
  }
};

const handleDragLeave = () => {
  dragOverFolderId.value = null;
};

const handleDrop = async (e, folderId) => {
  e.preventDefault();
  if (draggedFileId.value) {
    const targetFolderId = folderId === 'root' ? null : parseInt(folderId);
    try {
      await emit('move-file', draggedFileId.value, targetFolderId);
    } catch (error) {
      console.error('Erro ao mover arquivo:', error);
    }
  }
  handleDragEnd();
};

const handleSelectFile = (fileId, checked) => {
  if (checked) {
    selectedFileIds.value.add(fileId);
  } else {
    selectedFileIds.value.delete(fileId);
  }
};

const handleSelectAll = (e) => {
  const checked = e.target.checked;
  if (checked) {
    const fileIds = props.files.filter(f => f.type === 'file').map(f => f.id);
    selectedFileIds.value = new Set(fileIds);
  } else {
    selectedFileIds.value.clear();
  }
};

const handleCopySelected = () => {
  const fileIds = Array.from(selectedFileIds.value);
  if (fileIds.length > 0) {
    emit('copy-files', fileIds);
    selectedFileIds.value.clear();
  }
};

const handleCutSelected = () => {
  const fileIds = Array.from(selectedFileIds.value);
  if (fileIds.length > 0) {
    emit('cut-files', fileIds);
    selectedFileIds.value.clear();
  }
};

const handleDeleteSelected = () => {
  const fileIds = Array.from(selectedFileIds.value);
  if (fileIds.length > 0) {
    if (confirm(`Tem certeza que deseja excluir ${fileIds.length} arquivo(s)? Esta ação não pode ser desfeita.`)) {
      emit('delete-files', fileIds);
    }
  }
};

const handleItemClick = (file) => {
  if (file.type === 'folder') {
    emit('folder-click', file.id);
  } else {
    handleSelectFile(file.id, !selectedFileIds.value.has(file.id));
  }
};

const handleContextMenu = (e, file) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Context menu opened for:', file.name, file.type);
  contextMenu.value = {
    show: true,
    x: e.clientX,
    y: e.clientY,
    file: file,
  };
};

const handlePaste = async (folderId) => {
  contextMenu.value.show = false;
  const targetFolderId = folderId ? parseInt(folderId) : null;
  if (props.isCutMode) {
    await emit('paste-cut-files', targetFolderId);
  } else {
    await emit('paste-files', targetFolderId);
  }
};

const handleDownload = (file) => {
  showMenu.value = null;
  menuPosition.value = { x: 0, y: 0, isFixed: false };
  emit('download', file);
};

const handleDelete = (file) => {
  showMenu.value = null;
  menuPosition.value = { x: 0, y: 0, isFixed: false };
  emit('delete', file);
};

const closeContextMenu = (e) => {
  // Não fechar se o clique foi no próprio menu
  if (contextMenuRef.value && contextMenuRef.value.contains(e?.target)) {
    return;
  }
  // Não fechar se o clique foi no item que abriu o menu
  if (e?.target?.closest('[data-file-item]')) {
    return;
  }
  contextMenu.value.show = false;
};

const handleContextMenuKeydown = (e) => {
  if (e.key === 'Escape' && contextMenu.value.show) {
    contextMenu.value.show = false;
  }
};

let clickHandler = null;
let contextMenuHandler = null;
let keydownHandler = null;

onMounted(() => {
  // Usar setTimeout para evitar que o evento de clique imediato feche o menu
  clickHandler = (e) => {
    setTimeout(() => {
      closeContextMenu(e);
      // Fechar menu dropdown se clicar fora
      if (showMenu.value) {
        // Verificar se o clique foi no botão do menu (ícone MoreVertical)
        const clickedButton = e.target.closest('button');
        const isMenuButton = clickedButton && (
          clickedButton.querySelector('svg') || 
          clickedButton.querySelector('.lucide-more-vertical') ||
          e.target.closest('.lucide-more-vertical')
        );
        
        // Verificar se o clique foi dentro do menu dropdown (absolute ou fixed)
        const clickedMenu = e.target.closest('.z-\\[100\\]') || 
                           e.target.closest('.absolute.right-0.z-50') ||
                           e.target.closest('.fixed');
        
        if (!isMenuButton && !clickedMenu) {
          showMenu.value = null;
          menuPosition.value = { x: 0, y: 0, isFixed: false };
        }
      }
    }, 10);
  };
  contextMenuHandler = (e) => {
    // Só fechar se não for no item de arquivo
    if (!e.target.closest('[data-file-item]')) {
      setTimeout(() => closeContextMenu(e), 10);
    }
  };
  keydownHandler = (e) => {
    handleContextMenuKeydown(e);
    if (e.key === 'Escape' && showMenu.value) {
      showMenu.value = null;
      menuPosition.value = { x: 0, y: 0, isFixed: false };
    }
  };
  
  document.addEventListener('click', clickHandler, true);
  document.addEventListener('contextmenu', contextMenuHandler, true);
  document.addEventListener('keydown', keydownHandler);
});

onUnmounted(() => {
  if (clickHandler) {
    document.removeEventListener('click', clickHandler, true);
  }
  if (contextMenuHandler) {
    document.removeEventListener('contextmenu', contextMenuHandler, true);
  }
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
  }
});
</script>

