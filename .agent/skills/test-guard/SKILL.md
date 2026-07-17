---
name: test-guard
description: >
  Runs the full test pipeline before any commit and blocks the commit if
  anything fails. Matches changed files to their tests, reports untested
  modules, and watches coverage. The gatekeeper that keeps broken code
  out of the repository.
---

<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Bu skill, commit öncesi tüm testleri çalıştırır ve başarısızlık varsa commit'i
  engeller. Bozuk kodun repoya girmesini önleyen bekçidir. `github` skill'inin
  2. adımında (code-review ile birlikte) otomatik çağrılması önerilir.

  NE ZAMAN: Her commit öncesi. `release-preparer` içinde 1. ön kontrol olarak.
  ÇIKTI:    ✅ "Commit'e hazır" veya ❌ başarısız test raporu + önerilen düzeltmeler.
-->

# Test Guard Skill

## When to Trigger

- Before every commit (automatically, via `github` skill step 2)
- As the first pre-check of `release-preparer`
- After any dependency upgrade
- When the user asks "is this safe to commit?"

## Step-by-Step Process

### 1. Değişen Dosyaları Tespit Et

```bash
git diff --name-only HEAD          # commit'lenmemiş değişiklikler
git diff --staged --name-only      # staged değişiklikler
```

### 2. İlgili Testleri Eşleştir

Her değişen kaynak dosya için test dosyasını bul:

```
src/services/userService.ts  → src/services/userService.test.ts
src/utils/format.py          → tests/test_format.py
```

**Test dosyası olmayan modülleri raporla** — bunlar risk listesine girer.

### 3. Testleri Çalıştır — Kademeli

```bash
# Önce sadece ilgili testler (hızlı geri bildirim)
npm test -- --findRelatedTests <değişen dosyalar>

# Geçerse tüm suite
npm test

# Coverage ile
npm test -- --coverage
```

### 4. Karar Ver

| Durum | Aksiyon |
|-------|---------|
| Tüm testler geçti, coverage stabil | ✅ "Commit'e hazır" |
| Test başarısız | ❌ Commit engellenir — rapor üret |
| Coverage %70 altına düştü | ⚠️ Uyar, gerekçe iste |
| Değişen modülün hiç testi yok | ⚠️ Uyar, test yazılmasını öner |

### 5. Başarısızlık Raporu

```markdown
## ❌ Commit Engellendi — Test Guard

**Başarısız testler:** 2/48

### userService.test.ts › createUser › hashes password
- Beklenen: hash uzunluğu 60
- Alınan: undefined
- Muhtemel neden: bcrypt import'u kaldırılmış (satır 3)
- Önerilen düzeltme: <somut öneri>

**Testi olmayan değişen dosyalar:**
- src/utils/dateHelper.ts — test yazılması önerilir
```

## Rules

- **Başarısız test varsa commit yok.** İstisna yok — `--no-verify` yasak.
- **Testi geçirmek için testi silmek/skip'lemek yasak.** Kodu düzelt veya gerekçeli olarak testi düzelt.
- **Coverage bir vekil metriktir.** Sayıyı şişirmek için anlamsız assertion yazma.
- **Hız için önce ilgili testler,** ama commit kararı tüm suite'e göre verilir.
