import { ImageCollector } from './collect';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 測試圖片處理功能
 */
async function testImageProcessing() {
  console.log('🧪 開始測試圖片處理功能...\n');
  
  const collector = new ImageCollector('./test_output');
  await collector.createDirectories();
  
  // 創建一個測試用的大圖片
  const testImagePath = './test_large_image.jpg';
  
  try {
    // 生成一個大於500x500的測試圖片
    console.log('📸 創建測試圖片...');
    await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .jpeg({ quality: 95 })
    .toFile(testImagePath);
    
    // 檢查原始文件
    const originalStats = await fs.stat(testImagePath);
    const originalMetadata = await sharp(testImagePath).metadata();
    
    console.log(`📏 原始圖片: ${originalMetadata.width}x${originalMetadata.height}`);
    console.log(`📦 原始大小: ${(originalStats.size / 1024).toFixed(2)}KB\n`);
    
    // 測試處理功能
    console.log('🔧 測試圖片處理...');
    const processedPath = await collector.processImage(testImagePath, 'modern', 0);
    
    if (processedPath) {
      // 檢查處理後的文件
      const processedStats = await fs.stat(processedPath);
      const processedMetadata = await sharp(processedPath).metadata();
      
      console.log('\n📊 處理結果:');
      console.log(`📏 處理後尺寸: ${processedMetadata.width}x${processedMetadata.height}`);
      console.log(`📦 處理後大小: ${(processedStats.size / 1024).toFixed(2)}KB`);
      
      // 驗證要求
      const sizeOK = processedMetadata.width! <= 500 && processedMetadata.height! <= 500;
      const fileSizeOK = (processedStats.size / 1024) <= 50;
      
      console.log(`\n✅ 檢查結果:`);
      console.log(`   尺寸要求 (≤500x500): ${sizeOK ? '✅ 通過' : '❌ 失敗'}`);
      console.log(`   文件大小 (≤50KB): ${fileSizeOK ? '✅ 通過' : '❌ 失敗'}`);
      
      if (sizeOK && fileSizeOK) {
        console.log('\n🎉 測試通過！圖片處理功能正常工作。');
      } else {
        console.log('\n❌ 測試失敗！需要修復圖片處理功能。');
      }
    } else {
      console.log('❌ 圖片處理失敗');
    }
    
  } catch (error) {
    console.error('❌ 測試出錯:', error);
  } finally {
    // 清理測試文件
    await fs.unlink(testImagePath).catch(() => {});
  }
}

// 如果直接執行此文件
if (require.main === module) {
  testImageProcessing().catch(console.error);
}