const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { authenticate } = require('../middleware/auth');
const File = require('../models/File');
const Folder = require('../models/Folder');
const Permission = require('../models/Permission');

// Configuração do Multer para upload
const uploadDir = process.env.UPLOAD_DIR || './uploads';
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let folderPath = uploadDir;
    
    if (req.body.folderId) {
      const folder = await Folder.findById(req.body.folderId);
      if (folder) {
        folderPath = path.join(uploadDir, folder.path);
      }
    }
    
    await fs.ensureDir(folderPath);
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Fazer upload de arquivo
 *     tags: [Arquivos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folderId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Arquivo enviado com sucesso
 */
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const folderId = req.body.folderId ? parseInt(req.body.folderId) : null;
    
    // Verificar permissão se houver pasta
    if (folderId) {
      const hasAccess = await Permission.checkAccess(req.user.id, folderId, 'write');
      if (!hasAccess) {
        // Deletar arquivo enviado
        await fs.remove(req.file.path);
        return res.status(403).json({ error: 'Sem permissão para escrever nesta pasta' });
      }
    }

    const fileData = {
      name: req.file.filename,
      originalName: req.file.originalname,
      path: folderId ? 
        path.relative(uploadDir, req.file.path) : 
        path.basename(req.file.path),
      size: req.file.size,
      mimeType: req.file.mimetype,
      folderId: folderId,
      ownerId: req.user.id
    };

    const file = await File.create(fileData);

    res.json({
      message: 'Arquivo enviado com sucesso',
      file: {
        id: file.id,
        name: file.originalName,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        mime_type: file.mimeType,
        folderId: file.folderId,
        folder_id: file.folderId,
        createdAt: file.created_at,
        created_at: file.created_at
      }
    });
  } catch (error) {
    if (req.file) {
      await fs.remove(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Listar arquivos do usuário
 *     tags: [Arquivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de arquivos
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const folderId = req.query.folderId ? parseInt(req.query.folderId) : null;
    
    if (folderId) {
      const hasAccess = await Permission.checkAccess(req.user.id, folderId, 'read');
      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para acessar esta pasta' });
      }
    }

    const files = await File.getByOwner(req.user.id, folderId);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/files/copy:
 *   post:
 *     summary: Copiar arquivos para outra pasta
 *     tags: [Arquivos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileIds
 *             properties:
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               folderId:
 *                 type: integer
 *                 nullable: true
 *                 description: ID da pasta destino (null para copiar para raiz)
 *     responses:
 *       200:
 *         description: Arquivos copiados com sucesso
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Arquivo não encontrado
 */
router.post('/copy', authenticate, async (req, res) => {
  try {
    const { fileIds, folderId } = req.body;

    console.log('Rota /copy recebeu:', { fileIds, folderId, folderIdType: typeof folderId });
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs de arquivos é obrigatória' });
    }

    // Tratar folderId: pode ser null, undefined, número ou string
    let newFolderId = null;
    if (folderId !== undefined && folderId !== null) {
      newFolderId = typeof folderId === 'number' ? folderId : parseInt(folderId);
      if (isNaN(newFolderId)) {
        return res.status(400).json({ error: 'ID da pasta inválido' });
        }
    }
    
    console.log('newFolderId processado:', newFolderId);

    // Verificar permissão na pasta destino (se houver)
    if (newFolderId !== null) {
      const hasAccess = await Permission.checkAccess(req.user.id, newFolderId, 'write');
      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para copiar arquivos para esta pasta' });
  }
    }

    const copiedFiles = [];
    const errors = [];

    // Copiar cada arquivo
    for (const fileId of fileIds) {
  try {
        const file = await File.findById(fileId);
    
    if (!file) {
          errors.push({ fileId, error: 'Arquivo não encontrado' });
          continue;
    }

        // Verificar permissão no arquivo original
    if (file.owner_id !== req.user.id) {
      if (file.folder_id) {
            const hasAccess = await Permission.checkAccess(req.user.id, file.folder_id, 'read');
        if (!hasAccess) {
              errors.push({ fileId, error: 'Sem permissão para copiar este arquivo' });
              continue;
        }
      } else {
            errors.push({ fileId, error: 'Sem permissão para copiar este arquivo' });
            continue;
      }
    }

        // Copiar arquivo
        const copiedFile = await File.copy(fileId, newFolderId, req.user.id);
        copiedFiles.push({
          id: copiedFile.id,
          name: copiedFile.original_name,
          originalName: copiedFile.original_name,
          size: copiedFile.size,
          mimeType: copiedFile.mime_type,
          folderId: copiedFile.folder_id,
          folder_id: copiedFile.folder_id,
          createdAt: copiedFile.created_at,
          created_at: copiedFile.created_at
        });
      } catch (error) {
        errors.push({ fileId, error: error.message });
      }
    }

    if (copiedFiles.length === 0) {
      return res.status(400).json({ 
        error: 'Nenhum arquivo foi copiado',
        errors 
      });
    }

    res.json({
      message: `${copiedFiles.length} arquivo(s) copiado(s) com sucesso`,
      files: copiedFiles,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/files/folders:
 *   post:
 *     summary: Criar pasta
 *     tags: [Arquivos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Pasta criada com sucesso
 */
router.post('/folders', authenticate, async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da pasta é obrigatório' });
    }

    if (parentId) {
      const hasAccess = await Permission.checkAccess(req.user.id, parentId, 'write');
      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para criar pasta aqui' });
      }
    }

    const folder = await Folder.create({
      name,
      parentId: parentId || null,
      ownerId: req.user.id
    });

    res.status(201).json({
      message: 'Pasta criada com sucesso',
      folder
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/files/folders:
 *   get:
 *     summary: Listar pastas do usuário
 *     tags: [Arquivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pastas
 */
router.get('/folders', authenticate, async (req, res) => {
  try {
    const parentId = req.query.parentId ? parseInt(req.query.parentId) : null;
    
    if (parentId) {
      const hasAccess = await Permission.checkAccess(req.user.id, parentId, 'read');
      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para acessar esta pasta' });
      }
    }

    const folders = await Folder.getByOwner(req.user.id, parentId);
    res.json({ folders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/files/folders/{id}:
 *   delete:
 *     summary: Deletar pasta
 *     tags: [Arquivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pasta deletada
 */
router.delete('/folders/:id', authenticate, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    // Verificar permissão
    if (folder.owner_id !== req.user.id) {
      const hasAccess = await Permission.checkAccess(req.user.id, folder.id, 'delete');
      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para deletar esta pasta' });
      }
    }

    await Folder.delete(req.params.id);
    res.json({ message: 'Pasta deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para mover múltiplos arquivos
router.post('/move', authenticate, async (req, res) => {
  try {
    const { fileIds, folderId } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs de arquivos é obrigatória' });
    }

    let newFolderId = null;
    if (folderId !== undefined && folderId !== null) {
      newFolderId = typeof folderId === 'number' ? folderId : parseInt(folderId);
      if (isNaN(newFolderId)) {
        return res.status(400).json({ error: 'ID da pasta inválido' });
      }
    }

    // Verificar permissão na pasta destino (se houver)
    if (newFolderId !== null) {
      const hasAccess = await Permission.checkAccess(req.user.id, newFolderId, 'write');
      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para mover arquivos para esta pasta' });
      }
    }

    const movedFiles = [];
    const errors = [];

    // Mover cada arquivo
    for (const fileId of fileIds) {
      try {
        const file = await File.findById(fileId);
        
        if (!file) {
          errors.push({ fileId, error: 'Arquivo não encontrado' });
          continue;
        }

        // Verificar permissão no arquivo original
        if (file.owner_id !== req.user.id) {
          if (file.folder_id) {
            const hasAccess = await Permission.checkAccess(req.user.id, file.folder_id, 'read');
            if (!hasAccess) {
              errors.push({ fileId, error: 'Sem permissão para mover este arquivo' });
              continue;
            }
          } else {
            errors.push({ fileId, error: 'Sem permissão para mover este arquivo' });
            continue;
          }
        }

        // Mover arquivo
        const movedFile = await File.move(fileId, newFolderId);
        movedFiles.push({
          id: movedFile.id,
          name: movedFile.original_name,
          originalName: movedFile.original_name,
          size: movedFile.size,
          mimeType: movedFile.mime_type,
          folderId: movedFile.folder_id,
          folder_id: movedFile.folder_id,
          createdAt: movedFile.created_at,
          created_at: movedFile.created_at
        });
      } catch (error) {
        errors.push({ fileId, error: error.message });
      }
    }

    if (movedFiles.length === 0) {
      return res.status(400).json({ 
        error: 'Nenhum arquivo foi movido',
        errors 
      });
    }

    res.json({
      message: `${movedFiles.length} arquivo(s) movido(s) com sucesso`,
      files: movedFiles,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para deletar múltiplos arquivos
router.post('/delete', authenticate, async (req, res) => {
  try {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs de arquivos é obrigatória' });
    }

    const deletedFiles = [];
    const errors = [];

    // Deletar cada arquivo
    for (const fileId of fileIds) {
      try {
        const file = await File.findById(fileId);
        
        if (!file) {
          errors.push({ fileId, error: 'Arquivo não encontrado' });
          continue;
        }

        // Verificar permissão
        if (file.owner_id !== req.user.id) {
          if (file.folder_id) {
            const hasAccess = await Permission.checkAccess(req.user.id, file.folder_id, 'delete');
            if (!hasAccess) {
              errors.push({ fileId, error: 'Sem permissão para deletar este arquivo' });
              continue;
            }
          } else {
            errors.push({ fileId, error: 'Sem permissão para deletar este arquivo' });
            continue;
          }
        }

        // Deletar arquivo
        await File.delete(fileId);
        deletedFiles.push(fileId);
      } catch (error) {
        errors.push({ fileId, error: error.message });
      }
    }

    if (deletedFiles.length === 0) {
      return res.status(400).json({ 
        error: 'Nenhum arquivo foi deletado',
        errors 
      });
    }

    res.json({
      message: `${deletedFiles.length} arquivo(s) deletado(s) com sucesso`,
      deletedIds: deletedFiles,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/files/{id}/move:
 *   put:
 *     summary: Mover arquivo para outra pasta
 *     tags: [Arquivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: integer
 *                 nullable: true
 *                 description: ID da pasta destino (null para mover para raiz)
 *     responses:
 *       200:
 *         description: Arquivo movido com sucesso
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Arquivo não encontrado
 */
router.put('/:id/move', authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Verificar permissão no arquivo atual
    if (file.owner_id !== req.user.id) {
      if (file.folder_id) {
        const hasAccess = await Permission.checkAccess(req.user.id, file.folder_id, 'read');
        if (!hasAccess) {
          return res.status(403).json({ error: 'Sem permissão para acessar este arquivo' });
        }
      } else {
        return res.status(403).json({ error: 'Sem permissão para acessar este arquivo' });
      }
    }

    const newFolderId = req.body.folderId !== undefined ? 
      (req.body.folderId === null ? null : parseInt(req.body.folderId)) : 
      null;

    // Verificar permissão na pasta destino (se houver)
    if (newFolderId !== null) {
      const hasAccess = await Permission.checkAccess(req.user.id, newFolderId, 'write');
      if (!hasAccess) {
        return res.status(403).json({ error: 'Sem permissão para mover arquivo para esta pasta' });
      }
    }

    // Mover arquivo
    const updatedFile = await File.move(req.params.id, newFolderId);

    res.json({
      message: 'Arquivo movido com sucesso',
      file: {
        id: updatedFile.id,
        name: updatedFile.original_name,
        originalName: updatedFile.original_name,
        size: updatedFile.size,
        mimeType: updatedFile.mime_type,
        folderId: updatedFile.folder_id,
        folder_id: updatedFile.folder_id,
        createdAt: updatedFile.created_at,
        created_at: updatedFile.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Download de arquivo
 *     tags: [Arquivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Arquivo
 *       404:
 *         description: Arquivo não encontrado
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Verificar permissão
    if (file.owner_id !== req.user.id) {
      if (file.folder_id) {
        const hasAccess = await Permission.checkAccess(req.user.id, file.folder_id, 'read');
        if (!hasAccess) {
          return res.status(403).json({ error: 'Sem permissão para acessar este arquivo' });
        }
      } else {
        return res.status(403).json({ error: 'Sem permissão para acessar este arquivo' });
      }
    }

    const filePath = path.join(uploadDir, file.path);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no sistema de arquivos' });
    }

    // Se for preview (para miniaturas de imagens)
    if (req.query.preview === 'true') {
      const mimeType = file.mime_type || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
      res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
      return res.sendFile(path.resolve(filePath));
    }

    // Download normal
    res.download(filePath, file.original_name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Deletar arquivo
 *     tags: [Arquivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Arquivo deletado
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Verificar permissão
    if (file.owner_id !== req.user.id) {
      if (file.folder_id) {
        const hasAccess = await Permission.checkAccess(req.user.id, file.folder_id, 'delete');
        if (!hasAccess) {
          return res.status(403).json({ error: 'Sem permissão para deletar este arquivo' });
        }
      } else {
        return res.status(403).json({ error: 'Sem permissão para deletar este arquivo' });
      }
    }

    await File.delete(req.params.id);
    res.json({ message: 'Arquivo deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

