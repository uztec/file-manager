const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

const DB_PATH = path.join(__dirname, '../database.sqlite');

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
          return;
        }
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Tabela de usuários
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabela de pastas
        `CREATE TABLE IF NOT EXISTS folders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          path TEXT UNIQUE NOT NULL,
          parent_id INTEGER,
          owner_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        
        // Tabela de arquivos
        `CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          original_name TEXT NOT NULL,
          path TEXT UNIQUE NOT NULL,
          size INTEGER NOT NULL,
          mime_type TEXT,
          folder_id INTEGER,
          owner_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        
        // Tabela de permissões (acesso de usuários a pastas)
        `CREATE TABLE IF NOT EXISTS permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          folder_id INTEGER NOT NULL,
          can_read INTEGER DEFAULT 1,
          can_write INTEGER DEFAULT 0,
          can_delete INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
          UNIQUE(user_id, folder_id)
        )`
      ];

      let completed = 0;
      queries.forEach((query) => {
        this.db.run(query, (err) => {
          if (err) {
            reject(err);
            return;
          }
          completed++;
          if (completed === queries.length) {
            resolve();
          }
        });
      });
    });
  }

  getDb() {
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

const database = new Database();

module.exports = database;

