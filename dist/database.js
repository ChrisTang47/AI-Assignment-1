"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.updateLocalPath = exports.getImageById = exports.getAllImages = exports.insertImage = exports.database = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
// 创建数据库实例
const db = new better_sqlite3_1.default('building_images.db');
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
exports.database = db;
// 预准备的语句用于常见操作
exports.insertImage = db.prepare(`
  INSERT INTO images (src, alt, localPath) 
  VALUES (?, ?, ?)
`);
exports.getAllImages = db.prepare(`
  SELECT * FROM images
`);
exports.getImageById = db.prepare(`
  SELECT * FROM images WHERE id = ?
`);
exports.updateLocalPath = db.prepare(`
  UPDATE images SET localPath = ? WHERE id = ?
`);
exports.deleteImage = db.prepare(`
  DELETE FROM images WHERE id = ?
`);
