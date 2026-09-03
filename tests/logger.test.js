const test = require('node:test');
const assert = require('node:assert/strict');
const logger = require('../src/utils/logger');

test('Logger: Che 8 số đầu của CCCD, chỉ hiển thị 4 số cuối', () => {
  assert.equal(logger.maskCCCD('079311029797'), '********9797');
  assert.equal(logger.maskCCCD('001311023242'), '********3242');
  assert.equal(logger.maskCCCD('123'), '********');
  assert.equal(logger.maskCCCD(null), '********');
  assert.equal(logger.maskCCCD(undefined), '********');
});

test('Logger: Tự động che chuỗi 12 chữ số trong thông điệp', () => {
  let loggedOutput = '';
  const originalLog = console.log;
  console.log = (msg) => { loggedOutput = msg; };

  try {
    logger.info('Tra cứu số CCCD 079311029797 cho học sinh');
    assert.equal(loggedOutput.includes('079311029797'), false, 'Không được để lộ đầy đủ 12 số CCCD');
    assert.equal(loggedOutput.includes('********9797'), true, 'Phải che thành ********9797');
  } finally {
    console.log = originalLog;
  }
});
