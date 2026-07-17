---
name: ai-code-cleanup
description: >
  Systematically untangles messy AI-generated ("vibe-coded") code: detects
  AI-specific smells (duplication across files, inconsistent patterns,
  hallucinated APIs, dead scaffolding, god-files), establishes a safety net
  of tests first, then refactors incrementally toward the kit's structure
  and quality rules — without changing behavior.
---

<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Bu skill, yapay zekanın dağınık yazdığı kodu güvenle toparlamak içindir.
  AI kodunun tipik kokuları farklıdır: her istekte sıfırdan üretilen benzer
  fonksiyonlar, dosyadan dosyaya değişen desenler, var olmayan API çağrıları,
  kullanılmayan iskele kodu, tek dosyaya yığılmış dev komponentler.
  Önce davranışı kilitleyen test ağı kurulur, sonra kural setine
  (code-structure, code-quality, code-hygiene) doğru adım adım refactor edilir.
  Davranış DEĞİŞMEZ — sadece düzen değişir.

  NE ZAMAN: AI ile hızlı prototip sonrası, devralınan vibe-coded proje,
            "çalışıyor ama kimse dokunamıyor" durumu.
  ÇIKTI:    Temizlik planı + kademeli refactor commit'leri + önce/sonra raporu.
-->

# AI Code Cleanup Skill

## Ne Zaman Tetiklenir

- AI ile hızlıca yazılmış bir prototip production'a hazırlanacaksa
- Devralınan projede "bunu AI yazmış, kimse anlamıyor" durumu varsa
- Aynı işi yapan 3-4 farklı fonksiyon/komponent fark edildiğinde
- Tek dosya 1000+ satıra ulaştıysa ve her şey oradaysa

---

## Adım 1: Envanter — Dokunmadan Önce Anla

Hiçbir şeyi değiştirmeden projeyi tara ve **AI kod kokuları** envanteri çıkar:

| Koku | Neden AI'a Özgü | Nasıl Bulunur |
|------|-----------------|---------------|
| Paralel kopyalar | Her istekte sıfırdan benzer kod üretilir | `npx jscpd src/` (duplicate detector) |
| Desen tutarsızlığı | Farklı oturumlar farklı stil kullanır | Aynı işi yapan dosyaları karşılaştır (fetch/axios karışımı, 3 farklı hata deseni) |
| God-file | Her şey "çalışan dosyaya" eklenir | 500+ satır dosyalar: `find src -name "*.ts" | xargs wc -l | sort -rn | head` |
| Ölü iskele | Yarım bırakılan denemeler | Kullanılmayan export/import (`ts-prune`, `depcheck`) |
| Hayalet API | Var olmayan metot/parametre halüsinasyonu | Tip kontrolü + testler: `tsc --noEmit` |
| Gereksiz yorum gürültüsü | Her satırı açıklayan AI yorumları | code-hygiene ihlali taraması |
| Kopyala-yapıştır config | Anlaşılmadan eklenen ayarlar | Kullanılmayan config anahtarları (env-validator) |
| Aşırı savunmacı kod | Her yerde gereksiz try-catch/null check | Hiç tetiklenmeyen catch blokları |

Çıktıyı `.agent/reviews/ai-cleanup-envanter-<tarih>.md` dosyasına yaz:
sorun → dosya/satır → şiddet (yüksek/orta/düşük).

**Bu aşamada kod değiştirmek yasak.**

---

## Adım 2: Güvenlik Ağı — Davranışı Kilitle

Refactor'dan önce mevcut davranışı testlerle sabitle:

1. Var olan testleri çalıştır — geçenler baseline'dır.
2. Test edilmeyen **kritik akışlara** karakterizasyon testi yaz:
   *doğru davranışı değil, MEVCUT davranışı test et* (bug bile olsa — bug ayrı iş).
3. En azından smoke test: uygulama açılıyor mu, ana akış çalışıyor mu?

```
Kural: Güvenlik ağı olmayan bölgede refactor yapılmaz.
Test yazılamıyorsa önce test edilebilir hale getirecek minimum değişiklik yapılır.
```

---

## Adım 3: Temizlik Planı — Riskten Ucuza Sırala

Envanteri şu sırayla plana çevir (her adım bağımsız commit):

```
1. Ölü kodu sil            → dead-code-cleaner       (risk: düşük, kazanç: yüksek)
2. Yorum gürültüsünü temizle → code-hygiene kuralı    (risk: sıfır)
3. Debug log'ları kaldır    → code-hygiene kuralı     (risk: sıfır)
4. Kopyaları birleştir      → code-quality (3+ kuralı) (risk: orta — testle doğrula)
5. Desenleri tekle          → tek hata deseni, tek HTTP client (risk: orta)
6. God-file'ları böl        → code-structure limitleri (risk: orta)
7. Katmanları ayır          → controller/service/repository (risk: yüksek — en son)
```

Her madde için: hangi dosyalar, beklenen sonuç, hangi testler doğrular.
5+ dosyayı etkileyen adımlar için önce kullanıcı onayı al (safety kuralı).

---

## Adım 4: Kademeli Refactor — Küçük Adım, Sürekli Test

Her adımda döngü:

```
küçük değişiklik → testleri çalıştır → geçti mi? → commit → sonraki adım
                                     → kalmadı mı? → geri al, daha küçük adımla dene
```

- **Bir commit = bir temizlik türü.** "Böldüm + yeniden adlandırdım + hata desenini değiştirdim" tek commit olmaz.
- Davranış değişikliği fark edersen **dur**: bu bir bug'dır, refactor'a karıştırma —
  kaydet, kullanıcıya bildir, ayrı görev aç.
- Birleştirme kararlarında code-quality soyutlama eşiğini uygula:
  benzer görünen ama farklı bağlamda değişen kodu **birleştirme**.

```bash
git commit -m "refactor(cleanup): remove dead scaffolding from auth module"
git commit -m "refactor(cleanup): unify 3 duplicate date formatters into utils/date"
git commit -m "refactor(cleanup): split 1200-line dashboard.tsx into 5 components"
```

---

## Adım 5: Kural Setine Bağla — Tekrarını Önle

Temizlik bittikten sonra aynı dağınıklığın geri gelmemesi için:

- ESLint limitlerini aç (code-structure §5'teki config)
- `jscpd` / `madge --circular` kontrolünü CI'a ekle
- Öğrenilen proje desenlerini `knowledge-base-update` ile `convention` olarak kaydet —
  sonraki AI oturumları `project-context-primer` ile bu desenleri yükler ve aynı stille yazar

> En kalıcı çözüm: AI'a kod yazdırmadan önce bağlam yüklemek.
> Dağınıklığın kökü kötü kod değil, bağlamsız üretimdir.

---

## Adım 6: Önce/Sonra Raporu

```markdown
## AI Code Cleanup — <tarih>

| Metrik | Önce | Sonra |
|--------|------|-------|
| Toplam satır | 14.200 | 9.800 |
| 500+ satır dosya | 6 | 0 |
| Duplicate blok (jscpd) | %18 | %3 |
| Ölü export | 41 | 0 |
| Hata deseni sayısı | 3 farklı | 1 standart |
| Test sayısı / coverage | 12 / %31 | 47 / %68 |

**Davranış değişikliği:** Yok (karakterizasyon testleri geçiyor)
**Bulunan ve AYRI görev açılan bug'lar:** 2 (listede)
**Kalan riskli bölge:** payments/ — test yazılamadı, dokunulmadı, işaretlendi
```

---

## Kurallar

- **Davranış değişmez.** Refactor sırasında bulunan bug düzeltilmez, raporlanır.
- **Güvenlik ağı yoksa refactor yok.** Önce karakterizasyon testi.
- **Big-bang yeniden yazım yasak.** Cazip gelir, her zaman kademeli daha güvenlidir.
- **Her adım geri alınabilir olmalı** — küçük commit'ler, anlamlı mesajlar.
- **Anlamadığın kodu silme/birleştirme** — şüpheliyse işaretle, kullanıcıya sor.
- Temizlik sonrası `knowledge-base-update` zorunlu: desenler kaydedilmezse
  bir sonraki AI oturumu aynı dağınıklığı yeniden üretir.
