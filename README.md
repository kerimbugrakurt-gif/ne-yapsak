# Ne Yapsak?

Hafta sonu ya da boş gününde ne yapacağını bilemeyenlere, yaşadığı şehirde **konser, maç, tiyatro, stand-up, sergi, müze, atölye ve doğa etkinlikleri** öneren mobil uygulama. Açılınca kişiye göre sıralanmış hazır bir akış gösterir: "Bu hafta sonu senin için", "İlk buluşmaya uygun", "Ücretsiz", "Konser ve sahne", "Maçlar", "Sergiler ve müzeler".

```
ne-yapsak/
├── app/                       Expo (React Native) uygulaması: iOS + Android (+ web önizleme)
├── collector/                 Etkinlik toplayıcı (Claude + web araması)
├── public/                    Cloudflare Pages'in yayınladığı klasör (events.json burada)
└── .github/workflows/         Haftada iki kez toplayıcıyı çalıştıran GitHub Actions görevi
```

## Nasıl çalışır? (sunucusuz, barındırma ücreti yok)

1. **GitHub Actions** her Pazartesi ve Perşembe 05:20'de (İstanbul) `collector`'ı çalıştırır. Claude; Biletix, Passo, Bubilet, Songkick, mekan siteleri, belediye takvimleri, müze siteleri ve fikstürlerde arama yapar. Bulduklarını kaydeder; geçmiş tarihli ya da hatalı kayıtlar reddedilir. Sonuç `public/events.json` dosyasına yazılır ve depoya işlenir.
2. **Cloudflare Pages** her güncellemede `public/` klasörünü ücretsiz olarak yayınlar (`https://<proje>.pages.dev/events.json`).
3. **Uygulama** bu dosyayı indirir ve akışı telefonda kendisi sıralar. Sıralama yapay zeka kullanmaz, anında çalışır. Liste telefonda saklandığı için internet yokken de açılır. Tercihler ve kaydedilenler yalnızca telefonda durur; hesap gerekmez.

## Kurulum (bir kerelik)

**1. Anthropic API anahtarı → GitHub:** Depo → Settings → Secrets and variables → Actions → **New repository secret**. Adı `ANTHROPIC_API_KEY`, değeri console.anthropic.com'dan alınan anahtar.

**2. (İsteğe bağlı) Taranacak şehirler:** Aynı sayfada **Variables** sekmesi → `COLLECT_CITIES`. Varsayılan sadece `İstanbul`. 5 şehir için: `İstanbul,Ankara,İzmir,Antalya,Bursa`.

**3. Cloudflare Pages:** dash.cloudflare.com → Workers & Pages → Create → Pages → **Connect to Git** → bu depo. Ayarlar:
- Framework preset: **None**
- Build command: *(boş)*
- Build output directory: `public`

Proje adı `ne-yapsak` alınmışsa farklı bir ad seçin ve `app/eas.json` ile `app/.env` içindeki `EXPO_PUBLIC_DATA_URL` değerini o adrese göre güncelleyin.

**4. İlk tarama:** Depo → Actions → **Etkinlikleri topla** → **Run workflow**.

## Bilgisayarda çalıştırma

```bash
cd app
npm install
cp .env.example .env      # EXPO_PUBLIC_DATA_URL=https://<proje>.pages.dev
npx expo start            # telefonda Expo Go ile QR kodu okut
```

Toplayıcıyı elle çalıştırma:

```bash
cd collector
npm install
cp .env.example .env      # ANTHROPIC_API_KEY=...
npm run collect -- İstanbul          # tek şehir
npm run collect -- İstanbul kultur   # tek şehir, tek konu (muzik-sahne | spor | kultur)
```

## Mağazaya gönderme (Expo EAS)

```bash
cd app
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android   # telefona kurulabilen test sürümü
npx eas-cli@latest build --profile production --platform all     # mağaza sürümü
npx eas-cli@latest submit --platform android
npx eas-cli@latest submit --platform ios
```

Gerekli hesaplar: Expo (ücretsiz), Google Play Console (tek sefer 25 $), Apple Developer (yıllık 99 $).

## Maliyet

| Kalem | Ücret |
|---|---|
| GitHub Actions (gizli depoda ayda 2.000 dk ücretsiz) | 0 $ |
| Cloudflare Pages | 0 $ |
| Claude ile tarama | Kullanıma göre. Kaba tahmin: sadece İstanbul ayda ~5–8 $, 5 şehir ~20–40 $ |

Tarama maliyetini düşürmek için: `COLLECT_CITIES` ile şehir sayısını azaltın, `SEARCHES_PER_RUN` (varsayılan 6) değişkenini düşürün ya da `.github/workflows/collect.yml` içindeki `cron` satırını haftada bire indirin.

## Bilinen sınırlar

- Etkinlik görselleri yok; kartlarda kategori simgesi ve rengi kullanılıyor (bilet sitelerinin görselleri telifli).
- Veri kalitesi web'de bulunabilene bağlı. Saat ve fiyat bilgisi çoğu zaman bilet sayfasında olduğundan kartlarda eksik kalabiliyor; kartta bilet linki her zaman var.
- Şimdilik 5 şehir: İstanbul, Ankara, İzmir, Antalya, Bursa.
