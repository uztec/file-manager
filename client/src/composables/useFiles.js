import { ref, computed, watch } from 'vue';
import { filesApi } from '@/services/api';
import { useToast } from '@/composables/useToast';

export const useFiles = (initialFolderId = null) => {
  const files = ref([]);
  const folders = ref([]);
  const currentFolderId = ref(initialFolderId);
  const breadcrumb = ref([{ id: null, name: 'Início' }]);
  const isLoading = ref(true);
  const error = ref(null);
  const copiedFileIds = ref([]);
  const isCutMode = ref(false); // true = cortar, false = copiar
  const { toast } = useToast();

  const loadFiles = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const folderIdNum = currentFolderId.value ? parseInt(currentFolderId.value) : null;
      const [filesData, foldersData] = await Promise.all([
        filesApi.listFiles(folderIdNum),
        filesApi.listFolders(folderIdNum),
      ]);
      
      // Combinar arquivos e pastas
      const allItems = [
        ...foldersData.map(f => ({ ...f, type: 'folder' })),
        ...filesData,
      ];
      
      files.value = allItems;
      folders.value = foldersData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar arquivos';
      error.value = message;
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      isLoading.value = false;
    }
  };

  const loadBreadcrumb = async () => {
    if (currentFolderId.value) {
      try {
        const folderIdNum = parseInt(currentFolderId.value);
        const foldersData = await filesApi.listFolders(null);
        // Buscar a pasta atual e construir breadcrumb recursivamente
        const findFolder = (id) => {
          return foldersData.find(f => parseInt(f.id) === id);
        };
        
        const buildBreadcrumb = (id) => {
          const folder = findFolder(id);
          if (!folder || !folder.parentId) {
            return [{ id: String(id), name: folder?.name || 'Pasta' }];
          }
          return [...buildBreadcrumb(parseInt(folder.parentId)), { id: String(id), name: folder.name }];
        };
        
        const bc = buildBreadcrumb(folderIdNum);
        breadcrumb.value = [{ id: null, name: 'Início' }, ...bc];
      } catch {
        breadcrumb.value = [{ id: null, name: 'Início' }];
      }
    } else {
      breadcrumb.value = [{ id: null, name: 'Início' }];
    }
  };

  watch(currentFolderId, () => {
    loadFiles();
    loadBreadcrumb();
  }, { immediate: true });

  const navigateToFolder = (folderId) => {
    currentFolderId.value = folderId;
  };

  const createFolder = async (name) => {
    try {
      const folderIdNum = currentFolderId.value ? parseInt(currentFolderId.value) : null;
      await filesApi.createFolder(name, folderIdNum);
      // Pequeno delay para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadFiles();
      toast({ title: 'Sucesso', description: 'Pasta criada com sucesso' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar pasta';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const uploadFile = async (file) => {
    try {
      const folderIdNum = currentFolderId.value ? parseInt(currentFolderId.value) : null;
      await filesApi.uploadFile(file, folderIdNum);
      // Pequeno delay para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadFiles();
      toast({ title: 'Sucesso', description: 'Arquivo enviado com sucesso' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar arquivo';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const downloadFile = async (fileItem) => {
    try {
      const blob = await filesApi.downloadFile(fileItem.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileItem.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Sucesso', description: 'Download iniciado' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao baixar arquivo';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await filesApi.deleteFile(fileId);
      await loadFiles();
      toast({ title: 'Sucesso', description: 'Arquivo excluído com sucesso' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir arquivo';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const deleteFolder = async (folderId) => {
    try {
      await filesApi.deleteFolder(folderId);
      await loadFiles();
      toast({ title: 'Sucesso', description: 'Pasta excluída com sucesso' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir pasta';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const moveFile = async (fileId, folderId) => {
    try {
      await filesApi.moveFile(fileId, folderId);
      await loadFiles();
      toast({ title: 'Sucesso', description: 'Arquivo movido com sucesso' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao mover arquivo';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const copyFiles = (fileIds) => {
    copiedFileIds.value = fileIds;
    isCutMode.value = false;
    toast({ 
      title: 'Arquivos copiados', 
      description: `${fileIds.length} arquivo(s) copiado(s). Clique com o botão direito em uma pasta para colar.` 
    });
  };

  const pasteFiles = async (folderId) => {
    if (copiedFileIds.value.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum arquivo copiado', variant: 'destructive' });
      return;
    }

    try {
      if (isCutMode.value) {
        // Se está em modo cortar, mover os arquivos
        await filesApi.moveFiles(copiedFileIds.value, folderId);
        toast({ title: 'Sucesso', description: `${copiedFileIds.value.length} arquivo(s) movido(s) com sucesso` });
      } else {
        // Se está em modo copiar, copiar os arquivos
        await filesApi.copyFiles(copiedFileIds.value, folderId);
        toast({ title: 'Sucesso', description: `${copiedFileIds.value.length} arquivo(s) colado(s) com sucesso` });
      }
      await loadFiles();
      copiedFileIds.value = []; // Limpar após colar/mover
      isCutMode.value = false;
    } catch (err) {
      console.error('Erro ao colar arquivos:', err);
      const message = err instanceof Error ? err.message : 'Erro ao colar arquivos';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const cutFiles = (fileIds) => {
    copiedFileIds.value = fileIds;
    isCutMode.value = true;
    toast({ 
      title: 'Arquivos cortados', 
      description: `${fileIds.length} arquivo(s) cortado(s). Clique com o botão direito em uma pasta para mover.` 
    });
  };

  const pasteCutFiles = async (folderId) => {
    if (copiedFileIds.value.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum arquivo cortado', variant: 'destructive' });
      return;
    }

    try {
      await filesApi.moveFiles(copiedFileIds.value, folderId);
      await loadFiles();
      toast({ title: 'Sucesso', description: `${copiedFileIds.value.length} arquivo(s) movido(s) com sucesso` });
      copiedFileIds.value = []; // Limpar após mover
      isCutMode.value = false;
    } catch (err) {
      console.error('Erro ao mover arquivos:', err);
      const message = err instanceof Error ? err.message : 'Erro ao mover arquivos';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const deleteFiles = async (fileIds) => {
    try {
      await filesApi.deleteFiles(fileIds);
      await loadFiles();
      toast({ title: 'Sucesso', description: `${fileIds.length} arquivo(s) excluído(s) com sucesso` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir arquivos';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const regularFiles = computed(() => files.value.filter(f => f.type === 'file'));

  return {
    files,
    folders,
    regularFiles,
    currentFolderId,
    breadcrumb,
    isLoading,
    error,
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
    refresh: loadFiles,
  };
};

