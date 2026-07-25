/**
 * Google Authenticator QR Code 生成器主程序
 * 整合所有功能：用户交互、QR码生成、复制功能等
 */

class TOTPGenerator {
    constructor() {
        this.qrCodeInstance = null;
        this.currentSecret = '';
        this.liveCodeTimer = null;
        this.liveCodeStep = null;
        this.init();
    }

    init() {
        this.bindEvents();
        if (!this.applySecretFromURL()) {
            this.generateNewSecret();
        }
        this.initializeQRContainer();
    }

    // 从 URL 参数带入 Secret Key（?secret=xxx 或 ?key=xxx），有带入时返回 true
    applySecretFromURL() {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('secret') || params.get('key');
        if (!raw) {
            return false;
        }

        const secret = raw.replace(/\s+/g, '');
        if (!secret) {
            return false;
        }

        this.currentSecret = secret;
        document.getElementById('secret').value = secret;
        this.updateSecretDisplay();

        // Secret 有效才自动打开即时验证码，无效则跳过
        if (validateSecret(secret)) {
            this.openLiveCode();
        }
        return true;
    }

    bindEvents() {
        // 绑定生成新 Secret 按钮
        document.getElementById('generateSecret').addEventListener('click', () => {
            this.generateNewSecret();
        });

        // 绑定生成 QR Code 按钮
        document.getElementById('generateQR').addEventListener('click', () => {
            this.generateQRCode();
        });

        // 绑定查看即时验证码按钮
        document.getElementById('viewLiveCode').addEventListener('click', () => {
            this.toggleLiveCode();
        });

        // 点击验证码复制
        document.getElementById('liveCode').addEventListener('click', () => {
            const code = document.getElementById('liveCode').textContent.replace(/\s/g, '');
            if (/^\d+$/.test(code)) {
                this.copyToClipboard(code, '驗證碼');
            }
        });

        // 绑定复制功能
        document.getElementById('secretDisplay').addEventListener('click', () => {
            this.copyToClipboard(this.currentSecret, 'Secret Key');
        });

        document.getElementById('totpUrl').addEventListener('click', () => {
            const url = document.getElementById('totpUrl').textContent;
            if (url && url !== '-') {
                this.copyToClipboard(url, 'TOTP URL');
            }
        });

        document.getElementById('qrImageUrl').addEventListener('click', () => {
            const url = document.getElementById('qrImageUrl').textContent;
            if (url && url !== '-') {
                this.copyToClipboard(url, 'QR Code Image URL');
            }
        });

        // 绑定输入框事件（自动过滤空白）
        document.getElementById('secret').addEventListener('input', (e) => {
            const cleaned = e.target.value.replace(/\s+/g, '');
            if (cleaned !== e.target.value) {
                const pos = Math.max(0, (e.target.selectionStart || cleaned.length) - (e.target.value.length - cleaned.length));
                e.target.value = cleaned;
                e.target.setSelectionRange(pos, pos);
            }
            this.currentSecret = cleaned;
            this.updateSecretDisplay();
            this.refreshLiveCodeIfVisible();
        });

        // 绑定回车键快捷生成
        document.getElementById('username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateQRCode();
            }
        });

        document.getElementById('issuer').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateQRCode();
            }
        });
    }

    generateNewSecret() {
        try {
            this.currentSecret = generateTOTPSecret(20);
            document.getElementById('secret').value = this.currentSecret;
            this.updateSecretDisplay();
            this.refreshLiveCodeIfVisible();
            this.showToast('新的 Secret Key 已生成', 'success');
        } catch (error) {
            console.error('生成 Secret 失败:', error);
            this.showToast('生成 Secret 失败', 'error');
        }
    }

    updateSecretDisplay() {
        const secretDisplay = document.getElementById('secretDisplay');
        secretDisplay.textContent = this.currentSecret || '-';
    }

    // ===== 即时验证码 =====

    toggleLiveCode() {
        const panel = document.getElementById('liveCodePanel');
        if (panel.style.display === 'none') {
            if (!validateSecret(this.currentSecret.trim())) {
                this.showToast('請先輸入有效的 Secret Key', 'error');
                return;
            }
            this.openLiveCode();
        } else {
            this.closeLiveCode();
        }
    }

    openLiveCode() {
        document.getElementById('liveCodePanel').style.display = 'flex';
        document.getElementById('viewLiveCode').textContent = '隱藏驗證碼';
        this.startLiveCode();
    }

    closeLiveCode() {
        document.getElementById('liveCodePanel').style.display = 'none';
        document.getElementById('viewLiveCode').textContent = '查看即時驗證碼';
        this.stopLiveCode();
    }

    startLiveCode() {
        this.stopLiveCode();
        this.liveCodeStep = null;
        this.tickLiveCode();
        this.liveCodeTimer = setInterval(() => this.tickLiveCode(), 1000);
    }

    stopLiveCode() {
        if (this.liveCodeTimer) {
            clearInterval(this.liveCodeTimer);
            this.liveCodeTimer = null;
        }
    }

    async tickLiveCode() {
        const period = 30;
        const remaining = getTOTPRemainingSeconds(period);
        document.getElementById('liveCodeCountdown').textContent = remaining;

        const barFill = document.getElementById('liveCodeBarFill');
        barFill.style.width = `${(remaining / period) * 100}%`;
        barFill.classList.toggle('warning', remaining <= 5);

        // 只在跨入新时间步时重新计算验证码
        const step = Math.floor(Date.now() / 1000 / period);
        if (step !== this.liveCodeStep) {
            this.liveCodeStep = step;
            await this.renderLiveCode();
        }
    }

    async renderLiveCode() {
        const codeEl = document.getElementById('liveCode');
        const secret = this.currentSecret.trim();

        if (!validateSecret(secret)) {
            codeEl.textContent = '------';
            return;
        }

        try {
            const code = await generateTOTPCode(secret);
            codeEl.textContent = code.replace(/^(\d{3})(\d{3})$/, '$1 $2');
        } catch (error) {
            console.error('计算验证码失败:', error);
            codeEl.textContent = '------';
        }
    }

    refreshLiveCodeIfVisible() {
        if (document.getElementById('liveCodePanel').style.display !== 'none') {
            this.renderLiveCode();
        }
    }

    generateQRCode() {
        const issuer = document.getElementById('issuer').value.trim();
        const username = document.getElementById('username').value.trim();
        const secret = this.currentSecret.trim();

        // 验证输入
        if (!issuer) {
            this.showToast('請輸入發行者名稱', 'error');
            document.getElementById('issuer').focus();
            return;
        }

        if (!username) {
            this.showToast('請輸入用戶名', 'error');
            document.getElementById('username').focus();
            return;
        }

        if (!secret) {
            this.showToast('請先生成 Secret Key', 'error');
            return;
        }

        if (!validateSecret(secret)) {
            this.showToast('Secret Key 格式不正確', 'error');
            return;
        }

        try {
            // 清理并验证 Secret
            const cleanedSecret = cleanSecret(secret);
            
            // 构建 TOTP URL
            const totpUrl = buildTOTPUrl(issuer, username, cleanedSecret);
            
            // 更新界面显示
            this.updateTOTPUrlDisplay(totpUrl);
            
            // 生成 QR Code
            this.createQRCode(totpUrl);

            // 顯示 QR Code 圖片 URL（延遲等待 QR Code 渲染完成）
            setTimeout(() => {
                try {
                    const qrContainer = document.getElementById('qrcode');
                    const canvas = qrContainer.querySelector('canvas');
                    const img = qrContainer.querySelector('img');
                    if (img && img.src) {
                        document.getElementById('qrImageUrl').textContent = img.src;
                    } else if (canvas) {
                        document.getElementById('qrImageUrl').textContent = canvas.toDataURL('image/png');
                    }
                } catch (e) {
                    document.getElementById('qrImageUrl').textContent = '-';
                }
            }, 500);

            this.showToast('QR Code 生成成功', 'success');
            
        } catch (error) {
            console.error('生成 QR Code 失败:', error);
            this.showToast('生成 QR Code 失败', 'error');
        }
    }

    updateTOTPUrlDisplay(url) {
        document.getElementById('totpUrl').textContent = url;
    }

    createQRCode(text) {
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        qrContainer.className = '';

        try {
            this.qrCodeInstance = new QRCode(qrContainer, {
                text: text,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        } catch (error) {
            console.error('QR Code 生成失败:', error);
            this.showQRError();
        }
    }

    showQRError() {
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                width: 256px;
                height: 256px;
                background: #f8f9fa;
                border: 2px dashed #dee2e6;
                border-radius: 8px;
                color: #6c757d;
                font-family: Arial, sans-serif;
                font-size: 14px;
                text-align: center;
            ">
                QR Code<br>生成失敗
            </div>
        `;
    }

    initializeQRContainer() {
        const qrContainer = document.getElementById('qrcode');
        qrContainer.className = 'empty';
    }

    async copyToClipboard(text, label) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                this.showToast(`${label} 已複製到剪貼簿`, 'success');
            } else {
                // 备用方案
                this.fallbackCopyToClipboard(text);
                this.showToast(`${label} 已複製到剪貼簿`, 'success');
            }
        } catch (error) {
            console.error('复制失败:', error);
            this.showToast('複製失敗', 'error');
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 工具方法：格式化 Secret Key（添加空格）
    formatSecret(secret) {
        return secret.replace(/(.{4})/g, '$1 ').trim();
    }

    // 工具方法：验证输入格式
    validateInputs(issuer, username, secret) {
        const errors = [];

        if (!issuer || issuer.length < 1) {
            errors.push('發行者名稱不能為空');
        }

        if (!username || username.length < 1) {
            errors.push('用戶名不能為空');
        }

        if (!secret || secret.length < 16) {
            errors.push('Secret Key 長度不足');
        }

        if (secret && !validateSecret(secret)) {
            errors.push('Secret Key 格式不正確');
        }

        return errors;
    }

    // 获取当前状态
    getCurrentState() {
        return {
            issuer: document.getElementById('issuer').value.trim(),
            username: document.getElementById('username').value.trim(),
            secret: this.currentSecret,
            hasQRCode: this.qrCodeInstance !== null
        };
    }

    // 重置所有状态
    reset() {
        document.getElementById('issuer').value = 'Service';
        document.getElementById('username').value = '';
        document.getElementById('secret').value = '';
        document.getElementById('secretDisplay').textContent = '-';
        document.getElementById('totpUrl').textContent = '-';
        
        this.currentSecret = '';
        this.qrCodeInstance = null;
        this.closeLiveCode();
        this.initializeQRContainer();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.totpGenerator = new TOTPGenerator();
});

// 调试辅助函数
window.debugInfo = () => {
    if (window.totpGenerator) {
        console.log('Current State:', window.totpGenerator.getCurrentState());
        console.log('Browser Support:', {
            crypto: !!window.crypto,
            clipboard: !!navigator.clipboard,
            canvas: !!document.createElement('canvas').getContext
        });
    }
}; 