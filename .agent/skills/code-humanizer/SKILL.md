---
name: code-humanizer
description: >
  Removes the "AI wrote this" fingerprint from code and makes it read like
  a thoughtful human on this team wrote it: domain-driven naming instead of
  generic names, project idioms instead of textbook patterns, pragmatic
  simplicity instead of ceremonial boilerplate. Style-only — behavior and
  structure stay untouched (structure is ai-code-cleanup's job).
---

<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Bu skill, koddaki "bunu AI yazmış" parmak izini siler. ai-code-cleanup'tan
  farkı: o DÜZENİ toparlar (dosya bölme, kopya birleştirme, katman ayırma),
  bu skill ÜSLUBU insanileştirir — isimlendirme, deyimler, yorum tonu,
  gereksiz tören kodunun sadeleştirilmesi. Davranış ve mimari değişmez.
  Hedef: kodu 6 ay sonra okuyan birinin "bunu düşünen biri yazmış" demesi.

  NE ZAMAN: AI üretimi kod merge edilmeden önce; ekip stiline uyum gerektiğinde;
            ai-code-cleanup sonrası son rötuş olarak.
  ÇIKTI:    Üslup değişiklikleri (ayrı commit) + AI-izi kontrol raporu.
-->

# Code Humanizer Skill

## Ne Zaman Tetiklenir

- AI'ın yazdığı kod PR'a girmeden önce son geçiş olarak
- Kod "doğru ama ruhsuz" hissi veriyorsa
- Ekipte "AI kodu hemen belli oluyor" şikayeti varsa
- `ai-code-cleanup` tamamlandıktan sonra (önce düzen, sonra üslup)

## Ön Koşul

Testler yeşil olmalı. Bu skill yalnızca üslup değiştirir; her adımdan sonra
testler tekrar çalıştırılır. Davranış veya yapı değişikliği gerekiyorsa bu
skill'in işi değildir — `ai-code-cleanup` veya normal refactor'a yönlendir.

---

## AI Parmak İzi Kataloğu — Ne Aranır, Nasıl İnsanileşir

### 1. Jenerik İsimlendirme → Domain Dili

AI, domain'i bilmediği için soyut isimler üretir. Projenin gerçek dilini kullan:

```typescript
// ❌ AI izi — her projede aynı isimler
const data = await fetchData();
const result = processItems(data);
handleResponse(result);

// ✅ İnsan izi — domain konuşuyor
const overdueInvoices = await fetchOverdueInvoices();
const reminders = buildPaymentReminders(overdueInvoices);
queueReminderEmails(reminders);
```

Kara liste (gerekçesiz kullanılamaz): `data`, `result`, `item`, `temp`, `value`,
`handleX`, `processX`, `doX`, `myX`, `foo`, `obj`, `arr`, `res2`, `newData`.

### 2. Anlatıcı Yorumlar → Sessizlik veya Gerekçe

AI kodun NE yaptığını anlatır; insan NEDEN yapıldığını yazar (code-hygiene zaten
satır içi yorumu yasaklar — burada kalan metot üstü yorumların tonu düzeltilir):

```typescript
// ❌ AI izi
/** Bu fonksiyon kullanıcı listesini alır ve filtreler, sonra döndürür. */

// ✅ İnsan izi — kod zaten ne yaptığını söylüyor; yorum sadece neden'i
/** Pasif kullanıcılar faturalamaya girmesin diye burada filtrelenir (bkz. #482). */
```

Ayrıca sil: "Step 1/2/3" yorumları, `// TODO: implement error handling` gibi
sahipsiz iskeleler, yorum içi emoji, kendinden emin olmayan ifadeler
("this should probably work").

### 3. Tören Kodu → Pragmatik Sadelik

AI her yere aynı kalıbı döşer. Bağlama göre sadeleştir:

```typescript
// ❌ AI izi — üç satırlık iş, on satırlık tören
let output: string[] = [];
if (users && users.length > 0) {
  for (let i = 0; i < users.length; i++) {
    if (users[i] !== null && users[i] !== undefined) {
      output.push(users[i].email);
    }
  }
}

// ✅ İnsan izi
const emails = users.flatMap(u => u?.email ?? []);
```

Aranacaklar: asla tetiklenmeyen null-check yığınları, tek satırlık işlev için
ayrı interface + factory, her fonksiyonda kopyala-yapıştır try-catch
(hata zaten üst katmanda yakalanıyorsa), gereksiz `else` blokları.

### 4. Ders Kitabı Deseni → Proje Deyimi

AI genel-geçer "best practice" yazar; insan projenin mevcut deyimini sürdürür:

- Projede React Query varken elle `useEffect + fetch` yazılmışsa → projenin desenine çevir
- Proje `date-fns` kullanırken AI `new Date()` matematiği yazmışsa → uyumla
- Projenin kendi `ApiError` sınıfı varken jenerik `throw new Error()` → projeninkine çevir

Referans: `.agent/knowledge/` altındaki `convention` girdileri. Yoksa bu geçişte
öğrenilen deyimleri `knowledge-base-update` ile kaydet.

### 5. Tekdüze Ritim → Doğal Vurgu

AI her şeyi aynı ağırlıkta yazar. İnsan önemliyi öne çıkarır:

- Ana akış (happy path) yukarıda ve yalın; edge case'ler guard clause ile başta ayıklanır
- Önemli iş kuralı görünür olsun; kritik satır beş satır savunma kodunun arasına gömülmesin
- Simetri zorlaması kaldırılır: iki benzer fonksiyondan biri 3 parametre gerektirmiyorsa almaz

---

## Süreç

1. **Tara:** Yukarıdaki 5 kategori için dosya dosya işaretleme yap (değiştirme).
2. **Domain sözlüğü çıkar:** README, tip isimleri ve DB şemasından projenin
   gerçek terimlerini listele — isimlendirme bunlardan beslenir.
3. **Kategori kategori uygula:** Her kategori ayrı commit; her commit sonrası test.
   ```bash
   git commit -m "style(humanize): rename generic identifiers to domain terms in billing"
   git commit -m "style(humanize): replace narrative comments with rationale comments"
   git commit -m "style(humanize): simplify ceremonial null-handling in reports"
   ```
4. **Raporla:**

```markdown
## Humanize Raporu — <tarih>

| Kategori | Bulunan | Düzeltilen |
|----------|---------|------------|
| Jenerik isim | 34 | 34 |
| Anlatıcı yorum | 58 | 58 (12'si gerekçe yorumuna çevrildi) |
| Tören kodu | 9 blok | 7 (2'si gerçekten gerekli — not düşüldü) |
| Desen uyumsuzluğu | 4 | 4 (React Query'ye geçirildi) |

**Davranış değişikliği:** Yok — testler yeşil.
**Knowledge'a eklenen convention:** 3 (isimlendirme sözlüğü, hata deseni, tarih kütüphanesi)
```

---

## Kurallar

- **Sadece üslup.** Mantık, yapı, API yüzeyi değişmez; gerekiyorsa ayrı skill/görev.
- **Her kategori ayrı commit** — isim değişikliğiyle sadeleştirme karışmaz.
- **Kara liste körü körüne uygulanmaz:** `data` bir CSV parser'da meşru olabilir; bağlama bak.
- **İnsanileştirme ≠ süsleme.** Amaç kişilik katmak değil, düşünce izini görünür kılmak.
- **Domain terimini uydurma** — sözlükte yoksa kullanıcıya sor.
- Öğrenilen deyimler `knowledge-base-update` ile kaydedilir; yoksa bir sonraki
  AI oturumu yine ders kitabı yazar.
