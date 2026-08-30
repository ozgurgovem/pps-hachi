# OTURUM Faz 8 — Dilim 1: Settings shell + Vorion adaptörünün temeli (keychain, model keşfi, test connection)

> `docs/oturumlar/faz8-kapsam-belirleme.md`'nin kapsam belirleme oturumu **BİTTİ**
> 2026-08-30 (D-199) — `SPEC.md` §8.2'nin "üç sağlayıcı" (Anthropic/OpenAI/Google)
> varsayımı bu dağıtımda **geçersiz**: Farplas yalnızca kendi kurumsal AI gateway'i
> **Vorion**'u (`vorionai.com`) kullanabiliyor. Faz 8, D-13'ün yerini alan D-199'un
> kurduğu üç dilime bölündü — bu dosya **Dilim 1**'in kapsamıdır: minimal Settings
> shell + Rust `LlmProvider` trait + `keyring` entegrasyonu + Vorion'un model-keşif
> ve test-connection yarısı. Dilim 2 (streaming chat panel + provenance plumbing) ve
> Dilim 3 (D-20'nin Playwright testi) bu oturumun **DIŞINDA**.
>
> **D-199'un doğruladığı gerçek API yüzeyi, bu oturumun ham verisi:**
> - Base URL: `https://vorionai.com/api/<service>` — bize lazım olan: `https://vorionai.com/api/llm`
> - Kimlik doğrulama: `x-api-key` header'ında `nk_live_...` anahtarı (Bearer DEĞİL).
>   "Asla kendi `X-User-Id` header'ını gönderme, gateway anahtardan çıkarır."
> - **Predictions**: Synchronous Prediction, **Streaming Prediction (SSE)**, Cancel
>   Prediction, Multi-LLM (Streaming/Sync/Async — bize gerekmiyor), Resume Stream,
>   Voice Stream/TTS (bize gerekmiyor).
> - **LLM Configuration**: List LLMs, Get Available LLMs (Grouped), Get LLM by ID,
>   Get LLMs by Category/Group, Get Provider Models, (Create/Update/Delete LLM —
>   admin-yalnızca, bize gerekmiyor).
> - Tam dokümantasyon `vorionai.com/docs` altında, **yalnızca yetkili (giriş yapılmış)
>   oturumda görünür** — bu oturumun kendi Rust/TS kodu yazmadan önceki ilk işi, bu
>   dokümanı (ve varsa "Try It" sekmesiyle gerçek bir çağrıyı) doğrudan okumak/denemek
>   olmalı, D-199'un metninden değil.
>
> **Vorion API Keys'te zaten canlı bir key var**: "PPS Destek", tip **Personal**,
> roller `user-free` + `vorion-chat-basic`, prefiks `nk_live_`, 90 gün geçerlilik.
> Keşif/geliştirme için kullanılabilir. Şirket-çapında dağıtım öncesi tip
> (Personal→Application) ve rol kapsamı yeniden değerlendirilmeli — bu oturumun
> **kapsamı değil**, yalnızca not.
>
> Kanonik konum: `docs/oturumlar/faz8-dilim1-vorion-temel.md`. Yazıldı: 2026-08-30,
> kapsam belirleme oturumunun kapanışının hemen ardından, Barış'ın açık isteğiyle.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/faz8-kapsam-belirleme.md \
      src/domain/model/projectModel.ts \
      src/domain/model/provenance.ts \
      src/domain/model/entry.ts \
      src/app/routes/workspace/RightPanel.tsx \
      src/app/routes/workspace/WorkspaceShell.tsx \
      src/app/routes/launch/LaunchScreen.tsx \
      src-tauri/Cargo.toml \
      src-tauri/src/lib.rs \
      package.json \
      src/ai/proposal/.gitkeep
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-30'da
doğrulandı, kapsam belirleme oturumunun kapanışının hemen ardından.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made"in **AI layer** alt bölümü (D-199 ile
   güncellenmiş hali — tek sağlayıcı Vorion, `LlmProvider` trait, keychain kuralı),
   "How I want you to work" (plan onayı, TDD, i18n), ve "Current state"in **Faz 8**
   paragrafı.
3. `docs/oturumlar/faz8-kapsam-belirleme.md` — kapsam belirleme oturumunun kendi
   promptu, özellikle SPEC.md §8'in okunması gereken bölümleri (§8.1-8.5) hâlâ geçerli.
4. `DECISIONS.md`: **D-199** (bu dilimin kaynağı — Vorion keşfinin tam kaydı, tam
   API yüzeyi, üç dilimlik plan), **D-13** (artık kısmen SUPERSEDED, ama "asla anahtar
   tutma/proxy'leme" ilkesi hâlâ LOCKED), **D-14** (keychain, webview'a asla girmez),
   **D-15/D-16** (assistant proposes/human accepts, critique-before-draft — Vorion'un
   Agent Service'ine GİRİLMEYECEK olmasının nedeni), **D-18** (Provenance şeması,
   zaten var, bu dilim henüz doldurmuyor ama trait tasarımı buna hazırlıklı olmalı),
   **D-21** (model listesini hardcode etme, endpoint'ten çek — List LLMs bunun için).
5. `SPEC.md` §8.2 (satır 614-661, provider abstraction taslağı), §8.3 (satır 663-682,
   anahtar güvenliği), §8.4 (satır 684-706, Settings → AI providers alan listesi) —
   üçü de üç-sağlayıcı varsayımıyla yazılmış, bu oturum onları TEK sağlayıcıya
   (Vorion) uyarlıyor; §8.4'ün "one card per provider" cümlesi artık "tek kart".
6. `vorionai.com/docs` — **Barış'ın yetkili tarayıcı oturumunda** açılmalı (bu ortamın
   kendi `WebFetch`'i yetkisiz, boş bir yer tutucu sayfa görür — D-199'un kendi
   dersi). LLM Service → Predictions ve LLM Configuration alt bölümlerinin tam
   endpoint referansını (yol, istek/yanıt JSON şeması, örnek `cURL`) oku. Varsa
   "Try It" sekmesiyle List LLMs ve Synchronous Prediction'ı gerçek key ile (PPS
   Destek, `nk_live_...`) bir kez dene — Rust kodu yazmadan önce gerçek bir istek/
   yanıt örneği elde et (CLAUDE.md'nin "verify against current docs before
   implementing, do not code from memory" kuralı, D-21).

---

## 2. Kapsam

### 2.1 Açık soru — KODLAMADAN ÖNCE `AskUserQuestion` ile Barış'a sorulmalı

**Settings ekranına nereden girilecek?** Hiçbir mevcut ekranda (LaunchScreen,
WorkspaceShell) bir Settings girişi yok — Faz 2 bunu kapsam dışı bırakmıştı. İki
gerçek seçenek (kesin değil, bu oturumun kendi kararı):

- **WorkspaceShell'in sol rayında sabit bir dişli/gear ikonu** — proje açıkken her
  zaman erişilebilir, ama LaunchScreen'den (proje açmadan önce) erişilemez; bir
  provider bağlamak için önce bir proje açmak gerekir, bu ilk-kurulum akışı için
  garip olabilir.
- **LaunchScreen'de de ayrı bir giriş** (örn. üst köşede) — proje açmadan önce de
  AI sağlayıcısını bağlamaya izin verir, ama LaunchScreen'in bugünkü sade tasarımına
  (D-49) yeni bir kalıcı eleman ekler.

Üçüncü bir seçenek varsa (örn. ikisi birden) onu da öner. Bu, D-199'un Soru 1
cevabının ("minimal AI-providers iskeleti") kapsamadığı, o zaman düşünülmemiş yeni
bir açık soru.

### 2.2 Rust `LlmProvider` trait — tek somut adaptöre (Vorion) göre boyutlandır

`SPEC.md` §8.2'nin taslağı üç sağlayıcı için yazılmıştı (`ProviderId` enum'ı
`anthropic | openai | google` taşıyordu — `projectModel.ts`'in `AiMetaSchema.providerId`
alanı da aynı üçlüyü taşıyor, bu şemanın kendisi güncellenmeli, D-52'nin additive/
loose posture'ı sayesinde migration gerekmez). Trait'in kendi imzası (`list_models`/
`test_connection`/`complete`/`complete_structured`/`capabilities`) hâlâ geçerli bir
başlangıç noktası ama:

- `complete()` Vorion'un **Streaming Prediction (SSE)** endpoint'ine, Tauri'nin
  `Channel<StreamEvent>`'ına bağlanacak şekilde tasarlanmalı — §1.6'da okunan gerçek
  istek/yanıt şeklini kullan, SPEC'in taslağından değil.
  **Cancel Prediction**'ın da bir yol bulması gerekiyor (§8.14'ün "stream kesintisi"
  senaryosu) — trait'e ayrı bir `cancel()` metodu mu, yoksa `complete()`'in döndürdüğü
  bir handle üzerinden mi, bu oturumun kendi tasarım kararı.
- `test_connection()` — Synchronous Prediction ile "en küçük gerçek istek" (§8.3'ün
  kendi lafzı), gerçek gecikme + çözülen model listesi + varsa billing/quota hatasını
  olduğu gibi raporlamalı.
- `list_models()` — List LLMs veya Get Available LLMs (Grouped)'dan hangisinin
  Settings'in model seçicisine daha uygun olduğu §1.6'daki gerçek yanıt şekline bakılarak
  karar verilir (Grouped, sağlayıcı bazlı gruplama sunuyorsa muhtemelen daha iyi).
- `complete_structured()` — Vorion'un Predictions ailesinde ayrı bir endpoint olarak
  görünmüyor (D-199); bir `response_format`/schema parametresi olarak mı sunuluyor,
  §1.6'nın kendi dokümanına bakılmadan bilinmiyor. **Eğer dokümanda hiç yoksa**, bu
  metodu Faz 9'a (`generateStructured`'ın kendi işi) erteleyip trait'te bir stub/
  `todo!()` bırakmak makul — Faz 8'in done-koşulu yalnızca "answer a trivial prompt"
  istiyor, yapılandırılmış çıktı değil.
- `capabilities()` — Get LLM by ID'nin döndürdüğü alanlara göre doldurulur (vision/
  context-window/pricing varsa).

**Vorion'un Agent Service/RAG Service/Marketplace/Custom Assistants/Voice-STT/
Meetings yüzeyine HİÇ dokunulmaz** (D-199'un bilinçli sınırı, D-15/D-16'yı korumak
için) — trait yalnızca LLM Service'in Predictions + LLM Configuration alt kümesini
sarar.

### 2.3 `keyring` entegrasyonu

D-14'ün kuralı: anahtar asla webview'da kalıcı olmaz, asla `localStorage`'a girmez,
asla `.ppsx`'e girmez. Akış: kullanıcı Settings'te key'i bir input'a yapıştırır →
`invoke('ai_set_key', ...)` ile Rust'a gönderilir (bu tek geçiş kaçınılmaz — bir yapıştır
alanı olmadan key hiç girilemez, D-14'ün "asla webview'dan sağlayıcıya fetch atma"
kuralını ihlal etmez) → Rust `keyring` crate'iyle OS keychain'e yazar → aynı çağrıda
(veya ayrı bir "Test connection" tıklamasıyla) gerçek bir istek atıp doğrular. `keyring`
crate'inin güncel sürümü ve macOS/Windows API'leri (Keychain Access / Credential
Manager) **dokümantasyona karşı doğrulanmalı** (CLAUDE.md'nin kuralı, hafızadan
yazılmaz). Var olan bir key'in üzerine yazma davranışı (§8.3: "Re-entry replaces;
there is no 'reveal'") ve `nk_live_...d41d` gibi maskelenmiş bir önizleme gösterme
UI deseni buna göre kurulmalı.

**Rust HTTP client**: `reqwest` en olağan seçim (async, SSE/streaming desteği) — SPEC
bunu ismen önermiyor ama örtük varsayıyor; bu oturum bunu doğrudan seçebilir veya
alternatifleri (mesela SSE için `eventsource-stream` gibi yardımcı bir crate) kısaca
değerlendirip kararını `DECISIONS.md`'ye yazmalı.

### 2.4 Settings → AI providers ekranı (minimal, tek kart)

§8.4'ün alan listesi — tek karta indirgenmiş: sağlayıcı adı ("Vorion"), bağlantı
durumu (Not connected/Connected/Error + gerçek hata mesajı), API key alanı (maskeli,
yapıştırılabilir), **Test connection**, **Remove key**, model seçici (List LLMs'den
canlı doldurulur) + varsayılan model + opsiyonel "fast model", ve provider'ın key
verdiği yere bir link (`vorionai.com/profile` → API Keys). §8.4'ün "global AI
settings" alt bölümü (Enable AI assistance switch, redaction policy, spend cap,
attachment policy) — **bu dilimin kapsamı DIŞINDA**, Faz 9/10'un işi; yalnızca
"Enable AI assistance" master switch'i bu ekranda görünebilir (varsayılan kapalı,
D-20) ama redaction/spend-cap/attachment alanları boş/placeholder kalabilir.

### 2.5 Done-koşulu

- Settings'te gerçek bir Vorion key girilebiliyor, keychain'e yazılıyor (bir test
  key string'inin hiçbir logda/dosyada/`.ppsx`'te görünmediğini doğrulayan bir test,
  CLAUDE.md'nin "write a test that asserts a known key string appears nowhere"
  kuralı).
- "Test connection" gerçek bir Synchronous Prediction çağrısı yapıp başarı/hata +
  gecikme raporluyor.
- Model seçici List LLMs'den canlı dolduruluyor (hardcode edilmiş bir liste değil,
  D-21).
- `cargo test`/`npm test` yeşil, `AiMetaSchema.providerId` Vorion'u kapsayacak
  şekilde güncellendi.

---

## 3. Kapsam dışı (bu oturumda kesinlikle inşa EDİLMEZ)

- **Dilim 2** — Streaming Prediction'ın gerçekten bir sohbete bağlanması, `RightPanel`'in
  Assistant sekmesi, provenance plumbing (`CompletionMeta` → `Provenance`). Bu dilim
  yalnızca bağlantıyı/anahtarı/model listesini kurar, henüz bir tamamlama akışını
  UI'a bağlamaz.
- **Dilim 3** — D-20'nin Playwright "AI kapalı" mutlu-yol testi. Vorion'dan bağımsız,
  ayrı bir oturum (bu dilimden önce veya sonra, paralel de yapılabilir).
- **Yeni Proje diyaloğunun AI adımı** (§8.5 — provider/model/redaction seçimi proje
  oluştururken). `meta.ai` şeması zaten var (`AiMetaSchema`, Faz 2) ama bu akışa
  dokunulmaz; Dilim 2 veya kendi küçük ek dilimi bunu ele alabilir — bu dilim
  yalnızca GLOBAL Settings'i kurar, proje-başına etkinleştirmeyi değil. **Not**:
  `RightPanel`'in Assistant sekmesi `project.meta.ai.enabled`'e bakıyor — bu dilim
  bitince bile hiçbir projede bu `true` olmadığı için sekme hâlâ görünmeyecek, bu
  beklenen bir ara durum, hata değil.
- **Vorion'un Agent Service/RAG Service/Marketplace/Custom Assistants/Voice-STT/
  Meetings** yüzeyi — D-199'un bilinçli sınırı, asla bu dilimde veya sonrasında
  PPS Hachi'den çağrılmaz.
- `complete_structured()`'ın gerçek implementasyonu (Faz 9'un `generateStructured`'ı,
  eğer §1.6'nın dokümanı bunu ayrı bir mekanizma olarak gösteriyorsa bile).
- Redaction mantığı, dosya/görsel içeri alma (§8.9), A3 yerleştirme optimizeri
  (§8.10), maliyet sayacı (§8.12) — hepsi Faz 9/10.

---

## 4. Bütçe ve kapanış disiplini

Açık soru (§2.1) **hemen, kodlamadan önce** `AskUserQuestion` ile sorulur (bu
oturumda reddedilirse, kapsam belirleme oturumunun yaptığı gibi düz metinle sorulur
ve cevap beklenir) — cevap gelmeden yazılan bir Settings rotası yeniden yapılır
(bu repo'nun kendi tekrarlanan dersi). §1.6'nın kendi dokümanına bakma/deneme adımı
**Rust kodu yazmadan önce** tamamlanmalı — Vorion'un gerçek istek/yanıt şeklini
görmeden yazılan bir `LlmProvider` implementasyonu tahmin olur (Anayasa Madde 8).

Bu, Faz 8'in ilk gerçek kod dilimi ve yeni bir alt sistem açıyor (ağ, kimlik bilgisi,
harici bir API) — Faz 5/6b gibi "yeni mekanizma" fazlarıyla aynı dikkatle: TDD,
`npm test`/`npm run lint`/`npm run build` ve `cargo test`/`cargo clippy`/`cargo fmt`
hepsi yeşil olmadan iş bitmiş sayılmaz, exit code ayrı kontrol edilir (D-143'ün
dersi, `tail`'e pipe'lanmaz). Anahtar sızıntısı testi (§2.5) özellikle atlanmamalı —
CLAUDE.md'nin "API keys leaking into logs, crash reports, error strings" uyarısı bu
dilimde ilk kez gerçek anlam kazanıyor.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin
Faz 8 tablosuna Dilim 1 satırının durumu güncellenir, `CLAUDE.md`'nin Current
state'ine özet eklenir. Dilim 2'nin kendi launch prompt'u bu oturumun kapanışında
yazılır.

---

**Model önerisi:** Sonnet 5 yeterli çoğu iş için, ama bu oturum gerçek bir harici
API'nin (Vorion) ilk kez koda bağlandığı oturum — §1.6'nın doküman/deneme adımı
özenli yapılmalı (hafızadan tahmin değil, gerçek istek/yanıt). `LlmProvider`
trait'inin somut şekli (§2.2) bir mimari karar sayılabilir; D-28'in kendi routing
mantığına göre bu kısım için Opus değerlendirilebilir, ama trait'in taslağı zaten
SPEC.md §8.2'de var — bu oturum onu Vorion'un gerçek şekline uyarlıyor, sıfırdan
tasarlamıyor, o yüzden Sonnet 5 ile de güvenle ilerlenebilir.
