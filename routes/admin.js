const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Folder = require('../models/Folder');
const Permission = require('../models/Permission');
const { body, validationResult } = require('express-validator');

// Todas as rotas de admin requerem autenticação e ser admin
router.use(authenticate);
router.use(isAdmin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Listar todos os usuários
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Obter usuário por ID
 *     tags: [Admin]
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
 *         description: Dados do usuário
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Atualizar role do usuário
 *     tags: [Admin]
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
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: Role atualizada
 */
router.put('/users/:id/role', [
  body('role').isIn(['user', 'admin']).withMessage('Role deve ser user ou admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const result = await User.updateRole(req.params.id, role);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Role atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Deletar usuário
 *     tags: [Admin]
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
 *         description: Usuário deletado
 */
router.delete('/users/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }

    const result = await User.delete(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/folders:
 *   get:
 *     summary: Listar todas as pastas
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pastas
 */
router.get('/folders', async (req, res) => {
  try {
    const folders = await Folder.getAll();
    res.json({ folders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/permissions:
 *   get:
 *     summary: Listar todas as permissões
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de permissões
 */
router.get('/permissions', async (req, res) => {
  try {
    let permissions;
    
    if (req.query.folderId) {
      permissions = await Permission.getByFolder(parseInt(req.query.folderId));
    } else if (req.query.userId) {
      permissions = await Permission.getByUser(parseInt(req.query.userId));
    } else {
      // Retornar todas as permissões (seria necessário criar método getAll)
      permissions = [];
    }

    res.json({ permissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/permissions:
 *   post:
 *     summary: Criar permissão de acesso
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - folderId
 *             properties:
 *               userId:
 *                 type: integer
 *               folderId:
 *                 type: integer
 *               canRead:
 *                 type: boolean
 *               canWrite:
 *                 type: boolean
 *               canDelete:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Permissão criada
 */
router.post('/permissions', [
  body('userId').isInt().withMessage('userId deve ser um número'),
  body('folderId').isInt().withMessage('folderId deve ser um número'),
  body('canRead').optional().isBoolean(),
  body('canWrite').optional().isBoolean(),
  body('canDelete').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, folderId, canRead = true, canWrite = false, canDelete = false } = req.body;

    // Verificar se usuário e pasta existem
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    // Verificar se permissão já existe
    const existing = await Permission.findByUserAndFolder(userId, folderId);
    if (existing) {
      // Atualizar permissão existente
      await Permission.update({ userId, folderId, canRead, canWrite, canDelete });
      return res.json({ message: 'Permissão atualizada com sucesso' });
    }

    const permission = await Permission.create({ userId, folderId, canRead, canWrite, canDelete });
    res.status(201).json({
      message: 'Permissão criada com sucesso',
      permission
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/permissions:
 *   put:
 *     summary: Atualizar permissão de acesso
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - folderId
 *             properties:
 *               userId:
 *                 type: integer
 *               folderId:
 *                 type: integer
 *               canRead:
 *                 type: boolean
 *               canWrite:
 *                 type: boolean
 *               canDelete:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Permissão atualizada
 */
router.put('/permissions', [
  body('userId').isInt().withMessage('userId deve ser um número'),
  body('folderId').isInt().withMessage('folderId deve ser um número'),
  body('canRead').optional().isBoolean(),
  body('canWrite').optional().isBoolean(),
  body('canDelete').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, folderId, canRead, canWrite, canDelete } = req.body;

    const existing = await Permission.findByUserAndFolder(userId, folderId);
    if (!existing) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    await Permission.update({ userId, folderId, canRead, canWrite, canDelete });
    res.json({ message: 'Permissão atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/permissions:
 *   delete:
 *     summary: Remover permissão de acesso
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - folderId
 *             properties:
 *               userId:
 *                 type: integer
 *               folderId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Permissão removida
 */
router.delete('/permissions', [
  body('userId').isInt().withMessage('userId deve ser um número'),
  body('folderId').isInt().withMessage('folderId deve ser um número')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, folderId } = req.body;

    const result = await Permission.delete(userId, folderId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    res.json({ message: 'Permissão removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

