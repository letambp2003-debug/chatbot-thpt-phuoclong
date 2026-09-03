# HỆ THỐNG CHATBOT TRA CỨU HỒ SƠ HỌC SINH BẰNG CCCD
**TRƯỜNG THPT PHƯỚC LONG**

Ứng dụng webapp full-stack tra cứu hồ sơ học sinh bảo mật, chính xác 100% qua Số căn cước công dân (12 chữ số).

---

## 1. Tính năng chính

- **Phạm vi tra cứu tuyệt đối**: Chỉ hỗ trợ tra cứu duy nhất qua **Số CCCD gồm đúng 12 chữ số** (`^\d{12}$`). Không hỗ trợ tìm theo họ tên, lớp, ngày sinh hay từ khóa tự do.
- **Bảo mật dữ liệu học sinh**:
  - Mọi thao tác truy vấn Google Sheet thực hiện 100% phía máy chủ (server-side).
  - Không nạp toàn bộ Google Sheet về trình duyệt.
  - Không lưu hoặc in log đầy đủ 12 số CCCD (tự động che 8 số đầu: `********1234`).
  - Tích hợp Rate Limiting chống cào dữ liệu / dò tự động.
- **Giao diện chuẩn học đường**:
  - Font chữ: **Tahoma**.
  - Tông màu: **Xanh dịu** hài hòa, trang trọng.
  - Đầy đủ Banner trường, Logo THPT Phước Long, tất cả tiêu đề căn giữa.
  - Câu chào chuẩn: *“Xin chào, hãy nhập thông tin là số căn cước công dân”*.
  - Tương thích tốt trên cả máy tính (Desktop) và điện thoại di động (Mobile).
  - Hỗ trợ in trực tiếp thẻ hồ sơ học sinh (`window.print()`).
- **Tuân thủ tri thức**:
  - Đã tích hợp `kt.md` và `tc.md` vào thư mục `/knowledge`.

---

## 2. Cấu trúc thư mục

```
TRA_CUU_TTHS/
├── knowledge/
│   ├── kt.md                 # Kiến thức tra cứu hồ sơ
│   └── tc.md                 # Tính cách và quy tắc phản hồi
├── public/                   # Giao diện frontend
│   ├── index.html            # Trang chính chatbot
│   ├── css/style.css         # Định dạng Tahoma, xanh dịu, responsive
│   ├── js/app.js             # Logic xử lý client, validation 12 số
│   └── assets/
│       └── logo.jpg          # Logo Trường THPT Phước Long
├── src/                      # Máy chủ backend
│   ├── server.js             # Express server & endpoints
│   ├── config.js             # Cấu hình hệ thống & Google Sheet ID
│   ├── services/
│   │   └── sheetService.js   # Truy vấn Google Sheet & in-memory cache
│   ├── middlewares/
│   │   ├── validator.js      # Middleware validate ^\d{12}$
│   │   └── rateLimiter.js    # Giới hạn tần suất tra cứu
│   └── utils/
│       └── logger.js         # Logger bảo mật che CCCD
├── tests/                    # Bộ kiểm thử tự động
│   ├── validator.test.js     # Test validation
│   ├── logger.test.js        # Test che giấu CCCD
│   ├── sheetService.test.js  # Test truy vấn cột F, NOT_FOUND, DUPLICATE_ID
│   └── api.test.js           # Test các API endpoints
└── package.json
```

---

## 3. Hướng dẫn cài đặt & Khởi chạy

### Cài đặt thư viện:
```bash
npm install
```

### Khởi chạy máy chủ:
```bash
npm start
```
Sau đó truy cập trình duyệt tại địa chỉ: `http://localhost:3000`

### Chế độ phát triển (Auto-reload):
```bash
npm run dev
```

### Chạy kiểm thử tự động:
```bash
npm test
```
Toàn bộ 14 bài kiểm tra sẽ được thực thi tự động.
