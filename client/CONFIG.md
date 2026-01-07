# Configuração da Aplicação

## Configuração da API

A URL da API é configurada através do arquivo `src/config/index.js` e pode ser customizada usando variáveis de ambiente.

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório `client/` para configurar a URL da API:

```env
# URL base da API
# Em desenvolvimento, o Vite usa proxy automático para /api
# Em produção, você pode configurar a URL completa da API aqui

# Exemplos:
# - Desenvolvimento local: VITE_API_URL=http://localhost:3000/api
# - Produção (mesmo servidor): VITE_API_URL=/api
# - Produção (servidor diferente): VITE_API_URL=https://api.exemplo.com/api

VITE_API_URL=/api
```

### Uso no Código

A configuração da API está centralizada em `src/config/index.js`:

```javascript
import { apiConfig } from '@/config';

// Usar a URL base da API
const url = `${apiConfig.baseURL}/endpoint`;
```

### Configurações Disponíveis

- **apiConfig.baseURL**: URL base da API (padrão: `/api`)
- **apiConfig.timeout**: Timeout para requisições em milissegundos (padrão: 30000)
- **appConfig.name**: Nome da aplicação
- **appConfig.version**: Versão da aplicação
- **uploadConfig.maxFileSize**: Tamanho máximo de arquivo em bytes (padrão: 100MB)

### Exemplos de Configuração

#### Desenvolvimento Local
```env
VITE_API_URL=http://localhost:3000/api
```

#### Produção (mesmo servidor)
```env
VITE_API_URL=/api
```

#### Produção (servidor diferente)
```env
VITE_API_URL=https://api.exemplo.com/api
```

### Notas

- As variáveis de ambiente no Vite devem começar com `VITE_` para serem expostas ao código do cliente
- Em desenvolvimento, o Vite já configura um proxy para `/api` no `vite.config.js`
- Em produção, se a API estiver no mesmo servidor, use caminho relativo `/api`
- Se a API estiver em outro servidor, configure a URL completa e certifique-se de configurar CORS no backend

