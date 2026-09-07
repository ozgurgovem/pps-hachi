# OTURUM Faz 10 — K4 (devam): maliyet sayacı + `ai-log.jsonl` + Settings spend cap

> Bu dosya `K4-maliyet-sayaci.md`'nin **devamıdır** — orijinal launch prompt değil. Önceki
> oturumda K4'ün neredeyse tamamı inşa edildi (plumbing, log/accumulator, spend cap
> enforcement, Settings UI) ve test edildi; **tek eksik parça gerçek Vorion token/cost alan
> adları** — bu, o oturumun kendi bulduğu bir blokaj (D-199/D-200/D-201/D-204'ün "ekran
> görüntüsü, asla tahmin" disiplini). Barış "ekran görüntüsünü şimdi paylaşırım" dedi ama
> oturum context bütçesi nedeniyle burada kesildi; devamı yeni, temiz bir oturumda yürütülecek.
>
> Kanonik konum: `docs/oturumlar/K4-maliyet-sayaci-devam.md`. Yazıldı: 2026-09-06.

---

## 0. İlk iş — bu promptu ve önceki oturumun bıraktığı durumu doğrula

```bash
# Önceki oturumun yeni/değiştirdiği dosyalar — hepsi var olmalı:
ls -1 docs/oturumlar/K4-maliyet-sayaci.md \
      src-tauri/src/path_safety.rs \
      src-tauri/src/ai/usage.rs \
      src-tauri/src/ai/provider.rs \
      src-tauri/src/ai/vorion.rs \
      src-tauri/src/ai/commands.rs \
      src-tauri/src/ai/settings.rs \
      src-tauri/src/ai/error.rs \
      src/ai/settingsIpc.ts \
      src/ai/structuredIpc.ts \
      src/app/routes/settings/SettingsScreen.tsx \
      src/app/routes/workspace/entryProposal.ts \
      src/app/routes/workspace/layoutReview.ts \
      src/app/routes/workspace/mockAudit.ts \
      src/app/routes/workspace/entryTranslation.ts

# Asıl blokajın hâlâ orada olduğunu doğrula — bu, tam olarak beklenen "stub" olmalı:
grep -n "fn completion_usage_from_response" -A 3 src-tauri/src/ai/vorion.rs
  # `CompletionUsage::default()` dönüyor olmalı (hepsi None). Doluysa (bir önceki oturum
  # bunu bir şekilde tamamladıysa) bu promptun kendi §2'si zaten bitmiş demektir — DECISIONS.md
  # D-218 için hazır olup olmadığını kontrol et, tekrar yazma.

grep -n "struct PredictionResponse" -A 12 src-tauri/src/ai/vorion.rs
  # yalnızca `response: String` alanı olmalı, token/cost alanları eklenmemiş olmalı.

# git durumu — ÖNEMLİ, aşağıdaki §0.1'i oku
git status --porcelain
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — küçük bir yol yanlışlığı durma
sebebi değildir, yalnızca notla devam et.

### 0.1 Eşzamanlı, ilgisiz bir başka iş — dokunma

Önceki oturum sırasında **başka bir Claude Code oturumu aynı depoda eşzamanlı çalışıyordu** —
Workspace Yüzey Yenilemesi'nin (D-217'nin kendi kaydı, `docs/oturumlar/W1-insa.md`) inşası.
Bu, K4'ün AI-katmanı işinden **tamamen bağımsız** bir UX girişimi. Bu prompt yazıldığı anda
şu dosyalar o işin bir parçası olarak değişiyordu: `src/app/routes/workspace/WorkspaceShell.tsx`,
`AssistantPanel.tsx`, `StepPage.tsx`, `WorkspaceScreen.test.tsx`, `AssistantPanel.test.tsx`,
`src/state/projectStore.ts`, `src/index.css`, ve yeni dosyalar `StepOverview.tsx`/
`StepQuickJump.tsx` (`StepStepper.tsx` silinerek). **Bu dosyalara bu prompt kapsamında
dokunma** — K4 bunlardan hiçbirini kullanmıyor. Eğer bu oturum başladığında o iş hâlâ yarım
kalmışsa (`npx tsc --noEmit` `WorkspaceShell.tsx`/`AssistantPanel.tsx` içinde hata veriyorsa),
bu **senin bulgun değil** — Barış'a bildir, düzeltme, kendi K4 dosyalarını buna göre doğrula
(`npx tsc --noEmit` çıktısını bu iki dosyaya göre filtrele, bkz. §3'ün kendi doğrulama adımı).

Eğer o iş bu oturum başladığında zaten bitip commit'lenmişse, bu not artık geçersizdir —
sessizce yok say.

### 0.2 Paylaşılan dosyalara dikkat

Önceki oturum `CLAUDE.md`/`DECISIONS.md`/`docs/oturumlar/README.md`'ye **kasıtlı olarak
dokunmadı** — çünkü W1 oturumu da muhtemelen aynı dosyalara yazacaktı (çakışma riski). K4
gerçekten bittiğinde (§3'ün kendi done-koşulu karşılandığında) bu üç dosyayı **güncel halleriyle
oku, sonra düzenle** — W1'in kendi yazdığı satırları asla ezme.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/K4-maliyet-sayaci.md` — **orijinal launch prompt, tam okunmalı**. Bu dosyanın
   §1-§4'ü hâlâ geçerli: mimari kararların gerekçesi (plumbing (b), log sidecar, spend cap
   global per-month) hep orada. Bu devam-dosyası yalnızca "ne yapıldı, ne kaldı" ekliyor.
3. Bu dosyanın §2'si (aşağıda) — önceki oturumun tam olarak ne inşa ettiği.
4. `src-tauri/src/ai/vorion.rs`'in `PredictionResponse`/`completion_usage_from_response`/ilgili
   test'i — asıl iş burada bitiyor.

---

## 2. Önceki oturumda tamamlanan (2026-09-06)

Barış'ın dört `AskUserQuestion` turuyla onayladığı kararlar, hepsi (b)/önerilen seçenek:

- **§2.1 Plumbing** → Rust kendi başına loglar. `LlmProvider::complete_structured`'ın trait
  imzası **Rust-içi** olarak `Result<StructuredCompletionResult, AiError>`'a genişledi
  (`StructuredCompletionResult { value, usage: CompletionUsage }`, `provider.rs`) — ama
  `ai_complete_structured` Tauri komutunun **TS'e giden dönüşü değişmedi**
  (`Result<serde_json::Value, String>`), bu yüzden K1/K2/K3'ün `attemptStructuredProposal`
  zincirinin hiçbir TİPİ bozulmadı. Tek gerçek ripple: `projectId`/`promptVersion`'ın
  `completeStructured`'a yeni, zorunlu parametre olarak eklenmesi — bu, `ai::usage`'ın
  per-project log'u için kaçınılmazdı (Rust'ta "şu an açık proje" kavramı yok). Bu iki alan
  5 propose-fonksiyonunun (`proposeStructuredEntry`, `proposeLayoutReviewDiff`,
  `proposeMockAuditFindings`, `proposeEntryTranslation`, `proposeWholeReportTranslation`) kendi
  `Params` arayüzlerine ve 6 UI bileşenine (`EntryProposalField`, `EntryTranslateField`,
  `EntryEditorDialog`, `LayoutReviewPanel`, `MockAuditPanel`, `TranslateReportPanel`) mekanik
  olarak eklendi.
- **§2.2 Log konumu** → Sidecar, `history.rs`'in D-74 deseni. `ai-log/{project_id}.jsonl`,
  `app_local_data_dir` altında. SPEC.md §8.13'ün "inside the `.ppsx`" lafzından bilinçli
  sapma — kapanışta DECISIONS.md'ye yazılacak (§3'ün kendi işi).
- **§2.3 Running total** → İkisi de: per-project (`ai::usage::read_project_totals`, log'dan
  toplanır) + global per-month (`ai-usage.json`, `AiUsage`/`record_usage`/`month_total`).
- **§2.4 Spend cap** → Global per-month toplama karşı, `AiSettings.spend_cap_usd: Option<f64>`.
  `ai_complete_structured` göndermeden ÖNCE kontrol eder, cap'e çarpınca
  `AiError::SpendCapExceeded` ile YALNIZCA o çağrı reddedilir — `meta.ai.enabled`'a
  dokunulmaz.

**Yeni Rust modülleri/değişiklikler:**
- `src-tauri/src/path_safety.rs` (yeni) — `ppsx::history`'nin D-91/D-92 doğrulayıcısı
  (`is_safe_path_component`) buraya taşındı, `ai::usage` de aynı fonksiyonu kullanıyor (G2).
  `ppsx/history.rs` güncellendi, kendi testleri (entegrasyon seviyesinde) korundu.
- `src-tauri/src/ai/usage.rs` (yeni) — `AiLogEntry` (timestamp/provider/modelId/promptVersion/
  inputTokens/outputTokens/costUsd/**accepted: her zaman `None`** — bkz. aşağıdaki P-numarası),
  `append_log_entry`/`read_project_totals` (per-project), `AiUsage`/`read_usage`/`write_usage`/
  `record_usage`/`month_total`/`current_month_key` (global per-month), `CostSummary` (IPC'ye
  giden birleşik yanıt). 14 yeni test, hepsi geçiyor.
- `src-tauri/src/ai/provider.rs` — `CompletionUsage`/`StructuredCompletionResult` eklendi,
  `complete_structured` trait imzası genişledi.
- `src-tauri/src/ai/vorion.rs` — `complete_structured` artık `StructuredCompletionResult`
  dönüyor. **`completion_usage_from_response` bilerek bir stub** —
  `CompletionUsage::default()` (hepsi `None`) döner, gerçek alan adları onaylanana kadar.
  Kendi testi (`completion_usage_from_response_is_a_documented_stub_pending_the_real_field_names`)
  bu stub davranışını kilitliyor — gerçek alanlar eklendiğinde bu test SİLİNMELİ/DEĞİŞTİRİLMELİ.
- `src-tauri/src/ai/error.rs` — `Io`/`UnsafeEntryName`/`SpendCapExceeded` varyantları.
- `src-tauri/src/ai/settings.rs` — `spend_cap_usd: Option<f64>`.
- `src-tauri/src/ai/commands.rs` — `ai_complete_structured` artık `app: AppHandle`,
  `project_id: String`, `prompt_version: Option<String>` alıyor; spend cap kontrolü + log/usage
  yazımı (best-effort, `eprintln!` ile, gerçek başarılı yanıtı ASLA kaybetmiyor). Yeni
  `ai_get_cost_summary(app, project_id) -> CostSummary` komutu.
- `Cargo.toml` — `chrono = "0.4.45"` eklendi (RFC3339 zaman damgası için, `default-features =
  false` + `clock`/`std`).
- `lib.rs` — `path_safety` modülü + `ai_get_cost_summary` komutu kaydedildi.

**TS tarafı:** `settingsIpc.ts` (`AiSettings.spendCapUsd`, `CostTotals`/`CostSummary`,
`getCostSummary`), `structuredIpc.ts` (`completeStructured`'a `projectId`/`promptVersion`),
5 propose-fonksiyonu + 6 UI bileşeni yukarıda anlatıldığı gibi güncellendi. `SettingsScreen.tsx`
kalıcı (geçici debug DEĞİL) bir "AI maliyeti" bölümü kazandı: aylık harcama sınırı girişi
(`onBlur` ile commit, `termsInput`'un deseni) + proje toplamı/ay toplamı gösterimi + cap
aşıldığında görünür uyarı. i18n TR+EN birlikte eklendi (`settings.ai.spendCap*`/`cost*`).

**Test durumu (önceki oturumun sonunda):**
- `cargo test` 195/195 (170 → 195: path_safety 1 + usage.rs 14 + vorion.rs 1), `cargo clippy
  --all-targets -- -D warnings` ve `cargo fmt -- --check` ikisi de temiz.
- Dokunulan 14 TS test dosyası scoped çalıştırıldı: 181/181 yeşil (`npx vitest run <o 14
  dosya>`). **Tam `npm test` bu oturumda ÇALIŞTIRILAMADI temiz halde** — §0.1'de anlatılan
  eşzamanlı W1 işi 4 ilgisiz dosyada (`LaunchScreen.test.tsx`, `AssistantPanel.test.tsx`,
  `WorkspaceScreen.test.tsx`, `entryReferences.integration.test.tsx`) kırıktı, K4'ün kendi
  dosyalarıyla hiç kesişmiyor.
- `npx tsc --noEmit`: K4'ün dokunduğu HİÇBİR dosyada hata yok (doğrulandı: `grep -v
  "AssistantPanel.tsx\|WorkspaceShell.tsx"` ile filtrelenince çıktı boş). Kalan iki hata W1'in
  kendi yarım işi.
- `npx eslint` K4'ün dokunduğu dosyalarda temiz (bir `react-hooks/exhaustive-deps` uyarısı
  `termsInput`'un kendi desenine uyularak `eslint-disable-next-line` ile bilinçli susturuldu).

**Filed, henüz kapatılmayan gerçek gap'ler (kapanışta P-numarası almalı):**
- `AiLogEntry.accepted` her zaman `None` — `ai_complete_structured`'ın TS'e hiç metadata
  dönmemesi (§2.1'in kendi seçimi) bir log kaydını sonraki Accept/Reject kararıyla
  eşleştirecek bir korelasyon mekanizması olmadığı anlamına geliyor. İkinci bir mekanizma
  gerektirir, bu dilimin bütçesi dışında bırakıldı.
- Per-month toplam GERÇEKTEN cross-project (tek bir global `ai-usage.json`) — birden fazla
  proje aynı ayda açılırsa doğru şekilde toplanıyor, ama bu hiç canlı test edilmedi (yalnızca
  birim testlerle).

---

## 3. Kalan iş — bu oturumun kendi görevi

### 3.1 Asıl blokaj: gerçek Vorion token/cost alan adları

Barış'tan `vorionai.com/docs` → LLM Service → Predictions → **Synchronous Prediction** →
Response Schema tablosunun ekran görüntüsünü iste (bir önceki oturumda zaten istenmişti,
"şimdi paylaşırım" dendi ama oturum context bütçesi nedeniyle kesildi — muhtemelen bu
oturumun en başında paylaşacak). İhtiyacın olan:

- Input/output token sayısı alan adları (`input_tokens`/`output_tokens` mi, `prompt_tokens`/
  `completion_tokens` mi, başka bir isim mi).
- Doğrudan bir `cost`/`total_cost` benzeri alan var mı — varsa, `LlmListItem`'ın
  `cost_per_input_token`/`cost_per_output_token`'ından ayrı bir hesaplama gerekmez, bu çok
  daha basit ve tercih edilir (önceki oturumun kendi notu, `usage.rs`'in tasarımı buna göre
  esnek bırakıldı).
- Eğer yalnızca ham token sayıları varsa (doğrudan cost alanı yoksa): maliyeti
  `input_tokens × cost_per_input_token + output_tokens × cost_per_output_token` olarak
  hesaplamak `list_models()`'i (ya da modelin kendi fiyatını) ayrıca çekmeyi gerektirir —
  bu, `complete_structured`'ın bugünkü akışına yeni bir ağ çağrısı ekler; gerçekten gerekiyorsa
  `AskUserQuestion` ile Barış'a sor (önerilen: eğer doğrudan bir cost alanı yoksa, bu dilimde
  yalnızca ham token sayılarını logla, `costUsd: None` bırak, maliyet hesaplamasını P-numarasıyla
  ertele — cap enforcement token sayısına göre değil, yalnızca doğrudan cost verisi varsa
  anlamlı çalışır; token-only senaryoda spend cap'in kendisi de yeniden düşünülmeli, tek
  başına karar verme, sor).

Alan adları netleşince:
1. `PredictionResponse`'a (`vorion.rs`) gerçek alanları ekle (`#[serde(default)]` ile
   savunmacı — dokümante edilmiş bir alan bazen eksik gelirse `None`'a düşsün, tüm yanıtı
   çökertmesin).
2. `completion_usage_from_response`'u gerçek çıkarımla değiştir.
3. `List LLms`'in gerçek belgelenmiş şekline (D-200) benzer şekilde, gerçek Response Schema'ya
   birebir uyan bir deserialize testi ekle (`stream_chunk_payload_deserializes_from_the_real_
   documented_shape`/`list_llms_response_deserializes_from_the_real_documented_shape`'in aynı
   deseni) — ekstra alanların yok sayıldığını KANITLA, yalnızca yorumda iddia etme.
4. Stub testini (`completion_usage_from_response_is_a_documented_stub_pending_the_real_field_names`)
   sil, yerine gerçek çıkarımı doğrulayan testler koy.

### 3.2 Kapanış (§3.1 bittikten sonra)

- `cargo test`/`cargo clippy --all-targets -- -D warnings`/`cargo fmt -- --check` — hepsi
  temiz olmalı, exit code ayrı kontrol et (D-143'ün dersi).
- `npm test` — **tam çalıştır**, exit code kontrol et. §0.1'in kendi notunu uygula: eğer W1
  işi hâlâ yarım ve ilgisiz dosyalarda kırıksa, bunu K4'ün kendi başarısızlığı SAYMA — ayrı
  belirt. K4'ün kendi dokunduğu dosyalar (bu dosyanın §2'sinde listelenen + `vorion.rs`)
  100% yeşil olmalı.
- `npm run build`/`npx tsc --noEmit` — aynı ayrım (§0.1).
- `DECISIONS.md`'ye **D-218** (önceki oturumda D-217 zaten "Workspace Yüzey Yenilemesi"ne
  gitti — bu oturum başladığında güncel `DECISIONS.md`'yi oku, gerçek bir sonraki numarayı
  doğrula, körü körüne D-218 yazma). K4'ün tam kaydı: plumbing/log-konumu/spend-cap
  kararları + gerçek Vorion alan adları + P-numaraları (accepted-her-zaman-None, vs.).
- `docs/oturumlar/README.md`'nin K4 satırı güncellenir — **güncel haliyle oku, W1'in kendi
  satırlarını ezme** (§0.2).
- `CLAUDE.md`'nin Current State'ine K4'ün kapanış özeti eklenir — **güncel haliyle oku, W1'in
  kendi eklediği satırları koru** (§0.2). **Faz 10'un dört dilimlik planı (K1-K4) bu oturumla
  TAMAMEN kapanır.**
- SPEC.md §6'nın bir sonraki fazının (Faz 11, D-157'nin işaret ettiği Rev00-tabanlı 8-step
  template) kendi kapsam-belirleme launch prompt'u bu oturumun kapanışında yazılabilir
  (isteğe bağlı, Barış'ın sıralaması W1/Faz 11 arasında kendi tercihi).

---

**Model önerisi:** §3.1'in kendi alan-adı entegrasyonu K1-K3'ün kurduğu desenin (D-200'ün
`LlmListItem`/`model_info_from_item` deseni) doğrudan tekrarı — Sonnet 5 yeterli. Yeni bir
mimari karar gerekmiyor, yalnızca doğrulanmış veriyi doğru yere yazmak.
