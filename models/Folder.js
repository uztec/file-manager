const db = require('../config/database');
const path = require('path');
const fs = require('fs-extra');

class Folder {
  static async create(folderData) {
    const { name, parentId = null, ownerId } = folderData;
    
    // Validar nome
    if (!name || !name.trim()) {
      throw new Error('Nome da pasta é obrigatório');
    }
    
    const trimmedName = name.trim();
    
    // Verificar se já existe pasta com mesmo nome no mesmo nível
    const existingFolders = await this.getByOwner(ownerId, parentId);
    const nameExists = existingFolders.some(f => f.name.toLowerCase() === trimmedName.toLowerCase());
    if (nameExists) {
      throw new Error('Já existe uma pasta com este nome neste local');
    }
    
    // Construir caminho da pasta
    let folderPath = trimmedName;
    if (parentId) {
      const parent = await this.findById(parentId);
      if (!parent) {
        throw new Error('Pasta pai não encontrada');
      }
      folderPath = path.join(parent.path, trimmedName);
    }
    
    // Verificar se o caminho já existe
    const existingPath = await this.findByPath(folderPath);
    if (existingPath) {
      throw new Error('Já existe uma pasta com este caminho');
    }
    
    // Criar pasta física no sistema de arquivos
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const fullPath = path.join(uploadDir, folderPath);
    
    try {
      await fs.ensureDir(fullPath);
    } catch (err) {
      throw new Error(`Erro ao criar pasta no sistema de arquivos: ${err.message}`);
    }
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO folders (name, path, parent_id, owner_id) 
                   VALUES (?, ?, ?, ?)`;
      db.getDb().run(sql, [trimmedName, folderPath, parentId, ownerId], function(err) {
        if (err) {
          // Se erro de constraint único, limpar pasta física criada
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            fs.remove(fullPath).catch(() => {});
            reject(new Error('Já existe uma pasta com este nome neste local'));
          } else {
            // Limpar pasta física em caso de erro
            fs.remove(fullPath).catch(() => {});
            reject(err);
          }
          return;
        }
        resolve({ id: this.lastID, name: trimmedName, path: folderPath, parentId, ownerId });
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM folders WHERE id = ?';
      db.getDb().get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async findByPath(folderPath) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM folders WHERE path = ?';
      db.getDb().get(sql, [folderPath], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async getByOwner(ownerId, parentId = null) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM folders WHERE owner_id = ?';
      const params = [ownerId];
      
      if (parentId === null) {
        sql += ' AND parent_id IS NULL';
      } else {
        sql += ' AND parent_id = ?';
        params.push(parentId);
      }
      
      db.getDb().all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM folders';
      db.getDb().all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  static async delete(id) {
    const folder = await this.findById(id);
    if (!folder) {
      throw new Error('Pasta não encontrada');
    }

    // Deletar pasta física
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const fullPath = path.join(uploadDir, folder.path);
    await fs.remove(fullPath);

    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM folders WHERE id = ?';
      db.getDb().run(sql, [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Folder;

