# OTURUM Faz 10 — K4: maliyet sayacı + `ai-log.jsonl` + Settings spend cap

> Faz 10'un kendi kapsam belirleme oturumu (D-213, 2026-09-05) BİTTİ. K1 (D-214), K2 (D-215)
> ve K3 (D-216) BİTTİ. Bu dosya dört dilimlik planın **dördüncü ve son** dilimini uygular:
>
> - K1 (BİTTİ, D-214) — A3 yerleşim optimize edici + hücre bütçesine kısaltma, `RightPanel`'in
>   "Review" sekmesi.
> - K2 (BİTTİ, D-215) — mock-auditor review + anlatı kopukluğu tespiti BİRLEŞİK,
>   `RightPanel`'in "Denetim" sekmesi.
> - K3 (BİTTİ, D-216) — TR↔EN çeviri: alan-bazlı `EntryTranslateField` (koşulsuz, her
>   method'da) + `RightPanel`'in kendi kendine yeten "Çeviri" sekmesi.
> - **K4 (bu dosya)** — maliyet sayacı + `ai-log.jsonl` + Settings spend cap, D-213'ün kendi
>   kararıyla K1-K3'ten SONRA sıralandı: ölçecek gerçek `complete_structured` trafiği (K1/K2/K3
>   bunu üretti) olmadan bir maliyet sayacı inşa etmenin somut faydası yoktu.
>
> Kanonik konum: `docs/oturumlar/K4-maliyet-sayaci.md`. Yazıldı: 2026-09-06, K3'ün kapanışının
> hemen ardından, Barış'ın açık talebiyle.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/K1-yerlesim-kisaltma.md \
      docs/oturumlar/K3-tr-en-ceviri.md \
      src-tauri/src/ai/provider.rs \
      src-tauri/src/ai/vorion.rs \
      src-tauri/src/ai/settings.rs \
      src-tauri/src/ai/commands.rs \
      src-tauri/src/ppsx/history.rs \
      src-tauri/src/ppsx/archive.rs \
      src/ai/structuredIpc.ts \
      src/ai/completionIpc.ts \
      src/ai/settingsIpc.ts \
      src/app/routes/workspace/entryProposal.ts \
      src/app/routes/workspace/layoutReview.ts \
      src/app/routes/workspace/mockAudit.ts \
      src/app/routes/workspace/entryTranslation.ts \
      src/app/routes/settings/SettingsScreen.tsx \
      src/domain/model/projectModel.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — küçük bir yol yanlışlığı (K1/K2/K3'ün
her birinin kendi §0'ında bulduğu tekrarlayan desen) durma sebebi değildir, yalnızca notla devam
et.

Ayrıca kendi taramamı da doğrula:

```bash
grep -n "struct PredictionResponse" -A 5 src-tauri/src/ai/vorion.rs
  # yalnızca `response: String` bekleniyor — Synchronous Prediction'ın gerçek yanıtındaki
  # token sayaçları (D-200'ün doğruladığı) hâlâ okunmuyor olmalı. Okunuyorsa (bir önceki
  # dilim bunu değiştirdiyse) bu promptun kendi §2.1'i zaten kısmen yapılmış demektir.
grep -n "struct LlmListItem" -A 8 src-tauri/src/ai/vorion.rs
  # `cost_per_input_token`/`cost_per_output_token` alanları hâlâ okunmuyor olmalı — D-213'ün
  # kendi bulgusu (List LLMs yanıtı bunları zaten taşıyor, `list_llms_response_deserializes_
  # from_the_real_documented_shape` testi bunu kanıtlıyor).
grep -rn "ai-log\|spendCap\|spend_cap\|CostMeter\|cost_meter" src-tauri/src/ src/ 2>/dev/null
  # HİÇBİR eşleşme bekleniyor — K4'ün kendi mekanizması bu dilimde ilk kez inşa ediliyor.
grep -n "pub struct AiSettings" -A 5 src-tauri/src/ai/settings.rs
  # `enabled`/`default_model_id`/`fast_model_id` üç alan bekleniyor — spend cap için dördüncü
  # bir alan bu dilimde eklenecek mi, yoksa ayrı bir dosyada mı yaşayacak, §2.5'in kendi kararı.
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-213** (Faz 10 kapsam belirleme — K4'ün veri kaynağı sorusunun ZATEN
   cevaplı olduğunu kanıtlayan bulgu: `vorion.rs` okunarak doğrulandı, `PredictionResponse`
   Synchronous Prediction'ın — yani `complete_structured`'ın temeli — yanıtından yalnızca
   `response` alanını okuyor, token sayaçlarını bilerek yok sayıyor; `LlmListItem` de List
   LLMs'in zaten taşıdığı `cost_per_input_token`/`cost_per_output_token`'ı okumuyor. **Yeni
   bir Vorion doküman turu GEREKMİYOR** — veri zaten oradadır, yalnızca okunmuyor). **P-53**
   (K4'ün maliyet sayacı yalnızca `complete_structured` tabanlı çağrıları — K1/K2/K3 —
   sayabilecek; `AssistantPanel`'in serbest sohbeti Streaming Prediction kullanıyor ve o
   yanıtta HİÇ token sayacı yok, D-201. Bu sınırlamayı Settings UI'ında SESSİZCE bırakmamak
   bu dilimin kendi done-koşulu). **D-74** (history sidecar hassasiyeti — `.ppsx` dosyasının
   KENDİSİ crash-safe atomic-write ile bütün-arşiv-yeniden-yazma modeli kullanıyor; sık,
   düşük-riskli veri app-local-data-dir'de bir sidecar olarak tutulabiliyor, `.ppsx`'in
   içine HER seferinde yazılmak zorunda değil — K4'ün kendi §2.2'sinin ai-log.jsonl yer
   kararına doğrudan emsal). **D-204/D-214/D-216** (K1/K3'ün her ikisinin de
   `attemptStructuredProposal` üzerine kendi retry orkestrasyonlarını kurduğu desen — K4'ün
   plumbing değişikliği bu tek çağrı noktasından mı geçmeli, yoksa Rust tarafında mı
   kalmalı, §2.1'in kendi sorusu).
3. `SPEC.md` §8.12 ("Cost and tokens" — live token estimate before send; actual usage/cost
   after, per request; per-project ve per-month running totals; caching; ucuz "fast model"
   condensation/translation/retry'ye, seçilen model analiz/critique'e; spend cap davranışı
   AÇIK ve YAPILANDIRILABİLİR, cap'e çarpınca hataya değil OFFLINE MODA düşer). §8.13
   ("Provenance and the audit trail" — `ai-log.jsonl`'ın kendi tanımı: `.ppsx`'in İÇİNDE,
   her isteği timestamp/provider/model/prompt version/token counts/cost/accepted-or-rejected
   ile kaydeden bir dosya; prompt/response gövdeleri VARSAYILAN OLARAK kaydedilmez —
   redaction katmanının korumaya çalıştığı aynı gizli veriyi taşırlar; tam-gövde loglama
   için AÇIK bir uyarılı Settings anahtarı var). §8.14 (context/spend cap'in "asla sessizce"
   ilkesi — burada da geçerli: cap'e çarpınca ne olduğu AÇIKÇA söylenir).
4. `src-tauri/src/ai/provider.rs` — `LlmProvider` trait'i (`complete_structured`'ın bugünkü
   imzası: `Result<serde_json::Value, AiError>`, HİÇBİR metadata taşımıyor), `CompletionMeta`
   (`complete()`'in — streaming'in — kendi dönüş tipi, D-201'in kendi notu: "Streaming
   Prediction'da token sayacı YOK, bu yüzden CompletionMeta'nın taşıyacak bir şeyi yok" —
   bu not hâlâ doğru, K4 bunu DEĞİŞTİRMEZ). `Capabilities` (`json_schema` tek alan — SPEC'in
   kendi taslak `cost_per_mtok` alanı hâlâ eklenmedi, §2.1'in kendi kararı bunu ekleyip
   eklemeyeceği).
5. `src-tauri/src/ai/vorion.rs` — `PredictionResponse` (yalnızca `response: String` okuyor,
   §0'ın kendi grep'i), `LlmListItem` (yalnızca `provider_name`/`model_name`/`group_name`/
   `display_name` okuyor — `cost_per_input_token`/`cost_per_output_token` zaten gerçek yanıtta
   var, D-213'ün kendi bulgusu), `complete_structured`'ın gerçek implementasyonu (redact →
   request kur → gönder → parse → unredact sırası — token/cost okuma bu zincirin neresine
   eklenir, §2.1'in kendi kararı).
6. `src-tauri/src/ai/settings.rs` — `AiSettings` (üç alan: `enabled`/`default_model_id`/
   `fast_model_id`, hepsi additive-field/degrade-to-default deseninde, D-134/D-200'ün kendi
   dosyası — `ai-settings.json`, non-secret, `write_settings`/`read_settings`). Spend cap
   burada dördüncü bir alan mı olur yoksa ayrı bir dosya mı, §2.5'in kendi kararı.
7. `src-tauri/src/ppsx/history.rs` — D-74'ün sidecar deseni: `.ppsx`'in KENDİSİ değil,
   app-local-data-dir altında proje-id'ye göre adreslenen ayrı dosyalar; `ppsx_write`'ın
   optimistic-concurrency compare-and-swap'ından ve D-91/D-92'nin path-traversal
   sertleştirmesinden bağımsız, çok daha basit bir yazma/okuma/prune/list yüzeyi. K4'ün
   `ai-log.jsonl`'ı bu desene mi (sidecar, `.ppsx` dışı) yoksa SPEC'in lafzına mı (`.ppsx`
   içi) daha yakın durmalı — §2.2'nin kendi asıl sorusu.
8. `src-tauri/src/ppsx/archive.rs` — `write_ppsx`'in bütün-arşiv-yeniden-yazma modeli
   (D-56/D-64/D-67/D-77/D-91/D-92'nin hepsinin üstüne kurulu, sertleştirilmiş yazma yolu).
   `ai-log.jsonl` gerçekten `.ppsx`'in içinde yaşarsa, HER TEK AI isteği bu bütün-arşiv
   yeniden-yazmayı tetikler mi (SPEC'in lafzı bunu ima ediyor ama maliyeti/riski gerçek) —
   §2.2'nin kendi tasarım gerilimi.
9. `src/ai/structuredIpc.ts` — `completeStructured`'ın bugünkü imzası: `Promise<unknown>`,
   HİÇBİR metadata dönmüyor. `src/ai/completionIpc.ts` — `CompletionMeta`'nın TS yansıması
   (`conversationId`/`streamId`/`messageId`, token/cost YOK — P-53'ün kendi sınırı, streaming
   tarafında bu doğru kalacak). `src/ai/settingsIpc.ts` — `AiSettings` TS arayüzü, `getAiSettings`/
   `setAiSettings` IPC sarmalayıcıları.
10. `src/app/routes/workspace/entryProposal.ts` — `attemptStructuredProposal` (K1/K2/K3'ün
    HEPSİNİN üstüne kurduğu TEK ortak çağrı noktası: `EntryProposalField`,
    `layoutReview.ts`'in `proposeLayoutReviewDiff`'i, `mockAudit.ts`'in `proposeMockAuditFindings`'i
    doğrudan, `entryTranslation.ts`'in ikisi de). `completeStructured`'ın dönüş tipi
    değişirse bu TEK noktadan geçen HER ŞEY etkilenir — K4'ün kendi plumbing kararının
    (§2.1) gerçek yarıçapı budur, küçümsenmemeli.
11. `src/app/routes/settings/SettingsScreen.tsx` — D-201/D-205'in "küçük, açıkça geçici,
    kesik-çizgi-kenarlıklı debug bölümü" emsali (`meta.ai.enabled`, redaction modu için
    kullanılmıştı) VE `AiSettings`'in kendi kalıcı, gerçek bölümü (API key/model seçimi/test
    connection — geçici DEĞİL). Spend cap/running-total gösterimi hangisine daha yakın —
    §2.5'in kendi kararı, muhtemelen artık "geçici debug" değil çünkü SPEC'in kendi lafzı
    "gizli değil, aranmadan görünür" (`visible without hunting for them`) diyor.
12. `src/domain/model/projectModel.ts` — `AiMeta` (`enabled`/`providerId`/`modelId`/`redaction`,
    proje-bazlı). Spend cap/running total proje-bazlı mı (`AiMeta`'nın beşinci alanı) yoksa
    global mı (`AiSettings`'in dördüncü alanı) — SPEC'in "per-project ve per-month running
    totals" lafzı İKİSİNİ de istiyor gibi okunuyor (per-project → `.ppsx`'in kendi verisi,
    per-month → global bir toplam) — §2.3'ün kendi kararı.

---

## 2. Kapsam

### 2.1 Plumbing — token/cost verisi Rust'tan nereye, nasıl akar

`complete_structured`'ın bugünkü imzası (`provider.rs`) hiçbir metadata taşımıyor —
`Result<serde_json::Value, AiError>`. Token/cost verisini gerçekten kullanılabilir kılmak için
iki gerçek yol var:

- **(a) Rust, dönüş tipini genişletir.** `complete_structured` artık `Result<StructuredResponse,
  AiError>` gibi bir şey döner (`{ value: serde_json::Value, meta: StructuredCompletionMeta }`).
  Bu, `commands.rs` → `structuredIpc.ts` → **K1/K2/K3'ün ortak çağrı noktası olan
  `attemptStructuredProposal`** (§1 madde 10) → onun ÜSTÜNE kurulu HER yer (`proposeStructuredEntry`,
  `proposeLayoutReviewDiff`, `proposeMockAuditFindings`, `proposeEntryTranslation`,
  `proposeWholeReportTranslation`) boyunca gerçek bir tip değişikliği demek — geniş ama TEK
  bir noktadan (D-204'ün `Attempt` tipi) yönetilebilir, çünkü hepsi zaten o tek primitife
  bağlı.
- **(b) Rust, logu kendi başına yazar.** `VorionProvider::complete_structured` (ya da onu saran
  bir `commands.rs` katmanı) token/cost verisini OKUR ama TS'e HİÇ döndürmez — doğrudan
  `ai-log.jsonl`'a (§2.2) kendi başına yazar. TS, canlı bir per-call geri bildirim yerine ayrı
  bir `ai_get_cost_summary`-benzeri komutla (proje açıldığında / Settings ekranı görüldüğünde)
  BİRİKMİŞ toplamı okur. K1/K2/K3'ün bugün ÇALIŞAN hiçbir tipine dokunmadan inşa edilir.

**Önerilen: (b).** SPEC'in "live token estimate before send; actual usage and cost after, per
request" lafzı per-call bir UI geri bildirimi GEREKTİRİYOR gibi okunabilir ama bu, Apply/Accept
sonrası bir özet paneli okuyarak da (K1/K2/K3'ün panelleri zaten "sonuç geldi" anını gösteriyor)
karşılanabilir — Rust'ın zaten bildiği veriyi TS'e taşımak için beş ayrı, çalışan çağrı zincirini
değiştirmenin riski, kazanılan "anlık" geri bildirime değmiyor. Ama bu gerçek bir mimari karar —
`AskUserQuestion`'a değer, önerilen (b) ile.

### 2.2 `ai-log.jsonl`'ın gerçek yeri — `.ppsx` içi mi, sidecar mı

SPEC'in lafzı açık: "`ai-log.jsonl` inside the `.ppsx`." Ama `.ppsx` yazma modeli
(`write_ppsx`, `archive.rs`) BÜTÜN arşivi HER seferinde yeniden yazıyor — D-72'nin autosave'i
bile 5 saniyelik navigasyon-coalescing + tek-uçuşta-guard ile bu maliyeti kontrol ediyor. Her
TEK AI isteği (kullanıcı "Propose"/"Analyze"/"Translate" butonuna her bastığında) kendi başına
bir `.ppsx` yeniden-yazması tetiklerse, bu D-72'nin kendi disipliniyle ÇELİŞİR ve autosave'in
optimistic-concurrency compare-and-swap'ı (D-77, P-15/P-16'nın hâlâ açık TOCTOU/mtime-only
sınırlarıyla) ile de etkileşir.

- **(a) Gerçekten `.ppsx` içi.** SPEC'in lafzına birebir. Her `ai-log` yazımı `.ppsx`'i
  yeniden yazar (ya da mevcut bir `entries.push` + autosave'in bir sonraki normal döngüsüne
  bindirilir — bu ikinci alt-seçenek "her istekte hemen" değil "en yakın autosave'de" demek,
  SPEC'in "per request" lafzını gevşetir).
- **(b) `history.rs`'in kendi deseni gibi bir sidecar** (app-local-data-dir, proje-id'ye göre
  adreslenmiş, `.ppsx`'in kendi crash-safe/compare-and-swap makinesinden TAMAMEN bağımsız).
  SPEC'in "inside the `.ppsx`" lafzından SAPMA — ama D-74'ün kendi gerekçesi (history
  snapshot'ları da başta `.ppsx` içi düşünülüp sonra sidecar'a taşınmıştı, "manual rollback,
  not crash recovery" ayrımıyla) burada da geçerli: `ai-log.jsonl` da bir "denetim izi", proje
  dosyasının kendisinin bütünlüğünü etkilemeyen bir yardımcı veri.

**Önerilen: (b), D-74'ün emsaliyle aynı gerekçeyle** — ama bu SPEC'in kendi lafzından açık bir
sapma olduğu için `AskUserQuestion`'a değer, iki seçenek de somut maliyetleriyle sunularak.
Eğer (b) seçilirse, SPEC.md'nin §8.13 cümlesi ("An `ai-log.jsonl` inside the `.ppsx`...")
düzeltilmeli ve `DECISIONS.md`'ye bu sapmanın kendi gerekçesi yazılmalı — D-27/D-95 gibi
önceki "SPEC yanlıştı, düzeltildi" örnekleriyle aynı disiplin.

### 2.3 Running total'lar — proje-bazlı mı, global mı, ikisi de mi

SPEC: "Per-project and per-month running totals." Per-project toplam doğal olarak §2.2'nin
kendi log dosyasından (hangi konumda olursa olsun) toplanabilir — proje AÇIKKEN. Per-month
toplam ise BİRDEN FAZLA projeyi kapsıyor olabilir (Farplas'ta bir mühendis birden çok `.ppsx`
üzerinde çalışıyor olabilir) — bu, tek bir projenin log dosyasından hesaplanamaz, GLOBAL bir
biriktirici gerektirir (muhtemelen `AiSettings`'in yanında, `ai-settings.json`'a benzer ayrı bir
`ai-usage.json` ya da benzeri, app-local-data-dir'de). Bu ikinci parça §2.2'nin cevabından
BAĞIMSIZ bir karar — kendi `AskUserQuestion`'ını hak ediyor mu, yoksa bu dilimin ilk sürümü
yalnızca per-project'i mi kapsasın (per-month'u P-numarası olarak erteleyerek) — bütçe
gerginleşirse ilk düşürülecek parça burası olmalı (§4'ün kendi notu).

### 2.4 Spend cap — nerede kontrol edilir, neye çarpınca ne olur

SPEC: "Spend cap behaviour is explicit and configurable, and hitting it degrades to offline
mode rather than erroring." Cap muhtemelen `AiSettings`'in (ya da §2.3'ün ürettiği global
biriktiricinin) bir alanı (`spendCapUsd: Option<f64>`, `None` = sınırsız — mevcut
`default_model_id`/`fast_model_id`'nin `Option<String>` deseniyle tutarlı). Kontrol noktası
muhtemelen `commands.rs`'in `ai_complete_structured`'ı (ve varsa `ai_complete`) — gerçek bir
Vorion isteği göndermeden ÖNCE running total'ı okur, cap'i aşıyorsa yeni bir `AiError` varyantı
(`AiError::SpendCapExceeded` gibi) döner. **"Offline moda düşer" ne demek burada** — SPEC'in
literal "offline mode"u proje genelinde `meta.ai.enabled`'ı kapatmak mı (çok agresif, kullanıcının
kendi seçimini ezer) yoksa yalnızca "bir sonraki AI çağrısı bu net hatayla reddedilir, kullanıcı
manuel olarak devam eder/cap'i yükseltir" mi — muhtemelen ikincisi (§8.14'ün "None of them may
lose user data" ilkesiyle daha tutarlı: sert bir global kapanma yerine, her çağrı noktasının
zaten sahip olduğu error-gösterme UI'ını kullanmak). `AskUserQuestion`'a değer.

### 2.5 Settings UI — nerede, geçici mi kalıcı mı

`SettingsScreen.tsx`'in bugünkü iki hâli var: `AiSettings`'in kendi KALICI bölümü (API key,
model seçimi, test connection) ve D-201/D-205'in AÇIKÇA GEÇİCİ debug bölümleri
(`meta.ai.enabled`, redaction). Spend cap/running-total gösterimi hangisine daha yakın —
**önerilen: kalıcı** (SPEC'in kendi "visible without hunting for them" lafzı bunu istiyor, ve
spend cap `AiSettings`'in gerçek, sürekli kullanılacak bir alanı olacak, D-201'in "gerçek
New-Project-AI-adımı henüz yok" gerekçesiyle aynı geçicilik sınıfında değil). P-53'ün kendi
notu burada UYGULANMALI: gösterilen toplamın yalnızca `complete_structured` trafiğini
kapsadığı (Assistant'ın serbest sohbeti HARİÇ) küçük bir açıklama metniyle AÇIKÇA belirtilmeli
— sessizce eksik bırakılmamalı.

### 2.6 Done-koşulu

- `complete_structured`'ın gerçek bir çağrısı, gerçek (test'te sahte/mock) bir token/cost
  yanıtından bir `ai-log` kaydı üretiyor — timestamp/provider/model/promptVersion/token
  counts/cost/accepted-or-rejected alanlarıyla.
- Bu kayıtlar kalıcı: proje kapanıp açılınca (ya da uygulama yeniden başlayınca) running
  total'lar sıfırlanmıyor.
- Settings'te bir spend cap girilebiliyor; cap aşılınca yeni bir `complete_structured` çağrısı
  AÇIK bir hata ile reddediliyor (sessizce başarısız olmuyor, mevcut veriyi bozmuyor).
  `AssistantPanel`'in serbest sohbeti bu cap'in KAPSAMI DIŞINDA kalıyor — P-53'ün kendi sınırı,
  Settings UI'ında açıkça belirtiliyor.
- Prompt/response gövdeleri VARSAYILAN OLARAK loglanmıyor (§8.13) — yalnızca metadata. Tam-gövde
  loglama AÇIK bir uyarılı ayrı bir ayarla açılabiliyor (bu ayar bu dilimde inşa edilmezse,
  kendi P-numarasıyla ertelenir, sessizce atlanmaz).
- `npm test`/`cargo test` yeşil, exit code ayrı kontrol edilir (D-143'ün dersi), lint/build/
  clippy/fmt hepsi temiz.
- Gerçek Vorion round-trip'i yine "dürüstçe doğrulanmamış, Barış'ın kendi `npm run tauri dev`
  turu owed" kategorisinde kalabilir (bu ortamda ekran/Tauri çalışma zamanı yok — D-105/
  D-113/D-136/D-200/D-201/D-204/D-213/D-214/D-215/D-216'nın aynı sınıf deseni).

---

## 3. Kapsam dışı

- **K1/K2/K3** — zaten BİTTİ, bu dilim yalnızca §2.1'in işaret ettiği tek ortak çağrı noktasına
  (`attemptStructuredProposal`, eğer (a) seçilirse) dokunur, K1/K2/K3'ün kendi davranışını
  DEĞİŞTİRMEZ.
- **Gerçek bir tokenizer/kesin token sayımı.** "Live token estimate before send" muhtemelen
  KABA bir karakter-tabanlı yaklaşıklama (K1/K2/K3'ün context-bütçeleme kodunun zaten kullandığı
  "generous character budget, not a token count" dili) — gerçek bir tokenizer kütüphanesi
  (tiktoken-benzeri) İNŞA EDİLMEZ, bu fazın kapsamı dışı.
- **Prompt/response tam-gövde loglama UI'ı**, gerçekten inşa edilirse bile, kendi güvenlik
  incelemesini hak eder (redaction'ın korumaya çalıştığı TAM VERİYİ diske yazmak) — bu dilimde
  yalnızca AÇIK bir uyarıyla sunulur, derinlemesine bir güvenlik turu bu dilimin işi değil.
- `RedactionPolicySchema`'nın `customers-and-parts`/`custom` modları (P-54) — dokunulmaz.
- Vorion'un Agent/RAG/Marketplace/Custom Assistants yüzeyi — D-199'un LOCKED sınırı.
- SPEC §8.2'nin taslak `cost_per_mtok`/`max_context`/`caching` `Capabilities` alanları — yalnızca
  gerçekten bir çağıran ihtiyaç duyarsa eklenir (D-204'ün "kullanılmayan alan bir iddiadır"
  disiplini).

---

## 4. Bütçe ve kapanış disiplini

Bu dilim K1 kadar (belki daha) büyük olabilir — D-213'ün kendi bulgusu zaten "K1-K4'ün DÖRDÜ de
gerçekten yeni mekanizma" diyordu, ve K4'ün üç ayrı gerçek mimari kararı (§2.1 plumbing, §2.2
log yeri, §2.4 spend cap) hepsi birbirine bağlı. Eğer §2.1/§2.2'nin ikisi de beklenenden karmaşık
çıkarsa, bu dilim ikiye bölünmeyi düşünmeli (K4a: token/cost okuma + kalıcı log, hiçbir spend
cap/UI olmadan; K4b: spend cap enforcement + Settings UI) — §2.3'ün per-month toplamı da, bütçe
gerginleşirse, ilk düşürülecek/ertelenecek parça olmalı, kendi P-numarasıyla.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (D-217), `docs/oturumlar/README.md`'nin K4
satırı güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir. **Faz 10'un kendi dört
dilimlik planı bu dilimle TAMAMEN kapanır** — `SPEC.md` §6'nın bir sonraki fazının (Faz 11'in
kendi kapsam-belirleme oturumu, D-157'nin işaret ettiği Rev00-tabanlı 8-step template'in
inşası) kendi launch prompt'u bu oturumun kapanışında yazılabilir.

---

**Model önerisi:** §2.1 (plumbing), §2.2 (log yeri) ve §2.4 (spend cap enforcement) gerçek
mimari kararlar, D-28'in routing mantığına göre Opus değerlendirilebilir. §2.5'in Settings
UI'ı ve mekanik token/cost okuma kodunun kendisi K1-K3'ün kurduğu desenin devamı, Sonnet 5
yeterli kalır.
