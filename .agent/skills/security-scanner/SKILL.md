---
name: security-scanner
description: >
  Scans the codebase for leaked secrets, dangerous code patterns
  (eval, SQL string concatenation, unvalidated input), and verifies
  .env hygiene. Complements dependency-audit: that skill covers packages,
  this one covers your own code. Run before every release and on demand.
---

<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Bu skill, kod tabanını sızmış secret'lar, tehlikeli kod desenleri ve
  .env hijyeni açısından tarar. `dependency-audit` paketleri tarar,
  bu skill senin kendi kodunu tarar — ikisi birbirini tamamlar.

  NE ZAMAN: Her release öncesi, şüpheli durumda, yeni katılımcı onboard edilirken.
  ÇIKTI:    Risk seviyesine göre sıralı bulgu listesi: dosya, satır, sorun, çözüm.
-->

# Security Scanner Skill

## When to Trigger

- Before every production release (via `release-preparer`)
- After merging external contributions
- When a secret leak is suspected
- Monthly cadence alongside `dependency-audit`

## Step-by-Step Process

### 1. Secret Taraması

```bash
# Yaygın secret desenleri
git grep -nE "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][A-Za-z0-9_\-]{16,}" -- ':!*.test.*' ':!*.example'

# Bilinen key formatları
git grep -nE "sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16}"

# Git geçmişinde sızıntı (daha derin tarama gerekirse)
# gitleaks detect --source .
```

**Sızıntı bulunursa:** önce key'i rotate et, sonra koddan temizle. Sadece silmek yetmez — git geçmişinde kalır.

### 2. Tehlikeli Kod Desenleri

| Desen                                      | Risk                | Aranacak                        |
| ------------------------------------------ | ------------------- | ------------------------------- |
| `eval(`, `new Function(`                   | Kod enjeksiyonu     | JS/TS                           |
| SQL string birleştirme                     | SQL injection       | `"SELECT ... " +`, f-string SQL |
| `innerHTML =`, `dangerouslySetInnerHTML`   | XSS                 | Frontend                        |
| `pickle.loads`, `yaml.load` (safe olmayan) | Deserialization     | Python                          |
| Doğrulanmamış redirect                     | Open redirect       | `res.redirect(req.query...)`    |
| `chmod 777`, geniş CORS (`*`)              | Yanlış yapılandırma | Config                          |

### 3. .env Hijyeni

- [ ] `.env` `.gitignore`'da mı?
- [ ] `.env` daha önce commit'lenmiş mi? (`git log --all -- .env`)
- [ ] `.env.example`'da gerçek değer var mı? (placeholder olmalı)

### 4. Rapor

```markdown
## Security Scan — <tarih>

### 🔴 Kritik

- src/config.ts:12 — hardcoded API key → env değişkenine taşı + key'i rotate et

### 🟡 Yüksek

- src/db/query.ts:45 — SQL string birleştirme → parametreli sorguya çevir

### 🔵 Bilgi

- CORS tüm origin'lere açık — production'da daraltılmalı

**Karar:** ❌ Kritik bulgu var — release/commit önerilmez.
```

## Rules

- **Kritik bulgu release'i bloklar.** Açık onay olmadan istisna yok.
- **Sızan secret önce rotate edilir,** sonra temizlenir. Sıralama önemli.
- **False positive'leri gerekçeyle işaretle,** sessizce yoksayma.
- **Test fixture'larındaki sahte key'ler** açıkça "fake/test" olarak adlandırılmalı.
