const test = require('node:test');
const assert = require('node:assert/strict');
const sheetService = require('../src/services/sheetService');

test('SheetService: Phân tích CSV chính xác dòng có ngoặc kép và dấu phẩy', () => {
  const line = '1,"Nguyễn Văn A, Jr.",01/01/2011,Nam,,079123456789,"Bộ Công An, Cục C06",10A1';
  const parsed = sheetService.parseCSVLine(line);
  assert.equal(parsed[0], '1');
  assert.equal(parsed[1], 'Nguyễn Văn A, Jr.');
  assert.equal(parsed[5], '079123456789');
  assert.equal(parsed[6], 'Bộ Công An, Cục C06');
});

test('SheetService: Tra cứu CCCD có thật trong Google Sheet (079311029797)', async () => {
  const result = await sheetService.lookupByCCCD('079311029797');
  assert.equal(result.ok, true);
  assert.equal(result.code, 'FOUND');
  assert.ok(result.student);
  assert.equal(result.student['Họ tên'], 'Nguyễn Ngọc Mai An');
  assert.equal(result.student['Ngày sinh'], '09/02/2011');
  assert.equal(result.student['Giới tính'], 'Nữ');
  assert.equal(result.student['Lớp học (26-27)'], '10A1');
  assert.equal(result.maskedCCCD, '********9797');
});

test('SheetService: Tra cứu CCCD không tồn tại (999999999999) -> NOT_FOUND', async () => {
  const result = await sheetService.lookupByCCCD('999999999999');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'NOT_FOUND');
  assert.equal(result.message, 'Không tìm thấy hồ sơ phù hợp với số căn cước công dân đã nhập.');
});

test('SheetService: Xử lý bản ghi trùng lặp (DUPLICATE_ID)', async () => {
  // Giả lập dữ liệu có 2 dòng cùng CCCD
  const duplicateCCCD = '012345678901';
  const fakeData = {
    headers: ['STT', 'Họ tên', 'Ngày sinh', 'Giới tính', 'Dân tộc', 'Số định danh cá nhân'],
    rows: [
      ['1', 'Học sinh 1', '01/01/2011', 'Nam', 'Kinh', duplicateCCCD],
      ['2', 'Học sinh 2', '02/02/2011', 'Nữ', 'Kinh', duplicateCCCD]
    ],
    idColIndex: 5
  };

  const originalFetch = sheetService.fetchSheetData;
  sheetService.fetchSheetData = async () => fakeData;

  try {
    const result = await sheetService.lookupByCCCD(duplicateCCCD);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'DUPLICATE_ID');
    assert.equal(result.message, 'Dữ liệu có bản ghi trùng Số định danh cá nhân. Vui lòng liên hệ quản trị viên.');
  } finally {
    sheetService.fetchSheetData = originalFetch;
  }
});
