---
name: performance-auditor
description: >
  Scans for common performance pitfalls (N+1 queries, await-in-loop,
  unnecessary re-renders, oversized bundles), measures what it can,
  and produces a prioritized impact/effort report. Explicitly flags
  premature optimizations to avoid over-engineering.
---

<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Bu skill, yaygın performans tuzaklarını tarar ve etki × çaba matrisiyle
  önceliklendirir. Yavaşlık birikerek gelir — düzenli tarama küçükken yakalar.
  "Erken optimizasyon" olanları ayrıca işaretler; her bulgu düzeltilmez.

  NE ZAMAN: Yavaşlık şikayetinde, büyük feature sonrası, aylık rutin.
  ÇIKTI:    İlk 5 kazanım listesi: sorun, konum, beklenen etki, önerilen düzeltme.
-->

# Performance Auditor Skill

## When to Trigger

- A user or metric reports slowness
- After a large feature lands
- Monthly cadence alongside `dependency-audit`
- Before scaling traffic (launch, campaign)

## Step-by-Step Process

### 1. Statik Analiz — Yaygın Tuzaklar

| Tuzak                  | Aranacak                                              |
| ---------------------- | ----------------------------------------------------- |
| Döngü içinde await     | `for` içinde `await` (Promise.all'a çevrilebilir mi?) |
| N+1 sorgu              | Döngü içinde `findById`/query çağrısı                 |
| Tüm kütüphane import'u | `import _ from 'lodash'` (→ `lodash/pick`)            |
| Gereksiz re-render     | Inline object/function prop'lar, eksik memo           |
| Index'siz sorgu        | WHERE/ORDER BY kolonlarında index var mı?             |
| Büyük senkron işlem    | Request döngüsünü bloklayan CPU işi                   |

```bash
# Örnek: döngü içinde await
grep -rn "for.*{" -A 5 src/ | grep "await"
```

### 2. Ölç — Tahmin Etme

Mümkün olanı ölç:

```bash
# Bundle boyutu
npm run build && du -sh dist/

# Test süresi trendi
time npm test

# Endpoint süresi (varsa)
curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3000/api/users
```

Öncekiyle karşılaştır — regresyon var mı?

### 3. Önceliklendir — Etki × Çaba

```
Yüksek etki + düşük çaba  → HEMEN (ilk 5 listesi)
Yüksek etki + yüksek çaba → PLANLA (ayrı görev)
Düşük etki                → ERKEN OPTİMİZASYON — dokunma, not düş
```

### 4. Rapor

```markdown
## Performance Audit — <tarih>

### İlk 5 Kazanım

1. **N+1 sorgu** — src/services/orderService.ts:34
   Etki: liste sayfası 50 sorgu → 2 sorgu. Düzeltme: JOIN / include kullan.
2. **Döngüde await** — src/jobs/mailer.ts:12
   Etki: 100 mail 100sn → ~5sn. Düzeltme: Promise.all + batch limit.
   ...

### Erken Optimizasyon (dokunulmadı)

- memo eklenmemiş küçük komponentler — ölçülebilir etki yok
```

## Rules

- **Ölçmeden "yavaş" deme.** Her bulguya mümkünse rakam ekle.
- **Erken optimizasyon işaretle, düzeltme.** code-quality kuralı burada da geçerli.
- **Düzeltme sonrası tekrar ölç** — iyileşmeyi kanıtla.
- **Okunabilirliği bozan mikro-optimizasyon** ancak ölçülmüş darboğazda haklıdır.
