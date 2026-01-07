/**
 * API Service - Conectado com a API File Manager
 * 
 * BASE_URL: URL do backend (padrão: http://localhost:3000/api)
 * Todas as chamadas de API são centralizadas aqui
 */

// ============================================
// CONFIGURATION
// ============================================
// Em produção, usa caminho relativo (mesmo servidor)
// Em desenvolvimento, pode usar variável de ambiente ou padrão relativo
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// HTTP Client with authentication
// ============================================
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// ============================================
// Authentication API
// ============================================
export const authApi = {
  /**
   * Login com username e password
   */
  login: (username, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Registrar novo usuário
   */
  register: (username, email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  /**
   * Obter usuário atual
   */
  getCurrentUser: async () => {
    const response = await apiRequest('/auth/me');
    return response.user;
  },
};

// ============================================
// Files API
// ============================================
export const filesApi = {
  /**
   * Listar arquivos do usuário
   */
  listFiles: async (folderId = null) => {
    const query = folderId !== null ? `?folderId=${folderId}` : '';
    const response = await apiRequest(`/files${query}`);
    if (!response.files || !Array.isArray(response.files)) {
      return [];
    }
    return response.files.map(file => ({
      id: String(file.id),
      name: file.original_name || file.name,
      type: 'file',
      size: file.size,
      mimeType: file.mime_type,
      parentId: file.folder_id ? String(file.folder_id) : null,
      createdAt: file.created_at,
      updatedAt: file.created_at,
      createdBy: String(file.owner_id),
    }));
  },

  /**
   * Listar pastas do usuário
   */
  listFolders: async (parentId = null) => {
    const query = parentId !== null ? `?parentId=${parentId}` : '';
    const response = await apiRequest(`/files/folders${query}`);
    if (!response.folders || !Array.isArray(response.folders)) {
      return [];
    }
    return response.folders.map(folder => ({
      id: String(folder.id),
      name: folder.name,
      type: 'folder',
      parentId: folder.parent_id ? String(folder.parent_id) : null,
      createdAt: folder.created_at,
      updatedAt: folder.created_at,
      createdBy: String(folder.owner_id),
    }));
  },

  /**
   * Criar pasta
   */
  createFolder: async (name, parentId = null) => {
    const body = { name };
    if (parentId !== null) {
      body.parentId = parentId;
    }
    
    const response = await apiRequest('/files/folders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const folder = response.folder;
    return {
      id: String(folder.id),
      name: folder.name,
      type: 'folder',
      parentId: folder.parent_id ? String(folder.parent_id) : null,
      createdAt: folder.created_at,
      updatedAt: folder.created_at,
      createdBy: String(folder.owner_id),
    };
  },

  /**
   * Upload de arquivo
   */
  uploadFile: async (file, folderId = null) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    if (folderId !== null) {
      formData.append('folderId', String(folderId));
    }

    const response = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || error.message || 'Upload failed');
    }

    const data = await response.json();
    const fileData = data.file;
    return {
      id: String(fileData.id),
      name: fileData.originalName || fileData.name,
      type: 'file',
      size: fileData.size,
      mimeType: fileData.mimeType || fileData.mime_type,
      parentId: (fileData.folderId || fileData.folder_id) ? String(fileData.folderId || fileData.folder_id) : null,
      createdAt: fileData.createdAt || fileData.created_at || new Date().toISOString(),
      updatedAt: fileData.createdAt || fileData.created_at || new Date().toISOString(),
      createdBy: '', // Owner ID não vem na resposta
    };
  },

  /**
   * Download de arquivo
   */
  downloadFile: async (fileId) => {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/files/${fileId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(error.error || error.message || 'Download failed');
    }

    return response.blob();
  },

  /**
   * Copiar arquivos para outra pasta
   */
  copyFiles: async (fileIds, folderId = null) => {
    console.log('copyFiles API chamado:', { fileIds, folderId, folderIdType: typeof folderId });
    const body = { 
      fileIds: fileIds.map(id => parseInt(id)),
      folderId: folderId
    };
    console.log('Body enviado:', body, 'JSON:', JSON.stringify(body));
    const response = await apiRequest('/files/copy', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.files.map(file => ({
      id: String(file.id),
      name: file.originalName || file.name,
      type: 'file',
      size: file.size,
      mimeType: file.mimeType || file.mime_type,
      parentId: file.folderId || file.folder_id ? String(file.folderId || file.folder_id) : null,
      createdAt: file.createdAt || file.created_at,
      updatedAt: file.createdAt || file.created_at,
      createdBy: '', // Owner ID não vem na resposta
    }));
  },

  /**
   * Mover arquivo para outra pasta
   */
  moveFile: async (fileId, folderId = null) => {
    const response = await apiRequest(`/files/${fileId}/move`, {
      method: 'PUT',
      body: JSON.stringify({ folderId }),
    });
    const file = response.file;
    return {
      id: String(file.id),
      name: file.originalName || file.name,
      type: 'file',
      size: file.size,
      mimeType: file.mimeType || file.mime_type,
      parentId: file.folderId || file.folder_id ? String(file.folderId || file.folder_id) : null,
      createdAt: file.createdAt || file.created_at,
      updatedAt: file.createdAt || file.created_at,
      createdBy: '', // Owner ID não vem na resposta
    };
  },

  /**
   * Deletar arquivo
   */
  deleteFile: (fileId) => {
    return apiRequest(`/files/${fileId}`, { method: 'DELETE' });
  },

  /**
   * Deletar pasta
   */
  deleteFolder: (folderId) => {
    return apiRequest(`/files/folders/${folderId}`, { method: 'DELETE' });
  },

  /**
   * Mover múltiplos arquivos
   */
  moveFiles: async (fileIds, folderId = null) => {
    const response = await apiRequest('/files/move', {
      method: 'POST',
      body: JSON.stringify({ 
        fileIds: fileIds.map(id => parseInt(id)),
        folderId 
      }),
    });
    return response.files.map(file => ({
      id: String(file.id),
      name: file.originalName || file.name,
      type: 'file',
      size: file.size,
      mimeType: file.mimeType || file.mime_type,
      parentId: file.folderId || file.folder_id ? String(file.folderId || file.folder_id) : null,
      createdAt: file.createdAt || file.created_at,
      updatedAt: file.createdAt || file.created_at,
      createdBy: '',
    }));
  },

  /**
   * Deletar múltiplos arquivos
   */
  deleteFiles: async (fileIds) => {
    const response = await apiRequest('/files/delete', {
      method: 'POST',
      body: JSON.stringify({ 
        fileIds: fileIds.map(id => parseInt(id))
      }),
    });
    return response.deletedIds.map(id => String(id));
  },
};

// ============================================
// Admin API
// ============================================
export const adminApi = {
  /**
   * Listar todos os usuários
   */
  listUsers: async () => {
    const response = await apiRequest('/admin/users');
    return response.users.map(user => ({
      id: String(user.id),
      email: user.email,
      name: user.username,
      role: user.role,
      createdAt: user.created_at,
    }));
  },

  /**
   * Obter usuário por ID
   */
  getUser: async (userId) => {
    const response = await apiRequest(`/admin/users/${userId}`);
    const user = response.user;
    return {
      id: String(user.id),
      email: user.email,
      name: user.username,
      role: user.role,
      createdAt: user.created_at,
    };
  },

  /**
   * Atualizar role do usuário
   */
  updateUserRole: (userId, role) => {
    return apiRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  /**
   * Deletar usuário
   */
  deleteUser: (userId) => {
    return apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
  },

  /**
   * Listar todas as pastas
   */
  getAllFolders: async () => {
    const response = await apiRequest('/admin/folders');
    return response.folders.map(folder => ({
      id: String(folder.id),
      name: folder.name,
      type: 'folder',
      parentId: folder.parent_id ? String(folder.parent_id) : null,
      createdAt: folder.created_at,
      updatedAt: folder.created_at,
      createdBy: String(folder.owner_id),
    }));
  },

  /**
   * Listar permissões
   */
  listPermissions: async (folderId, userId) => {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    if (userId) params.append('userId', userId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiRequest(`/admin/permissions${query}`);
    return response.permissions.map(perm => ({
      id: String(perm.id),
      folderId: String(perm.folder_id),
      userId: String(perm.user_id),
      canRead: perm.can_read === 1,
      canWrite: perm.can_write === 1,
      canDelete: perm.can_delete === 1,
      createdAt: perm.created_at,
    }));
  },

  /**
   * Criar ou atualizar permissão
   */
  createPermission: (userId, folderId, canRead, canWrite, canDelete) => {
    return apiRequest('/admin/permissions', {
      method: 'POST',
      body: JSON.stringify({
        userId: parseInt(userId),
        folderId: parseInt(folderId),
        canRead,
        canWrite,
        canDelete,
      }),
    });
  },

  /**
   * Atualizar permissão
   */
  updatePermission: (userId, folderId, canRead, canWrite, canDelete) => {
    return apiRequest('/admin/permissions', {
      method: 'PUT',
      body: JSON.stringify({
        userId: parseInt(userId),
        folderId: parseInt(folderId),
        canRead,
        canWrite,
        canDelete,
      }),
    });
  },

  /**
   * Remover permissão
   */
  removePermission: (userId, folderId) => {
    return apiRequest('/admin/permissions', {
      method: 'DELETE',
      body: JSON.stringify({
        userId: parseInt(userId),
        folderId: parseInt(folderId),
      }),
    });
  },
};

