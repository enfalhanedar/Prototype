# Agent Setup — Oturum Talimatları

Bu dosya asistan tarafından her oturumda otomatik okunur.

---

## Zorunlu İlk Adım

Her yeni oturumda **`.agent/skills/project-context-primer/SKILL.md`** oku ve uygula. Bu atlanmaz.

---

## Kritik Kurallar (özet — tamamı .agent/rules/ altında)

### Güvenlik (rules/safety.md)

- `DROP`, `DELETE`, `TRUNCATE`, `rm -rf`, `git push --force` (ana branch): **önce onay al**
- Mevcut testler geçiyorsa ve görev o kodu doğrudan değiştirmiyorsa — **dokunma**
- Migration/production deploy öncesi: **rollback adımı tanımla**

### Kod Temizliği (rules/code-hygiene.md)

- Yorumlar sadece fonksiyon/metot başlıklarında
- `console.log`, `console.warn`, `debugger`, `print()`: commit öncesi **kaldır**
- Hassas değerler (API key, token): **.env kullan**, kesinlikle koda yazma
- Yeni env variable eklendiğinde: **.env.example güncelle** (açıklama zorunlu)

### Kod Kalitesi (rules/code-quality.md)

- Aynı kod 3+ yerde tekrar ediyorsa → **extract et**
- Yeni soyutlama öncesi: "3+ yerde kullanılıyor mu? 6 ay sonra anlaşılır mı?" → Hayır ise **bırak**
- Refactor: feature commit'inden ayrı, bağımsız commit

### Kod Yapısı (rules/code-structure.md)

- Dosya 500, fonksiyon 60 satırı **geçemez** (uyarı: 300/40) — geçen önce bölünür
- Katman sırası: controller → service → repository; **katman atlama ve döngüsel bağımlılık yasak**
- Magic number/string → isimli sabit veya enum

---

## İş Akışı

```
YENİ OTURUM
  └─ project-context-primer (zorunlu)

FİKİR      → prompt-enhancer → brainstorming → SCOPE-<slug>.md
PLAN       → writing-plans → implementation_plan.md → architecture-review
GELİŞTİRME → test-driven-execution
KOMİT      → test-guard → code-review → github skill (doğrudan git komutu ÇALIŞTIRMA)
RELEASE    → release-preparer (tüm ön kontrolleri zincirler)
KRİZ       → incident-response → knowledge-base-update
```

---

## Skill Rehberi

| Skill                      | Ne Zaman                                                   |
| -------------------------- | ---------------------------------------------------------- |
| `project-context-primer`   | Her oturum başında — zorunlu                               |
| `prompt-enhancer`          | İstek belirsizse                                           |
| `brainstorming`            | Fikir/gereksinim netleştirilirken                          |
| `writing-plans`            | Scope onaylandıktan sonra                                  |
| `architecture-review`      | Plan sonrası, kod öncesi — zorunlu                         |
| `test-driven-execution`    | Her feature/bugfix implementasyonunda                      |
| `test-guard`               | Her commit öncesi — testler bekçisi                        |
| `code-review`              | Commit öncesi checklist                                    |
| `github`                   | Tüm git işlemlerinde                                       |
| `security-scanner`         | Release öncesi + şüpheli durumda                           |
| `env-validator`            | Env değişikliğinde, onboarding öncesi                      |
| `dependency-audit`         | Release öncesi + aylık                                     |
| `changelog-generator`      | Release öncesi                                             |
| `documentation-sync`       | Önemli kod değişikliği sonrası                             |
| `performance-auditor`      | Yavaşlık şikayetinde + aylık                               |
| `dead-code-cleaner`        | Refactor öncesi + aylık bakım                              |
| `ai-code-cleanup`          | Dağınık AI kodu toparlanacağında — davranış değişmeden     |
| `code-humanizer`           | AI üretimi kod merge edilmeden önce — üslup insanileştirme |
| `release-preparer`         | Her production release — orkestratör                       |
| `incident-response`        | Production sorunlarında                                    |
| `onboarding-doc-generator` | Yeni ekip üyesi / proje devri öncesi                       |
| `knowledge-base-update`    | Öğrenilen her önemli şeyde                                 |

**Agent personaları:** Aria (UI/UX), Felix (Frontend), Bora (Backend), Deva (DevOps) — `.agent/agents/`

---

## Kritik Davranış

- **Belirsizlikte sor** — varsayım yapma
- **Kapsamı sessizce genişletme** — görev dışı sorun görürsen bildir
- **"Çalışıyor" ≠ "bitti"** — testler geçiyor + temiz kod + docs güncel
- **5+ dosya etkileniyorsa** — önce plan göster, onay al
