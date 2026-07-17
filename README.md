# 📐 WebCAD Prototipi

Tarayıcıda çalışan, basit bir 2D kat planı / çizim aracı. Çizgi ve dikdörtgen
çizip nesne ile grid'e mıknatıslanma (snap), köşeleri sürükleyerek düzenleme,
kutu ile çoklu seçim ve kapalı çizgi döngülerinden otomatik oda algılama
sağlar. Bağımlılık yönetimi veya derleme adımı olmayan, saf ES modülleriyle
yazılmış küçük bir prototiptir.

## Özellikler

- **Çizim araçları:** Çizgi, dikdörtgen, kare — sol paneldeki araç
  butonlarından seçilir.
- **Mıknatıslama (snap):** Fare, mevcut çizgi köşelerine/kenarlarına veya
  grid'e otomatik yapışır (`src/geometry/snap.js`, `src/geometry/grid.js`).
- **Açı kilidi:** Çizgi çizerken açı varsayılan olarak en yakın 45°'nin
  katına kilitlenir; **Shift** basılıyken serbest açıda çizilebilir.
- **Seç ve taşı:** Çizgileri, grupları (kapalı şekilleri) veya tek bir köşeyi
  seçip sürükleyerek taşıyabilirsiniz; taşırken de snap uygulanır.
- **Kutu ile çoklu seçim:** Boş alana tıklayıp sürükleyerek kutu içindeki tüm
  şekilleri seçin.
- **Otomatik bölme:** Bir çizginin ucu başka bir çizginin gövdesine denk
  gelirse, o çizgi otomatik olarak ikiye bölünür (duvarların birleşim
  noktalarının doğru davranması için).
- **Oda algılama:** Kapalı çizgi döngüleri otomatik olarak "oda" olarak
  tanınır ve içi renkli dolgu ile gösterilir (`src/drawing/rooms.js`).
- **Uzunluk etiketleri:** Her çizginin üstünde, metre cinsinden uzunluğu
  gösterilir; zoom seviyesinden bağımsız olarak hep aynı boyutta kalır.
- **Zoom / Pan:** Fare tekerleği ile yakınlaştır/uzaklaştır (imlecin altındaki
  noktaya göre), sağ tuşla sürükleyerek gez.
- **Grid:** Açılıp kapatılabilir, ayrıca grid'e bağımsız olarak snap
  açılıp kapatılabilir.
- **Geri al / ileri al / tümünü sil.**
- **JSON olarak dışa aktar:** Sol paneldeki "⬇ JSON Olarak Dışa Aktar"
  butonu, mevcut çizgi listesini `webcad-plan-<tarih>.json` adıyla indirir
  (`src/io/export.js`).
- **Silme:** Seçili şekil(ler) `Delete`/`Backspace` tuşuyla veya seçili
  şeklin yanında beliren çöp kutusu butonuyla silinir.
- **Esc:** Yarım kalan çizimi iptal eder.

## Çalıştırma

Kod ES modülleri (`type="module"`) kullandığı için `index.html`'i doğrudan
`file://` ile açmak çalışmaz — tarayıcı, modül importlarını disk üzerinden
yüklerken (herhangi bir dilden bağımsız olarak) engeller; dosyaların gerçek
bir `http://` origin'inden servis edilmesi gerekir. Proje tamamen JS
olduğu için statik sunucu da JS tarafında (`http-server` paketiyle):

```bash
npm install
npm start
```

Ardından `http://localhost:8080` adresine gidin. (`npm start`, `devDependencies`
içindeki `http-server` paketini çalıştırır — Python'a ihtiyaç yoktur, sadece
dosyaları olduğu gibi servis eden bir statik sunucudur.)

## Proje Yapısı

Uygulama kodu `src/` altında sorumluluğa göre klasörlere ayrılmıştır; `index.html`
ve `style.css` statik giriş dosyaları olarak proje kökünde kalır.

```
src/
  app.js                  — Giriş noktası: tüm modülleri yükler, ilk grid çizimini tetikler
  core/
    state.js              — Uygulamanın tüm paylaşılan durumu (çizgiler, odalar, seçim, hover, mod)
    stage.js              — EaselJS stage/canvas/katman (layer) kurulumu
    tools.js              — Araç çubuğu (Seç/Çizgi/Dikdörtgen/Kare) mod geçişleri
  geometry/
    geometry.js           — Saf geometri yardımcıları (poligon alanı, nokta-poligon testi, kutu kesişimi)
    grid.js               — Grid çizimi, grid'e snap, grid görünürlük/snap butonları
    snap.js               — Nesneye/kenara snap hesaplamaları, açı kilidi, grup taşıma snap'i
  drawing/
    drawing.js            — Çizgi/dikdörtgen/kare çizim akışı (tıklama → önizleme → tamamlama)
    rooms.js              — Çizgi gruplarından kapalı poligon ("oda") çıkarımı
    history.js            — Undo/redo yığınları, çizgi ekleme, otomatik çizgi bölme
    render.js             — Sahnenin (odalar, çizgiler, köşeler, uzunluk etiketleri) yeniden çizimi
  camera/
    camera.js             — Zoom ve pan (viewport dönüşümleri)
  interaction/
    interaction.js               — SELECT dışı modlarda fare olayları (çizim başlat/bitir)
    interaction-select.js        — Tıklanan çizgi/oda bulma
    interaction-drag.js          — Grup veya köşe sürükleme mantığı
    interaction-box-select.js    — Kutu ile çoklu seçim
    interaction-hover.js         — Hover (üzerine gelme) durumu ve görsel geri bildirim
    interaction-delete-button.js — Seçili şeklin yanındaki silme butonunun konumlandırılması ve silme
    interaction-selection-helpers.js — Seçim durumuyla ilgili küçük ortak yardımcılar
  io/
    export.js             — Mevcut çizimi JSON dosyası olarak indirme
index.html
style.css
```

## Teknolojiler

- **[EaselJS](https://createjs.com/easeljs)** (CDN) — canvas çizim katmanı
- **[Tailwind CSS](https://tailwindcss.com)** (CDN, `@tailwindcss/browser`) — arayüz stilleri
- Derleme/bundler yok — tarayıcı doğrudan ES modüllerini yükler
- ESLint (`eslint.config.mjs`) — `npm install` sonrası `npx eslint .`

## Geliştirme Notları

- Otomatik test yok (`npm test` şu an placeholder). Değişiklik sonrası en
  azından çizim/seçim/zoom/grid/undo akışlarını tarayıcıda elle test edin.
- Proje `.agent/` altında bir agent/skill yapılandırması içerir — yeni bir
  AI destekli oturuma başlarken `.agent/AGENTS.md` okunmalıdır.
