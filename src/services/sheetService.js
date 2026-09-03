const config = require('../config');
const logger = require('../utils/logger');

class SheetService {
  constructor() {
    this.sheetId = config.SHEET_ID;
    this.cacheTTL = config.CACHE_TTL_MS || 300000; // 5 minutes
    this.cachedData = null;
    this.lastFetchTime = 0;
    this.fetchPromise = null;
    this.isRefreshing = false;
  }

  getExportUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv`;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('Google Sheet không có dữ liệu.');
    }

    const headers = this.parseCSVLine(lines[0]);
    let idColIndex = 5;
    const foundIndex = headers.findIndex(h => 
      h.toLowerCase().includes('định danh') || h.toLowerCase().includes('cccd')
    );
    if (foundIndex !== -1) {
      idColIndex = foundIndex;
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parsedRow = this.parseCSVLine(lines[i]);
      if (parsedRow.length > idColIndex) {
        rows.push(parsedRow);
      }
    }

    return { headers, rows, idColIndex };
  }

  async fetchSheetData() {
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        const url = this.getExportUrl();
        logger.info('Đang tải dữ liệu từ Google Sheet (server-side)...');
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Chatbot-THPT-Phuoc-Long/1.0'
          },
          redirect: 'follow'
        });

        if (!response.ok) {
          throw new Error(`Google Sheet HTTP Error: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        const parsed = this.parseCSV(csvText);
        this.cachedData = parsed;
        this.lastFetchTime = Date.now();
        logger.info(`Đã nạp thành công ${parsed.rows.length} hồ sơ học sinh vào bộ nhớ đệm.`);
        return parsed;
      } catch (err) {
        logger.error('Lỗi khi tải dữ liệu từ Google Sheet:', err.message);
        if (this.cachedData) {
          logger.warn('Duy trì dữ liệu bộ nhớ đệm trước đó.');
          return this.cachedData;
        }
        throw err;
      } finally {
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  // Stale-while-revalidate: Trả về dữ liệu đệm ngay lập tức nếu có, làm mới ngầm
  async getSheetData() {
    const now = Date.now();

    if (this.cachedData) {
      // Nếu hết hạn TTL và không bận làm mới -> kích hoạt làm mới chạy ngầm
      if (now - this.lastFetchTime > this.cacheTTL && !this.isRefreshing) {
        this.isRefreshing = true;
        this.fetchSheetData()
          .catch(err => logger.warn('Làm mới ngầm thất bại:', err.message))
          .finally(() => { this.isRefreshing = false; });
      }
      return this.cachedData;
    }

    // Chưa có dữ liệu lần đầu -> buộc phải tải
    return await this.fetchSheetData();
  }

  async lookupByCCCD(cccd) {
    if (!cccd || typeof cccd !== 'string') {
      return {
        ok: false,
        code: 'INVALID_FORMAT',
        message: 'Vui lòng nhập đúng 12 chữ số căn cước công dân.'
      };
    }

    const targetCCCD = cccd.trim();
    if (!/^\d{12}$/.test(targetCCCD)) {
      return {
        ok: false,
        code: 'INVALID_FORMAT',
        message: 'Vui lòng nhập đúng 12 chữ số căn cước công dân.'
      };
    }

    const masked = logger.maskCCCD(targetCCCD);
    logger.info(`Thực hiện tra cứu CCCD: ${masked}`);

    let data;
    try {
      data = await this.getSheetData();
    } catch (err) {
      logger.error(`Tra cứu thất bại do nguồn dữ liệu cho CCCD ${masked}:`, err.message);
      return {
        ok: false,
        code: 'DATA_SOURCE_ERROR',
        message: 'Hệ thống tạm thời chưa truy cập được dữ liệu. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
      };
    }

    const { headers, rows, idColIndex } = data;

    // So khớp chính xác 100% cột F (Số định danh cá nhân)
    const matches = [];
    for (const row of rows) {
      const val = (row[idColIndex] || '').trim();
      if (val === targetCCCD) {
        matches.push(row);
      }
    }

    if (matches.length === 0) {
      logger.info(`Không tìm thấy hồ sơ cho CCCD: ${masked}`);
      return {
        ok: false,
        code: 'NOT_FOUND',
        message: 'Không tìm thấy hồ sơ phù hợp với số căn cước công dân đã nhập.'
      };
    }

    if (matches.length > 1) {
      logger.warn(`Phát hiện bản ghi trùng lặp cho CCCD: ${masked} (${matches.length} bản ghi)`);
      return {
        ok: false,
        code: 'DUPLICATE_ID',
        message: 'Dữ liệu có bản ghi trùng Số định danh cá nhân. Vui lòng liên hệ quản trị viên.'
      };
    }

    // Khớp chính xác 1 hồ sơ
    const matchedRow = matches[0];
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = matchedRow[idx] || '';
    });

    const idKey = headers[idColIndex];
    record[idKey] = masked;

    logger.info(`Tìm thấy hồ sơ thành công cho CCCD: ${masked} (Học sinh: ${record['Họ tên'] || 'N/A'})`);

    return {
      ok: true,
      code: 'FOUND',
      message: 'Đã tìm thấy hồ sơ. Thông tin của bạn như sau:',
      student: record,
      maskedCCCD: masked
    };
  }
}

module.exports = new SheetService();
