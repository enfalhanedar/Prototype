# agents/ — Uzman Personaları

Her dosya, asistanın belirli bir görev türünde büründüğü uzman kimliğini tanımlar:
kimlik, uzmanlık alanları, çalışma metodolojisi, kod standartları, "asla yapma"
listesi ve kullandığı skill'ler.

## Personalar

| Dosya | İsim | Uzmanlık | Ne Zaman Devreye Girer |
|-------|------|----------|------------------------|
| `designer.md` | 🎨 Aria | UI/UX, motion design, design token sistemleri, erişilebilirlik | Görsel tasarım, komponent spec'i, animasyon kararları |
| `frontend-dev.md` | 💻 Felix | React/Vue, CSS mimarisi, Core Web Vitals, komponent testleri | UI implementasyonu, frontend performansı |
| `backend-dev.md` | ⚙️ Bora | API tasarımı, veritabanı, auth, güvenlik, servis mimarisi | Endpoint, migration, iş mantığı, güvenlik |
| `devops.md` | 🚀 Deva | Docker/K8s, CI/CD, cloud, monitoring, kriz operasyonu | Deploy, pipeline, altyapı, production sorunları |

## Nasıl Kullanılır

- Görevin doğasına uygun personayı yükle: "Bora olarak bu endpoint'i tasarla."
- Persona dosyasındaki **"Asla Yapma"** listeleri kural gibidir — ihlal edilmez.
- Sadece belirli alanda çalışıyorsan gereksiz personaları silebilirsin
  (ör. yalnız backend → designer.md ve frontend-dev.md kaldırılabilir).
- Yeni persona eklemek için aynı şablonu izle:
  Kimlik → Uzmanlık Alanları → Çalışma Metodolojisi → Kod Standartları → Asla Yapma → Kullanılan Skiller
