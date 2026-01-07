require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3000;

// Importar rotas
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const adminRoutes = require('./routes/admin');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Criar diretório de uploads se não existir
const uploadDir = process.env.UPLOAD_DIR || './uploads';
fs.ensureDirSync(uploadDir);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'File Manager API',
      version: '1.0.0',
      description: 'API REST para gerenciamento de arquivos com controle de acesso',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'File Manager API está funcionando' });
});

// Servir arquivos estáticos do front-end
const distPath = path.join(__dirname, 'client', 'dist');
const indexPath = path.join(distPath, 'index.html');

// Verificar se o build existe (produção)
if (fs.existsSync(distPath)) {
  // Servir arquivos estáticos (JS, CSS, imagens, etc.)
  app.use(express.static(distPath));
  
  // Todas as rotas não-API servem o index.html (SPA routing)
  app.get('*', (req, res) => {
    // Não servir index.html para rotas da API
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(indexPath);
  });
} else {
  // Em desenvolvimento, apenas servir uma mensagem se o build não existir
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.send(`
      <html>
        <head><title>File Manager</title></head>
        <body>
          <h1>File Manager - Backend</h1>
          <p>Front-end não está buildado. Execute 'npm run build' ou use 'npm run dev' para desenvolvimento.</p>
          <p>API está disponível em: <a href="/api-docs">/api-docs</a></p>
        </body>
      </html>
    `);
  });
}

// Inicializar banco de dados
const db = require('./config/database');
db.init().then(() => {
  console.log('Banco de dados inicializado');
  
  // Criar usuário admin padrão se não existir
  const User = require('./models/User');
  User.createAdminIfNotExists();
  
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Documentação Swagger: http://localhost:${PORT}/api-docs`);
  });
}).catch(err => {
  console.error('Erro ao inicializar banco de dados:', err);
  process.exit(1);
});

module.exports = app;

