/**
 * CHATBOT TRA CỨU HỒ SƠ HỌC SINH - THPT PHƯỚC LONG
 * Client Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const cccdInput = document.getElementById('cccdInput');
  const lookupBtn = document.getElementById('lookupBtn');
  const charCounter = document.getElementById('charCounter');
  const chatMessages = document.getElementById('chatMessages');
  const queryStatus = document.getElementById('queryStatus');
  const resultContent = document.getElementById('resultContent');

  // Xác định API endpoint (tương thích cả khi chạy qua localhost:3000 hoặc file:// hoặc Live Server)
  function getApiEndpoint() {
    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000')) {
      return 'http://localhost:3000/api/lookup';
    }
    return '/api/lookup';
  }

  // Lắng nghe nhập liệu: chỉ cho phép nhập chữ số & cập nhật bộ đếm
  cccdInput.addEventListener('input', (e) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/\D/g, '').slice(0, 12);
    if (rawVal !== cleanVal) {
      e.target.value = cleanVal;
    }
    charCounter.textContent = `${cleanVal.length}/12`;
    
    if (cleanVal.length === 12) {
      charCounter.style.color = '#0b824a';
    } else {
      charCounter.style.color = '#537590';
    }
  });

  // Nhấn phím Enter để tra cứu
  cccdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup();
    }
  });

  // Nhấn nút tra cứu
  lookupBtn.addEventListener('click', () => {
    handleLookup();
  });

  /**
   * Xử lý tra cứu hồ sơ
   */
  async function handleLookup() {
    const rawInput = cccdInput.value;
    const sanitized = (rawInput || '').replace(/\D/g, '').trim();

    // 1. NGHIỆM THU: Sai 12 số => KHÔNG gọi backend
    if (!/^\d{12}$/.test(sanitized)) {
      addMessageBubble('bot', 'Vui lòng nhập đúng 12 chữ số căn cước công dân.');
      queryStatus.textContent = 'Định dạng chưa đúng';
      queryStatus.style.borderColor = '#f8c8c8';
      queryStatus.style.background = '#fdf2f2';
      cccdInput.focus();
      return;
    }

    // 2. Định dạng hợp lệ 12 số: Hiển thị hội thoại (luôn che 8 số đầu)
    const masked = '********' + sanitized.slice(-4);
    addMessageBubble('user', `Tra cứu CCCD: ${masked}`);

    // Hiển thị trạng thái đang kiểm tra
    const typingId = showTypingIndicator();
    setSearchingState(true);
    queryStatus.textContent = 'Đang kiểm tra hồ sơ...';
    queryStatus.style.borderColor = '#b8daf2';
    queryStatus.style.background = '#eaf5fc';

    let lastError = null;

    // Cơ chế thử lại 1 lần nếu gặp lỗi kết nối tạm thời
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const endpoint = getApiEndpoint();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cccd: sanitized })
        });

        const res = await response.json();

        removeTypingIndicator(typingId);

        if (response.ok && res.ok && res.student) {
          // TÌM THẤY HỒ SƠ
          addMessageBubble('bot', 'Đã tìm thấy hồ sơ. Thông tin của bạn như sau:');
          renderStudentCard(res.student);
          queryStatus.textContent = `Tìm thấy: ${res.student['Họ tên'] || '1 học sinh'}`;
          queryStatus.style.borderColor = '#c1e7d2';
          queryStatus.style.background = '#edfbf3';
          cccdInput.value = '';
          charCounter.textContent = '0/12';
          setSearchingState(false);
          return;
        } else {
          // Xử lý phản hồi từ server (NOT_FOUND, DUPLICATE_ID, RATE_LIMIT...)
          handleErrorResponse(res, response.status);
          setSearchingState(false);
          return;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Lần tra cứu ${attempt} thất bại:`, err);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 400));
        }
      }
    }

    // Nếu cả 2 lần đều thất bại do không kết nối được máy chủ
    removeTypingIndicator(typingId);
    console.error('Fetch error cuối cùng:', lastError);
    const errMsg = 'Hệ thống tạm thời chưa truy cập được dữ liệu. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
    addMessageBubble('bot', errMsg);
    renderAlert('danger', 'Lỗi kết nối máy chủ', 'Không thể kết nối đến máy chủ http://localhost:3000. Vui lòng kiểm tra lại địa chỉ trên thanh duyệt web.');
    queryStatus.textContent = 'Lỗi kết nối máy chủ';
    queryStatus.style.borderColor = '#f8c8c8';
    queryStatus.style.background = '#fdf2f2';
    setSearchingState(false);
  }

  /**
   * Xử lý phản hồi không thành công từ máy chủ
   */
  function handleErrorResponse(res, status) {
    let msg = res.message || 'Không thể thực hiện tra cứu.';
    
    if (res.code === 'NOT_FOUND' || status === 404) {
      msg = 'Không tìm thấy hồ sơ phù hợp với số căn cước công dân đã nhập.';
      addMessageBubble('bot', msg);
      renderAlert('warning', 'Không tìm thấy hồ sơ', msg);
      queryStatus.textContent = 'Không tìm thấy hồ sơ';
      queryStatus.style.borderColor = '#ffe1b3';
      queryStatus.style.background = '#fff8eb';
    } else if (res.code === 'DUPLICATE_ID' || status === 409) {
      msg = 'Dữ liệu có bản ghi trùng Số định danh cá nhân. Vui lòng liên hệ quản trị viên.';
      addMessageBubble('bot', msg);
      renderAlert('danger', 'Dữ liệu trùng lặp', msg);
      queryStatus.textContent = 'Bản ghi trùng Số định danh';
      queryStatus.style.borderColor = '#f8c8c8';
      queryStatus.style.background = '#fdf2f2';
    } else if (res.code === 'RATE_LIMIT_EXCEEDED' || status === 429) {
      msg = res.message || 'Bạn đã thực hiện quá nhiều lượt tra cứu. Vui lòng chờ 1 phút rồi thử lại.';
      addMessageBubble('bot', msg);
      renderAlert('warning', 'Giới hạn tra cứu', msg);
      queryStatus.textContent = 'Vượt quá tần suất tra cứu';
      queryStatus.style.borderColor = '#ffe1b3';
      queryStatus.style.background = '#fff8eb';
    } else {
      addMessageBubble('bot', msg);
      renderAlert('danger', 'Thông báo', msg);
      queryStatus.textContent = 'Lỗi tra cứu';
      queryStatus.style.borderColor = '#f8c8c8';
      queryStatus.style.background = '#fdf2f2';
    }
  }

  /**
   * Thêm bong bóng chat vào giao diện
   */
  function addMessageBubble(sender, text) {
    const row = document.createElement('div');
    row.className = `message-row ${sender}-row`;

    if (sender === 'bot') {
      const avatar = document.createElement('div');
      avatar.className = 'bot-avatar';
      avatar.textContent = '🤖';
      row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}-bubble`;
    bubble.textContent = text;
    row.appendChild(bubble);

    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Hiển thị hiệu ứng đang gõ
   */
  function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const row = document.createElement('div');
    row.id = id;
    row.className = 'message-row bot-row';

    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar';
    avatar.textContent = '🤖';
    row.appendChild(avatar);

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble bot-bubble';
    bubble.innerHTML = `
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    row.appendChild(bubble);

    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  /**
   * Bật/tắt trạng thái đang gửi
   */
  function setSearchingState(isSearching) {
    lookupBtn.disabled = isSearching;
    cccdInput.disabled = isSearching;
    if (isSearching) {
      lookupBtn.textContent = '⏳ ĐANG TÌM KIẾM...';
    } else {
      lookupBtn.textContent = 'TRA CỨU HỒ SƠ';
      cccdInput.focus();
    }
  }

  /**
   * Hiển thị Thẻ hồ sơ học sinh tìm thấy
   */
  function renderStudentCard(student) {
    resultContent.className = 'result-content';
    resultContent.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'student-card';

    // Header thẻ
    const cardHeader = document.createElement('div');
    cardHeader.className = 'student-card-header';
    cardHeader.innerHTML = `
      <div class="student-badge-title">HỒ SƠ HỌC SINH THPT PHƯỚC LONG</div>
      <h4 class="student-fullname">${escapeHtml(student['Họ tên'] || 'HỌC SINH')}</h4>
    `;
    card.appendChild(cardHeader);

    // Body thẻ
    const cardBody = document.createElement('div');
    cardBody.className = 'student-card-body';

    const grid = document.createElement('div');
    grid.className = 'info-grid';

    // Danh sách các trường thông tin chuẩn theo Google Sheet
    const fieldMapping = [
      { key: 'Số định danh cá nhân', label: 'Số CCCD (Bảo mật)', highlight: true },
      { key: 'Ngày sinh', label: 'Ngày sinh' },
      { key: 'Giới tính', label: 'Giới tính' },
      { key: 'Dân tộc', label: 'Dân tộc' },
      { key: 'Lớp học (25-26)', label: 'Lớp (Năm 25-26)', isClass: true },
      { key: 'Lớp học (26-27)', label: 'Lớp (Năm 26-27)', isClass: true },
      { key: 'Ngày cấp', label: 'Ngày cấp CCCD' },
      { key: 'Nơi cấp', label: 'Nơi cấp' },
      { key: 'Bán trú', label: 'Bán trú' },
      { key: 'Số phòng', label: 'Số phòng' },
      { key: 'Mã hồ sơ', label: 'Mã hồ sơ' },
      { key: 'STT', label: 'Số thứ tự' }
    ];

    fieldMapping.forEach(item => {
      const val = student[item.key] || '—';
      const itemEl = document.createElement('div');
      itemEl.className = 'info-item';

      let valClass = 'info-value';
      if (item.highlight) valClass += ' highlight';
      if (item.isClass && val !== '—') valClass += ' tag-class';

      itemEl.innerHTML = `
        <span class="info-label">${item.label}</span>
        <span class="${valClass}">${escapeHtml(val)}</span>
      `;
      grid.appendChild(itemEl);
    });

    cardBody.appendChild(grid);

    // Các nút tiện ích
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.innerHTML = `
      <button class="btn-action btn-print" type="button" onclick="window.print()">
        🖨 In kết quả
      </button>
      <button id="resetSearchBtn" class="btn-action btn-new-search" type="button">
        🔍 Tra cứu hồ sơ khác
      </button>
    `;
    cardBody.appendChild(actions);

    card.appendChild(cardBody);
    resultContent.appendChild(card);

    document.getElementById('resetSearchBtn').addEventListener('click', () => {
      cccdInput.value = '';
      charCounter.textContent = '0/12';
      cccdInput.focus();
    });
  }

  /**
   * Hiển thị thông báo Alert trong Result Panel
   */
  function renderAlert(type, title, message) {
    resultContent.className = 'result-content';
    resultContent.innerHTML = `
      <div class="alert-card alert-${type}">
        <div class="alert-icon">${type === 'danger' ? '⚠️' : 'ℹ️'}</div>
        <div class="alert-title">${escapeHtml(title)}</div>
        <p class="alert-msg">${escapeHtml(message)}</p>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
