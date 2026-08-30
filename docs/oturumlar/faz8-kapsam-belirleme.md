# FAZ 8 — Kapsam belirleme (kod YAZILMAZ, yalnızca ölçüm + dilim planı)

> Faz 7 (G1/G2/G3, D-195/D-196/D-197/D-198) 2026-08-23'te tamamen kapandı. `SPEC.md`
> §6'nın kendi faz tablosu sırada **Faz 8**'i gösteriyor: "**AI foundation**: provider
> abstraction, keychain storage, Settings tab, connection test, model discovery,
> streaming chat panel, provenance plumbing — Done when: All three providers answer a
> trivial prompt through the same interface; keys are provably absent from disk, logs
> and the webview."
>
> Bu **Oturum A'nın ve `faz7-kapsam-belirleme.md`'nin aynı emsali**: ölçüm + karar, kod
> yok. Faz 8'i tek oturumda yazmaya kalkışmak Anayasa Madde 1/G1'in (bütçesiz büyük iş)
> tam kendisi olur — yedi ayrı alt-teslimat (provider abstraction, keychain, Settings
> tab, connection test, model discovery, streaming chat panel, provenance plumbing) tek
> cümlede sıralanmış görünüyor ama olgunluk açısından birbirinden çok farklı: bazı veri
> modeli parçaları (Provenance, AiMeta) Faz 2/3'ten beri **zaten var**; Settings'in
> kendisi (route, shell) **hiç yok**; hiçbir Rust bağımlılığı (keyring, HTTP client)
> henüz eklenmedi; D-20'nin Gün-1'den beri LOCKED olan "AI kapalıyken de Playwright
> mutlu-yol testi yeşil kalmalı" şartının test altyapısı **hiç kurulmamış**.
>
> **Bu faz ayrıca önceki hepsinden farklı bir sınıf iş** — Faz 0-7 A3/method-plugin
> mimarisi üzerine inşa etti; Faz 8 gerçek ağ çağrıları, gerçek sır yönetimi (OS
> keychain), gerçek sağlayıcı API'leri (hızlı hareket eden, kodda değil dokümantasyonda
> doğrulanması gereken) içeren tamamen yeni bir alt sistem açıyor. `CLAUDE.md`'nin kendi
> "AI layer" bölümü ("Never hardcode model lists... Verify every provider API detail
> against current docs before implementing — do not code these from memory") bunu zaten
> vurguluyor.
>
> Kanonik konum: `docs/oturumlar/faz8-kapsam-belirleme.md`. Yazıldı: 2026-08-23, Faz
> 7'nin kapanışının hemen ardından, Barış'ın açık isteğiyle ("please share the prompt
> for phase 8").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      src/domain/model/projectModel.ts \
      src/domain/model/provenance.ts \
      src/domain/model/entry.ts \
      src/app/routes/workspace/RightPanel.tsx \
      src-tauri/Cargo.toml \
      package.json \
      src/ai/proposal/.gitkeep
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-23'te
doğrulandı, Faz 7'nin kapanışının hemen ardından.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md`. **`AKIS.md`'yi bu oturum okumana gerek YOK** — bu oturum kod
   yazmıyor, yalnızca okuyor ve `docs/`/`DECISIONS.md`'ye yazıyor (istisna: eğer okuma
   sonunda "aslında küçük, tek dilimlik bir iş" sonucuna varırsan ve Barış aynı
   oturumda kodlamanı isterse, o noktada dur ve `AKIS.md`'yi oku).
2. `SPEC.md` §8'in **tamamı** (satır 584-889, ~305 satır) — kelimesi kelimesine, atlama
   yok. Özellikle:
   - §8.1 (satır 586-613): beş ilke, hepsi zaten `DECISIONS.md` D-13–D-21 ile Gün-1'de
     LOCKED edilmiş — bunlar bu oturumda yeniden TARTIŞILMAZ, yalnızca uygulanır.
   - §8.2 (satır 614-661): `LlmProvider` trait taslağı (Rust) + `ai.propose()` çağrı
     şekli (TS) — bu bir taslak, kesin imza değil; bu oturumun kendi kararı.
   - §8.3 (satır 663-682): anahtar güvenliği — `keyring` crate'i isimlendiriyor,
     Rust'ın kendi CSP sonucunu (`connect-src` gerekmiyor) not ediyor.
   - §8.4 (satır 684-706): Settings → AI providers ekranının tam alan listesi.
   - §8.5 (satır 707-719): proje başına model seçimi, `meta.ai`'a yazılıyor (zaten var).
   - §8.6-8.14 **oku ama uygulama** — bunlar ağırlıklı olarak Faz 9/10'un kapsamı
     (structured output, redaction mantığı, A3 optimizer, maliyet sayacı); Faz 8'in
     sınırının NEREDE bittiğini anlamak için okunmaları gerekiyor, kodlanmaları için
     değil.
3. `SPEC.md` §6'nın kendi faz tablosu (satır 540-559) — Faz 8/9/10'un birbirinden
   ayrımı: **Faz 8** = temel + bağlantı + akış (bu oturumun konusu); **Faz 9** = "AI
   structured generation" (per-step prompt library, proposal→accept/edit/reject,
   dosya/görsel içeri alma, redaction katmanı); **Faz 10** = "AI review & layout" (A3
   yerleştirme optimizeri, koşullandırma, sahte-denetçi incelemesi, çeviri, maliyet
   sayacı). "Phases 8–10 are additive" notu (satır 561) — Faz 0-7'nin hiçbiri bozulmaz.
4. `CLAUDE.md`'nin "Decisions already made" bölümündeki "### AI layer (see SPEC.md §8)"
   alt bölümü — sekiz kısa ilke, §8.1'in kendi özeti, zaten okudun ama bu oturumun
   kendi çerçevesi olarak burada da tekrar dursun.
5. `DECISIONS.md` D-13 → D-21 (dokuz karar, hepsi 2026-08-01, hepsi LOCKED) — AI
   katmanının Gün-1 ilkeleri, §8.1/§8.2/§8.3/§8.11'in birebir kod-öncesi kaydı.
6. Kendi taramanı yap (körü körüne bu listeye güvenme — D-137'nin kendi dersi). Bu
   oturumun kendi ön taraması (2026-08-23'te yapıldı, doğrulanmalı — kod yazılmadı):

   | Parça | 2026-08-23 itibariyle durum |
   |---|---|
   | `Provenance` şeması (`src/domain/model/provenance.ts`) | **VAR** — `origin` (human/ai-accepted/ai-edited), `model.{providerId,modelId,promptVersion}`, `generatedAt`, `acceptedBy`. §8.13'ün istediği alanlarla birebir eşleşiyor. |
   | `meta.ai` şeması (`src/domain/model/projectModel.ts`) | **KISMEN VAR** — `enabled: boolean`, `providerId: "anthropic"\|"openai"\|"google"` (optional), `modelId` (optional), `redaction: RedactionPolicySchema`. `RedactionPolicySchema` bugün **boş** (`z.looseObject({})`) — §8.11'in `mode`/`terms`/`preserveNumbers` alanları hiç yok. |
   | `RightPanel.tsx`'in "Assistant" sekmesi | **STUB** — `aiEnabled && <TabsTrigger value="assistant">` var ama `<TabsContent value="assistant">{null}</TabsContent>` — bugüne kadar hiçbir proje `meta.ai.enabled`'i `true` yapmadığı için hiç ulaşılamıyor. |
   | Settings ekranı (herhangi bir rota) | **HİÇ YOK** — Faz 2'nin kendi notu: "SPEC.md §2.1's secondary row (settings, about, language toggle) — not named in this phase's scope and settings has no domain model yet." §8.4'ün istediği "Settings → AI providers" sekmesinin oturacağı bir Settings shell'in kendisi bile inşa edilmedi. |
   | `src/ai/` dizini | **BOŞ İSKELE** — yalnızca `src/ai/proposal/.gitkeep` (Faz 0'ın kendi dizin taslağından, D-2.1). Hiç kod yok. |
   | Rust bağımlılıkları (`src-tauri/Cargo.toml`) | **keyring YOK, HTTP client (reqwest vb.) YOK.** Mevcut crate'ler: tauri, serde, zip, thiserror, rust_xlsxwriter, base64, image, kamadak-exif — hiçbiri ağ/kimlik-bilgisi işi yapmıyor. |
   | npm bağımlılıkları | Hiçbir sağlayıcı SDK'sı yok (beklenen — §8.2 zaten "tüm sağlayıcı çağrıları Rust'ta" diyor, TS tarafı yalnızca `invoke()` çağırır). |
   | Playwright / E2E altyapısı | **HİÇ YOK** — `package.json`'da `"test": "vitest run"` dışında test script'i yok, `@playwright/test` kurulu değil, `*.spec.ts` hiç yok. D-20 (LOCKED, Gün-1) "a Playwright suite runs the whole happy path with no keys configured and must stay green" diyor ama bu altyapı Faz 0-7'nin hiçbirinde kurulmadı — gerçek, somut bir boşluk. |
   | `DECISIONS.md`'de Faz 8'e özgü karar | **YOK** — D-13→D-21 hepsi ilke-seviyesinde (§8.1/§8.2/§8.3), hiçbiri "hangi Rust crate", "hangi Settings route yapısı", "streaming kanalı nasıl kurulur" gibi somut bir uygulama kararı içermiyor. Bu oturumun kendi işi tam olarak bu boşluğu doldurmak değil — yalnızca **hangi sorular** sorulmalı, onu tespit etmek.

---

## 2. Bu oturumun işi

**Kod YAZMA.** Bu oturumun tek çıktısı: (1) yukarıdaki tabloyu gerçek koda karşı bir kez
daha doğrulanmış hale getirmek, (2) `docs/oturumlar/README.md`'ye benzer bir **Faz 8
dilim tablosu** önerisi (D-114'ün "dilim başına bir yeni mekanizma" bütçesini uygula),
(3) gerçek açık tasarım sorularını `AskUserQuestion` ile Barış'a sormak.

### 2.1 Muhtemel gerçek açık sorular (kesin değil — dosyaları okuduktan sonra doğrula)

1. **Settings shell'i kim inşa ediyor?** §8.4'ün "Settings → AI providers" sekmesi bir
   Settings *ekranının* varlığını varsayıyor ama Faz 2 bunu bilinçli olarak kapsam dışı
   bırakmıştı ("settings has no domain model yet"). Settings'in kendisi (rota, genel
   shell, sekme mimarisi — about/dil değiştirici gibi diğer bölümlerin de bir gün
   oturacağı) bu fazın **kendi ilk dilimi** mi (D-114 bütçesi: "yeni bir mekanizma" —
   Settings shell'in kendisi), yoksa yalnızca "AI providers" sekmesine yetecek kadar
   minimal bir iskelet mi kuruluyor?
2. **Üç sağlayıcının hepsi bu fazda mı, yoksa dilimlere mi bölünüyor?** Fazın kendi
   done-koşulu "all three providers answer a trivial prompt" diyor — bu, Anthropic +
   OpenAI + Google'ın üçünün de aynı oturum/faz içinde bitmesi gerektiği anlamına mı
   geliyor, yoksa bir referans implementasyon (örn. Anthropic) + soyutlamanın kendisi
   önce, diğer iki adaptör kendi küçük dilimlerinde mi geliyor? Üç ayrı sağlayıcının
   üçü de "verify against current docs before implementing" gerektiriyor (`CLAUDE.md`)
   — bu, tek oturumda üç kez tekrar eden bir araştırma yükü demek.
3. **"Streaming chat panel" ne kadar derin?** Done-koşulu yalnızca "answer a trivial
   prompt" diyor — §8.6'nın dört modu (Critique/Draft/Extract/Review), adım-bağlamı
   enjeksiyonu, ve `ai.propose()`'un `schema`/`context` alanları açıkça Faz 9'un işi
   (`generateStructured`, per-step prompt library). Faz 8'in kendi "chat panel"i, hiçbir
   step-farkındalığı veya yapılandırılmış çıktı olmadan, yalnızca bağlantıyı kanıtlayan
   çıplak bir serbest-metin sohbet mi (bir "test connection" UI'ının genişletilmiş
   hali), yoksa `RightPanel`'in şu an `{null}` olan Assistant sekmesine gerçekten
   yerleşen, kalıcı bir sohbet geçmişi tutan bir bileşen mi?
4. **Eksik Playwright altyapısı bu fazın işi mi?** D-20 (LOCKED, Gün-1) "AI kapalıyken
   mutlu yolun Playwright ile yeşil kalması" şartını koyuyor ama bu altyapı hiç
   kurulmadı — Faz 8 tam olarak AI açık/kapalı ayrımının ilk kez GERÇEK hale geldiği
   faz olduğu için bu boşluğun kapatılması için en doğal an. Bu fazın kendi bir dilimi
   mi (temel bir Playwright kurulumu + "AI kapalı" mutlu-yol testi), yoksa ayrı bir
   P-numarası olarak dosyalanıp ertelenecek mi?
5. **Rust tarafında hangi crate'ler?** `keyring` (§8.3'ün kendi ismi) — güncel sürüm
   ve macOS/Windows API'leri dokümantasyona karşı doğrulanmalı (kod hafızadan
   yazılmaz, `CLAUDE.md`'nin kendi kuralı). HTTP client — `reqwest` en olağan seçim
   (SSE/streaming desteği, async) ama alternatifler (`ureq`, `hyper` doğrudan)
   değerlendirilmeli mi, yoksa `reqwest` doğrudan varsayılıyor mu? Tauri v2'nin kendi
   `Channel` API'si (§8.2'nin Rust taslağındaki `tx: Channel<StreamEvent>`)
   dokümantasyona karşı doğrulanmalı.
6. **Dilim sayısı ve sırası.** Muhtemel aday bölünme (Barış'a önerilecek, kesin değil,
   yukarıdaki sorulara verilen cevaplara göre değişir):
   - **H1** — Settings shell'in kendisi (yeni bir rota, genel iskelet) + Rust
     `LlmProvider` trait'i + `keyring` entegrasyonu (anahtar kaydet/oku/sil, hiç
     webview'a geçmeden).
   - **H2** — Bir referans sağlayıcı adaptörü uçtan uca (muhtemelen Anthropic):
     `list_models`/`test_connection`/`complete` (streaming), Settings kartı, "Test
     connection" akışı.
   - **H3** — Kalan iki sağlayıcı adaptörü (OpenAI, Google) — H2'nin kurduğu deseni
     tekrarlıyor, muhtemelen daha ucuz (yeni mimari yok, yalnızca yeni implementasyon).
   - **H4** — Streaming chat panel'in kendisi (`RightPanel`'in Assistant sekmesi,
     gerçek içerikle) + provenance plumbing (`CompletionMeta`'nın `Provenance`'a nasıl
     aktığı).
   - **H5** (belki ayrı, belki H1'e gömülü) — offline mutlu-yol Playwright testi.
   - Bu sıralama kesin değil — bu oturumun kendi işi doğru sırayı ve sınırları
     bulmak, burada varsayılmıyor.

### 2.2 Kapsam dışı (bu oturumda kesinlikle karara BAĞLANMAZ)

- Faz 9/10'un kendi işi: `generateStructured`, per-step prompt kütüphanesi, proposal→
  accept/edit/reject akışı, dosya/görsel içeri alma (§8.9), redaction'ın **mantığı**
  (şemasının Faz 8'de mi genişletileceği ayrı bir soru — §2.1 madde 1'e bakılabilir,
  ama redaction'ın gerçek çalışması Faz 9'un işi), A3 yerleştirme optimizeri (§8.10),
  maliyet sayacı (§8.12), TR↔EN çeviri.
- D-13→D-21'in yeniden tartışılması — hepsi LOCKED, bu oturum onları uygular, sorgulamaz.
- Herhangi bir gerçek sağlayıcı API çağrısının kodlanması — bu oturum yalnızca hangi
  crate/hangi dilim sırası sorularını çıkarır, gerçek entegrasyon kodu H1-H5'in işi.

---

## 3. Bütçe ve kapanış disiplini

Açılışta kaba bir tahmin ver (Anayasa Madde 1). Bu **ölçüm** oturumu — `faz7-kapsam-
belirleme.md`'nin kendi büyüklüğüyle kıyaslanabilir olmalı (tek oturumda biter, kod
yok) — ama Faz 8'in SPEC.md §8'i (305 satır) Faz 7'nin dört-cümlelik satırından çok
daha uzun ve daha çok yeni-alt-sistem riski taşıyor (ağ, kimlik bilgisi, üç harici
API), o yüzden okuma yükü daha büyük olabilir; kod yazmadığı için yine de ucuz kalmalı.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturumun kendi bulgu ve dilim
planı), `docs/oturumlar/README.md`'ye Faz 8'in kendi dilim tablosu (Faz 6/7'nin kendi
bölümlerine benzer yeni bir bölüm), `CLAUDE.md`'nin "Current state"ine "Phase: 8 of 12
— kapsam belirlendi, henüz inşa edilmedi" türü bir güncelleme. Kod yok, ama docs
değişikliği yine de commit'lenmeli (yalnızca docs dokunduğu için düşük riskli —
`AKIS.md`'nin kalıcı commit yetkisi burada da geçerli, yalnızca Barış açıkça isterse).

---

**Model önerisi:** Sonnet 5 yeterli — bu bir kod-yazma değil envanter/karar oturumu.
Asıl mimari iskelet (`LlmProvider` trait, `ai.propose()` şekli) SPEC.md §8.2'de zaten
taslak halinde veriliyor; bu oturum onu tasarlamıyor, kod tabanına karşı doğruluyor ve
dilimlere bölüyor. Üç sağlayıcının güncel API detaylarının doğrulanması (§2.1 madde 5)
gerçek implementasyon oturumlarının (H2/H3) işi, bu oturumun değil.
