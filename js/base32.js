/**
 * Base32 编码/解码库
 * 用于 Google Authenticator TOTP Secret 处理
 */

class Base32 {
    constructor() {
        this.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        this.lookup = {};
        
        // 创建查找表
        for (let i = 0; i < this.alphabet.length; i++) {
            this.lookup[this.alphabet[i]] = i;
        }
    }

    /**
     * 将字节数组编码为 Base32 字符串
     * @param {Uint8Array} bytes 字节数组
     * @returns {string} Base32 编码的字符串
     */
    encode(bytes) {
        if (bytes.length === 0) return '';
        
        let output = '';
        let bits = 0;
        let value = 0;
        
        for (let i = 0; i < bytes.length; i++) {
            value = (value << 8) | bytes[i];
            bits += 8;
            
            while (bits >= 5) {
                output += this.alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }
        
        if (bits > 0) {
            output += this.alphabet[(value << (5 - bits)) & 31];
        }
        
        return output;
    }

    /**
     * 将 Base32 字符串解码为字节数组
     * @param {string} input Base32 编码的字符串
     * @returns {Uint8Array} 解码后的字节数组
     */
    decode(input) {
        if (input.length === 0) return new Uint8Array(0);
        
        // 移除填充和空格，转换为大写
        input = input.replace(/[=\s]/g, '').toUpperCase();
        
        let output = [];
        let bits = 0;
        let value = 0;
        
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            if (!(char in this.lookup)) {
                throw new Error(`Invalid character in Base32 string: ${char}`);
            }
            
            value = (value << 5) | this.lookup[char];
            bits += 5;
            
            if (bits >= 8) {
                output.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }
        
        return new Uint8Array(output);
    }

    /**
     * 验证 Base32 字符串是否有效
     * @param {string} input 要验证的字符串
     * @returns {boolean} 是否有效
     */
    isValid(input) {
        try {
            this.decode(input);
            return true;
        } catch (e) {
            return false;
        }
    }
}

// 创建全局实例
const base32 = new Base32();

/**
 * 生成加密安全的随机字节数组
 * @param {number} length 字节数组长度
 * @returns {Uint8Array} 随机字节数组
 */
function generateSecureRandomBytes(length) {
    const bytes = new Uint8Array(length);
    
    if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(bytes);
    } else {
        // 备用方案（不够安全，仅用于演示）
        for (let i = 0; i < length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    
    return bytes;
}

/**
 * 生成 TOTP Secret Key
 * @param {number} length Secret 长度（字节）
 * @returns {string} Base32 编码的 Secret Key
 */
function generateTOTPSecret(length = 20) {
    const bytes = generateSecureRandomBytes(length);
    return base32.encode(bytes);
}

/**
 * 构建 TOTP URL
 * @param {string} issuer 发行者
 * @param {string} username 用户名
 * @param {string} secret Base32 编码的 Secret Key
 * @param {number} digits 验证码位数（默认6）
 * @param {number} period 时间间隔（默认30秒）
 * @returns {string} TOTP URL
 */
function buildTOTPUrl(issuer, username, secret, digits = 6, period = 30) {
    const params = new URLSearchParams({
        secret: secret,
        issuer: issuer,
        digits: digits.toString(),
        period: period.toString()
    });
    
    const label = encodeURIComponent(`${issuer}:${username}`);
    return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * 验证 Secret Key 格式
 * @param {string} secret Secret Key
 * @returns {boolean} 是否有效
 */
function validateSecret(secret) {
    if (!secret || typeof secret !== 'string') {
        return false;
    }
    
    // 移除空格和填充
    const cleaned = secret.replace(/[=\s]/g, '');
    
    // 检查长度（通常16-32字符）
    if (cleaned.length < 16 || cleaned.length > 32) {
        return false;
    }
    
    // 检查是否为有效的Base32字符串
    return base32.isValid(cleaned);
}

/**
 * 清理 Secret Key（移除空格和填充）
 * @param {string} secret Secret Key
 * @returns {string} 清理后的 Secret Key
 */
function cleanSecret(secret) {
    return secret.replace(/[=\s]/g, '').toUpperCase();
}

// 导出函数
window.Base32 = Base32;
window.base32 = base32;
window.generateSecureRandomBytes = generateSecureRandomBytes;
window.generateTOTPSecret = generateTOTPSecret;
window.buildTOTPUrl = buildTOTPUrl;
window.validateSecret = validateSecret;
window.cleanSecret = cleanSecret; 