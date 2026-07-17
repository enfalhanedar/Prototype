# skills/ — İş Akışları

Her klasörde bir `SKILL.md` bulunur: ne zaman tetiklenir, adım adım süreç, kurallar
ve üretilen çıktı. Skill'ler "anlık prompt" yerine tekrarlanabilir süreç tanımlarıdır.

## Yaşam Döngüsüne Göre Skill'ler

### 🆕 Oturum Başlangıcı
| Skill | Ne Yapar | Çıktı |
|-------|----------|-------|
| `project-context-primer` | Bağlamı yükler (kararlar, tuzaklar, aktif görev). **Zorunlu ilk adım.** | Context Loaded özeti |

### 💡 Fikir → Kapsam
| Skill | Ne Yapar | Çıktı |
|-------|----------|-------|
| `prompt-enhancer` | Belirsiz isteği netleştirir, eksik boyutları tamamlar | Enhanced prompt |
| `brainstorming` | Sokratik sorularla fikri rafine eder | SCOPE-<slug>.md |

### 📋 Planlama
| Skill | Ne Yapar | Çıktı |
|-------|----------|-------|
| `writing-plans` | Scope'u atomik, bağımlılık sıralı görevlere böler | implementation_plan.md |
| `architecture-review` | Planı stres testine sokar — kod öncesi zorunlu | Blocker/Warning raporu |

### 🛠️ Geliştirme
| Skill | Ne Yapar | Çıktı |
|-------|----------|-------|
| `test-driven-execution` | Test önce, kod sonra (Red→Green→Refactor) | Geçen testler + coverage |

### ✅ Commit
| Skill | Ne Yapar | Çıktı |
|-------|----------|-------|
| `test-guard` ⭐ | Testleri çalıştırır, başarısızsa commit'i bloklar | Hazır/Engellendi kararı |
| `code-review` | Pre-commit checklist + review feedback yanıtlama | Review kartı |
| `github` | Conventional commits, branch, PR yönetimi | Temiz commit geçmişi |

### 🚀 Release
| Skill | Ne Yapar | Çıktı |
|-------|----------|-------|
| `release-preparer` ⭐ | Tüm ön kontrolleri sırayla zincirler — orkestratör | Release checklist + tag |
| `security-scanner` ⭐ | Kendi kodunda secret/tehlikeli desen taraması | Risk raporu |
| `env-validator` ⭐ | Kod ↔ .env.example senkronu | Eksik/bayat anahtar raporu |
| `dependency-audit` | Paket açıkları, eski/kullanılmayan bağımlılıklar | audits/ raporu |
| `changelog-generator` ⭐ | Commit geçmişinden CHANGELOG + SemVer önerisi | Güncel CHANGELOG.md |
| `documentation-sync` | Eskiyen dokümanları tespit edip günceller | Güncel docs |

### 🧹 Bakım
| Skill | Ne Yapar | Çıktı |
|-------|----------|-------|
| `performance-auditor` ⭐ | N+1, await-in-loop vb. tarar, etki×çaba sıralar | İlk 5 kazanım listesi |
| `dead-code-cleaner` ⭐ | Kullanılmayan kodu güvenle siler | Temizlik raporu |
| `onboarding-doc-generator` ⭐ | Mimari rehber + doğrulanmış kurulum adımları | ARCHITECTURE.md |
| `ai-code-cleanup` ⭐ | Dağınık AI kodunu güvenle toparlar: envanter → test ağı → kademeli refactor | Temizlik planı + önce/sonra raporu |
| `code-humanizer` ⭐ | AI parmak izini siler: jenerik isim → domain dili, tören kodu → sadelik, ders kitabı → proje deyimi | Üslup commit'leri + AI-izi raporu |

### 🔥 Kriz & Hafıza
| Skill | Ne Yapar | Çıktı |
|-------|----------|-------|
| `incident-response` | Triyaj → içerme → kök neden → post-mortem | incidents/ kaydı |
| `knowledge-base-update` | Öğrenilenleri kalıcı hafızaya yazar | knowledge/ girdisi |

⭐ = vibe-coder-kit'e ek olarak bu kit için yazılan skill'ler (aynı format ve felsefe).

## Yeni Skill Eklemek

`skills/<skill-adi>/SKILL.md` oluştur:

```
---
name: skill-adi
description: >
  Ne zaman kullanılır ve ne üretir (İngilizce frontmatter).
---
<!-- TÜRKÇE AÇIKLAMA bloğu -->
# Skill Adı
## Ne Zaman Tetiklenir
## Adım Adım Süreç
## Kurallar
```
