# Ne Yapsak?

Hafta sonu ya da boş gününde ne yapacağını bilemeyenlere, yaşadığı şehirde **konser, maç, tiyatro, stand-up, sergi, müze, atölye ve doğa etkinlikleri** öneren mobil uygulama. Açılınca kişiye göre sıralanmış hazır bir akış gösterir: "Bu hafta sonu senin için", "İlk buluşmaya uygun", "Ücretsiz", "Konser ve sahne", "Maçlar", "Sergiler ve müzeler".

```
ne-yapsak/
├── app/      Expo (React Native) uygulaması: iOS + Android (+ web önizleme)
├── server/   Node API + etkinlik toplayıcı (Claude) + SQLite veritabanı
└── render.yaml   Sunucuyu Render'da tek tıkla yayınlama ayarı
```

## Nasıl çalışır?

1. **Toplayıcı** (`server/src/collector.ts`): Haftada iki kez (Pazartesi ve Perşembe sabahı) her şehir için üç konuyu tarar: müzik ve sahne, spor, kültür (sergi, müze, atölye, aile, doğa). Claude web'de Biletix, Passo, Bubilet, Songkick, mekan siteleri, belediye takvimleri, müze siteleri ve fikstürlerde arama yapar. Bulduklarını `save_events` aracıyla kaydeder. Sunucu her kaydı kontrol eder: tarih aralığı, link biçimi, eksik alanlar. Geçmiş tarihli ya da hatalı kayıtları reddeder.
2. **Akış** (`server/src/feed.ts`): Kullanıcının şehri, ilgi alanları, kiminle çıktığı ve bütçesine göre etkinlikleri puanlar ve bölümlere ayırır. Bu adımda yapay zeka kullanılmaz, yani her açılış **ücretsiz ve anında** gelir.
3. **Uygulama** (`app/`): Kurulum (4 soru), Keşfet akışı, etkinlik detayı (bilet linki, kaydet, paylaş), Kaydedilenler, Profil. Tercihler ve kaydedilenler yalnızca telefonda saklanır; hesap açmak gerekmez.

## Bilgisayarda çalıştırma

```bash
cd server
npm install
cp .env.example .env    # ANTHROPIC_API_KEY=... (boşsa tarama kapalı, başlangıç verisiyle çalışır)
npm run dev
```

```bash
cd app
npm install
cp .env.example .env    # EXPO_PUBLIC_API_URL=http://<bilgisayarın-yerel-IP'si>:8787
npx expo start          # telefonda Expo Go ile QR kodu okut
```

Elle tarama: `cd server && npm run collect` (tüm şehirler), `npm run collect -- İstanbul` ya da `npm run collect -- İstanbul kultur`.

## Yayına alma

**Sunucu (Render):** Depoyu GitHub'a koy → render.com → New → Blueprint → depoyu seç. Sorulunca `ANTHROPIC_API_KEY` gir. Adres `https://ne-yapsak.onrender.com` değilse `app/eas.json` içindeki `EXPO_PUBLIC_API_URL` değerini güncelle. İlk taramayı hemen başlatmak için:

```bash
curl -X POST https://<adres>/admin/collect -H "Authorization: Bearer <ADMIN_TOKEN>"
```

(`ADMIN_TOKEN` değeri Render panelinde, Environment altında.)

**Uygulama (Expo EAS):**

```bash
cd app
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android   # telefona kurulabilen test sürümü
npx eas-cli@latest build --profile production --platform all     # mağaza sürümü
npx eas-cli@latest submit --platform ios                          # App Store'a gönder
npx eas-cli@latest submit --platform android                      # Play Store'a gönder
```

Gerekli hesaplar: Apple Developer (yıllık 99 $), Google Play Console (tek sefer 25 $), Expo (ücretsiz).

## Maliyet ayarları (sunucu ortam değişkenleri)

| Değişken | Varsayılan | Etkisi |
|---|---|---|
| `COLLECT_CITIES` | 5 şehir | Taranan şehirler. Tek şehirle başlamak maliyeti 5'te 1'e indirir. |
| `COLLECT_CRON` | `20 5 * * 1,4` | Tarama sıklığı (Pazartesi + Perşembe). |
| `SEARCHES_PER_RUN` | 6 | Her şehir/konu için en fazla web araması (1.000 arama = 10 $). |
| `COLLECTOR_MODEL` | `claude-opus-5-5` | Taramayı yapan model. |

## Bilinen sınırlar

- Etkinlik görselleri yok; kartlarda kategori simgesi ve rengi kullanılıyor (bilet sitelerinin görselleri telifli).
- Veri kalitesi web'de bulunabilene bağlı. Saat ve fiyat bilgisi çoğu zaman bilet sayfasında olduğundan kartlarda eksik kalabiliyor; kartta bilet linki her zaman var.
- Şimdilik 5 şehir: İstanbul, Ankara, İzmir, Antalya, Bursa.
