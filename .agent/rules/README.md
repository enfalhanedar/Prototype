# rules/ — Zorunlu Kurallar

Skill'lerden farkı: skill'ler **çağrıldığında** çalışan süreçlerdir, kurallar
**her görevde, her zaman** geçerlidir. Öneri değil, kısıttır.

| Dosya               | Kapsam   | Özet                                                                                                                         |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `code-hygiene.md`   | Temizlik | Yorum sadece metot seviyesinde; commit öncesi debug log temizliği; secret'lar .env'de, .env.example güncel                   |
| `code-quality.md`   | Kalite   | 3+ tekrar → extract; soyutlama eşiği testi; overdesign göstergeleri; refactor ayrı commit                                    |
| `safety.md`         | Güvenlik | Yıkıcı komutlara onay zorunluluğu; çalışan sisteme dokunmama; rollback planı olmadan riskli işlem yok                        |
| `code-structure.md` | Yapı     | Dosya ≤500 / fonksiyon ≤60 satır; tek yönlü katman mimarisi; feature-first klasör düzeni; import sırası; magic number yasağı |

## Denetleyici Skill Eşleşmeleri

Kural koyar, skill doğrular:

- `code-hygiene` (debug log, secret) → `security-scanner` ve `code-review` denetler
- `code-hygiene` (3c: .env.example) → `env-validator` denetler
- `safety` (rollback) → `release-preparer` ve `architecture-review` denetler
- `code-quality` (erken optimizasyon) → `performance-auditor` işaretler

## Kural Eklerken

- Kısa ve denetlenebilir yaz — "iyi kod yaz" kural değildir, "fonksiyon 40 satırı geçmez" kuraldır.
- Toplam kural hacmini sınırlı tut; kural şişkinliği talimat sulanmasına yol açar.
- Her kurala ✅/❌ örneği ekle.
