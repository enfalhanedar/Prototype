---
name: changelog-generator
description: >
  Generates or updates CHANGELOG.md from commit history using the
  Keep a Changelog format. Categorizes conventional commits, rewrites
  meaningless messages by inspecting the diff, and suggests the next
  semantic version. Run before tagging a release.
---

<!--
  TÜRKÇE AÇIKLAMA
  ───────────────
  Bu skill, commit geçmişinden okunabilir bir CHANGELOG üretir.
  Conventional commit'leri kategorize eder (feat→Added, fix→Fixed...),
  anlamsız mesajları diff'e bakarak yeniden adlandırır ve semantic
  versioning önerisi yapar. "Bu sürümde ne değişti?" sorusunu otomatikleştirir.

  NE ZAMAN: Release öncesi, sprint sonu, `release-preparer` içinde.
  ÇIKTI:    Güncellenmiş CHANGELOG.md + versiyon önerisi.
-->

# Changelog Generator Skill

## When to Trigger

- Before tagging any release (via `release-preparer`)
- At the end of a sprint for stakeholder reporting
- When CHANGELOG.md has drifted behind actual changes

## Step-by-Step Process

### 1. Commit'leri Topla

```bash
# Son tag'den bugüne
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Tag yoksa belirli tarihten itibaren
git log --since="2026-06-01" --oneline
```

### 2. Kategorize Et

| Commit type | CHANGELOG bölümü |
|-------------|------------------|
| `feat` | Added |
| `fix` | Fixed |
| `refactor`, `perf` | Changed |
| `revert` + kaldırmalar | Removed |
| `feat!`, `BREAKING CHANGE` | ⚠️ Breaking Changes |
| `chore`, `ci`, `style` | (genellikle atlanır) |

**Anlamsız mesajlar** ("wip", "fix2", "update"): `git show <hash>` ile diff'e bak, ne yaptığını anla, changelog'a anlamlı cümleyle yaz.

### 3. Versiyon Öner (SemVer)

```
Breaking change var       → MAJOR (2.0.0)
Yeni özellik var          → MINOR (1.3.0)
Sadece düzeltme/iyileştirme → PATCH (1.2.4)
```

### 4. CHANGELOG.md Güncelle

Keep a Changelog formatında:

```markdown
## [1.3.0] - 2026-07-16

### Added
- User registration endpoint with email verification (#42)

### Fixed
- Null refresh token causing 500 on rotation (#51)

### Changed
- Migrated user IDs from integer to UUID

### ⚠️ Breaking Changes
- /api/users/:id now expects UUID string — see migration guide
```

### 5. Özet Çıktı

```
v1.3.0 önerisi: 3 yeni özellik, 5 düzeltme, 1 breaking change.
CHANGELOG.md güncellendi — release tag'i atılabilir.
```

## Rules

- **Changelog kullanıcı için yazılır,** geliştirici için değil — commit mesajını kopyalama, faydayı anlat.
- **Breaking change asla gömülmez.** Ayrı bölüm, migration notu zorunlu.
- **Emin olmadığın commit'i uydurma** — diff'e bak veya "İNCELE" işaretle.
- **[Unreleased] bölümü** her zaman en üstte tutulur, release'te versiyonlanır.
