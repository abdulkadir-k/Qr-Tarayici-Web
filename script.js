// Gerekli DOM elementlerini seçiyoruz
const fileInput = document.getElementById('fileInput');
const qrImage = document.getElementById('qrImage');
const imagePlaceholder = document.getElementById('imagePlaceholder');
const output = document.getElementById('output');

// Dosya seçildiğinde
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    output.textContent = '';

    const reader = new FileReader();
    reader.onload = (e) => {
        qrImage.src = e.target.result;
        imagePlaceholder.style.display = 'none';
        qrImage.style.display = 'block';

        qrImage.onload = () => decodeQRFromImage(qrImage);
    };
    reader.readAsDataURL(file);
});

// --- QR Kod Çözümleme ---
function decodeQRFromImage(imageElement) {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (!code) throw new Error("QR kod okunamadı veya bulunamadı.");
        const text = code.data;

        if (!text.includes("otpauth-migration://")) throw new Error("Bu QR 'otpauth-migration' formatında değil.");

        const url = new URL(text);
        const b64Data = url.searchParams.get('data');
        if (!b64Data) throw new Error("URI içinde 'data' parametresi yok.");

        const rawBytes = base64UrlToUint8Array(b64Data);
        const entries = decodeMigrationPayload(rawBytes);
        displayEntries(entries);

    } catch (e) {
        output.textContent = `Hata oluştu:\n${e.message}`;
    }
}

// --- Çıktıyı Yazdır ---
function displayEntries(entries) {
    output.textContent = '';
    if (entries.length === 0) {
        output.textContent = "QR kodda geçerli bir hesap bulunamadı.";
        return;
    }

    entries.forEach((e, idx) => {
        output.textContent += "=".repeat(40) + "\n";
        output.textContent += `Hesap Bilgileri\n`;
        output.textContent += `Issuer        : ${e.issuer || '<boş>'}\n`;
        output.textContent += `Hesap Adı     : ${e.name || '<boş>'}\n`;
        output.textContent += `Secret (Base32): ${e.secret_base32 || '<boş>'}\n`;
        output.textContent += `Secret (hex)    : ${e.secret_hex || '<boş>'}\n`;

        
        output.textContent += "=".repeat(40) + "\n\n";
    });
}

// --- Protobuf Yardımcıları ---
function readVarint(data, i) {
    let shift = 0, result = 0, pos = i;
    while (pos < data.length) {
        const b = data[pos];
        result |= (b & 0x7F) << shift;
        pos += 1;
        if (!(b & 0x80)) return [result, pos];
        shift += 7;
        if (shift >= 64) throw new Error("varint too long");
    }
    throw new Error("unexpected end while reading varint");
}

function readLengthDelimited(data, i) {
    const [length, ni] = readVarint(data, i);
    const end = ni + length;
    if (end > data.length) throw new Error("truncated length-delimited field");
    return [data.slice(ni, end), end];
}

function parseOtpParameters(msg) {
    let i = 0;
    const out = {};
    const textDecoder = new TextDecoder();

    while (i < msg.length) {
        const key = msg[i++];
        const fieldNumber = key >> 3;
        const wireType = key & 0x7;

        if (wireType === 2) {
            let val, newI;
            [val, newI] = readLengthDelimited(msg, i);
            i = newI;
            switch (fieldNumber) {
                case 1: out['secret_bytes'] = val; break;
                case 2: out['name'] = textDecoder.decode(val); break;
                case 3: out['issuer'] = textDecoder.decode(val); break;
            }
        } else if (wireType === 0) {
            let v, newI;
            [v, newI] = readVarint(msg, i);
            i = newI;
            switch (fieldNumber) {
                case 4: out['algorithm'] = v; break;
                case 5: out['digits'] = v; break;
                case 6: out['type'] = v; break;
            }
        }
    }
    return out;
}

function decodeMigrationPayload(raw) {
    let i = 0;
    const entries = [];
    while (i < raw.length) {
        const key = raw[i++];
        const wireType = key & 0x7;

        if (wireType === 2) {
            let val, newI;
            [val, newI] = readLengthDelimited(raw, i);
            i = newI;
            const parsed = parseOtpParameters(val);
            if (parsed['secret_bytes']) {
                parsed['secret_base32'] = b32FromBytes(parsed['secret_bytes']);
                parsed['secret_hex'] = bytesToHex(parsed['secret_bytes']);
            }
            entries.push(parsed);
        } else if (wireType === 0) {
            let v, newI;
            [v, newI] = readVarint(raw, i);
            i = newI;
        }
    }
    return entries;
}

// --- Yardımcı Fonksiyonlar ---
function base64UrlToUint8Array(b64Url) {
    let b64 = b64Url.replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - b64.length % 4) % 4);
    const decoded = atob(b64);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
    return bytes;
}

function b32FromBytes(bytes) {
    const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0, bitCount = 0, output = '';
    for (const byte of bytes) {
        bits = (bits << 8) | byte;
        bitCount += 8;
        while (bitCount >= 5) {
            bitCount -= 5;
            output += B32_CHARS[(bits >> bitCount) & 31];
        }
    }
    if (bitCount > 0) output += B32_CHARS[(bits << (5 - bitCount)) & 31];
    return output;
}

function bytesToHex(bytes) {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
