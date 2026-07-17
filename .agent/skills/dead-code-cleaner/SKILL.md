---
name: dead-code-cleaner
description: >
  Safely removes unused imports, variables, functions, components, and files.
  Verifies dynamic usage before deleting, runs tests after each removal,
  and separates confirmed-dead code from suspicious candidates that need
  human judgment.
---

<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Bu skill, kullanılmayan kodu güvenle temizler. Kullanılmayan kod projeyi
  şişirir, okumayı zorlaştırır ve saldırı yüzeyini büyütür. Dinamik kullanım
  (string import, reflection) kontrolü yapmadan asla silmez.

  NE ZAMAN: Refactor öncesi, aylık bakım, "proje şişti" hissinde.
  ÇIKTI:    Silinen kod raporu + insan kararı bekleyen şüpheli listesi.
-->

# Dead Code Cleaner Skill

## When to Trigger

- Before a large refactor (clean base = easier refactor)
- Monthly maintenance cadence
- After removing a feature (its helpers often linger)

## Step-by-Step Process

### 1. Tara

```bash
# TS/JS — kullanılmayan export'lar
npx ts-prune            # TypeScript
npx depcheck            # kullanılmayan bağımlılıklar

# Python
pip install vulture
vulture src/
```

Ek manuel taramalar:
- Hiç import edilmeyen dosyalar
- Hiç çağrılmayan export'lar
- Yorum satırına alınmış eski kod blokları
- Kullanılmayan CSS sınıfları

### 2. Doğrula — Silmeden Önce

Her aday için dinamik kullanım kontrolü:

```bash
# String ile referans var mı? (dinamik import, route tablosu, config)
git grep -n "helperName"          # sadece import değil, string olarak da ara
```

Şüpheli durumlar (SİLME, işaretle):
- Framework convention'la çağrılan kod (lifecycle, magic methods)
- Reflection / `getattr` / dinamik import hedefleri
- Public API olarak dışa açılan export'lar (başka repo kullanıyor olabilir)

### 3. Temizle — Kademeli

- Kesin ölü kodu sil — **her silme sonrası testleri çalıştır**
- Silmeleri mantıksal gruplar halinde ayrı commit'lere böl:

```bash
git commit -m "chore: remove unused date helpers (no references found)"
git commit -m "chore: remove orphaned UserBadge component"
```

### 4. Rapor

```markdown
## Dead Code Cleanup — <tarih>

**Silinen:** 14 dosya, ~1.200 satır
- src/utils/oldFormatter.ts — hiç import edilmiyordu
- src/components/LegacyModal/ — v2'de değiştirilmişti

**Şüpheli (insan kararı bekliyor):**
- src/plugins/hooks.ts — string ile dinamik çağrı olabilir (plugin sistemi)

**Testler:** ✅ 48/48 geçiyor
```

## Rules

- **Emin değilsen silme.** Şüpheli listesi utanç değil, doğru davranıştır.
- **Her silme sonrası test.** Toplu sil-sonra-test yaklaşımı hatayı izole edemez.
- **Yorumlanmış kod blokları silinir** — git geçmişi zaten saklıyor.
- **Silme commit'leri feature commit'lerinden ayrı** tutulur (code-quality kuralı 4).
