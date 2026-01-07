# Integração Front-end com Backend API

Este documento descreve como o front-end React está conectado com a API do backend.

## Configuração

### Variável de Ambiente

Configure a URL da API no arquivo `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

O padrão é `http://localhost:3000/api` se a variável não for definida.

## Estrutura da Integração

### 1. Serviço de API (`src/services/api.ts`)

O arquivo `api.ts` contém todas as chamadas para a API, organizadas em três módulos:

- **authApi**: Autenticação (login, registro, obter usuário atual)
- **filesApi**: Gerenciamento de arquivos e pastas
- **adminApi**: Funcionalidades administrativas

### 2. Autenticação

- **Login**: Usa `username` e `password` (não email)
- **Registro**: Requer `username`, `email` e `password`
- **Token**: Armazenado em `localStorage` como `auth_token`
- **Headers**: Token enviado como `Authorization: Bearer <token>`

### 3. Endpoints Utilizados

#### Autenticação
- `POST /api/auth/login` - Login com username/password
- `POST /api/auth/register` - Registro de novo usuário
- `GET /api/auth/me` - Obter usuário atual

#### Arquivos
- `GET /api/files?folderId=<id>` - Listar arquivos
- `GET /api/files/folders?parentId=<id>` - Listar pastas
- `POST /api/files/upload` - Upload de arquivo (multipart/form-data)
- `GET /api/files/:id` - Download de arquivo
- `DELETE /api/files/:id` - Deletar arquivo
- `POST /api/files/folders` - Criar pasta
- `DELETE /api/files/folders/:id` - Deletar pasta

#### Admin
- `GET /api/admin/users` - Listar usuários
- `GET /api/admin/users/:id` - Obter usuário
- `PUT /api/admin/users/:id/role` - Atualizar role
- `DELETE /api/admin/users/:id` - Deletar usuário
- `GET /api/admin/folders` - Listar todas as pastas
- `GET /api/admin/permissions` - Listar permissões
- `POST /api/admin/permissions` - Criar permissão
- `PUT /api/admin/permissions` - Atualizar permissão
- `DELETE /api/admin/permissions` - Remover permissão

## Diferenças entre Front-end e Backend

### Tipos de Dados

- **IDs**: Backend retorna números, front-end converte para strings
- **Datas**: Backend retorna `created_at`, front-end mapeia para `createdAt`
- **Usuário**: Backend retorna `username`, front-end mapeia para `name` no tipo `User`

### Respostas da API

- **Arquivos**: Backend retorna `{ files: [...] }`
- **Pastas**: Backend retorna `{ folders: [...] }`
- **Usuários**: Backend retorna `{ users: [...] }` ou `{ user: {...} }`
- **Autenticação**: Backend retorna `{ token, user }` ou `{ user }` no `/me`

## Funcionalidades Não Implementadas

As seguintes funcionalidades não estão disponíveis na API e foram removidas do front-end:

- ❌ Renomear arquivos/pastas
- ❌ Endpoint de logout (logout é apenas local)
- ❌ Endpoint de breadcrumb (construído manualmente no front-end)

## Hooks e Contextos

### `useAuth` (AuthContext)
- Gerencia autenticação do usuário
- Fornece métodos: `login`, `register`, `logout`
- Propriedades: `user`, `isAuthenticated`, `isAdmin`, `isLoading`

### `useFiles`
- Gerencia arquivos e pastas
- Métodos: `createFolder`, `uploadFile`, `downloadFile`, `deleteFile`, `deleteFolder`
- Propriedades: `files`, `folders`, `regularFiles`, `currentFolderId`, `breadcrumb`

## Tratamento de Erros

Todos os erros da API são capturados e exibidos via toast notifications usando o hook `useToast`.

Erros comuns:
- `401`: Token inválido ou expirado → redireciona para login
- `403`: Sem permissão → exibe mensagem de erro
- `404`: Recurso não encontrado → exibe mensagem de erro
- `500`: Erro do servidor → exibe mensagem de erro

## Testando a Integração

1. Inicie o backend:
```bash
cd ..
npm start
```

2. Inicie o front-end:
```bash
cd front-end
npm run dev
```

3. Acesse `http://localhost:8080` (ou a porta configurada no Vite)

4. Faça login com:
   - Username: `admin`
   - Password: `admin123`

## Troubleshooting

### CORS Errors
Se houver erros de CORS, verifique se o backend está configurado para aceitar requisições do front-end. O backend já tem CORS habilitado.

### Token não funciona
- Verifique se o token está sendo salvo em `localStorage`
- Verifique se o token está sendo enviado no header `Authorization`
- Verifique se o `JWT_SECRET` no backend está correto

### Upload não funciona
- Verifique se o tamanho do arquivo não excede 100MB
- Verifique se o `UPLOAD_DIR` está configurado no backend
- Verifique se há permissões de escrita no diretório de uploads

