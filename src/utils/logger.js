function maskCCCD(cccd) {
  if (!cccd || typeof cccd !== 'string') return '********';
  const clean = cccd.replace(/\D/g, '');
  if (clean.length < 4) return '********';
  return '********' + clean.slice(-4);
}

function sanitizeLogMessage(message) {
  if (typeof message !== 'string') return message;
  // Automatically replace any 12-digit numeric sequences with masked version
  return message.replace(/\b(\d{8})(\d{4})\b/g, '********$2');
}

const logger = {
  maskCCCD,
  info: (msg, ...args) => {
    const timestamp = new Date().toISOString();
    const sanitizedMsg = sanitizeLogMessage(msg);
    console.log(`[INFO] [${timestamp}] ${sanitizedMsg}`, ...args);
  },
  warn: (msg, ...args) => {
    const timestamp = new Date().toISOString();
    const sanitizedMsg = sanitizeLogMessage(msg);
    console.warn(`[WARN] [${timestamp}] ${sanitizedMsg}`, ...args);
  },
  error: (msg, ...args) => {
    const timestamp = new Date().toISOString();
    const sanitizedMsg = sanitizeLogMessage(msg);
    console.error(`[ERROR] [${timestamp}] ${sanitizedMsg}`, ...args);
  }
};

module.exports = logger;
