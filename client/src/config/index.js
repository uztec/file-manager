/**
 * Configuração da aplicação
 * 
 * Este arquivo centraliza todas as configurações da aplicação,
 * incluindo URLs da API, endpoints, etc.
 */

/**
 * Configuração da API
 */
export const apiConfig = {
  // URL base da API
  // Em desenvolvimento: usa proxy do Vite ou variável de ambiente
  // Em produção: usa caminho relativo ou URL completa via variável de ambiente
  baseURL: import.meta.env.VITE_API_URL || '/api',
  
  // Timeout para requisições (em milissegundos)
  timeout: 30000,
  
  // Configurações de retry
  retry: {
    enabled: false,
    maxRetries: 3,
    retryDelay: 1000,
  },
};

/**
 * Configuração da aplicação
 */
export const appConfig = {
  // Nome da aplicação
  name: 'File Manager',
  
  // Versão
  version: '1.0.0',
  
  // Modo de desenvolvimento
  isDevelopment: import.meta.env.DEV,
  
  // Modo de produção
  isProduction: import.meta.env.PROD,
};

/**
 * Configurações de upload
 */
export const uploadConfig = {
  // Tamanho máximo do arquivo (em bytes)
  maxFileSize: 100 * 1024 * 1024, // 100MB
  
  // Tipos de arquivo permitidos (opcional)
  allowedTypes: null, // null = todos os tipos permitidos
};

/**
 * Exportar configuração completa
 */
export default {
  api: apiConfig,
  app: appConfig,
  upload: uploadConfig,
};

