---
name: release-preparer
description: >
  Orchestrates all pre-release checks in order: tests, security scan,
  env validation, dependency audit, changelog, version bump, docs sync,
  and production build. Any failure stops the release with a blocker
  report. The conductor that calls the other skills.
---

<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Bu skill, release öncesi tüm kontrolleri sırayla çalıştıran "orkestra şefi"dir.
  Diğer skill'leri çağırır: test-guard → security-scanner → env-validator →
  dependency-audit → changelog-generator → documentation-sync. Biri kalırsa durur.
  Release günü paniği yerine tek komutla kontrollü hazırlık sağlar.

  NE ZAMAN: Her production release öncesi.
  ÇIKTI:    ✅ "Release'e hazır" checklist'i + tag, veya ❌ engelleyici listesi.
-->

# Release Preparer Skill

## When to Trigger

- Before any production release or version tag
- When the user says "release hazırlığı yap" / "prepare the release"

## Step-by-Step Process — Sırayla, Biri Kalırsa DUR

### Aşama 1: Ön Kontroller (Koruyucular)

| Sıra | Kontrol | Skill | Bloklar mı? |
|------|---------|-------|-------------|
| 1 | Tüm testler geçiyor | `test-guard` | ✅ Evet |
| 2 | Güvenlik taraması temiz | `security-scanner` | ✅ Kritik bulgu bloklar |
| 3 | Env/config tutarlı | `env-validator` | ✅ Eksik anahtar bloklar |
| 4 | Bağımlılık açığı yok | `dependency-audit` | ✅ Critical CVE bloklar |

### Aşama 2: Sürüm Hazırlığı

5. **CHANGELOG güncelle** → `changelog-generator` — versiyon önerisini al
6. **Versiyon numarasını artır** — package.json / pyproject.toml vb.
7. **Dokümanları senkronize et** → `documentation-sync`

### Aşama 3: Paketleme ve Doğrulama

8. **Production build al:**
```bash
npm run build
# Build hatası = release iptal
```
9. **Smoke test** — uygulama ayağa kalkıyor mu, kritik akış çalışıyor mu?

### Aşama 4: Karar

**✅ Her şey temizse:**
```bash
git tag -a v<X.Y.Z> -m "Release v<X.Y.Z> — <özet>"
```
```markdown
## Release Hazır: v1.3.0
- [x] 48/48 test geçti
- [x] Güvenlik: temiz
- [x] Env: senkron
- [x] Bağımlılık: kritik açık yok
- [x] CHANGELOG + docs güncel
- [x] Build başarılı
→ Tag atıldı. Deploy edilebilir. Rollback: v1.2.3 tag'i mevcut.
```

**❌ Sorun varsa:**
```markdown
## Release Engellendi
1. 🔴 security-scanner: hardcoded key (src/config.ts:12) → rotate + env'e taşı
2. 🔴 test-guard: 2 test başarısız → rapor ekte
Çözülmeden release yok.
```

## Rules

- **Sıra atlanmaz.** Testler geçmeden güvenliğe bile bakılmaz — kaynak israfı.
- **Rollback planı olmadan tag atılmaz** (safety kuralı 3).
- **"Küçük release" istisnası yoktur.** Tek satırlık hotfix de aynı pipeline'dan geçer.
- **Her engelleyici somut çözümle raporlanır** — sadece "hata var" denmez.
