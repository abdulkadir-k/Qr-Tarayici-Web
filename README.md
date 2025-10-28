# 🌐 OTPAuth Migration QR Decoder (Web Versiyonu)

Bu proje, **Google Authenticator** veya benzeri kimlik doğrulama uygulamalarıyla oluşturulmuş  
**`otpauth-migration://offline?data=...`** formatındaki QR kodlarını çözümlemenizi sağlar.

Bu sayede Google tarafından oluşturulan **yedekleme veya aktarım QR kodlarını** tarayıcı üzerinden okuyabilir,  
içerisindeki hesap bilgilerini (issuer, hesap adı, secret key vb.) doğrudan görüntüleyebilirsiniz.

---

## 🧭 Özellikler

- **Google Authenticator QR kodlarını** (`otpauth-migration://offline?...`) çözümleyebilir.  
- QR içeriğini **Base64 + Protobuf** yapısından ayrıştırır.  
- Aşağıdaki bilgileri kullanıcıya sunar:
  - Issuer (Uygulama veya hizmet adı)  
  - Hesap adı (örneğin: kullanıcı e-posta adresi)  
  - Secret Key (hem Base32 hem Hex formatında)
- Modern, hafif ve tamamen **tarayıcıda çalışan** HTML-CSS-JS arayüzü.  
- Ek yazılım kurulumu gerekmez — sadece bir tarayıcı yeterlidir.

---

## 🧩 Kullanılan Teknolojiler

- **HTML5** – Arayüz iskeleti  
- **Tailwind CSS** – Hızlı ve şık stil tasarımı  
- **JavaScript (ES6)** – QR çözümleme mantığı  
- **jsQR** – QR kod çözümleme kütüphanesi  

---

## 🛠️ Kurulum ve Çalıştırma

Projeyi yerel olarak çalıştırmak için şu adımları izle:

### 1️⃣ Projeyi klonla
```bash
git clone https://github.com/abdulkadir-k/Qr-Tarayici-Web.git
cd Qr-Tarayici-Web


---

## 🔗 Canlı Demo

💻 **Canlı olarak nasıl göründüğüne buradan bakabilirsin:**  
👉 [https://abdulkadir-k.github.io/Qr-Tarayici-Web/](https://abdulkadir-k.github.io/Qr-Tarayici-Web/)

---