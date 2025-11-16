const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = 'building_images.db';

if (!fs.existsSync(dbPath)) {
  console.log('❌ 找不到資料庫檔案');
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

try {
  // 先檢查資料庫結構
  const tableInfo = db.prepare('PRAGMA table_info(images)').all();
  console.log('🔍 資料庫結構:');
  tableInfo.forEach(col => {
    console.log(`   ${col.name}: ${col.type}`);
  });
  
  // 檢查總圖片數量
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM images').get();
  console.log(`\n📊 資料庫中總圖片數: ${totalCount.count} 張`);
  
  // 檢查有 alt 文字的圖片
  const withAltCount = db.prepare("SELECT COUNT(*) as count FROM images WHERE alt IS NOT NULL AND alt != ''").get();
  console.log(`📝 有替代文字的圖片: ${withAltCount.count} 張`);
  
  // 分析 alt 文字中包含建築相關關鍵字的圖片
  const buildingKeywords = ['building', 'architecture', 'facade', 'exterior', 'structure', '建築', '大樓'];
  let buildingRelatedCount = 0;
  
  const allImages = db.prepare('SELECT id, alt FROM images WHERE alt IS NOT NULL').all();
  allImages.forEach(img => {
    const altLower = (img.alt || '').toLowerCase();
    const isBuilding = buildingKeywords.some(keyword => altLower.includes(keyword.toLowerCase()));
    if (isBuilding) buildingRelatedCount++;
  });
  
  console.log(`🏛️ Alt 文字包含建築關鍵字: ${buildingRelatedCount} 張`);
  console.log(`📈 建築相關比例: ${((buildingRelatedCount / totalCount.count) * 100).toFixed(1)}%`);
  
  // 檢查有多少圖片有 localPath (已下載處理)
  const processed = db.prepare('SELECT COUNT(*) as count FROM images WHERE localPath IS NOT NULL').get();
  console.log(`🔄 已處理的圖片: ${processed.count} 張`);
  
  // 檢查處理後的圖片文件是否存在
  const processedDir = path.join('building_dataset', 'processed');
  if (fs.existsSync(processedDir)) {
    let totalProcessedFiles = 0;
    const styles = ['modern', 'classical', 'gothic', 'baroque', 'renaissance', 'contemporary', 'minimalist', 'art-deco'];
    
    // 準備表格數據
    const tableData = [];
    
    styles.forEach(style => {
      const styleDir = path.join(processedDir, style);
      if (fs.existsSync(styleDir)) {
        const files = fs.readdirSync(styleDir).filter(f => f.endsWith('.jpg'));
        tableData.push({
          category: style,
          number_of_images: files.length
        });
        totalProcessedFiles += files.length;
      } else {
        tableData.push({
          category: style,
          number_of_images: 0
        });
      }
    });
    
    console.log('\n📁 各建築風格圖片數量統計表:');
    console.table(tableData);
    
    console.log(`\n📦 總處理檔案數: ${totalProcessedFiles}`);
  }
  
  // 檢查最近收集的一些圖片範例
  const recentImages = db.prepare(`SELECT src, alt FROM images ORDER BY id DESC LIMIT 10`).all();
  
  console.log('\n🔍 最近收集的圖片範例：');
  recentImages.slice(0, 5).forEach((img, i) => {
    const altText = (img.alt || '').substring(0, 60);
    const isBuilding = buildingKeywords.some(keyword => 
      (img.alt || '').toLowerCase().includes(keyword.toLowerCase())
    );
    const status = isBuilding ? '✅' : '❓';
    
    console.log(`${i + 1}. ${status} ${altText}...`);
    console.log(`   來源: ${img.src.substring(0, 80)}...`);
    console.log();
  });
  
} catch (error) {
  console.error('❌ 檢查資料庫時發生錯誤:', error);
} finally {
  db.close();
}