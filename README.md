# File Manager

Sistema completo de gerenciamento de arquivos com controle de acesso, desenvolvido com Vue.js e Express.js.

## 📋 Descrição

Sistema de gerenciamento de arquivos que permite:
- ✅ Upload e download de arquivos
- ✅ Organização em pastas hierárquicas
- ✅ Controle de acesso por usuário e pasta
- ✅ Drag and drop para mover arquivos
- ✅ Copy/paste de múltiplos arquivos
- ✅ Seleção múltipla de arquivos
- ✅ Interface moderna e responsiva
- ✅ Área administrativa para gerenciamento de usuários e permissões

## 🚀 Tecnologias

### Frontend
- **Vue.js 3** - Framework JavaScript reativo
- **Vue Router** - Roteamento
- **Pinia** - Gerenciamento de estado
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide Vue Next** - Ícones
- **Date-fns** - Manipulação de datas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite3** - Banco de dados
- **JWT** - Autenticação
- **Multer** - Upload de arquivos
- **Bcryptjs** - Hash de senhas
- **Swagger** - Documentação da API

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone <URL_DO_REPOSITORIO>
cd file-manager
```

2. **Instale as dependências do backend**
```bash
npm install
```

3. **Instale as dependências do frontend**
```bash
cd client
npm install
cd ..
```

4. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
PORT=3000
JWT_SECRET=seu_jwt_secret_aqui
UPLOAD_DIR=./uploads
```

5. **Inicialize o banco de dados**
O banco de dados SQLite será criado automaticamente na primeira execução.

## 🏃 Executando o Projeto

### Modo Desenvolvimento

Execute o servidor backend e frontend simultaneamente:
```bash
npm run dev
```

Isso iniciará:
- **Backend** na porta `3000`
- **Frontend** na porta `8080`
- **Documentação Swagger** em `http://localhost:3000/api-docs`

### Modo Produção

1. **Build do frontend**
```bash
npm run build
```

2. **Inicie o servidor**
```bash
npm start
```

O servidor Express servirá tanto a API quanto os arquivos estáticos do frontend.

Ou em um único comando:
```bash
npm run build:start
```

## 📁 Estrutura do Projeto

```
file-manager/
├── client/                 # Frontend Vue.js
│   ├── public/            # Arquivos estáticos (icon.png, etc)
│   ├── src/
│   │   ├── components/     # Componentes Vue
│   │   │   └── dashboard/ # Componentes do dashboard
│   │   ├── composables/  # Composables (hooks Vue)
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── router/        # Configuração de rotas
│   │   ├── services/      # Serviços de API
│   │   ├── stores/        # Stores Pinia
│   │   ├── lib/           # Utilitários
│   │   └── main.js        # Entry point
│   ├── vite.config.js     # Configuração Vite
│   └── package.json
├── routes/                # Rotas Express
│   ├── auth.js            # Rotas de autenticação
│   ├── files.js           # Rotas de arquivos
│   └── admin.js           # Rotas administrativas
├── models/                # Modelos de dados
│   ├── User.js            # Modelo de usuário
│   ├── File.js            # Modelo de arquivo
│   ├── Folder.js          # Modelo de pasta
│   └── Permission.js      # Modelo de permissão
├── middleware/            # Middlewares Express
│   └── auth.js            # Middleware de autenticação
├── config/                # Configurações
│   └── database.js        # Configuração do banco de dados
├── uploads/               # Arquivos enviados (gerado automaticamente)
├── server.js              # Servidor Express
└── package.json
```

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação:
- **Login**: `POST /api/auth/login`
- **Registro**: `POST /api/auth/register`
- **Verificar usuário**: `GET /api/auth/me`

## 📚 API

A documentação completa da API está disponível em:
- **Swagger UI**: `http://localhost:3000/api-docs`

### Principais Endpoints

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário atual

#### Arquivos
- `GET /api/files` - Listar arquivos
- `GET /api/files/folders` - Listar pastas
- `POST /api/files/upload` - Upload de arquivo
- `GET /api/files/:id` - Download de arquivo
- `PUT /api/files/:id/move` - Mover arquivo
- `POST /api/files/copy` - Copiar arquivos
- `DELETE /api/files/:id` - Deletar arquivo

#### Pastas
- `POST /api/files/folders` - Criar pasta
- `DELETE /api/files/folders/:id` - Deletar pasta

#### Admin
- `GET /api/admin/users` - Listar usuários
- `PUT /api/admin/users/:id/role` - Atualizar role
- `DELETE /api/admin/users/:id` - Deletar usuário
- `GET /api/admin/folders` - Listar todas as pastas
- `GET /api/admin/permissions` - Listar permissões
- `POST /api/admin/permissions` - Criar permissão
- `PUT /api/admin/permissions` - Atualizar permissão
- `DELETE /api/admin/permissions` - Remover permissão

## 🎯 Funcionalidades

### Usuário
- ✅ Autenticação (login/registro)
- ✅ Upload de arquivos
- ✅ Download de arquivos
- ✅ Criar e gerenciar pastas
- ✅ Mover arquivos (drag and drop)
- ✅ Copiar e colar arquivos
- ✅ Seleção múltipla de arquivos
- ✅ Navegação por breadcrumb
- ✅ Menu de contexto (botão direito)

### Administrador
- ✅ Gerenciar usuários
- ✅ Alterar roles de usuários
- ✅ Visualizar todas as pastas
- ✅ Gerenciar permissões de acesso

## 🛠️ Scripts Disponíveis

### Raiz do Projeto
- `npm start` - Inicia o servidor em produção
- `npm run dev` - Inicia backend e frontend em desenvolvimento
- `npm run dev:server` - Apenas o servidor backend
- `npm run dev:client` - Apenas o frontend
- `npm run build` - Build do frontend para produção
- `npm run build:start` - Build e inicia em produção

### Cliente (client/)
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview da build

## 🔧 Configuração do Frontend

O arquivo `client/vite.config.js` contém a configuração do Vite, incluindo:
- Proxy para API em desenvolvimento (`/api` → `http://localhost:3000`)
- Aliases de caminho (`@` para `src/`)
- Configuração de build

**Nota**: Em desenvolvimento, o proxy redireciona `/api` para `http://localhost:3000`. Em produção, o Express serve tanto a API quanto os arquivos estáticos.

## 📝 Sistema de Permissões

O sistema permite que administradores controlem o acesso de usuários a pastas específicas:

- **Ler (canRead)**: Permite visualizar e baixar arquivos da pasta
- **Escrever (canWrite)**: Permite fazer upload de arquivos na pasta
- **Deletar (canDelete)**: Permite deletar arquivos e pastas

Os proprietários das pastas sempre têm acesso total. Administradores têm acesso a tudo.

## 🔒 Segurança

- ✅ Senhas são hasheadas com bcrypt
- ✅ Autenticação via JWT
- ✅ Validação de entrada com express-validator
- ✅ Controle de acesso baseado em roles e permissões
- ✅ Proteção contra upload de arquivos maliciosos

## 🐛 Troubleshooting

### Erro de conexão com banco de dados
Certifique-se de que o SQLite está instalado e que o diretório tem permissões de escrita.

### Erro de upload
Verifique se o diretório `uploads/` existe e tem permissões de escrita.

### Erro de autenticação
Verifique se o `JWT_SECRET` está configurado no arquivo `.env`.

### Erro de proxy no desenvolvimento
Certifique-se de que o backend está rodando na porta 3000 antes de iniciar o frontend.

## 📞 Acesso

- **Aplicação Web**: `http://localhost:8080` (desenvolvimento) ou `http://localhost:3000` (produção)
- **API Swagger**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

## 🔧 Desenvolvimento

### Adicionar novas funcionalidades

1. **Backend**: Adicione rotas em `routes/` e modelos em `models/`
2. **Frontend**: Crie componentes em `client/src/components/` e páginas em `client/src/pages/`
3. **API**: Atualize os serviços em `client/src/services/api.js`

### Estrutura de Dados

- **Users**: Usuários do sistema
- **Files**: Arquivos enviados
- **Folders**: Pastas de organização
- **Permissions**: Permissões de acesso às pastas

## 📄 Licença

ISC

## 👥 Autor

Desenvolvido para gerenciamento de arquivos com controle de acesso.
