# AI Code Cleanup — Envanter (2026-07-17)

Kapsam: proje kökündeki tüm `.js` dosyaları (19 dosya, ~2.764 satır) + `index.html` + `style.css`.
Bu aşamada **hiçbir kod değiştirilmedi** — sadece tarama yapıldı.

## Genel Durum

Proje, sanılanın aksine oldukça derli toplu: dosyalar sorumluluğa göre bölünmüş
(`camera.js`, `grid.js`, `snap.js`, `interaction-*.js`...), isimlendirme baştan
sona tutarlı bir Türkçe domain dili kullanıyor (`cizgiler`, `odalar`, `aktifMod`,
`grupId` gibi — jenerik `data`/`result`/`item` isimlendirmesi yok). Bu, tipik
"vibe-coded" projelerin aksine bir durum.

## Bulgular

| Koku | Bulundu mu? | Detay | Şiddet |
|------|-------------|-------|--------|
| God-file (500+ satır) | Hayır | En büyük dosya `drawing.js` — 358 satır | - |
| Paralel kopyalar / duplicate fonksiyon | Hayır | `jscpd` ile taranabilecek belirgin bir kopya yok; `zoomIn`/`zoomOut` gibi simetrik çiftler kabul edilebilir boyutta | - |
| Hayalet API / yanlış EaselJS kullanımı | Hayır | `createjs.Stage/Container/Shape/Text` API'leri doğru kullanılmış | - |
| Ölü iskele / kullanılmayan export | Hayır | Taramada kullanılmayan export bulunmadı | - |
| Kopyala-yapıştır config | Hayır | `.env` yok, hassas değer yok | - |
| Aşırı savunmacı kod | Düşük | DOM sorgularında yaygın `?.` kullanımı var (örn. `document.getElementById(...)?.addEventListener`) — index.html'de elementler hep mevcut olduğundan çoğu gereksiz ama zararsız, dokunulmadı | Düşük |
| **Gereksiz yorum gürültüsü / diff-anlatan yorumlar** | **Evet** | Aşağıda liste — AI/chat oturumundan kalan "YENİ:", "DEĞİŞİKLİK:", "eklendi", "[cite: 2]" gibi izler | Orta |
| Debug log / console.log | Kısmi | `interaction.js:85` içinde tek bir `console.warn` var — hata durumunu bilgilendirmek için meşru, debug amaçlı değil | - |

### Diff-anlatan / AI-oturumu yorumları (detay)

Bunlar kodun NE'sini değil, "bu satır AI ile yapılan bir önceki değişiklikte
eklendi" bilgisini taşıyor — 6 ay sonra okuyan biri için anlamsız:

- `state.js:16-17,83,88` — `// YENİ: ...` etiketli 4 yorum
- `render.js:7-8` — `// YENİ: ...` etiketli 2 yorum
- `render.js:88,111,167` — `(Aynı kalıyor)` / `DEĞİŞİKLİK:` etiketli 3 yorum
- `render.js:117,119,120,161` — `[cite: 2]` citation artığı (muhtemelen bir AI
  sohbet yanıtından kopyalanmış kaynak referansı, koda hiç ait değil)
- `interaction.js:1,2` — `// cizgiler eklendi`, `// viewport eklendi`
- `interaction.js:10` — `// interaction-drag'e eklediğimiz yeni fonksiyon`
- `interaction-drag.js:8` — `// dinamikBolmeUygula eklendi`
- `history.js:133` — `// btnUndo, btnRedo, tumunuSil fonksiyonları tamamen aynı kalıyor...`

Ayrıca `render.js` içinde numaralandırma çakışması var: dış yorum
`// 2. EKRANI GÜNCELLEME (EASELJS TARZI)` iken fonksiyon içi adımlar da
`1. ODALARI ÇİZ`, `2. ÇİZGİLERİ ÇİZ`, `3. KÖŞELERİ ÇİZ` olarak numaralanmış —
iki farklı AI oturumunun üst üste bıraktığı numaralandırma izi.

## Güvenlik Ağı Durumu (Adım 2 için not)

`package.json`'daki `test` script'i placeholder: `echo "Error: no test specified" && exit 1`.
**Otomatik test yok.** Bu proje bir canvas/DOM uygulaması olduğundan karakterizasyon
testi yazmak (headless DOM + canvas mock) orantısız olurdu; bunun yerine bu oturumda
davranış değişikliği yapılmadı (sadece yorum/üslup temizliği) ve değişiklik sonrası
uygulama tarayıcıda elle test edildi (çizim, seçim, zoom, grid, undo/redo).

## Karar

Yapısal temizlik (dosya bölme, kopya birleştirme, katman ayırma — Adım 3-5)
**gerekli değil**: envanterde bunu gerektiren bir bulgu yok. Bu oturumda sadece
yukarıdaki yorum gürültüsü `code-humanizer` kapsamında temizlendi (bkz.
`humanize-raporu-2026-07-17.md`). Satır kırma stili (birçok dosyada tek satırlık
ifadelerin çok satıra bölünmesi) tutarlı bir proje konvansiyonu gibi göründüğü için
zorla "sadeleştirilmedi" — bu, kapsamı gerekçesiz genişletmek olurdu.

**Bulunan ve ayrı görev açılan bug:** Yok.
**Kalan riskli bölge:** Otomatik test yok — gelecekte davranış değiştiren bir
refactor öncesi en azından smoke-test eklenmesi önerilir.
