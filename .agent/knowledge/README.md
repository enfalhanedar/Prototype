# knowledge/ — Kalıcı Bilgi Tabanı

Oturumlar arası hafıza. `knowledge-base-update` skill'i buraya yazar,
`project-context-primer` her oturum başında buradan okur. Böylece aynı araştırma
iki kez yapılmaz, aynı hataya iki kez düşülmez.

## Girdi Türleri

| Tür | Ne Saklanır |
|-----|-------------|
| `decision` | Mimari seçimler, teknoloji tercihleri ve gerekçeleri |
| `convention` | İsimlendirme kuralları, kod pattern'leri, klasör yapıları |
| `bug` | Belirsiz sorunların kök nedeni ve çözümü |
| `gotcha` | 3. parti servis tuzakları, ortam sorunları, edge case'ler |
| `research` | Ciddi araştırma gerektiren soruların cevapları |

## Yapı

- Her konu ayrı dosya: `<slug>.md` (kebab-case), ilgili konular alt klasörde (`auth/`, `infra/`)
- `INDEX.md` tüm girdilerin tek satırlık özetini tutar — önce o taranır
- Şablon ve kurallar: `skills/knowledge-base-update/SKILL.md`
