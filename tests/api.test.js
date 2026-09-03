const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/server');

test('API: Kiểm tra các endpoint của hệ thống', async (t) => {
  let server;
  let baseUrl;

  // Khởi động server test trên port ngẫu nhiên
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  t.after(() => {
    server.close();
  });

  await t.test('GET /api/info trả về thông tin trường và câu chào chính xác', async () => {
    const res = await fetch(`${baseUrl}/api/info`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.schoolName, 'TRƯỜNG THPT PHƯỚC LONG');
    assert.equal(body.greeting, 'Xin chào, hãy nhập thông tin là số căn cước công dân');
  });

  await t.test('POST /api/lookup với số không đủ 12 chữ số bị từ chối 400', async () => {
    const res = await fetch(`${baseUrl}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cccd: '12345' })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.code, 'INVALID_FORMAT');
    assert.equal(body.message, 'Vui lòng nhập đúng 12 chữ số căn cước công dân.');
  });

  await t.test('POST /api/lookup tra cứu theo tên bị từ chối 400', async () => {
    const res = await fetch(`${baseUrl}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cccd: 'Nguyễn Văn A' })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.code, 'INVALID_FORMAT');
  });

  await t.test('POST /api/lookup tra cứu CCCD không tồn tại trả về 404 NOT_FOUND', async () => {
    const res = await fetch(`${baseUrl}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cccd: '999999999999' })
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.code, 'NOT_FOUND');
    assert.equal(body.message, 'Không tìm thấy hồ sơ phù hợp với số căn cước công dân đã nhập.');
  });

  await t.test('POST /api/lookup tra cứu CCCD có thật trả về 200 FOUND kèm hồ sơ', async () => {
    const res = await fetch(`${baseUrl}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cccd: '079311029797' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.code, 'FOUND');
    assert.ok(body.student);
    assert.equal(body.student['Họ tên'], 'Nguyễn Ngọc Mai An');
    assert.equal(body.maskedCCCD, '********9797');
  });
});
