import Database from 'better-sqlite3';

// 创建数据库实例
const db = new Database('building_images.db');

// 创建表：存储图像ID、src、alt、本地存储路径
const createTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    src TEXT NOT NULL,
    alt TEXT,
    localPath TEXT
  )
`);
createTable.run();

// 导出数据库实例和预准备的语句
export const database = db;

// 预准备的语句用于常见操作
export const insertImage = db.prepare(`
  INSERT INTO images (src, alt, localPath) 
  VALUES (?, ?, ?)
`);

export const getAllImages = db.prepare(`
  SELECT * FROM images
`);

export const getImageById = db.prepare(`
  SELECT * FROM images WHERE id = ?
`);

export const updateLocalPath = db.prepare(`
  UPDATE images SET localPath = ? WHERE id = ?
`);

export const deleteImage = db.prepare(`
  DELETE FROM images WHERE id = ?
`);