"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingScraper = void 0;
const playwright_1 = require("playwright");
const database_1 = require("./database");
// 建築風格搜索關鍵詞 - 大幅擴展版本以獲得5000+張圖片
const ARCHITECTURE_KEYWORDS = {
    modern: [
        // 現代建築基本詞
        'modern architecture', 'modern building', 'contemporary architecture', 'modern design',
        'modern office building', 'modern skyscraper', 'modern tower', 'modern residential',
        'glass building', 'steel architecture', 'concrete building', 'modern facade',
        'modern apartment', 'modern house', 'modern villa', 'modern museum',
        'modern library', 'modern hotel', 'modern shopping center', 'modern hospital',
        // 風格特徵
        'curtain wall building', 'glass facade', 'steel frame', 'geometric building',
        'high-rise building', 'urban architecture', 'commercial building', 'office tower',
        'modern construction', 'contemporary design', 'architectural innovation', 'futuristic building',
        'modern engineering', 'sustainable building', 'green building', 'eco architecture',
        // 地域性
        'modern city building', 'metropolitan architecture', 'urban development', 'modern plaza',
        'business district', 'financial center', 'modern landmark', 'architectural masterpiece',
        'modern civic building', 'modern infrastructure', 'modern complex', 'modern structure'
    ],
    classical: [
        // 古典建築基本詞
        'classical architecture', 'neoclassical building', 'classical design', 'ancient architecture',
        'greek architecture', 'roman architecture', 'classical temple', 'classical palace',
        'classical mansion', 'classical government building', 'classical university', 'classical museum',
        'classical library', 'classical courthouse', 'classical bank building', 'classical monument',
        // 建築元素
        'doric columns', 'ionic columns', 'corinthian columns', 'classical columns',
        'pediment', 'portico', 'classical dome', 'classical arch', 'stone columns',
        'marble building', 'classical facade', 'classical entrance', 'symmetrical building',
        'classical proportions', 'classical orders', 'entablature', 'classical frieze',
        // 歷史和地域
        'ancient greek building', 'roman temple', 'pantheon style', 'parthenon architecture',
        'european classical', 'american neoclassical', 'federal style', 'georgian architecture',
        'colonial architecture', 'classical revival', 'beaux arts', 'academic architecture',
        'institutional building', 'ceremonial architecture', 'monumental building', 'classical heritage'
    ],
    gothic: [
        // 哥德式基本詞
        'gothic architecture', 'gothic cathedral', 'gothic church', 'medieval architecture',
        'gothic building', 'gothic style', 'neo-gothic', 'gothic revival',
        'cathedral architecture', 'church architecture', 'abbey architecture', 'monastery building',
        'gothic tower', 'bell tower', 'church spire', 'cathedral spire',
        // 建築特徵
        'pointed arch', 'ribbed vault', 'flying buttresses', 'rose window',
        'gothic windows', 'stained glass', 'gothic tracery', 'stone carving',
        'gothic facade', 'church entrance', 'cathedral door', 'gothic portal',
        'medieval stonework', 'gothic ornament', 'church interior', 'vaulted ceiling',
        // 歷史和地域
        'french gothic', 'english gothic', 'german gothic', 'italian gothic',
        'early gothic', 'high gothic', 'late gothic', 'perpendicular gothic',
        'decorated gothic', 'rayonnant gothic', 'flamboyant gothic', 'tudor gothic',
        'collegiate gothic', 'ecclesiastical architecture', 'religious building', 'sacred architecture'
    ],
    baroque: [
        // 巴洛克基本詞
        'baroque architecture', 'baroque building', 'baroque palace', 'baroque church',
        'baroque style', 'ornate architecture', 'decorative building', 'elaborate architecture',
        'baroque facade', 'baroque interior', 'baroque decoration', 'baroque ornament',
        'rococo architecture', 'rococo building', 'rococo palace', 'rococo decoration',
        // 建築類型
        'baroque cathedral', 'baroque basilica', 'baroque monastery', 'baroque convent',
        'palace architecture', 'royal palace', 'aristocratic mansion', 'noble residence',
        'baroque villa', 'country house', 'baroque theater', 'opera house',
        'baroque library', 'baroque university', 'baroque hospital', 'baroque fountain',
        // 地域和時期
        'italian baroque', 'french baroque', 'spanish baroque', 'german baroque',
        'austrian baroque', 'bohemian baroque', 'portuguese baroque', 'colonial baroque',
        'high baroque', 'late baroque', 'baroque revival', 'neo-baroque',
        'counter-reformation', 'absolutist architecture', 'ceremonial building', 'grandeur architecture'
    ],
    renaissance: [
        // 文藝復興基本詞
        'renaissance architecture', 'renaissance building', 'renaissance palace', 'renaissance villa',
        'renaissance church', 'renaissance mansion', 'renaissance design', 'renaissance style',
        'italian renaissance', 'florentine architecture', 'venetian architecture', 'roman renaissance',
        'high renaissance', 'early renaissance', 'late renaissance', 'northern renaissance',
        // 建築特徵
        'renaissance dome', 'renaissance facade', 'renaissance courtyard', 'renaissance loggia',
        'classical proportions', 'symmetrical design', 'renaissance arch', 'renaissance window',
        'renaissance door', 'rusticated facade', 'pilaster', 'renaissance ornament',
        'humanist architecture', 'rational design', 'geometric harmony', 'classical revival',
        // 建築師和地域
        'palladian architecture', 'brunelleschi style', 'bramante design', 'michelangelo architecture',
        'venetian palazzo', 'florentine palazzo', 'tuscan villa', 'lombard architecture',
        'french renaissance', 'english renaissance', 'flemish renaissance', 'german renaissance',
        'renaissance castle', 'renaissance monastery', 'renaissance hospital', 'renaissance university'
    ],
    contemporary: [
        // 當代建築基本詞
        'contemporary architecture', 'contemporary building', 'contemporary design', 'current architecture',
        'today architecture', 'recent building', 'new architecture', 'latest design',
        'contemporary house', 'contemporary office', 'contemporary museum', 'contemporary library',
        'contemporary hotel', 'contemporary apartment', 'contemporary residential', 'contemporary commercial',
        // 設計特徵
        'innovative architecture', 'experimental building', 'cutting-edge design', 'avant-garde architecture',
        'parametric architecture', 'digital architecture', 'computational design', 'algorithmic architecture',
        'sustainable architecture', 'green architecture', 'eco-friendly building', 'energy efficient',
        'smart building', 'intelligent architecture', 'responsive architecture', 'adaptive building',
        // 材料和技術
        'high-tech architecture', 'steel and glass', 'composite materials', 'innovative construction',
        'prefab architecture', 'modular building', 'tensile structure', 'membrane architecture',
        'cable-stayed', 'cantilever structure', 'space frame', 'geodesic architecture',
        'biomimetic architecture', 'organic architecture', 'fluid architecture', 'dynamic facade'
    ],
    minimalist: [
        // 極簡主義基本詞
        'minimalist architecture', 'minimal building', 'simple architecture', 'clean design',
        'minimalist house', 'minimal design', 'simple building', 'bare architecture',
        'stripped architecture', 'essential architecture', 'pure architecture', 'basic building',
        'geometric building', 'cubic architecture', 'rectangular building', 'linear architecture',
        // 設計特徵
        'white building', 'monochrome architecture', 'neutral colors', 'simple geometry',
        'clean lines', 'smooth surfaces', 'flat roof', 'large windows',
        'open space', 'uncluttered design', 'functional architecture', 'rational design',
        'elementary architecture', 'primary forms', 'simple volumes', 'abstract architecture',
        // 材料和風格
        'concrete minimalism', 'glass minimalism', 'steel minimalism', 'wood minimalism',
        'stone minimalism', 'modern simplicity', 'architectural reduction', 'less is more',
        'zen architecture', 'japanese minimalism', 'scandinavian minimalism', 'nordic architecture',
        'bauhaus influence', 'modernist simplicity', 'industrial minimalism', 'urban minimalism'
    ],
    'art-deco': [
        // 裝飾藝術基本詞
        'art deco architecture', 'art deco building', 'deco style', '1920s architecture',
        '1930s building', 'jazz age architecture', 'machine age building', 'streamline moderne',
        'art deco skyscraper', 'art deco hotel', 'art deco cinema', 'art deco theater',
        'art deco apartment', 'art deco office', 'art deco store', 'art deco restaurant',
        // 設計特徵
        'geometric decoration', 'zigzag pattern', 'sunburst design', 'stepped form',
        'chevron pattern', 'stylized ornament', 'metallic finish', 'chrome details',
        'curved corners', 'horizontal lines', 'vertical emphasis', 'streamlined form',
        'speed lines', 'fountain design', 'neon signs', 'glass brick',
        // 地域和影響
        'new york deco', 'miami deco', 'chicago deco', 'hollywood deco',
        'ocean drive style', 'chrysler building style', 'empire state style', 'rockefeller style',
        'egyptian revival', 'aztec influence', 'mayan motifs', 'african patterns',
        'machine aesthetic', 'industrial design', 'transportation design', 'luxury architecture'
    ]
};
class BuildingScraper {
    constructor() {
        this.browser = null;
        this.page = null;
    }
    /**
     * 初始化瀏覽器
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.browser = yield playwright_1.chromium.launch({
                headless: false, // 設為 true 可加快速度
                slowMo: 1000 // 減慢操作速度避免被偵測
            });
            this.page = yield this.browser.newPage();
            // 設置用戶代理避免被偵測為機器人
            yield this.page.setExtraHTTPHeaders({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            });
        });
    }
    /**
     * 從 Unsplash 搜索建築圖片 - 增強版
     */
    scrapeUnsplash(style_1) {
        return __awaiter(this, arguments, void 0, function* (style, maxImages = 50) {
            if (!this.page)
                throw new Error('Scraper not initialized');
            const results = [];
            const keywords = ARCHITECTURE_KEYWORDS[style];
            const keywordsToUse = Math.min(15, keywords.length); // 使用更多關鍵字
            for (let i = 0; i < keywordsToUse && results.length < maxImages; i++) {
                const keyword = keywords[i];
                try {
                    const searchUrl = `https://unsplash.com/s/photos/${encodeURIComponent(keyword)}`;
                    yield this.page.goto(searchUrl, { waitUntil: 'networkidle' });
                    yield this.page.waitForTimeout(1500);
                    // 滾動加載更多圖片
                    for (let scroll = 0; scroll < 3; scroll++) {
                        yield this.page.evaluate(() => {
                            window.scrollBy(0, 1000);
                        });
                        yield this.page.waitForTimeout(1000);
                    }
                    // 獲取圖片元素
                    const images = yield this.page.$$eval('img[srcset]', (imgs) => {
                        return imgs.slice(0, 15).map(img => {
                            const imgElement = img;
                            return {
                                src: imgElement.src,
                                alt: imgElement.alt || '',
                                srcset: imgElement.getAttribute('srcset') || ''
                            };
                        }).filter(img => img.src &&
                            img.src.includes('unsplash') &&
                            !img.src.includes('profile') &&
                            !img.src.includes('avatar'));
                    });
                    // 處理每張圖片
                    for (const img of images) {
                        if (results.length >= maxImages)
                            break;
                        const highQualityUrl = this.extractHighQualityUrl(img.srcset) || img.src;
                        results.push({
                            src: highQualityUrl,
                            alt: img.alt || `${style} architecture building`,
                            style,
                            searchTerm: keyword
                        });
                    }
                }
                catch (error) {
                    console.error(`❌ Unsplash搜索失敗: ${keyword}`, error);
                }
            }
            return results;
        });
    }
    /**
     * 從 Pexels 搜索建築圖片 - 增強版
     */
    scrapePexels(style_1) {
        return __awaiter(this, arguments, void 0, function* (style, maxImages = 60) {
            if (!this.page)
                throw new Error('Scraper not initialized');
            const results = [];
            const keywords = ARCHITECTURE_KEYWORDS[style];
            const keywordsToUse = Math.min(12, keywords.length);
            for (let i = 0; i < keywordsToUse && results.length < maxImages; i++) {
                const keyword = keywords[i];
                try {
                    const searchUrl = `https://www.pexels.com/search/${encodeURIComponent(keyword)}/`;
                    yield this.page.goto(searchUrl, { waitUntil: 'networkidle' });
                    yield this.page.waitForTimeout(1500);
                    // 滾動加載更多圖片
                    for (let scroll = 0; scroll < 4; scroll++) {
                        yield this.page.evaluate(() => {
                            window.scrollBy(0, 1200);
                        });
                        yield this.page.waitForTimeout(1000);
                    }
                    // 獲取圖片元素
                    const images = yield this.page.$$eval('img[srcset]', (imgs) => {
                        return imgs.slice(0, 20).map(img => {
                            const imgElement = img;
                            return {
                                src: imgElement.src,
                                alt: imgElement.alt || '',
                                srcset: imgElement.getAttribute('srcset') || ''
                            };
                        }).filter(img => img.src &&
                            img.src.includes('pexels') &&
                            !img.src.includes('profile') &&
                            !img.src.includes('avatar') &&
                            img.srcset);
                    });
                    // 處理每張圖片
                    for (const img of images) {
                        if (results.length >= maxImages)
                            break;
                        const highQualityUrl = this.extractHighQualityUrl(img.srcset) || img.src;
                        results.push({
                            src: highQualityUrl,
                            alt: img.alt || `${style} architecture building`,
                            style,
                            searchTerm: keyword
                        });
                    }
                }
                catch (error) {
                    console.error(`❌ Pexels搜索失敗: ${keyword}`, error);
                }
            }
            return results;
        });
    }
    /**
     * 從 Google Images 搜索建築圖片 - 增強版
     */
    scrapeGoogleImages(style_1) {
        return __awaiter(this, arguments, void 0, function* (style, maxImages = 100) {
            if (!this.page)
                throw new Error('Scraper not initialized');
            const results = [];
            const keywords = ARCHITECTURE_KEYWORDS[style];
            const keywordsToUse = Math.min(20, keywords.length); // 使用更多關鍵字
            for (let i = 0; i < keywordsToUse && results.length < maxImages; i++) {
                const keyword = keywords[i];
                try {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch&safe=active&tbs=isz:l`; // 添加大圖過濾
                    yield this.page.goto(searchUrl, { waitUntil: 'networkidle' });
                    yield this.page.waitForTimeout(2000);
                    // 更積極的滾動加載
                    for (let scroll = 0; scroll < 5; scroll++) {
                        yield this.page.evaluate(() => {
                            window.scrollBy(0, 1500);
                        });
                        yield this.page.waitForTimeout(800);
                    }
                    // 嘗試點擊"顯示更多結果"按鈕
                    try {
                        yield this.page.click('input[value="顯示更多結果"], input[value="Show more results"]', { timeout: 2000 });
                        yield this.page.waitForTimeout(2000);
                        // 再滾動一次
                        for (let scroll = 0; scroll < 3; scroll++) {
                            yield this.page.evaluate(() => {
                                window.scrollBy(0, 1000);
                            });
                            yield this.page.waitForTimeout(1000);
                        }
                    }
                    catch (_a) {
                        // 忽略按鈕點擊失敗
                    }
                    // 獲取圖片元素
                    const images = yield this.page.$$eval('img[src]', (imgs) => {
                        return imgs.slice(0, 30).map(img => {
                            const imgElement = img;
                            return {
                                src: imgElement.src,
                                alt: imgElement.alt || '',
                                width: imgElement.width || 0,
                                height: imgElement.height || 0
                            };
                        }).filter(img => {
                            // 更嚴格的過濾條件
                            const isValidUrl = img.src.startsWith('http') || img.src.startsWith('data:');
                            const hasGoodSize = img.width > 150 && img.height > 150;
                            const notIcon = !img.src.includes('logo') &&
                                !img.src.includes('icon') &&
                                !img.src.includes('button') &&
                                !img.src.includes('avatar') &&
                                !img.src.includes('profile');
                            const notGoogle = !img.src.includes('google') || img.src.includes('googleusercontent');
                            return isValidUrl && hasGoodSize && notIcon && notGoogle;
                        });
                    });
                    // 處理每張圖片
                    for (const img of images) {
                        if (results.length >= maxImages)
                            break;
                        results.push({
                            src: img.src,
                            alt: img.alt || `${style} architecture building`,
                            style,
                            searchTerm: keyword
                        });
                    }
                }
                catch (error) {
                    console.error(`❌ Google Images搜索失敗: ${keyword}`, error);
                }
                // 適當延遲避免封鎖
                yield this.page.waitForTimeout(2000);
            }
            return results;
        });
    }
    /**
     * 從 srcset 提取最高質量的圖片 URL
     */
    extractHighQualityUrl(srcset) {
        if (!srcset)
            return null;
        const urls = srcset.split(',').map(url => {
            const [src, size] = url.trim().split(' ');
            return { src, size: size ? parseInt(size) : 0 };
        });
        // 選擇最大尺寸的圖片
        const highestQuality = urls.reduce((prev, current) => current.size > prev.size ? current : prev);
        return highestQuality.src;
    }
    /**
     * 搜索所有建築風格的圖片 - 增強版，目標 5000+ 張
     */
    scrapeAllStyles() {
        return __awaiter(this, arguments, void 0, function* (targetTotal = 5000) {
            var _a, _b, _c;
            const allResults = [];
            const styles = Object.keys(ARCHITECTURE_KEYWORDS);
            const imagesPerStyle = Math.ceil(targetTotal / styles.length); // 每種風格的目標數量
            const imagesPerSource = Math.ceil(imagesPerStyle / 4); // 每個來源的圖片數 (4個來源)
            console.log(`🎯 目標收集 ${targetTotal} 張建築圖片`);
            console.log(`📐 ${styles.length} 種建築風格，每種約 ${imagesPerStyle} 張`);
            console.log(`🔍 每個搜索來源目標: ${imagesPerSource} 張\n`);
            for (let styleIndex = 0; styleIndex < styles.length; styleIndex++) {
                const style = styles[styleIndex];
                console.log(`\n🏛️ [${styleIndex + 1}/${styles.length}] 收集 ${style} 風格 (目標: ${imagesPerStyle} 張)...`);
                let styleResults = [];
                let attempts = 0;
                const maxAttempts = 3; // 每個來源最多嘗試3次
                // 1. Google Images - 主要來源
                for (let attempt = 0; attempt < maxAttempts && styleResults.length < imagesPerStyle; attempt++) {
                    try {
                        console.log(`📍 Google Images (第${attempt + 1}次)...`);
                        const googleResults = yield this.scrapeGoogleImages(style, imagesPerSource);
                        styleResults.push(...googleResults);
                        console.log(`   新增: ${googleResults.length} 張 | 累計: ${styleResults.length} 張`);
                        yield ((_a = this.page) === null || _a === void 0 ? void 0 : _a.waitForTimeout(3000));
                    }
                    catch (error) {
                        console.error(`❌ Google搜索失敗 (第${attempt + 1}次):`, error);
                    }
                }
                // 2. Unsplash
                for (let attempt = 0; attempt < maxAttempts && styleResults.length < imagesPerStyle; attempt++) {
                    try {
                        console.log(`📍 Unsplash (第${attempt + 1}次)...`);
                        const unsplashResults = yield this.scrapeUnsplash(style, imagesPerSource);
                        styleResults.push(...unsplashResults);
                        console.log(`   新增: ${unsplashResults.length} 張 | 累計: ${styleResults.length} 張`);
                        yield ((_b = this.page) === null || _b === void 0 ? void 0 : _b.waitForTimeout(2000));
                    }
                    catch (error) {
                        console.error(`❌ Unsplash搜索失敗 (第${attempt + 1}次):`, error);
                    }
                }
                // 3. Pexels
                for (let attempt = 0; attempt < maxAttempts && styleResults.length < imagesPerStyle; attempt++) {
                    try {
                        console.log(`📍 Pexels (第${attempt + 1}次)...`);
                        const pexelsResults = yield this.scrapePexels(style, imagesPerSource);
                        styleResults.push(...pexelsResults);
                        console.log(`   新增: ${pexelsResults.length} 張 | 累計: ${styleResults.length} 張`);
                        yield ((_c = this.page) === null || _c === void 0 ? void 0 : _c.waitForTimeout(2000));
                    }
                    catch (error) {
                        console.error(`❌ Pexels搜索失敗 (第${attempt + 1}次):`, error);
                    }
                }
                // 4. 額外搜索 - 如果還沒達到目標
                if (styleResults.length < imagesPerStyle) {
                    try {
                        console.log(`📍 額外搜索補強...`);
                        const extraResults = yield this.scrapeExtraKeywords(style, imagesPerStyle - styleResults.length);
                        styleResults.push(...extraResults);
                        console.log(`   額外新增: ${extraResults.length} 張 | 累計: ${styleResults.length} 張`);
                    }
                    catch (error) {
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
        });
    }
    /**
     * 使用額外關鍵字進行補強搜索
     */
    scrapeExtraKeywords(style, needed) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const results = [];
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
                if (results.length >= needed)
                    break;
                try {
                    // 使用Google搜索這些額外關鍵字
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch&safe=active`;
                    if (this.page) {
                        yield this.page.goto(searchUrl, { waitUntil: 'networkidle' });
                        yield this.page.waitForTimeout(2000);
                        const images = yield this.page.$$eval('img[src]', (imgs) => {
                            return imgs.slice(0, 5).map(img => {
                                const imgElement = img;
                                return {
                                    src: imgElement.src,
                                    alt: imgElement.alt || '',
                                    width: imgElement.width || 0,
                                    height: imgElement.height || 0
                                };
                            }).filter(img => img.src.startsWith('http') &&
                                img.width > 100 &&
                                img.height > 100 &&
                                !img.src.includes('logo') &&
                                !img.src.includes('icon'));
                        });
                        for (const img of images) {
                            if (results.length >= needed)
                                break;
                            results.push({
                                src: img.src,
                                alt: img.alt || `${style} architecture`,
                                style,
                                searchTerm: keyword
                            });
                        }
                    }
                }
                catch (error) {
                    // 忽略單個關鍵字的錯誤，繼續下一個
                }
                yield ((_a = this.page) === null || _a === void 0 ? void 0 : _a.waitForTimeout(1000));
            }
            return results;
        });
    }
    /**
     * 移除重複的圖片 URL
     */
    removeDuplicates(images) {
        const seen = new Set();
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
    saveToDatabase(images) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const image of images) {
                try {
                    database_1.insertImage.run(image.src, image.alt, null); // localPath 稍後下載時填入
                    console.log(`💾 已保存到資料庫: ${image.alt}`);
                }
                catch (error) {
                    console.error('❌ 資料庫保存失敗:', error);
                }
            }
        });
    }
    /**
     * 關閉瀏覽器
     */
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser) {
                yield this.browser.close();
                this.browser = null;
                this.page = null;
            }
        });
    }
}
exports.BuildingScraper = BuildingScraper;
// 使用範例（如果直接運行此文件）
if (require.main === module) {
    function main() {
        return __awaiter(this, void 0, void 0, function* () {
            const scraper = new BuildingScraper();
            try {
                yield scraper.init();
                // 收集所有風格的圖片
                const images = yield scraper.scrapeAllStyles(5); // 每種風格5張
                console.log(`\n📊 總共收集了 ${images.length} 張圖片`);
                // 保存到資料庫
                yield scraper.saveToDatabase(images);
            }
            catch (error) {
                console.error('❌ 運行失敗:', error);
            }
            finally {
                yield scraper.close();
            }
        });
    }
    main().catch(console.error);
}
