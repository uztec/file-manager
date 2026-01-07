const db = require('../config/database');

class Permission {
  static async create(permissionData) {
    const { userId, folderId, canRead = true, canWrite = false, canDelete = false } = permissionData;
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO permissions (user_id, folder_id, can_read, can_write, can_delete) 
                   VALUES (?, ?, ?, ?, ?)`;
      db.getDb().run(sql, [userId, folderId, canRead, canWrite, canDelete], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, userId, folderId, canRead, canWrite, canDelete });
      });
    });
  }

  static async update(permissionData) {
    const { userId, folderId, canRead, canWrite, canDelete } = permissionData;
    
    return new Promise((resolve, reject) => {
      const sql = `UPDATE permissions 
                   SET can_read = ?, can_write = ?, can_delete = ? 
                   WHERE user_id = ? AND folder_id = ?`;
      db.getDb().run(sql, [canRead, canWrite, canDelete, userId, folderId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ changes: this.changes });
      });
    });
  }

  static async findByUserAndFolder(userId, folderId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM permissions WHERE user_id = ? AND folder_id = ?';
      db.getDb().get(sql, [userId, folderId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async getByUser(userId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM permissions WHERE user_id = ?';
      db.getDb().all(sql, [userId], (err, rows) => {
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
      const sql = 'SELECT * FROM permissions WHERE folder_id = ?';
      db.getDb().all(sql, [folderId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  static async delete(userId, folderId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM permissions WHERE user_id = ? AND folder_id = ?';
      db.getDb().run(sql, [userId, folderId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ changes: this.changes });
      });
    });
  }

  static async checkAccess(userId, folderId, action) {
    // Admin sempre tem acesso
    const User = require('./User');
    const user = await User.findById(userId);
    if (user && user.role === 'admin') {
      return true;
    }

    // Verificar se é o dono da pasta
    const Folder = require('./Folder');
    const folder = await Folder.findById(folderId);
    if (folder && folder.owner_id === userId) {
      return true;
    }

    // Verificar permissões
    const permission = await this.findByUserAndFolder(userId, folderId);
    if (!permission) {
      return false;
    }

    switch (action) {
      case 'read':
        return permission.can_read === 1;
      case 'write':
        return permission.can_write === 1;
      case 'delete':
        return permission.can_delete === 1;
      default:
        return false;
    }
  }
}

module.exports = Permission;

