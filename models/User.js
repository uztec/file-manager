const bcrypt = require('bcryptjs');
const db = require('../config/database');

class User {
  static async create(userData) {
    const { username, email, password, role = 'user' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO users (username, email, password, role) 
                   VALUES (?, ?, ?, ?)`;
      db.getDb().run(sql, [username, email, hashedPassword, role], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, username, email, role });
      });
    });
  }

  static async findByUsername(username) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE username = ?';
      db.getDb().get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.getDb().get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, username, email, role, created_at FROM users WHERE id = ?';
      db.getDb().get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, username, email, role, created_at FROM users';
      db.getDb().all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  static async updateRole(userId, role) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET role = ? WHERE id = ?';
      db.getDb().run(sql, [role, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ changes: this.changes });
      });
    });
  }

  static async delete(userId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM users WHERE id = ?';
      db.getDb().run(sql, [userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ changes: this.changes });
      });
    });
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async createAdminIfNotExists() {
    const admin = await this.findByUsername('admin');
    if (!admin) {
      await this.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Usuário admin criado: username=admin, password=admin123');
    }
  }
}

module.exports = User;

