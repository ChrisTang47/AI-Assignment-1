"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const collect_1 = require("./collect");
const sharp_1 = __importDefault(require("sharp"));
const fs = __importStar(require("fs/promises"));
/**
 * 測試圖片處理功能
 */
function testImageProcessing() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🧪 開始測試圖片處理功能...\n');
        const collector = new collect_1.ImageCollector('./test_output');
        yield collector.createDirectories();
        // 創建一個測試用的大圖片
        const testImagePath = './test_large_image.jpg';
        try {
            // 生成一個大於500x500的測試圖片
            console.log('📸 創建測試圖片...');
            yield (0, sharp_1.default)({
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
            const originalStats = yield fs.stat(testImagePath);
            const originalMetadata = yield (0, sharp_1.default)(testImagePath).metadata();
            console.log(`📏 原始圖片: ${originalMetadata.width}x${originalMetadata.height}`);
            console.log(`📦 原始大小: ${(originalStats.size / 1024).toFixed(2)}KB\n`);
            // 測試處理功能
            console.log('🔧 測試圖片處理...');
            const processedPath = yield collector.processImage(testImagePath, 'modern', 0);
            if (processedPath) {
                // 檢查處理後的文件
                const processedStats = yield fs.stat(processedPath);
                const processedMetadata = yield (0, sharp_1.default)(processedPath).metadata();
                console.log('\n📊 處理結果:');
                console.log(`📏 處理後尺寸: ${processedMetadata.width}x${processedMetadata.height}`);
                console.log(`📦 處理後大小: ${(processedStats.size / 1024).toFixed(2)}KB`);
                // 驗證要求
                const sizeOK = processedMetadata.width <= 500 && processedMetadata.height <= 500;
                const fileSizeOK = (processedStats.size / 1024) <= 50;
                console.log(`\n✅ 檢查結果:`);
                console.log(`   尺寸要求 (≤500x500): ${sizeOK ? '✅ 通過' : '❌ 失敗'}`);
                console.log(`   文件大小 (≤50KB): ${fileSizeOK ? '✅ 通過' : '❌ 失敗'}`);
                if (sizeOK && fileSizeOK) {
                    console.log('\n🎉 測試通過！圖片處理功能正常工作。');
                }
                else {
                    console.log('\n❌ 測試失敗！需要修復圖片處理功能。');
                }
            }
            else {
                console.log('❌ 圖片處理失敗');
            }
        }
        catch (error) {
            console.error('❌ 測試出錯:', error);
        }
        finally {
            // 清理測試文件
            yield fs.unlink(testImagePath).catch(() => { });
        }
    });
}
// 如果直接執行此文件
if (require.main === module) {
    testImageProcessing().catch(console.error);
}
