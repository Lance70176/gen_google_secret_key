/**
 * Google Authenticator QR Code 生成器主程序
 * 整合所有功能：用户交互、QR码生成、复制功能等
 */

class TOTPGenerator {
    constructor() {
        this.qrCodeInstance = null;
        this.currentSecret = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.generateNewSecret();
        this.initializeQRContainer();
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

        // 绑定输入框事件
        document.getElementById('secret').addEventListener('input', (e) => {
            this.currentSecret = e.target.value;
            this.updateSecretDisplay();
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

            // 顯示 QR Code 圖片 URL
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(totpUrl)}&format=png&ecc=M`;
            document.getElementById('qrImageUrl').textContent = qrImageUrl;

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

        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(text)}&format=png&ecc=M`;
        img.width = 256;
        img.height = 256;
        img.alt = 'QR Code';
        img.style.display = 'block';
        img.onerror = () => {
            console.error('QR Code image failed to load');
            this.showQRError();
        };
        qrContainer.appendChild(img);
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