import { readdirSync, existsSync } from "fs";
import { join } from "path";

// 分析原始數據集
const analyzeOriginalDataset = () => {
  const dataset_dir = "building_dataset";
  
  if (!existsSync(dataset_dir)) {
    console.log('❌ 找不到數據集目錄');
    return;
  }

  const filenames = readdirSync(dataset_dir);
  const tableData: Array<{ category: string; number_of_images: number }> = [];
  let totalImages = 0;

  console.log("🏛️ 原始建築圖片數據集分析\n");

  for (let category of filenames) {
    if (category === 'processed') continue;
    
    const categoryPath = join(dataset_dir, category);
    if (!existsSync(categoryPath)) continue;
    
    const categoryFiles = readdirSync(categoryPath);
    const imageCount = categoryFiles.filter(file => 
      file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
    ).length;
    
    tableData.push({
      category: category,
      number_of_images: imageCount
    });
    totalImages += imageCount;
  }

  // 按圖片數量排序
  tableData.sort((a, b) => b.number_of_images - a.number_of_images);

  console.table(tableData);
  console.log(`\n📊 總圖片數: ${totalImages}\n`);
};

// 分析處理後的數據集
const analyzeProcessedDataset = () => {
  const processed_dir = join("building_dataset", "processed");
  
  if (!existsSync(processed_dir)) {
    console.log('❌ 找不到處理後的數據集目錄');
    return;
  }

  const filenames = readdirSync(processed_dir);
  const tableData: Array<{ category: string; number_of_images: number }> = [];
  let totalProcessedImages = 0;

  console.log("🎯 處理後建築圖片數據集分析\n");

  for (let category of filenames) {
    const categoryPath = join(processed_dir, category);
    if (!existsSync(categoryPath)) continue;
    
    const categoryFiles = readdirSync(categoryPath);
    const imageCount = categoryFiles.filter(file => 
      file.endsWith('.jpg') || file.endsWith('.jpeg')
    ).length;
    
    tableData.push({
      category: category,
      number_of_images: imageCount
    });
    totalProcessedImages += imageCount;
  }

  // 按圖片數量排序
  tableData.sort((a, b) => b.number_of_images - a.number_of_images);

  console.table(tableData);
  console.log(`\n📊 總處理圖片數: ${totalProcessedImages}`);
  console.log(`🎯 達成作業要求: ${totalProcessedImages >= 3000 ? '✅ 是' : '❌ 否'} (需要 3000-5000 張)\n`);
};

// 執行分析
console.log('🔍 DAE IT 2025 AI Assignment 1 - 建築圖片數據集分析報告');
console.log('='.repeat(60));

analyzeOriginalDataset();
analyzeProcessedDataset();

console.log('✨ 分析完成！');
