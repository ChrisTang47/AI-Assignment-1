import { chromium, Browser, Page } from 'playwright';
import { insertImage } from './database';
import * as fs from 'fs';
import * as path from 'path';

// 定義建築風格類型
export type ArchitectureStyle = 
  | 'modern' 
  | 'classical' 
  | 'gothic' 
  | 'baroque' 
  | 'renaissance' 
  | 'contemporary'
  | 'minimalist'
  | 'art-deco';

// 建築風格搜索關鍵詞 - 精確中英文版本，確保90%以上建築物相關性
const ARCHITECTURE_KEYWORDS: Record<ArchitectureStyle, string[]> = {
  modern: [
    // 英文精確關鍵詞 - 明確指定建築物
    'modern architecture building exterior', 'contemporary architecture building facade', 
    'modern office building exterior', 'modern skyscraper building', 'modern tower architecture',
    'modern commercial building facade', 'modern residential building exterior',
    'glass curtain wall building', 'steel frame building exterior', 'concrete modern building',
    'modern apartment building exterior', 'modern shopping mall building', 
    'modern hospital building architecture', 'modern university building exterior',
    'modern library building facade', 'modern museum building architecture',
    
    // 中文精確關鍵詞 - 確保是建築物
    '現代建築外觀', '現代建築物外立面', '現代辦公大樓', '現代摩天大樓建築',
    '現代商業建築', '現代住宅建築', '現代玻璃建築', '現代混凝土建築',
    '現代鋼結構建築', '現代高層建築', '現代建築設計', '當代建築外觀',
    '現代建築立面', '現代城市建築', '現代建築風格', '現代建築攝影',
    
    // 組合精確詞 - 排除人物和植物
    'modern building architecture photography', 'contemporary building exterior design',
    'modern architectural structure facade', 'modern building exterior view',
    'glass building architecture modern', 'steel building modern design'
  ],
  classical: [
    // 英文精確關鍵詞
    'classical architecture building exterior', 'neoclassical building facade',
    'greek temple architecture building', 'roman architecture building exterior',
    'classical columns building facade', 'doric columns building architecture',
    'ionic columns building exterior', 'corinthian columns architecture building',
    'classical government building exterior', 'neoclassical museum building',
    'classical university building facade', 'classical courthouse building',
    'classical bank building architecture', 'marble building classical facade',
    'stone columns building exterior', 'classical pediment building',
    
    // 中文精確關鍵詞
    '古典建築外觀', '新古典主義建築', '希臘式建築', '羅馬式建築',
    '古典柱式建築', '多立克柱建築', '愛奧尼亞柱建築', '科林斯柱建築',
    '古典政府建築', '古典博物館建築', '古典大學建築', '古典法院建築',
    '大理石建築外觀', '石柱建築', '古典建築立面', '對稱建築外觀',
    
    // 組合精確詞
    'classical building architecture photography', 'neoclassical building exterior view',
    'classical architectural facade design', 'ancient building architecture style',
    'classical stone building exterior', 'symmetrical classical building facade'
  ],
  gothic: [
    // 英文精確關鍵詞
    'gothic cathedral architecture exterior', 'gothic church building facade',
    'medieval cathedral building exterior', 'gothic architecture building stone',
    'gothic revival building exterior', 'neo-gothic building architecture',
    'pointed arch building gothic', 'flying buttresses cathedral exterior',
    'gothic tower building architecture', 'cathedral spire building exterior',
    'gothic abbey building facade', 'monastery gothic building',
    'gothic university building exterior', 'collegiate gothic building',
    'stone gothic building architecture', 'medieval building exterior gothic',
    
    // 中文精確關鍵詞
    '哥德式大教堂建築', '哥德式教堂外觀', '中世紀建築外觀', '哥德式建築立面',
    '哥德復興式建築', '新哥德式建築', '尖拱建築', '飛扶壁建築',
    '哥德式塔樓建築', '教堂尖塔建築', '哥德式修道院', '哥德式大學建築',
    '石造哥德式建築', '中世紀石建築', '哥德式建築外觀', '哥德式建築攝影',
    
    // 組合精確詞
    'gothic building architecture photography', 'cathedral building exterior gothic',
    'medieval building architecture stone', 'gothic architectural facade design',
    'pointed arch building exterior', 'gothic stone building facade'
  ],
  baroque: [
    // 英文精確關鍵詞
    'baroque palace building exterior', 'baroque cathedral architecture building',
    'baroque church building facade', 'ornate baroque building exterior',
    'decorative baroque building architecture', 'elaborate baroque facade building',
    'rococo palace building exterior', 'baroque mansion building architecture',
    'baroque villa building facade', 'italian baroque building exterior',
    'french baroque building architecture', 'baroque theater building exterior',
    'baroque university building facade', 'ornamental building baroque style',
    'curved baroque building facade', 'gilded baroque building exterior',
    
    // 中文精確關鍵詞
    '巴洛克宮殿建築', '巴洛克大教堂建築', '巴洛克教堂外觀', '華麗巴洛克建築',
    '裝飾性巴洛克建築', '精緻巴洛克建築', '洛可可宮殿建築', '巴洛克豪宅建築',
    '巴洛克別墅建築', '意大利巴洛克建築', '法國巴洛克建築', '巴洛克劇院建築',
    '巴洛克大學建築', '華麗裝飾建築', '曲線巴洛克建築', '金飾巴洛克建築',
    
    // 組合精確詞
    'baroque building architecture photography', 'ornate building baroque facade',
    'decorative baroque building exterior', 'elaborate architectural building baroque',
    'curved facade baroque building', 'gilded baroque building architecture'
  ],
  renaissance: [
    // 英文精確關鍵詞
    'renaissance palace building exterior', 'renaissance villa architecture building',
    'italian renaissance building facade', 'renaissance church building exterior',
    'florentine palazzo building architecture', 'venetian palazzo building facade',
    'renaissance mansion building exterior', 'renaissance dome building architecture',
    'palladian villa building exterior', 'renaissance university building facade',
    'tuscan villa renaissance building', 'renaissance courtyard building',
    'symmetrical renaissance building facade', 'renaissance arch building exterior',
    'rusticated renaissance building facade', 'renaissance castle building exterior',
    
    // 中文精確關鍵詞
    '文藝復興宮殿建築', '文藝復興別墅建築', '意大利文藝復興建築', '文藝復興教堂建築',
    '佛羅倫薩宮殿建築', '威尼斯宮殿建築', '文藝復興豪宅建築', '文藝復興圓頂建築',
    '帕拉第奧式建築', '文藝復興大學建築', '托斯卡納別墅建築', '文藝復興中庭建築',
    '對稱文藝復興建築', '文藝復興拱門建築', '粗面石文藝復興建築', '文藝復興城堡建築',
    
    // 組合精確詞
    'renaissance building architecture photography', 'italian renaissance building exterior',
    'symmetrical renaissance building facade', 'classical renaissance building architecture',
    'dome renaissance building exterior', 'courtyard renaissance building facade'
  ],
  contemporary: [
    // 英文精確關鍵詞
    'contemporary architecture building exterior', 'contemporary office building facade',
    'contemporary museum building exterior', 'contemporary residential building architecture',
    'contemporary commercial building facade', 'contemporary hotel building exterior',
    'contemporary university building architecture', 'contemporary library building facade',
    'innovative contemporary building exterior', 'sustainable contemporary building architecture',
    'green contemporary building facade', 'high-tech contemporary building exterior',
    'glass contemporary building architecture', 'steel contemporary building facade',
    'parametric building contemporary architecture', 'digital architecture building contemporary',
    
    // 中文精確關鍵詞
    '當代建築外觀', '當代辦公建築', '當代博物館建築', '當代住宅建築',
    '當代商業建築', '當代酒店建築', '當代大學建築', '當代圖書館建築',
    '創新當代建築', '可持續當代建築', '綠色當代建築', '高科技當代建築',
    '玻璃當代建築', '鋼結構當代建築', '參數化建築', '數字化建築',
    
    // 組合精確詞
    'contemporary building architecture photography', 'innovative contemporary building facade',
    'sustainable contemporary building exterior', 'high-tech contemporary building architecture',
    'glass facade contemporary building', 'steel frame contemporary building exterior'
  ],
  minimalist: [
    // 英文精確關鍵詞
    'minimalist architecture building exterior', 'minimalist house building facade',
    'simple minimalist building architecture', 'clean minimalist building exterior',
    'white minimalist building facade', 'geometric minimalist building architecture',
    'cubic minimalist building exterior', 'rectangular minimalist building facade',
    'concrete minimalist building architecture', 'glass minimalist building exterior',
    'scandinavian minimalist building facade', 'japanese minimalist building architecture',
    'zen minimalist building exterior', 'bauhaus minimalist building facade',
    'industrial minimalist building architecture', 'modern minimalist building exterior',
    
    // 中文精確關鍵詞
    '極簡主義建築外觀', '極簡住宅建築', '簡約建築外觀', '清潔極簡建築',
    '白色極簡建築', '幾何極簡建築', '立方體極簡建築', '矩形極簡建築',
    '混凝土極簡建築', '玻璃極簡建築', '北歐極簡建築', '日式極簡建築',
    '禪意極簡建築', '包豪斯極簡建築', '工業極簡建築', '現代極簡建築',
    
    // 組合精確詞
    'minimalist building architecture photography', 'simple minimalist building facade',
    'clean lines minimalist building exterior', 'geometric minimalist building architecture',
    'white facade minimalist building', 'concrete minimalist building exterior'
  ],
  'art-deco': [
    // 英文精確關鍵詞
    'art deco building architecture exterior', 'art deco skyscraper building facade',
    'art deco hotel building exterior', 'art deco apartment building architecture',
    'art deco theater building facade', 'art deco cinema building exterior',
    'streamline moderne building architecture', '1920s art deco building facade',
    '1930s art deco building exterior', 'geometric art deco building architecture',
    'zigzag art deco building facade', 'stepped art deco building exterior',
    'chrysler building art deco style', 'miami art deco building facade',
    'new york art deco building architecture', 'vintage art deco building exterior',
    
    // 中文精確關鍵詞
    '裝飾藝術建築外觀', '裝飾藝術摩天樓', '裝飾藝術酒店建築', '裝飾藝術公寓建築',
    '裝飾藝術劇院建築', '裝飾藝術電影院建築', '流線型現代建築', '1920年代裝飾藝術建築',
    '1930年代裝飾藝術建築', '幾何裝飾藝術建築', '鋸齒裝飾藝術建築', '階梯式裝飾藝術建築',
    '克萊斯勒大廈風格', '邁阿密裝飾藝術建築', '紐約裝飾藝術建築', '復古裝飾藝術建築',
    
    // 組合精確詞
    'art deco building architecture photography', 'geometric art deco building facade',
    'streamline art deco building exterior', 'vintage art deco building architecture',
    'stepped facade art deco building', 'chrome details art deco building exterior'
  ]
};

// 圖片資訊介面
export interface ImageInfo {
  src: string;
  alt: string;
  style: ArchitectureStyle;
  searchTerm: string;
}

export class BuildingScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * 初始化瀏覽器
   */
  async init(): Promise<void> {
    this.browser = await chromium.launch({ 
      headless: false, // 設為 true 可加快速度
      slowMo: 1000 // 減慢操作速度避免被偵測
    });
    this.page = await this.browser.newPage();
    
    // 設置用戶代理避免被偵測為機器人
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
  }

  /**
   * 從 Unsplash 搜索建築圖片 - 增強版
   */
  async scrapeUnsplash(style: ArchitectureStyle, maxImages: number = 50): Promise<ImageInfo[]> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    const results: ImageInfo[] = [];
    const keywords = ARCHITECTURE_KEYWORDS[style];
    const keywordsToUse = Math.min(15, keywords.length); // 使用更多關鍵字
    
    for (let i = 0; i < keywordsToUse && results.length < maxImages; i++) {
      const keyword = keywords[i];
      
      try {
        const searchUrl = `https://unsplash.com/s/photos/${encodeURIComponent(keyword)}`;
        await this.page.goto(searchUrl, { waitUntil: 'networkidle' });
        await this.page.waitForTimeout(1500);

        // 滾動加載更多圖片
        for (let scroll = 0; scroll < 3; scroll++) {
          await this.page.evaluate(() => {
            window.scrollBy(0, 1000);
          });
          await this.page.waitForTimeout(1000);
        }

        // 獲取圖片元素 - 嚴格過濾建築相關圖片
        const images = await this.page.$$eval('img[srcset]', (imgs) => {
          return imgs.slice(0, 15).map(img => {
            const imgElement = img as HTMLImageElement;
            return {
              src: imgElement.src,
              alt: imgElement.alt || '',
              srcset: imgElement.getAttribute('srcset') || ''
            };
          }).filter(img => {
            if (!img.src || !img.src.includes('unsplash')) return false;
            
            const srcLower = img.src.toLowerCase();
            const altLower = img.alt.toLowerCase();
            
            // 排除人物、植物等非建築內容
            const excludeTerms = [
              'profile', 'avatar', 'person', 'people', 'face', 'portrait', 'human',
              'plant', 'flower', 'tree', 'garden', 'nature', 'animal', 'food', 'interior'
            ];
            
            const hasExcluded = excludeTerms.some(term => 
              srcLower.includes(term) || altLower.includes(term)
            );
            
            // 確保是建築相關
            const buildingTerms = [
              'building', 'architecture', 'facade', 'exterior', 'structure'
            ];
            
            const hasBuilding = buildingTerms.some(term => 
              altLower.includes(term)
            ) || altLower.includes('建築') || altLower.includes('大樓');
            
            return !hasExcluded && (hasBuilding || altLower.length === 0);
          });
        });

        // 處理每張圖片
        for (const img of images) {
          if (results.length >= maxImages) break;
          
          const highQualityUrl = this.extractHighQualityUrl(img.srcset) || img.src;
          
          results.push({
            src: highQualityUrl,
            alt: img.alt || `${style} architecture building`,
            style,
            searchTerm: keyword
          });
        }

      } catch (error) {
        console.error(`❌ Unsplash搜索失敗: ${keyword}`, error);
      }
    }

    return results;
  }

  /**
   * 從 Pexels 搜索建築圖片 - 增強版
   */
  async scrapePexels(style: ArchitectureStyle, maxImages: number = 60): Promise<ImageInfo[]> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    const results: ImageInfo[] = [];
    const keywords = ARCHITECTURE_KEYWORDS[style];
    const keywordsToUse = Math.min(12, keywords.length);
    
    for (let i = 0; i < keywordsToUse && results.length < maxImages; i++) {
      const keyword = keywords[i];
      
      try {
        const searchUrl = `https://www.pexels.com/search/${encodeURIComponent(keyword)}/`;
        await this.page.goto(searchUrl, { waitUntil: 'networkidle' });
        await this.page.waitForTimeout(1500);

        // 滾動加載更多圖片
        for (let scroll = 0; scroll < 4; scroll++) {
          await this.page.evaluate(() => {
            window.scrollBy(0, 1200);
          });
          await this.page.waitForTimeout(1000);
        }

        // 獲取圖片元素
        const images = await this.page.$$eval('img[srcset]', (imgs) => {
          return imgs.slice(0, 20).map(img => {
            const imgElement = img as HTMLImageElement;
            return {
              src: imgElement.src,
              alt: imgElement.alt || '',
              srcset: imgElement.getAttribute('srcset') || ''
            };
          }).filter(img => {
            if (!img.src || !img.src.includes('pexels') || !img.srcset) return false;
            
            const srcLower = img.src.toLowerCase();
            const altLower = img.alt.toLowerCase();
            
            // 排除人物、植物等非建築內容
            const excludeTerms = [
              'profile', 'avatar', 'person', 'people', 'face', 'portrait', 'human',
              'plant', 'flower', 'tree', 'garden', 'nature', 'animal', 'food', 'interior'
            ];
            
            const hasExcluded = excludeTerms.some(term => 
              srcLower.includes(term) || altLower.includes(term)
            );
            
            // 確保是建築相關
            const buildingTerms = [
              'building', 'architecture', 'facade', 'exterior', 'structure'
            ];
            
            const hasBuilding = buildingTerms.some(term => 
              altLower.includes(term)
            ) || altLower.includes('建築') || altLower.includes('大樓');
            
            return !hasExcluded && (hasBuilding || altLower.length === 0);
          });
        });

        // 處理每張圖片
        for (const img of images) {
          if (results.length >= maxImages) break;
          
          const highQualityUrl = this.extractHighQualityUrl(img.srcset) || img.src;
          
          results.push({
            src: highQualityUrl,
            alt: img.alt || `${style} architecture building`,
            style,
            searchTerm: keyword
          });
        }

      } catch (error) {
        console.error(`❌ Pexels搜索失敗: ${keyword}`, error);
      }
    }

    return results;
  }

  /**
   * 從 Google Images 搜索建築圖片 - 增強版
   */
  async scrapeGoogleImages(style: ArchitectureStyle, maxImages: number = 100): Promise<ImageInfo[]> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    const results: ImageInfo[] = [];
    const keywords = ARCHITECTURE_KEYWORDS[style];
    const keywordsToUse = Math.min(20, keywords.length); // 使用更多關鍵字
    
    for (let i = 0; i < keywordsToUse && results.length < maxImages; i++) {
      const keyword = keywords[i];
      
      try {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch&safe=active&tbs=isz:l`; // 添加大圖過濾
        await this.page.goto(searchUrl, { waitUntil: 'networkidle' });
        await this.page.waitForTimeout(2000);

        // 更積極的滾動加載
        for (let scroll = 0; scroll < 5; scroll++) {
          await this.page.evaluate(() => {
            window.scrollBy(0, 1500);
          });
          await this.page.waitForTimeout(800);
        }

        // 嘗試點擊"顯示更多結果"按鈕
        try {
          await this.page.click('input[value="顯示更多結果"], input[value="Show more results"]', { timeout: 2000 });
          await this.page.waitForTimeout(2000);
          
          // 再滾動一次
          for (let scroll = 0; scroll < 3; scroll++) {
            await this.page.evaluate(() => {
              window.scrollBy(0, 1000);
            });
            await this.page.waitForTimeout(1000);
          }
        } catch {
          // 忽略按鈕點擊失敗
        }

        // 獲取圖片元素 - 嚴格過濾確保建築物相關性
        const images = await this.page.$$eval('img[src]', (imgs) => {
          return imgs.slice(0, 30).map(img => {
            const imgElement = img as HTMLImageElement;
            return {
              src: imgElement.src,
              alt: imgElement.alt || '',
              width: imgElement.width || 0,
              height: imgElement.height || 0
            };
          }).filter(img => {
            // URL 基本驗證
            const isValidUrl = img.src.startsWith('http') || img.src.startsWith('data:');
            const hasGoodSize = img.width > 200 && img.height > 200; // 提高尺寸要求
            
            // 排除明顯的非建築內容
            const excludeTerms = [
              'logo', 'icon', 'button', 'avatar', 'profile', 'person', 'people', 
              'face', 'portrait', 'human', 'man', 'woman', 'child', 'baby',
              'plant', 'flower', 'tree', 'garden', 'leaf', 'nature', 'animal',
              'food', 'restaurant', 'menu', 'dish', 'cooking', 'kitchen',
              'car', 'vehicle', 'transportation', 'interior', 'furniture', 'room'
            ];
            
            const srcLower = img.src.toLowerCase();
            const altLower = img.alt.toLowerCase();
            
            const hasExcludedContent = excludeTerms.some(term => 
              srcLower.includes(term) || altLower.includes(term)
            );
            
            // 確保包含建築相關詞彙
            const buildingTerms = [
              'building', 'architecture', 'facade', 'exterior', 'construction',
              'structure', 'tower', 'skyscraper', 'house', 'office', 'commercial'
            ];
            
            const hasBuildingContent = buildingTerms.some(term => 
              srcLower.includes(term) || altLower.includes(term)
            ) || altLower.includes('建築') || altLower.includes('大樓') || altLower.includes('外觀');
            
            const notGoogle = !img.src.includes('google') || img.src.includes('googleusercontent');
            
            return isValidUrl && hasGoodSize && !hasExcludedContent && notGoogle && hasBuildingContent;
          });
        });

        // 處理每張圖片
        for (const img of images) {
          if (results.length >= maxImages) break;
          
          results.push({
            src: img.src,
            alt: img.alt || `${style} architecture building`,
            style,
            searchTerm: keyword
          });
        }

      } catch (error) {
        console.error(`❌ Google Images搜索失敗: ${keyword}`, error);
      }
      
      // 適當延遲避免封鎖
      await this.page.waitForTimeout(2000);
    }

    return results;
  }

  /**
   * 從 srcset 提取最高質量的圖片 URL
   */
  private extractHighQualityUrl(srcset: string): string | null {
    if (!srcset) return null;
    
    const urls = srcset.split(',').map(url => {
      const [src, size] = url.trim().split(' ');
      return { src, size: size ? parseInt(size) : 0 };
    });
    
    // 選擇最大尺寸的圖片
    const highestQuality = urls.reduce((prev, current) => 
      current.size > prev.size ? current : prev
    );
    
    return highestQuality.src;
  }

  /**
   * 搜索所有建築風格的圖片 - 增強版，目標 5000+ 張
   */
  async scrapeAllStyles(targetTotal: number = 5000): Promise<ImageInfo[]> {
    const allResults: ImageInfo[] = [];
    const styles: ArchitectureStyle[] = Object.keys(ARCHITECTURE_KEYWORDS) as ArchitectureStyle[];
    const imagesPerStyle = Math.ceil(targetTotal / styles.length); // 每種風格的目標數量
    const imagesPerSource = Math.ceil(imagesPerStyle / 4); // 每個來源的圖片數 (4個來源)
    
    console.log(`🎯 目標收集 ${targetTotal} 張建築圖片`);
    console.log(`📐 ${styles.length} 種建築風格，每種約 ${imagesPerStyle} 張`);
    console.log(`🔍 每個搜索來源目標: ${imagesPerSource} 張\n`);
    
    for (let styleIndex = 0; styleIndex < styles.length; styleIndex++) {
      const style = styles[styleIndex];
      console.log(`\n🏛️ [${styleIndex + 1}/${styles.length}] 收集 ${style} 風格 (目標: ${imagesPerStyle} 張)...`);
      
      let styleResults: ImageInfo[] = [];
      let attempts = 0;
      const maxAttempts = 3; // 每個來源最多嘗試3次
      
      // 1. Google Images - 主要來源
      for (let attempt = 0; attempt < maxAttempts && styleResults.length < imagesPerStyle; attempt++) {
        try {
          console.log(`📍 Google Images (第${attempt + 1}次)...`);
          const googleResults = await this.scrapeGoogleImages(style, imagesPerSource);
          styleResults.push(...googleResults);
          console.log(`   新增: ${googleResults.length} 張 | 累計: ${styleResults.length} 張`);
          await this.page?.waitForTimeout(3000);
        } catch (error) {
          console.error(`❌ Google搜索失敗 (第${attempt + 1}次):`, error);
        }
      }
      
      // 2. Unsplash
      for (let attempt = 0; attempt < maxAttempts && styleResults.length < imagesPerStyle; attempt++) {
        try {
          console.log(`📍 Unsplash (第${attempt + 1}次)...`);
          const unsplashResults = await this.scrapeUnsplash(style, imagesPerSource);
          styleResults.push(...unsplashResults);
          console.log(`   新增: ${unsplashResults.length} 張 | 累計: ${styleResults.length} 張`);
          await this.page?.waitForTimeout(2000);
        } catch (error) {
          console.error(`❌ Unsplash搜索失敗 (第${attempt + 1}次):`, error);
        }
      }
      
      // 3. Pexels
      for (let attempt = 0; attempt < maxAttempts && styleResults.length < imagesPerStyle; attempt++) {
        try {
          console.log(`📍 Pexels (第${attempt + 1}次)...`);
          const pexelsResults = await this.scrapePexels(style, imagesPerSource);
          styleResults.push(...pexelsResults);
          console.log(`   新增: ${pexelsResults.length} 張 | 累計: ${styleResults.length} 張`);
          await this.page?.waitForTimeout(2000);
        } catch (error) {
          console.error(`❌ Pexels搜索失敗 (第${attempt + 1}次):`, error);
        }
      }
      
      // 4. 額外搜索 - 如果還沒達到目標
      if (styleResults.length < imagesPerStyle) {
        try {
          console.log(`📍 額外搜索補強...`);
          const extraResults = await this.scrapeExtraKeywords(style, imagesPerStyle - styleResults.length);
          styleResults.push(...extraResults);
          console.log(`   額外新增: ${extraResults.length} 張 | 累計: ${styleResults.length} 張`);
        } catch (error) {
          console.error(`❌ 額外搜索失敗:`, error);
        }
      }
      
      // 去重複並添加到總結果
      const uniqueResults = this.removeDuplicates(styleResults);
      allResults.push(...uniqueResults);
      
      const progressPercent = ((styleIndex + 1) / styles.length * 100).toFixed(1);
      console.log(`✅ ${style} 完成: ${uniqueResults.length} 張圖片`);
      console.log(`📊 總進度: ${allResults.length}/${targetTotal} 張 (${progressPercent}%)`);
      
      // 如果已經達到目標數量，提前結束
      if (allResults.length >= targetTotal) {
        console.log(`🎉 提前達成目標！已收集 ${allResults.length} 張圖片`);
        break;
      }
    }
    
    console.log(`\n🏁 搜索階段完成！總共收集 ${allResults.length} 張圖片連結`);
    return allResults;
  }

  /**
   * 使用額外關鍵字進行補強搜索
   */
  async scrapeExtraKeywords(style: ArchitectureStyle, needed: number): Promise<ImageInfo[]> {
    const results: ImageInfo[] = [];
    const keywords = ARCHITECTURE_KEYWORDS[style];
    
    // 使用更多關鍵字變體
    const extraKeywords = keywords.slice(0, Math.min(10, keywords.length)).map(keyword => {
      return [
        `${keyword} exterior`,
        `${keyword} facade`,
        `${keyword} design`,
        `beautiful ${keyword}`,
        `famous ${keyword}`,
        `historic ${keyword}`,
        `${keyword} photography`,
        `${keyword} example`
      ];
    }).flat();
    
    for (const keyword of extraKeywords) {
      if (results.length >= needed) break;
      
      try {
        // 使用Google搜索這些額外關鍵字
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch&safe=active`;
        
        if (this.page) {
          await this.page.goto(searchUrl, { waitUntil: 'networkidle' });
          await this.page.waitForTimeout(2000);
          
          const images = await this.page.$$eval('img[src]', (imgs) => {
            return imgs.slice(0, 5).map(img => {
              const imgElement = img as HTMLImageElement;
              return {
                src: imgElement.src,
                alt: imgElement.alt || '',
                width: imgElement.width || 0,
                height: imgElement.height || 0
              };
            }).filter(img => 
              img.src.startsWith('http') && 
              img.width > 100 && 
              img.height > 100 &&
              !img.src.includes('logo') &&
              !img.src.includes('icon')
            );
          });
          
          for (const img of images) {
            if (results.length >= needed) break;
            
            results.push({
              src: img.src,
              alt: img.alt || `${style} architecture`,
              style,
              searchTerm: keyword
            });
          }
        }
      } catch (error) {
        // 忽略單個關鍵字的錯誤，繼續下一個
      }
      
      await this.page?.waitForTimeout(1000);
    }
    
    return results;
  }

  /**
   * 移除重複的圖片 URL
   */
  private removeDuplicates(images: ImageInfo[]): ImageInfo[] {
    const seen = new Set<string>();
    return images.filter(image => {
      if (seen.has(image.src)) {
        return false;
      }
      seen.add(image.src);
      return true;
    });
  }

  /**
   * 將圖片資訊保存到資料庫
   */
  async saveToDatabase(images: ImageInfo[]): Promise<void> {
    for (const image of images) {
      try {
        insertImage.run(image.src, image.alt, null); // localPath 稍後下載時填入
        console.log(`💾 已保存到資料庫: ${image.alt}`);
      } catch (error) {
        console.error('❌ 資料庫保存失敗:', error);
      }
    }
  }

  /**
   * 關閉瀏覽器
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

// 使用範例（如果直接運行此文件）
if (require.main === module) {
  async function main() {
    const scraper = new BuildingScraper();
    
    try {
      await scraper.init();
      
      // 收集所有風格的圖片
      const images = await scraper.scrapeAllStyles(5); // 每種風格5張
      
      console.log(`\n📊 總共收集了 ${images.length} 張圖片`);
      
      // 保存到資料庫
      await scraper.saveToDatabase(images);
      
    } catch (error) {
      console.error('❌ 運行失敗:', error);
    } finally {
      await scraper.close();
    }
  }
  
  main().catch(console.error);
}