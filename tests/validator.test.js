const test = require('node:test');
const assert = require('node:assert/strict');
const { CCCD_REGEX, validateCCCD } = require('../src/middlewares/validator');

test('Validator: Regex kiểm tra đúng 12 chữ số', () => {
  // Hợp lệ
  assert.equal(CCCD_REGEX.test('079311029797'), true);
  assert.equal(CCCD_REGEX.test('001311023242'), true);
  assert.equal(CCCD_REGEX.test('000000000000'), true);

  // Không hợp lệ
  assert.equal(CCCD_REGEX.test('07931102979'), false, '11 số phải bị từ chối');
  assert.equal(CCCD_REGEX.test('0793110297971'), false, '13 số phải bị từ chối');
  assert.equal(CCCD_REGEX.test('07931102979a'), false, 'Có chữ cái phải bị từ chối');
  assert.equal(CCCD_REGEX.test('Nguyễn Văn A'), false, 'Họ tên phải bị từ chối');
  assert.equal(CCCD_REGEX.test('10A1'), false, 'Tên lớp phải bị từ chối');
  assert.equal(CCCD_REGEX.test('0793-1102-9797'), false, 'Có dấu gạch ngang phải bị từ chối');
  assert.equal(CCCD_REGEX.test(''), false, 'Chuỗi rỗng phải bị từ chối');
  assert.equal(CCCD_REGEX.test('   '), false, 'Khoảng trắng phải bị từ chối');
  assert.equal(CCCD_REGEX.test('*'), false, 'Wildcard phải bị từ chối');
});

test('Validator: Middleware validateCCCD', () => {
  let statusCode = 200;
  let jsonResponse = null;
  let nextCalled = false;

  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          jsonResponse = data;
        }
      };
    }
  };

  const next = () => { nextCalled = true; };

  // Trường hợp hợp lệ
  const reqValid = { body: { cccd: '079311029797' } };
  validateCCCD(reqValid, res, next);
  assert.equal(nextCalled, true);
  assert.equal(reqValid.sanitizedCCCD, '079311029797');

  // Trường hợp không hợp lệ: tên
  nextCalled = false;
  const reqInvalid = { body: { cccd: 'Nguyen Van A' } };
  validateCCCD(reqInvalid, res, next);
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 400);
  assert.equal(jsonResponse.code, 'INVALID_FORMAT');

  // Trường hợp thiếu cccd
  nextCalled = false;
  validateCCCD({ body: {} }, res, next);
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 400);
});
