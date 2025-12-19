# Sanal Depo  
**Dijital Depo: Barkodlu Ürün Yönetimi için Üç Boyutlu Etkileşimli Sistem**

Bu proje, bir depodaki **raf–seviye–göz yapısını** hem klasik liste görünümüyle hem de **3D / VR benzeri etkileşimli sahnelerle** görselleştiren bir **barkodlu ürün yönetim sistemi**dir.  

- Ön yüzde **React + React Three Fiber** kullanılarak 3D sahne oluşturulur.  
- Arka planda **.NET Web API** ve ilişkisel veritabanı (SQL Server vb.) üzerinden depo, raf, göz ve koli verileri yönetilir.  
- Her koli için **QR kod** üretimi yapılarak gerçek hayattaki barkod/QR akışına benzer bir deneyim sunulur.

---

## İçindekiler

- [Özellikler](#özellikler)
- [Mimari Genel Bakış](#mimari-genel-bakış)
- [Ekranlar ve Fonksiyonlar](#ekranlar-ve-fonksiyonlar)
  - [Liste Görünümü](#1-liste-görünümü)
  - [3D Görünüm](#2-3d-görünüm)
  - [VR Görünüm](#3-vr-görünüm)
  - [Admin Paneli](#4-admin-paneli)
- [Kurulum](#kurulum)
  - [Backend (.NET API)](#backend-net-api)
  - [Frontend (React)](#frontend-react)
- [Kullanım Senaryosu](#kullanım-senaryosu)
- [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
- [Gelecek Geliştirmeler](#gelecek-geliştirmeler)
- [Lisans](#lisans)

---

## Özellikler

- 📦 **Raf–Seviye–Göz bazlı depo modellemesi**
- 🧊 **3D kutu görselleştirmesi** (React Three Fiber ile)
- 🕶️ **VR benzeri serbest dolaşım**  
  - WASD / yön tuşları ile yürüyüş  
  - Mouse ile bakış açısını değiştirme  
  - Kutuların içinden geçememe (çarpışma kontrolü)
- 🧾 **QR kod ile koli tanımlama**  
  - Her koli için otomatik QR kod üretimi  
  - QR’a tıklayarak ilgili gözün seçilmesi
- 📋 **Zengin liste görünümü**  
  - Dolu gözlerin sarı renkle vurgulanması  
  - Ürün adı ve adet bilgisinin doğrudan listede görünmesi  
  - Sarı karta tıklayınca ilgili gözün 3D sahnede vurgulanması
- 🔐 **Basit Admin paneli**  
  - Yeni koli ekleme  
  - Var olan koliyi düzenleme / silme  
  - Konuma göre (Depo / Raf / Seviye / Göz) koli atama

---

## Mimari Genel Bakış

- **Backend**  
  - .NET Web API  
  - Örnek endpointler:
    - `GET /api/warehouses/1` → depo + raf + seviye + göz yapısı
    - `GET /api/boxes` → tüm koliler
    - `POST /api/boxes` → yeni koli ekleme
    - `PUT /api/boxes/{id}` → koli güncelleme
    - `DELETE /api/boxes/{id}` → koli silme
  - Veriler ilişkisel bir veritabanında (ör. SQL Server) saklanır.

- **Frontend**  
  - React (TypeScript/TSX)
  - 3D sahneler için **@react-three/fiber** ve **@react-three/drei**
  - QR kodlar için **react-qr-code**
  - API adresi frontend tarafında `API_BASE = "http://localhost:5204"` sabiti ile yönetilir.

---

## Ekranlar ve Fonksiyonlar

### 1. Liste Görünümü

Depo yapısı aşağıdaki hiyerarşide gösterilir:

> Depo → Raf → Seviye → Göz (Slot)

- Her raf için ayrı bir kart: **“Raf: R1”**, **“Raf: R2”** vb.
- Rafın içinde, seviyeler yan yana sütunlar halinde:
  - `Seviye 1`, `Seviye 2`, `Seviye 3`, `Seviye 4` …
- Seviye altında gözler listelenir:
  - **Boş gözler**: Beyaz kart, yalnızca göz kodu (örn: `DEP-A-R01-L04-S01`)
  - **Dolu gözler**: Açık sarı kart
    - Üst satır: Göz kodu
    - Alt satır: Ürün adı + sağda adet bilgisi (örn: `mayo / 10358 adet`)

**Etkileşim:**

- Sarı (dolu) bir göze tıklandığında:
  1. Bu göz ve içindeki koli **seçili** hale gelir.
  2. Otomatik olarak **“3D Görünüm” sekmesine geçilir.**
  3. 3D sahnede ilgili gözdeki kutu **yeşil renge boyanmış** olarak vurgulanır.
  4. Sağdaki panelde koli detayları (ürün, adet, QR) gösterilir.

---

### 2. 3D Görünüm

Depo, üç boyutlu bir sahne üzerinde kutular hâlinde gösterilir.

- Zemin: Geniş bir **grid** (depo tabanı).
- Tüm gözler kutu (box) olarak çizilir:
  - Boş göz: Gri kutu
  - Dolu göz: Koli rengi (#d2b48c)
- Dolu gözlerin ön yüzünde küçük **QR kodları** yer alır.

**Seçili Göz Vurgusu:**

- Bir göze veya QR’a tıklanırsa:
  - `selectedSlot` ve `selectedBox` güncellenir.
  - **Seçili gözdeki kutu yeşil** renge boyanır.
- Eğer liste ekranından bir sarı kart üzerinden gelindiyse, o göz zaten seçili ve **yeşil** olarak gelir.

**Bilgi Paneli (3D Görünüm altında):**

- Seçili Göz: kodu
- Konum: Depo / Raf / Seviye
- Koli Kodu
- Ürün Adı
- Miktar (adet)
- Büyük boyutlu QR kod

---

### 3. VR Görünüm

Gerçek VR gözlük entegrasyonu olmadan, **klasik ekran üzerinde “bir insan gibi depoda yürüme”** hissi verir.

- Sahne yine 3D görünümle aynıdır: raflar, kutular ve QR’lar.
- Kamera **insan boyuna yakın** bir konumda başlar (~1.6m yükseklik).

**Kontroller:**

- **W / A / S / D** veya **yön tuşları**:
  - İleri / geri / sağ / sol hareket.
- **Mouse**:
  - Bakış açısını döndürme (OrbitControls).
- Kutular için hesaplanan **çarpışma kutuları (colliders)** sayesinde:
  - Kamera kutuların içinden geçmez,
  - Kutular **duvar gibi davranır.**

**Seçim ve Panel:**

- Kutulara veya QR kodlarına tıklayarak göz seçilebilir.
- Alt panelde:
  - “VR – Seçili Göz”
  - Konum
  - Koli kodu, ürün adı, miktar
  - QR kod
- Panelde ayrıca bu görünümün **VR mantığını göstermek için bir demo** olduğu, ileride gerçek gözlük entegrasyonu eklenebileceği belirtilir.

---

### 4. Admin Paneli

Depodaki kolilerin yönetim ekranıdır.

#### Giriş

- Basit bir login ekranı:
  - Kullanıcı adı
  - Şifre
- Demo için:
  - Kullanıcı adı: `admin`
  - Şifre: `123456`

#### Koli Yönetimi

**Üst kısım: Yeni koli ekleme formu**

- Konum seçimi (Depo / Raf / Seviye / Göz)
- Ürün adı
- Miktar
- “Koli Ekle” butonu
- “Listeyi Yenile” butonu ile backend’den güncel veri çekme

**Alt kısım: Mevcut koliler tablosu**

Sütunlar:

- BoxCode (koli kodu)
- Ürün Adı
- Miktar
- Göz
- Seviye
- Raf
- Depo
- İşlemler:
  - **Düzenle** → koli bilgilerini güncelle
  - **Sil** → koliyi veritabanından sil

Admin panelinde yapılan değişiklikler:

- `/api/boxes` üzerinden backend’e kaydedilir.
- Liste / 3D / VR ekranları **bu güncel veriyle otomatik olarak** tekrar render edilir.

---

## Kurulum

Projede tipik olarak iki ana klasör bulunur:

- `backend/` → .NET Web API projesi  
- `frontend/` → React (3D/VR arayüzü)

Kendi klasör isimlerin farklıysa komutları ona göre uyarlayabilirsin.

### Backend (.NET API)

> Gereksinimler:  
> - .NET 8+ SDK  
> - SQL Server veya uyumlu başka bir veritabanı

```bash
cd backend
dotnet restore
