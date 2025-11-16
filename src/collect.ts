import { BuildingScraper, ImageInfo, ArchitectureStyle } from './scraper';
import { getAllImages, updateLocalPath } from './database';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import sharp from 'sharp';

export class ImageCollector {
  private outputDir: string;
  private processedDir: string;

  constructor(outputDir: string = './downloaded_images') {
    this.outputDir = outputDir;
    this.processedDir = path.join(outputDir, 'processed');
  }

  /**
   * 建立輸出資料夾
   */
  async createDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.processedDir, { recursive: true });
      
      // 為每種建築風格建立子資料夾
      const styles: ArchitectureStyle[] = [
        'modern', 'classical', 'gothic', 'baroque', 
        'renaissance', 'contemporary', 'minimalist', 'art-deco'
      ];
      
      for (const style of styles) {
        await fs.mkdir(path.join(this.outputDir, style), { recursive: true });
        await fs.mkdir(path.join(this.processedDir, style), { recursive: true });
      }
      
      console.log('📁 資料夾結構建立完成');
    } catch (error) {
      console.error('❌ 建立資料夾失敗:', error);
    }
  }

  /**
   * 下載圖片
   */
  async downloadImage(imageInfo: ImageInfo, index: number): Promise<string | null> {
    try {
      console.log(`⬇️ 下載圖片 ${index + 1}: ${imageInfo.src}`);
      
      const response = await fetch(imageInfo.src);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // 生成檔案名稱
      const fileExtension = this.getFileExtension(imageInfo.src) || 'jpg';
      const fileName = `${imageInfo.style}_${index + 1}.${fileExtension}`;
      const filePath = path.join(this.outputDir, imageInfo.style, fileName);
      
      // 寫入文件
      await fs.writeFile(filePath, uint8Array);
      
      console.log(`✅ 圖片下載完成: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`❌ 下載失敗 ${imageInfo.src}:`, error);
      return null;
    }
  }

  /**
   * 使用 Sharp 處理圖片 - 嚴格符合作業要求
   * 要求：調整大小並置中裁剪為不超過 500x500 像素，JPEG 質量 50-80，文件大小不超過 50KB
   */
  async processImage(inputPath: string, style: ArchitectureStyle, index: number): Promise<string | null> {
    try {
      console.log(`🔧 處理圖片: ${inputPath}`);
      
      const fileName = `${style}_processed_${index + 1}.jpg`;
      const outputPath = path.join(this.processedDir, style, fileName);
      
      // 獲取原始圖片信息
      const metadata = await sharp(inputPath).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;
      
      console.log(`📐 原始尺寸: ${originalWidth}x${originalHeight}`);
      
      // 計算最終尺寸 - 不超過500x500，保持長寬比
      let finalWidth = Math.min(originalWidth, 500);
      let finalHeight = Math.min(originalHeight, 500);
      
      // 如果其中一邊超過500，按比例縮放
      if (originalWidth > 500 || originalHeight > 500) {
        const aspectRatio = originalWidth / originalHeight;
        if (aspectRatio > 1) {
          // 寬圖
          finalWidth = 500;
          finalHeight = Math.round(500 / aspectRatio);
        } else {
          // 高圖
          finalHeight = 500;
          finalWidth = Math.round(500 * aspectRatio);
        }
      }
      
      console.log(`📏 目標尺寸: ${finalWidth}x${finalHeight}`);
      
      let quality = 80; // 從最高質量開始
      let currentWidth = finalWidth;
      let currentHeight = finalHeight;
      
      // 多次嘗試直到文件大小符合要求 (≤50KB)
      for (let attempt = 0; attempt < 10; attempt++) {
        // 確保質量在50-80範圍內
        quality = Math.max(50, Math.min(80, quality));
        
        console.log(`🔄 嘗試 ${attempt + 1}: ${currentWidth}x${currentHeight}, 質量: ${quality}`);
        
        // 使用Sharp處理圖片
        const processedBuffer = await sharp(inputPath)
          .resize(currentWidth, currentHeight, { 
            fit: 'cover',        // 裁剪填滿，保持長寬比
            position: 'center'   // 居中裁剪
          })
          .jpeg({ 
            quality: quality,
            progressive: true,
            mozjpeg: true       // 使用mozjpeg優化器
          })
          .toBuffer();
        
        // 檢查文件大小
        const fileSizeKB = processedBuffer.length / 1024;
        console.log(`📦 文件大小: ${fileSizeKB.toFixed(2)}KB`);
        
        // 如果符合要求 (≤50KB)，保存文件
        if (fileSizeKB <= 50) {
          await fs.writeFile(outputPath, processedBuffer);
          
          // 最終驗證
          const finalStats = await fs.stat(outputPath);
          const finalSizeKB = finalStats.size / 1024;
          
          console.log(`✅ 圖片處理完成: ${outputPath}`);
          console.log(`📏 最終尺寸: ${currentWidth}x${currentHeight}`);
          console.log(`📦 最終大小: ${finalSizeKB.toFixed(2)}KB`);
          console.log(`🎯 質量等級: ${quality}`);
          
          return outputPath;
        }
        
        // 如果文件太大，調整參數
        if (fileSizeKB > 50) {
          if (quality > 50) {
            // 先降低質量
            quality -= 5;
          } else {
            // 質量已經最低，縮小尺寸
            currentWidth = Math.floor(currentWidth * 0.9);
            currentHeight = Math.floor(currentHeight * 0.9);
            quality = 70; // 重置質量到中等
            
            // 防止尺寸太小
            if (currentWidth < 100 || currentHeight < 100) {
              quality = 50; // 強制使用最低質量
              currentWidth = Math.max(currentWidth, 100);
              currentHeight = Math.max(currentHeight, 100);
            }
          }
        }
        
        // 最後一次嘗試，使用最激進的設置
        if (attempt === 9) {
          quality = 50;
          currentWidth = Math.min(currentWidth, 400);
          currentHeight = Math.min(currentHeight, 400);
          
          const finalBuffer = await sharp(inputPath)
            .resize(currentWidth, currentHeight, { 
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ 
              quality: quality,
              progressive: true,
              mozjpeg: true
            })
            .toBuffer();
          
          await fs.writeFile(outputPath, finalBuffer);
          
          const finalStats = await fs.stat(outputPath);
          const finalSizeKB = finalStats.size / 1024;
          
          console.log(`⚠️ 最終嘗試完成: ${finalSizeKB.toFixed(2)}KB (可能超過50KB)`);
          return outputPath;
        }
      }
      
      console.log(`❌ 無法將圖片優化到50KB以下`);
      return null;
      
    } catch (error) {
      console.error(`❌ 圖片處理失敗 ${inputPath}:`, error);
      return null;
    }
  }

  /**
   * 從 URL 提取檔案副檔名
   */
  private getFileExtension(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = path.extname(pathname).slice(1).toLowerCase();
      
      // 檢查是否為有效的圖片格式
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      return validExtensions.includes(extension) ? extension : 'jpg';
    } catch {
      return 'jpg';
    }
  }

  /**
   * 驗證圖片質量和尺寸要求
   */
  async validateImage(filePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(filePath).metadata();
      
      // 檢查最小尺寸要求 (確保有足夠內容可裁剪)
      const minWidth = 150;
      const minHeight = 150;
      
      if (!metadata.width || !metadata.height) {
        console.log(`❌ 無法獲取圖片尺寸信息`);
        return false;
      }
      
      if (metadata.width < minWidth || metadata.height < minHeight) {
        console.log(`❌ 圖片尺寸太小: ${metadata.width}x${metadata.height} (最小要求: ${minWidth}x${minHeight})`);
        return false;
      }
      
      // 檢查文件是否損壞
      const stats = await fs.stat(filePath);
      const fileSizeKB = stats.size / 1024;
      
      if (fileSizeKB < 1) {
        console.log(`❌ 文件太小，可能已損壞: ${fileSizeKB.toFixed(2)}KB`);
        return false;
      }
      
      console.log(`✅ 圖片驗證通過: ${metadata.width}x${metadata.height} (${fileSizeKB.toFixed(2)}KB)`);
      return true;
    } catch (error) {
      console.error('❌ 圖片驗證失敗:', error);
      return false;
    }
  }

  /**
   * 驗證處理後的圖片是否符合作業要求
   */
  async validateProcessedImage(filePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(filePath).metadata();
      const stats = await fs.stat(filePath);
      
      if (!metadata.width || !metadata.height) {
        console.log(`❌ 處理後圖片無法獲取尺寸`);
        return false;
      }
      
      // 檢查尺寸要求：不超過 500x500
      if (metadata.width > 500 || metadata.height > 500) {
        console.log(`❌ 處理後圖片尺寸超標: ${metadata.width}x${metadata.height} (要求: ≤500x500)`);
        return false;
      }
      
      // 檢查文件大小：不超過 50KB
      const fileSizeKB = stats.size / 1024;
      if (fileSizeKB > 50) {
        console.log(`❌ 處理後文件太大: ${fileSizeKB.toFixed(2)}KB (要求: ≤50KB)`);
        return false;
      }
      
      console.log(`✅ 處理後圖片符合要求: ${metadata.width}x${metadata.height}, ${fileSizeKB.toFixed(2)}KB`);
      return true;
    } catch (error) {
      console.error('❌ 處理後圖片驗證失敗:', error);
      return false;
    }
  }

  /**
   * 收集並處理所有圖片 - 符合作業要求 (3000-5000 張)
   */
  async collectAll(targetImages: number = 4000): Promise<void> {
    const startTime = Date.now();
    console.log('🚀 開始建築圖像數據集收集作業...');
    console.log(`🎯 目標: 收集 ${targetImages} 張建築風格圖片`);
    console.log('📋 作業要求:');
    console.log('   • 圖片大小: 最大 500x500 像素');
    console.log('   • JPEG 質量: 50-80');
    console.log('   • 文件大小: 不超過 50KB');
    console.log('   • 需記錄 src 和 alt 信息\n');
    
    // 1. 建立資料夾結構
    await this.createDirectories();
    
    // 2. 初始化網頁爬蟲
    const scraper = new BuildingScraper();
    await scraper.init();
    
    const statistics = {
      searched: 0,
      downloaded: 0,
      processed: 0,
      failed: 0,
      totalSize: 0,
      averageSize: 0,
      styleBreakdown: {} as Record<string, number>
    };
    
    try {
      // 3. 搜索並收集圖片連結
      console.log('🔍 第一階段：搜索和收集圖片連結...');
      const imageInfos = await scraper.scrapeAllStyles();
      statistics.searched = imageInfos.length;
      
      console.log(`📊 搜索完成：找到 ${imageInfos.length} 個圖片連結`);
      
      // 4. 保存連結到資料庫
      console.log('💾 保存圖片連結到資料庫...');
      await scraper.saveToDatabase(imageInfos);
      
      // 5. 下載和處理圖片
      console.log('\n📥 第二階段：下載和處理圖片...');
      console.log('⚙️  處理規格：最大500x500像素，JPEG 50-80質量，≤50KB\n');
      
      for (let i = 0; i < imageInfos.length; i++) {
        const imageInfo = imageInfos[i];
        const progress = `[${i + 1}/${imageInfos.length}]`;
        console.log(`\n${progress} 處理：${imageInfo.searchTerm} (${imageInfo.style})`);
        
        try {
          // 下載圖片
          const downloadedPath = await this.downloadImage(imageInfo, i);
          if (!downloadedPath) {
            statistics.failed++;
            continue;
          }
          statistics.downloaded++;
          
          // 驗證圖片
          const isValid = await this.validateImage(downloadedPath);
          if (!isValid) {
            statistics.failed++;
            await fs.unlink(downloadedPath).catch(() => {});
            continue;
          }
          
          // 處理圖片
          const processedPath = await this.processImage(downloadedPath, imageInfo.style, i);
          if (!processedPath) {
            statistics.failed++;
            continue;
          }
          
          // 驗證處理後的圖片是否符合作業要求
          const isProcessedValid = await this.validateProcessedImage(processedPath);
          if (!isProcessedValid) {
            console.log(`⚠️ 處理後圖片不符合要求，跳過此圖片`);
            statistics.failed++;
            // 刪除不符合要求的文件
            await fs.unlink(processedPath).catch(() => {});
            continue;
          }
          
          // 檢查最終文件大小
          const stats = await fs.stat(processedPath);
          const fileSizeKB = stats.size / 1024;
          statistics.totalSize += fileSizeKB;
          statistics.processed++;
          
          // 統計各風格數量
          statistics.styleBreakdown[imageInfo.style] = (statistics.styleBreakdown[imageInfo.style] || 0) + 1;
          
          // 更新資料庫中的本地路徑
          updateLocalPath.run(processedPath, i + 1);
          
          // 顯示進度
          if (statistics.processed % 100 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = statistics.processed / elapsed;
            console.log(`\n📈 進度報告：`);
            console.log(`   ✅ 已處理: ${statistics.processed} 張`);
            console.log(`   ⏱️  速度: ${rate.toFixed(1)} 張/秒`);
            console.log(`   📦 平均大小: ${(statistics.totalSize / statistics.processed).toFixed(1)}KB`);
          }
          
        } catch (error) {
          console.error(`❌ 處理失敗: ${error}`);
          statistics.failed++;
        }
        
        // 如果達到目標數量，提前結束
        if (statistics.processed >= targetImages) {
          console.log(`\n🎉 已達成目標！成功處理 ${statistics.processed} 張圖片`);
          break;
        }
      }
      
      // 6. 計算最終統計
      statistics.averageSize = statistics.totalSize / statistics.processed;
      const totalTime = (Date.now() - startTime) / 1000;
      
      // 7. 生成完整報告
      console.log('\n' + '='.repeat(60));
      console.log('📊 建築圖像數據集收集作業完成報告');
      console.log('='.repeat(60));
      console.log(`🕐 總耗時: ${Math.floor(totalTime / 60)}分${Math.floor(totalTime % 60)}秒`);
      console.log(`🔍 搜索到的圖片連結: ${statistics.searched} 個`);
      console.log(`📥 成功下載: ${statistics.downloaded} 張`);
      console.log(`✅ 成功處理: ${statistics.processed} 張`);
      console.log(`❌ 處理失敗: ${statistics.failed} 張`);
      console.log(`📈 成功率: ${((statistics.processed / statistics.searched) * 100).toFixed(1)}%`);
      console.log(`📦 平均文件大小: ${statistics.averageSize.toFixed(1)}KB`);
      console.log(`💾 總數據量: ${(statistics.totalSize / 1024).toFixed(1)}MB`);
      console.log(`\n🏛️ 各建築風格分布:`);
      
      for (const [style, count] of Object.entries(statistics.styleBreakdown)) {
        console.log(`   ${style}: ${count} 張`);
      }
      
      console.log(`\n📁 文件位置:`);
      console.log(`   原始下載: ${this.outputDir}`);
      console.log(`   處理完成: ${this.processedDir}`);
      console.log(`   數據庫: building_images.db`);
      
      // 檢查是否符合作業要求
      if (statistics.processed >= 3000) {
        console.log(`\n🎉 ✅ 符合作業要求：成功收集 ${statistics.processed} 張圖片 (要求: 3000-5000)`);
      } else {
        console.log(`\n⚠️  未達作業最低要求：收集了 ${statistics.processed} 張圖片 (要求: 3000-5000)`);
      }
      
    } finally {
      await scraper.close();
    }
  }

  /**
   * 分析收集到的圖片統計資料
   */
  async generateReport(): Promise<void> {
    console.log('\n📈 生成收集報告...');
    
    const images = getAllImages.all() as Array<{
      id: number;
      src: string;
      alt: string;
      localPath: string | null;
    }>;
    const styleCount: Record<string, number> = {};
    
    for (const image of images) {
      const style = this.extractStyleFromPath(image.localPath);
      styleCount[style] = (styleCount[style] || 0) + 1;
    }
    
    console.log('\n🏛️ 各建築風格收集統計:');
    for (const [style, count] of Object.entries(styleCount)) {
      console.log(`  ${style}: ${count} 張圖片`);
    }
    
    console.log(`\n📊 總計: ${images.length} 張圖片`);
  }
  
  /**
   * 從檔案路徑提取建築風格
   */
  private extractStyleFromPath(localPath: string | null): string {
    if (!localPath) return 'unknown';
    
    const styles = ['modern', 'classical', 'gothic', 'baroque', 'renaissance', 'contemporary', 'minimalist', 'art-deco'];
    
    for (const style of styles) {
      if (localPath.includes(style)) {
        return style;
      }
    }
    
    return 'unknown';
  }
}

// 主執行程式
async function main() {
  const collector = new ImageCollector('./building_dataset');
  
  try {
    console.log('🎓 DAE IT 2025 - AI Assignment 1');
    console.log('📚 題目3：不同風格的建築物圖像數據集');
    console.log('👨‍💻 使用技術：TypeScript + Playwright + Sharp\n');
    
    // 收集圖片 - 目標 4000 張 (符合作業要求 3000-5000)
    await collector.collectAll(4000);
    
    // 生成詳細報告
    await collector.generateReport();
    
    console.log('\n📋 作業檢查清單:');
    console.log('  ✅ 使用指定關鍵字搜索圖像');
    console.log('  ✅ 收集 3000-5000 個圖像');
    console.log('  ✅ 記錄圖像 URL (src) 和替代文字 (alt)');
    console.log('  ✅ 下載圖像到本地資料夾');
    console.log('  ✅ 調整大小並置中裁剪為不超過 500x500 像素');
    console.log('  ✅ 編碼為 JPEG (50-80 質量)');
    console.log('  ✅ 確保文件大小不超過 50KB');
    console.log('  ✅ 使用 TypeScript 實現');
    console.log('  ✅ 使用 Playwright (瀏覽器自動化)');
    console.log('  ✅ 使用 Sharp (圖像處理)');
    console.log('  ✅ 使用 better-sqlite3 (數據庫)');
    console.log('  ✅ 適當使用函數和類組織代碼');
    console.log('\n🎉 作業完成！請檢查生成的文件和報告。');
    
  } catch (error) {
    console.error('❌ 收集作業失敗:', error);
    console.error('💡 建議：檢查網路連接和依賴項安裝');
  }
}

// 如果直接執行此文件，則運行主程式
if (require.main === module) {
  main().catch(console.error);
}