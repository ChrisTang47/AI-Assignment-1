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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor(logFile = './collection_log.txt') {
        this.logFile = logFile;
    }
    /**
     * 記錄日誌到文件和控制台
     */
    log(message_1) {
        return __awaiter(this, arguments, void 0, function* (message, type = 'INFO') {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${type}] ${message}`;
            // 輸出到控制台
            switch (type) {
                case 'ERROR':
                    console.error(logMessage);
                    break;
                case 'SUCCESS':
                    console.log(`✅ ${message}`);
                    break;
                case 'WARNING':
                    console.warn(`⚠️ ${message}`);
                    break;
                default:
                    console.log(message);
            }
            // 寫入日誌文件
            try {
                const fs = yield Promise.resolve().then(() => __importStar(require('fs/promises')));
                yield fs.appendFile(this.logFile, logMessage + '\n');
            }
            catch (error) {
                console.error('無法寫入日誌文件:', error);
            }
        });
    }
    /**
     * 記錄統計信息
     */
    logStats(stats) {
        return __awaiter(this, void 0, void 0, function* () {
            const statsMessage = `統計信息: ${JSON.stringify(stats, null, 2)}`;
            yield this.log(statsMessage, 'INFO');
        });
    }
    /**
     * 清空日誌文件
     */
    clearLog() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fs = yield Promise.resolve().then(() => __importStar(require('fs/promises')));
                yield fs.writeFile(this.logFile, '');
                yield this.log('日誌已清空', 'INFO');
            }
            catch (error) {
                console.error('無法清空日誌文件:', error);
            }
        });
    }
}
exports.Logger = Logger;
