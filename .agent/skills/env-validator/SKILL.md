---
name: env-validator
description: >
  Synchronizes environment variable usage across code, .env.example, and
  documentation. Finds env keys used in code but missing from .env.example,
  stale keys no longer used, and verifies .env is gitignored. Fixes
  "works on my machine" before it happens.
---

<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Bu skill, koddaki env kullanımı ile .env.example ve dokümantasyonu senkronize eder.
  "Bende çalışıyor" sorunlarının 1 numaralı kaynağı eksik env değişkenidir.
  code-hygiene kuralının (3c) denetleyicisidir — kural der, bu skill doğrular.

  NE ZAMAN: Yeni env eklendiğinde, onboarding öncesi, release öncesi, CI hatalarında.
  ÇIKTI:    Eksik/fazla anahtar raporu + güncellenmiş .env.example.
-->

# Env Validator Skill

## When to Trigger

- After any change that adds or removes an env variable
- Before onboarding a new developer
- As a pre-check in `release-preparer`
- When CI fails with "undefined" config errors

## Step-by-Step Process

### 1. Koddaki Kullanımı Tara

```bash
# Node.js
grep -rhoE "process\.env\.[A-Z0-9_]+" src/ | sort -u

# Python
grep -rhoE "os\.environ(\.get)?\(['\"][A-Z0-9_]+" . | sort -u

# Vite/Next gibi framework prefix'leri
grep -rhoE "import\.meta\.env\.[A-Z0-9_]+" src/ | sort -u
```

### 2. Karşılaştır

Üç liste çıkar:

```
KODDA VAR, .env.example'DA YOK  → eksik (kritik — yeni geliştirici çalıştıramaz)
.env.example'DA VAR, KODDA YOK  → bayat (temizlenebilir, ama runtime kullanımını doğrula)
İKİSİNDE DE VAR                 → tamam
```

### 3. Güvenlik Kontrolleri

- [ ] `.env` `.gitignore`'da mı?
- [ ] `.env.example`'daki değerler placeholder mı? (gerçek değer sızıntısı)
- [ ] Her anahtarın `#` açıklama satırı var mı? (code-hygiene 3c)

### 4. Düzelt

- Eksik anahtarları `.env.example`'a placeholder + açıklama ile ekle
- Bayat anahtarları kullanıcı onayıyla kaldır
- Uygulama başlangıcına fail-fast doğrulama öner:

```typescript
const required = ["DATABASE_URL", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}
```

### 5. Rapor

```markdown
## Env Validation — <tarih>

**Eksik (.env.example'a eklendi):**

- STRIPE_WEBHOOK_SECRET — src/payments/webhook.ts:8

**Bayat (onay bekliyor):**

- OLD_API_URL — kodda kullanım bulunamadı

**Güvenlik:** ✅ .env gitignore'da, placeholder'lar temiz
```

## Rules

- **Gerçek değer asla .env.example'a yazılmaz.**
- **Bayat anahtar sessizce silinmez** — dinamik kullanım (config dosyası, CI) olabilir, onay al.
- **Fail-fast doğrulama** her projede önerilir — eksik config runtime'da değil boot'ta patlasın.
