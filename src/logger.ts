export class Logger {
  private logFile: string;
  
  constructor(logFile: string = './collection_log.txt') {
    this.logFile = logFile;
  }

  /**
   * 記錄日誌到文件和控制台
   */
  async log(message: string, type: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARNING' = 'INFO'): Promise<void> {
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
      const fs = await import('fs/promises');
      await fs.appendFile(this.logFile, logMessage + '\n');
    } catch (error) {
      console.error('無法寫入日誌文件:', error);
    }
  }

  /**
   * 記錄統計信息
   */
  async logStats(stats: Record<string, any>): Promise<void> {
    const statsMessage = `統計信息: ${JSON.stringify(stats, null, 2)}`;
    await this.log(statsMessage, 'INFO');
  }

  /**
   * 清空日誌文件
   */
  async clearLog(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(this.logFile, '');
      await this.log('日誌已清空', 'INFO');
    } catch (error) {
      console.error('無法清空日誌文件:', error);
    }
  }
}