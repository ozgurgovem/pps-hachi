# OTURUM Faz 8 — Dilim 2: Streaming completion uçtan uca + Assistant sekmesi + provenance

> Dilim 1 (`faz8-dilim1-vorion-temel.md`) **BİTTİ** 2026-08-30 (D-200). Kurulan temel:
> Settings shell (WorkspaceTopBar'da dişli ikonu, `/settings`), Rust `keyring`
> entegrasyonu (`src-tauri/src/ai/keychain.rs`, `SecretStore` trait + gerçek
> `KeyringSecretStore`), `LlmProvider` trait (`src-tauri/src/ai/provider.rs` —
> şu an yalnızca `list_models`/`test_connection`), gerçek `VorionProvider`
> adaptörü (`src-tauri/src/ai/vorion.rs`), yedi Tauri komutu (`ai_set_key`,
> `ai_key_status`, `ai_remove_key`, `ai_test_connection`, `ai_list_models`,
> `ai_get_settings`, `ai_set_settings`), `AiSettings` (non-secret, app-local
> `ai-settings.json`), `AiMetaSchema.providerId` artık yalnızca `"vorion"`.
>
> **Bu dosya Dilim 2'nin kapsamıdır**: Vorion'un Streaming Prediction (SSE)
> endpoint'ini gerçekten bir sohbete bağlamak — `RightPanel`'in şu an `{null}`
> olan Assistant sekmesine çıplak bir chat kutusu + `Provenance` şemasının
> (D-18, zaten var) ilk kez gerçek bir tamamlamayla doldurulması. Dilim 3
> (D-20'nin Playwright "AI kapalı" testi) bu oturumun **DIŞINDA**, Vorion'dan
> bağımsız, paralel veya bu dilimden önce/sonra yapılabilir.
>
> Kanonik konum: `docs/oturumlar/faz8-dilim2-vorion-streaming.md`. Yazıldı:
> 2026-08-30, Dilim 1'in kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/faz8-dilim1-vorion-temel.md \
      src-tauri/src/ai/mod.rs \
      src-tauri/src/ai/provider.rs \
      src-tauri/src/ai/vorion.rs \
      src-tauri/src/ai/commands.rs \
      src/ai/settingsIpc.ts \
      src/app/routes/settings/SettingsScreen.tsx \
      src/app/routes/workspace/RightPanel.tsx \
      src/domain/model/provenance.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-30'da,
Dilim 1'in kapanışının hemen ardından doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-200** (Dilim 1'in tam kaydı — Vorion API'sinin gerçek
   doğrulanmış şekli, `LlmProvider`/`VorionProvider`/`SecretStore` mimarisi),
   **D-199** (üç dilimlik plan, D-15/D-16'nın Agent/RAG-service sınırı),
   **D-18** (Provenance şeması), **D-15/D-16** (assistant proposes/human
   accepts, critique-before-draft — bu dilimin çıplak chat kutusunun bile
   uyması gereken sınır).
3. `src-tauri/src/ai/vorion.rs` ve `provider.rs` — Dilim 1'in gerçek kodu.
   `test_connection`'ın Synchronous Prediction'a nasıl bağlandığını (multipart
   form, `data` alanı, `llm_name`/`llm_group_name`) oku; Streaming Prediction
   da aynı `data` şeklini kullanıyor olması muhtemel ama **doğrulanmadı** —
   §2.1'in kendi işi.
4. `SPEC.md` §8.2 (Rust `complete()` taslağı, `Channel<StreamEvent>`), §8.6
   (dört mod: Critique/Draft/Extract/Review — bu dilim yalnızca "çıplak bağlantı
   kanıtı" istiyor, D-199'un Soru 3 cevabı: adım-bağlamı/mod seçici/şema yok),
   §8.13 (Provenance ve audit trail), §8.14 (hata modları — stream kesintisi).
5. `vorionai.com/docs` — **Barış'ın yetkili tarayıcı oturumunda**. Bu dilimin
   kendi doğrulama yükü Dilim 1'den bile ağır: Streaming Prediction'ın SSE
   olay şekli (her chunk'ın JSON alanları — `delta`/`content`/`done` gibi),
   Cancel Prediction'ın body'si, ve stream tamamlandığında token sayaçlarının
   nerede geldiği (son chunk'ta mı, ayrı bir olay mı) hiç görülmedi.

---

## 2. Kapsam

### 2.1 Açık soru — KODLAMADAN ÖNCE gerçek doküman şekli doğrulanmalı

Dilim 1'in dersi aynen geçerli: Streaming Prediction'ın (`POST
/llm/api/v1/prediction/predict/stream`) gerçek SSE olay şeklini Barış'ın
yetkili oturumundan (ekran görüntüsü veya "Try It") görmeden bu dilimin Rust
tarafı (`VorionProvider::complete`) yazılamaz — CLAUDE.md'nin "verify against
current docs before implementing" kuralı burada da işler. Muhtemel şekil
(Synchronous Prediction'ın `data` body'sine benzer + SSE `data: {...}\n\n`
çerçevesi) **tahmindir, doğrulanmadan koda geçilmez.**

### 2.2 Rust `complete()` — `LlmProvider` trait'ine ekleniyor

`provider.rs`'in trait'i yalnızca `list_models`/`test_connection` taşıyor
(D-200'ün kendi notu: "complete() Dilim 2'de eklenecek, unimplemented/unused
bir trait metodu clippy'nin dead-code kapısını kırar"). Bu dilim:

- `complete(&self, req: CompletionRequest, tx: Channel<StreamEvent>) -> Result<CompletionMeta, AiError>`
  trait'e eklenir, `VorionProvider` implement eder.
- SSE gövdesi `reqwest`'in `bytes_stream()`'i üzerinden **elle** ayrıştırılır
  (D-200 bilinçli olarak bir SSE crate'i eklemedi, YAGNI — bu dilim gerçekten
  ihtiyaç duyarsa `eventsource-stream` gibi küçük bir crate değerlendirilebilir,
  ama önce elle ayrıştırma denenmeli).
- Cancel Prediction'ın (`POST /llm/api/v1/prediction/predict/cancel`) bir yolu
  bulmalı — trait'e ayrı bir `cancel()` metodu mu, `complete()`'in döndürdüğü
  bir handle üzerinden mi, bu oturumun kendi tasarım kararı (SPEC.md §8.2'nin
  taslağı bunu netleştirmiyor).

### 2.3 Tauri Channel

`tauri::ipc::Channel<StreamEvent>` — Tauri v2'nin async command'lardan
otomatik desteklediği mekanizma (Dilim 1'de doğrulandı, ek kurulum gerekmiyor).
`StreamEvent`'in TS tarafı şekli (`{ type: "chunk", text: string } | { type:
"done", meta: CompletionMeta } | { type: "error", message: string }` gibi) bu
oturumun kendi tasarım kararı — Vorion'un gerçek SSE şeklini yansıtacak şekilde.

### 2.4 `RightPanel`'in Assistant sekmesi — çıplak sohbet kutusu

D-199'un Soru 3 cevabı: **adım-bağlamı yok, mod seçici yok, şema yok, kalıcı
geçmiş yok** — yalnızca serbest-metin bir kutu + gönder düğmesi + akan yanıt.
`project.meta.ai.enabled` zaten `true` olmadıkça sekme görünmüyor (Faz 2'den
beri var); bu dilim projenin AI'yi nasıl `true` yapacağını KURMUYOR (§8.5'in
"New Project dialog'un AI adımı" hâlâ kapsam dışı, D-199'un notu) — test etmek
için Barış elle bir `.ppsx`'in `meta.ai.enabled`'ini `true`/`providerId`'sini
`"vorion"` yapması gerekecek, ya da bu dilim küçük bir geçici debug yolu
ekleyebilir (Barış'a sorulmalı).

### 2.5 Provenance plumbing

`CompletionMeta` (Rust'tan dönen) → `Provenance` (D-18, `src/domain/model/
provenance.ts`, zaten var) alanlarına nasıl akıyor: `origin: "ai-accepted"`
yalnızca kullanıcı Accept dediğinde (D-15'in LOCKED kuralı — bu dilim bir
"fill the whole A3" veya oto-kabul yolu AÇMAZ), `model.{providerId,modelId,
promptVersion}`, `generatedAt`. Bu dilimin "çıplak chat kutusu" olması,
Accept/Edit/Reject akışının da minimal olacağı anlamına gelmiyor — D-15/D-16
LOCKED, sekiz ay önceki karar bu dilimde de tam uygulanır.

### 2.6 Done-koşulu

- Assistant sekmesinde gerçek bir prompt yazılıp gönderiliyor, yanıt token
  token akıyor (Streaming Prediction → Tauri Channel → UI).
- Stream kesintiye uğratılabiliyor (Cancel Prediction gerçekten çağrılıyor).
- Kabul edilen bir yanıt gerçek bir `Provenance` kaydıyla `ProjectModel`'e
  giriyor — yalnızca Accept sonrası, asla otomatik.
- `cargo test`/`npm test` yeşil, anahtar sızıntısı testi (Dilim 1'in
  `a_saved_key_never_appears_in_a_produced_ppsx_file` emsali) bu dilimin yeni
  IPC yüzeyi için de geçerli kalıyor mu diye tekrar doğrulanır.

---

## 3. Kapsam dışı

- Dilim 3 (Playwright).
- §8.5 (New Project dialog'un AI adımı, proje-başına etkinleştirme).
- `complete_structured()` (Faz 9).
- Redaction mantığı, dosya/görsel içeri alma (§8.9), A3 yerleştirme optimizeri,
  maliyet sayacı — hepsi Faz 9/10.
- Vorion'un Agent/RAG/Marketplace/Custom Assistants/Voice-STT/Meetings yüzeyi
  — D-199'un bilinçli sınırı, asla bu dilimde de PPS Hachi'den çağrılmaz.

---

## 4. Bütçe ve kapanış disiplini

§2.1'in kendi doküman-doğrulama adımı Rust kodu yazmadan önce tamamlanmalı —
Dilim 1'in kendi dersi (Vorion'un gerçek şekli tahmin edilebilir değil, çok
turlu bir doğrulama gerekti) burada da geçerli, üstelik SSE olay şekli
Synchronous Prediction'dan daha az öngörülebilir. Bu, Faz 8'in ikinci "yeni alt
sistem" dilimi (SSE parsing, Tauri Channel, gerçek bir chat UI) — TDD, `npm
test`/`npm run lint`/`npm run build` ve `cargo test`/`cargo clippy`/`cargo fmt`
hepsi yeşil olmadan iş bitmiş sayılmaz, exit code ayrı kontrol edilir.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin
Dilim 2 satırı güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir.
Dilim 3'ün kendi launch prompt'u (eğer henüz yazılmadıysa) bu oturumun
kapanışında veya bağımsız olarak yazılabilir.

---

**Model önerisi:** Sonnet 5 yeterli, ama Dilim 1'deki gibi §2.1'in doküman
doğrulama adımı özenli yapılmalı. SSE ayrıştırma + Tauri Channel entegrasyonu
gerçek bir mimari karar sayılabilir (D-28'in routing mantığına göre Opus
değerlendirilebilir) ama trait'in genişletilmiş şekli zaten Dilim 1'de
kurulan desenin devamı, sıfırdan tasarım değil.
