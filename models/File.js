const db = require('../config/database');
const path = require('path');
const fs = require('fs-extra');

class File {
  static async create(fileData) {
    const { name, originalName, path: filePath, size, mimeType, folderId = null, ownerId } = fileData;
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO files (name, original_name, path, size, mime_type, folder_id, owner_id) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.getDb().run(sql, [name, originalName, filePath, size, mimeType, folderId, ownerId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, name, originalName, path: filePath, size, mimeType, folderId, ownerId });
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM files WHERE id = ?';
      db.getDb().get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async getByOwner(ownerId, folderId = null) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM files WHERE owner_id = ?';
      const params = [ownerId];
      
      if (folderId === null) {
        sql += ' AND folder_id IS NULL';
      } else {
        sql += ' AND folder_id = ?';
        params.push(folderId);
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

  static async getByFolder(folderId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM files WHERE folder_id = ?';
      db.getDb().all(sql, [folderId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  static async update(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      Object.keys(updates).forEach(key => {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      });
      
      if (fields.length === 0) {
        resolve({ id });
        return;
      }
      
      values.push(id);
      const sql = `UPDATE files SET ${fields.join(', ')} WHERE id = ?`;
      
      db.getDb().run(sql, values, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id, changes: this.changes });
      });
    });
  }

  static async move(id, newFolderId) {
    const file = await this.findById(id);
    if (!file) {
      throw new Error('Arquivo não encontrado');
    }

    // Se o arquivo já está na mesma pasta, não faz nada
    const currentFolderId = file.folder_id;
    if (currentFolderId === newFolderId || 
        (currentFolderId === null && newFolderId === null)) {
      return file;
    }

    // Atualizar folder_id no banco
    await this.update(id, { folder_id: newFolderId });
    
    // Retornar arquivo atualizado
    return await this.findById(id);
  }

  static async copy(id, newFolderId, ownerId) {
    const file = await this.findById(id);
    if (!file) {
      throw new Error('Arquivo não encontrado');
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const originalPath = path.join(uploadDir, file.path);
    
    // Verificar se o arquivo físico existe
    if (!await fs.pathExists(originalPath)) {
      throw new Error('Arquivo físico não encontrado');
    }

    // Gerar novo nome de arquivo único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.original_name);
    const baseName = path.basename(file.original_name, ext);
    const newFileName = `${uniqueSuffix}${ext}`;
    
    // Determinar o caminho de destino
    let destDir = uploadDir;
    let newPath = newFileName;
    
    if (newFolderId !== null) {
      const Folder = require('./Folder');
      const folder = await Folder.findById(newFolderId);
      if (folder) {
        destDir = path.join(uploadDir, folder.path);
        newPath = path.join(folder.path, newFileName);
      }
    }
    
    // Garantir que o diretório existe
    await fs.ensureDir(destDir);
    
    // Copiar arquivo físico
    const destPath = path.join(destDir, newFileName);
    await fs.copy(originalPath, destPath);
    
    // Criar novo registro no banco
    const newFile = await this.create({
      name: newFileName,
      originalName: file.original_name,
      path: newPath,
      size: file.size,
      mimeType: file.mime_type,
      folderId: newFolderId,
      ownerId: ownerId
    });
    
    return await this.findById(newFile.id);
  }

  static async delete(id) {
    const file = await this.findById(id);
    if (!file) {
      throw new Error('Arquivo não encontrado');
    }

    // Deletar arquivo físico
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const fullPath = path.join(uploadDir, file.path);
    await fs.remove(fullPath);

    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM files WHERE id = ?';
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

module.exports = File;

