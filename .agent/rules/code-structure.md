<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Kodun fiziksel düzenini koruyan kurallar: dosya ve fonksiyon boyut limitleri,
  katman mimarisi, klasör düzeni, import sırası ve iç içe geçme derinliği.
  Amaç: hiçbir dosyanın "çöp konteynerine" dönüşmemesi ve mimarinin
  zamanla erimemesi. Her yeni dosya/fonksiyonda geçerlidir.
-->
---
name: code-structure
description: >
  Keeps the physical shape of the codebase healthy: file and function size
  limits, layered architecture with one-way dependencies, folder conventions,
  import ordering, and nesting depth. Prevents god-files and architecture decay.
---

# Code Structure Rules

## 1. Boyut Limitleri

| Öğe | Uyarı Eşiği | Kesin Sınır | Aşılırsa |
|-----|-------------|-------------|----------|
| Dosya | 300 satır | **500 satır** | Sorumluluklara göre böl (yeni modül/komponent) |
| Fonksiyon/metot | 40 satır | **60 satır** | Alt fonksiyonlara ayır |
| Komponent (UI) | 200 satır | **300 satır** | Alt komponent + hook'a ayır |
| Fonksiyon parametresi | 4 | **5** | Options objesi kullan |
| İç içe geçme (nesting) | 3 seviye | **4 seviye** | Early return / guard clause / extract |

```typescript
// ❌ 4 seviye nesting
if (user) { if (user.active) { if (user.plan) { if (user.plan.paid) { ... } } } }

// ✅ Guard clause ile düzleştir
if (!user?.active) return;
if (!user.plan?.paid) return;
...
```

**Kural:** Uyarı eşiğini geçen dosyaya dokunan kişi bölme önerisi yapar;
kesin sınırı geçen dosyaya **yeni kod eklenmez** — önce bölünür.

İstisnalar (gerekçe yorumuyla): otomatik üretilen dosyalar, migration'lar,
test fixture'ları, saf veri/config dosyaları.

---

## 2. Katman Mimarisi — Bağımlılık Tek Yönlüdür

```
routes/controller  →  service  →  repository/db
       (HTTP)         (iş mantığı)   (veri erişimi)
```

- **Katman atlamak yasak:** controller doğrudan DB'ye erişemez.
- **Ters bağımlılık yasak:** repository, service'i import edemez.
- **Döngüsel bağımlılık yasak:** A → B → A görüldüğü anda refactor edilir
  (`npx madge --circular src/` ile denetle).
- İş mantığı controller'a sızmaz: controller sadece doğrulama + service çağrısı + response.

---

## 3. Klasör Düzeni

- **Bir dosya = bir ana öğe.** Bir dosyada birden fazla public class/komponent olmaz.
- **Özellik bazlı grupla** (feature-first), tip bazlı çöp klasörlerden kaçın:

```
✅ src/features/auth/{routes,service,repository,types}.ts
❌ src/{controllers,services,repos}/... (20+ dosyalık anonim yığınlar)
```

- `utils/` bir istisnadır ve 10 dosyayı geçerse konuya göre bölünür
  (`utils/date.ts`, `utils/string.ts` — `utils/helpers.ts` yasak).
- Dosya adı içeriğini söyler: `userService.ts` içinde sadece user service vardır.

---

## 4. Dosya İçi Düzen ve Import Sırası

Her dosyada sıra:

```typescript
// 1. Dış bağımlılıklar
import express from 'express';
// 2. İç modüller (mutlak/alias yol)
import { UserService } from '@/services/userService';
// 3. Göreli import'lar
import { formatDate } from './helpers';
// 4. Tipler
import type { User } from '@/types';

// 5. Sabitler (magic number/string burada tanımlanır)
const MAX_RETRY = 3;

// 6. Ana öğe (public API üstte, yardımcılar altta)
export function main() { ... }
function helper() { ... }
```

**Magic number/string kuralı:** Anlam taşıyan her sabit değer isimli sabit
veya enum olur. `if (status === 3)` yasak; `if (status === Status.APPROVED)` doğru.

---

## 5. Denetim

Bu kuralların denetleyicileri:

- `code-review` (Mod A) — boyut ve nesting kontrolü commit öncesi
- `architecture-review` — katman ihlalleri ve döngüsel bağımlılık plan aşamasında
- `dead-code-cleaner` — bölme sonrası artık kullanılmayan parçalar

Mümkünse otomatikleştir (ESLint):
```json
{
  "rules": {
    "max-lines": ["warn", 300],
    "max-lines-per-function": ["warn", 40],
    "max-depth": ["error", 4],
    "max-params": ["warn", 4],
    "import/no-cycle": "error",
    "no-magic-numbers": ["warn", { "ignore": [0, 1, -1] }]
  }
}
```
