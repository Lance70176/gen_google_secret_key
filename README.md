# Google Authenticator QR Code 生成器

一個完全前端化的 Google Authenticator QR Code 生成工具，無需後端服務器支持。

## 功能特點

✅ **完全前端化** - 純 HTML/CSS/JavaScript 實現  
✅ **離線工作** - 無需網絡連接即可生成 Secret Key  
✅ **安全性高** - Secret Key 在本地生成，不經過服務器  
✅ **易於使用** - 直觀的用戶界面  
✅ **一鍵複製** - 點擊即可複製 Secret Key 和 TOTP URL  
✅ **響應式設計** - 支持各種設備尺寸  
✅ **多重備用** - API 和 Canvas 雙重 QR 生成方案  

## 使用方法

### 1. 訪問工具
打開瀏覽器，訪問 `public/google_qr_code/index.html`

### 2. 填寫信息
- **發行者 (Issuer)**: 應用或服務名稱，如 "Service"
- **用戶名 (Username)**: 用戶賬號，如 "admin@example.com"
- **Secret Key**: 點擊"生成新 Secret"按鈕自動生成

### 3. 生成 QR Code
點擊"生成 QR Code"按鈕，系統將：
- 構建 TOTP URL
- 生成 QR Code 圖像
- 顯示詳細信息

### 4. 使用 QR Code
- 用手機打開 Google Authenticator
- 點擊"+"添加賬號
- 選擇"掃描 QR 碼"
- 掃描生成的 QR Code
- 或手動輸入 Secret Key

## 技術實現

### 核心技術
- **HTML5** - 現代網頁標準
- **CSS3** - 響應式設計和動畫
- **JavaScript (ES6+)** - 現代 JavaScript 特性
- **Web Crypto API** - 加密安全的隨機數生成
- **Canvas API** - QR Code 圖像生成

### 主要組件
- `index.html` - 主頁面
- `css/style.css` - 樣式文件
- `js/base32.js` - Base32 編碼庫
- `js/qrcode.min.js` - QR Code 生成庫
- `js/totp-generator.js` - 主要邏輯

### 瀏覽器支持
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 安全性說明

### 本地生成
- Secret Key 使用 `crypto.getRandomValues()` 在本地生成
- 符合加密學安全標準
- 不依賴外部隨機源

### 數據隱私
- 所有數據僅在瀏覽器本地處理
- 不發送任何敏感信息到外部服務器
- QR Code 圖像可選擇本地生成

### 使用建議
- 生成後立即保存 Secret Key
- 不要在不安全的環境中使用
- 定期更新 Secret Key

## 開發相關

### 文件結構
```
public/google_qr_code/
├── index.html              # 主頁面
├── css/
│   └── style.css          # 樣式文件
├── js/
│   ├── base32.js          # Base32 編碼庫
│   ├── qrcode.min.js      # QR Code 生成庫
│   └── totp-generator.js  # 主要邏輯
└── README.md              # 使用說明
```

### API 參考
```javascript
// 生成 Secret Key
const secret = generateTOTPSecret(20);

// 構建 TOTP URL
const url = buildTOTPUrl(issuer, username, secret);

// 生成 QR Code
const qr = new QRCode(element, { text: url });
```

### 調試功能
在瀏覽器控制台中執行：
```javascript
debugInfo(); // 顯示當前狀態和瀏覽器支持情況
```

## 故障排除

### 常見問題

**Q: QR Code 生成失敗**
- 檢查網絡連接（API 方式）
- 確認瀏覽器支持 Canvas API
- 嘗試重新生成

**Q: 複製功能不工作**
- 確認瀏覽器支持 Clipboard API
- 使用 HTTPS 協議訪問
- 允許剪貼板權限

**Q: Secret Key 格式錯誤**
- 確保 Secret Key 長度在 16-32 字符之間
- 只包含 A-Z 和 2-7 字符（Base32）
- 不包含特殊字符

### 瀏覽器兼容性
如果遇到兼容性問題：
1. 更新瀏覽器到最新版本
2. 檢查 JavaScript 是否啟用
3. 清除瀏覽器緩存

## 更新日志

### v1.0.0
- 初始版本發布
- 完全前端化實現
- 支持 Secret Key 生成
- 支持 QR Code 生成
- 添加複製功能
- 響應式設計

## 許可證

MIT License - 可自由使用、修改和分發

## 作者

DC Backend Team

---

🔒 **安全提醒**: 請妥善保管生成的 Secret Key，並確保在安全的環境中使用此工具。 