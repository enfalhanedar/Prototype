# .agent — Proje Agent Yapılandırması

AI kod asistanını disiplinli, süreç odaklı bir geliştirme ekibine dönüştüren yapılandırma dizini.
Temel: [omergocmen/vibe-coder-kit](https://github.com/omergocmen/vibe-coder-kit) (MIT) + 8 ek skill.

## Dizin Haritası

| Dizin               | İçerik                                   | Ne İşe Yarar                                                          |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `agents/`           | 4 uzman persona                          | Göreve göre uzman kimliği yükler (tasarım, frontend, backend, devops) |
| `skills/`           | 20 iş akışı (her biri `<isim>/SKILL.md`) | Komutla tetiklenen, adım adım süreç tanımları                         |
| `rules/`            | 3 zorunlu kural seti                     | Her görevde istisnasız geçerli standartlar                            |
| `knowledge/`        | Kalıcı bilgi tabanı                      | Oturumlar arası hafıza — kararlar, tuzaklar, kurallar                 |
| `reviews/`          | Mimari inceleme raporları                | `architecture-review` çıktıları buraya yazılır                        |
| `audits/`           | Denetim raporları                        | `dependency-audit`, `security-scanner` çıktıları                      |
| `incidents/`        | Olay kayıtları                           | `incident-response` timeline + post-mortem'leri                       |
| `AGENTS.md`         | Oturum başlatma talimatı                 | Asistan her oturumda ilk bunu okur                                    |
| `CURRENT_TASK.md`   | Aktif görev                              | Şu an ne üzerinde çalışılıyor                                         |
| `OPEN_QUESTIONS.md` | Açık sorular                             | Henüz karar verilmemiş konular                                        |

## Tam İş Akışı

```
🆕 YENİ OTURUM  → skills/project-context-primer  (zorunlu ilk adım)
💡 FİKİR        → skills/prompt-enhancer → skills/brainstorming → SCOPE doc
📋 PLAN         → skills/writing-plans → skills/architecture-review
🛠️ GELİŞTİR     → skills/test-driven-execution  (ilgili agents/ personasıyla)
✅ COMMIT       → skills/code-review + skills/test-guard → skills/github
🚀 RELEASE      → skills/release-preparer  (güvenlik, env, bağımlılık,
                  changelog ve docs kontrollerini zincirler)
🔥 KRİZ         → skills/incident-response → skills/knowledge-base-update
```

## Kurulum

Bu `.agent/` klasörünü proje köküne kopyala. `AGENTS.md`'yi de proje köküne taşıyabilirsin
(OpenCode kökten otomatik okur; Claude Code için CLAUDE.md'den referans ver).

Her dizinin kendi `README.md`'sinde ayrıntılı Türkçe açıklama vardır.
