# Humanize Raporu — 2026-07-17

Önce `ai-code-cleanup` envanteri çıkarıldı (`ai-cleanup-envanter-2026-07-17.md`).
Yapısal bir sorun bulunmadığından bu oturumda yalnızca `code-humanizer` uygulandı:
kodda kalan "AI/chat oturumu" izlerinin temizlenmesi.

## Bulunan ve Düzeltilen

| Kategori                                                                            | Bulunan          | Düzeltilen                                                                                 |
| ----------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| Jenerik isimlendirme                                                                | 0                | - (proje zaten tutarlı Türkçe domain dili kullanıyor: `cizgiler`, `odalar`, `aktifMod`...) |
| Diff-anlatan / oturum yorumları ("YENİ:", "DEĞİŞİKLİK:", "eklendi", "aynı kalıyor") | 11               | 11                                                                                         |
| AI sohbet citation artığı (`[cite: 2]`)                                             | 4                | 4                                                                                          |
| Yorum numaralandırma çakışması (render.js)                                          | 1                | 1                                                                                          |
| Tören kodu / gereksiz soyutlama                                                     | 0 belirgin örnek | -                                                                                          |
| Ders kitabı deseni ↔ proje deyimi uyumsuzluğu                                       | 0                | - (proje zaten kendi deyimini — EaselJS + Türkçe fonksiyon adları — tutarlı sürdürüyor)    |

### Değiştirilen dosyalar

- `state.js` — `hoverCizgiId`/`hoverKoseNoktasi` alanları ve setter'ları üzerindeki
  "YENİ:" etiketleri kaldırıldı; asıl açıklama (neyin ne işe yaradığı) korundu.
- `render.js` — `[cite: 2]` citation artıkları, "YENİ:"/"DEĞİŞİKLİK:" etiketleri ve
  `(Aynı kalıyor)` diff-notu temizlendi; `ekraniGuncelle()` içindeki çakışan
  "2. EKRANI GÜNCELLEME" / "1./2./3." numaralandırması tek, tutarlı bölüm başlıklarına
  (Odalar / Çizgiler / Köşeler) çevrildi.
- `interaction.js` — import satırlarındaki `// cizgiler eklendi`, `// viewport eklendi`,
  `// interaction-drag'e eklediğimiz yeni fonksiyon` diff-notları kaldırıldı.
- `interaction-drag.js` — `// dinamikBolmeUygula eklendi` diff-notu kaldırıldı.
- `history.js` — `// btnUndo, btnRedo, tumunuSil fonksiyonları tamamen aynı kalıyor...`
  yorumu kaldırıldı (kodun NE'sini değil, önceki bir değişiklikte neyin dokunulmadığını
  anlatıyordu — okuyucuya hiçbir değer katmıyordu).

**Davranış değişikliği:** Yok — sadece yorumlar silindi/yeniden yazıldı, hiçbir
ifade, koşul veya fonksiyon imzası değişmedi. Her dosya `node --check` ile
syntax doğrulamasından geçti; `git diff --stat` ile sadece bu 5 dosyanın ve
yalnızca yorum satırlarının değiştiği doğrulandı.

**Dokunulmayan (bilinçli) alan:** Projede birçok dosyada (örn. `camera.js`,
`grid.js`, `snap.js`) tek satırlık ifadeler tutarlı biçimde çok satıra
bölünmüş. Bu, tüm proje boyunca aynı şekilde uygulanmış bir biçimlendirme
tercihi olduğundan (AI izi değil, muhtemelen editör/format ayarı) zorla
"sadeleştirilmedi" — kod-humanizer kuralı gereği "insanileştirme ≠ süsleme,
kara liste körü körüne uygulanmaz".

**Knowledge'a eklenen convention:** Yok (bu proje `.agent/knowledge/` akışını
henüz kullanmıyor; istenirse `knowledge-base-update` ile "yorumlarda diff
narrasyonu yasak" kuralı kaydedilebilir).
