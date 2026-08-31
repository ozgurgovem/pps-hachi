# OTURUM Faz 9 — J1: Vorion yapılandırılmış çıktı + Pareto referans önerisi

> Faz 9'un kendi kapsam belirleme oturumu (D-203, 2026-08-31) BİTTİ. Dört açık tasarım
> sorusu `AskUserQuestion` ile Barış'a soruldu, dördü de önerilen seçenekle onaylandı — bu
> dosya o kararların **birinci** dilimini uygular. Faz 9'un kendi üç dilimlik planı (tam
> kayıt `DECISIONS.md` D-203, `docs/oturumlar/README.md`'nin Faz 9 tablosu):
>
> - **J1 (bu dosya)** — Vorion'un yapılandırılmış-çıktı şeklinin doğrulanması +
>   `LlmProvider.complete_structured`/`capabilities()` + prompt-kütüphanesi mekanizması +
>   TEK referans method (Pareto) elle-girilen veriyle uçtan uca `EntryProposalField`
>   üzerinden.
> - **J2** — gerçek dosya içeri alma (xlsx/csv okuma+örnekleme, `calamine` ilk kez
>   üretimde) + temel gerçek redaction, J1'in akışına bağlanır. Faz 9'un kendi lafzî
>   done-koşulunu ("propose a valid Pareto entry from an uploaded xlsx") kapatan dilim
>   budur — **bu dosyanın DEĞİL**, J1 elle-girilen veriyle çalışır, dosya YOK.
> - **J3** — prompt kütüphanesinin Pareto'dan registry'nin geri kalan 57 method'una
>   genelleştirilmesi.
>
> Kanonik konum: `docs/oturumlar/J1-pareto-yapilandirilmis-oneri.md`. Yazıldı: 2026-08-31,
> D-203'ün kapanışının hemen ardından, Barış'ın isteğiyle ("sıradaki adım için yeni
> oturumda kullanmak üzere prompt paylaşır mısın").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/faz9-kapsam-belirleme.md \
      src-tauri/src/ai/provider.rs \
      src-tauri/src/ai/vorion.rs \
      src-tauri/src/ai/error.rs \
      src/methods/types.ts \
      src/methods/registry.ts \
      src/methods/pareto/schema.ts \
      src/app/routes/workspace/EntryReferenceField.tsx \
      src/app/routes/workspace/EntryEditorDialog.tsx \
      src/app/routes/workspace/AssistantPanel.tsx \
      src/ai/completionIpc.ts \
      src/domain/model/provenance.ts \
      src/ai/prompts/.gitkeep
```

**`src/ai/prompts/.gitkeep` YOK olması bekleniyor** — bu dilimin kendi kuracağı yeni dizin,
listede yalnızca "henüz yok, ben kuracağım" diye doğrulanması için. Diğer tüm dosyalar
2026-08-31'de var olmalı; eksik/adı değişmiş bir tane varsa **DUR ve Barış'a söyle**.

Ayrıca şunu da doğrula — kendi taramamdan (D-203):

```bash
grep -n "schema: ZodType" src/methods/types.ts   # VAR bekleniyor — her method zaten Zod şeması taşıyor
grep -n "complete_structured\|capabilities" src-tauri/src/ai/provider.rs   # BOŞ bekleniyor
grep -rn "calamine" src-tauri/src --include="*.rs"   # yalnızca tests/xlsx.rs'te bekleniyor, üretimde YOK
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-203** (bu fazın kapsam belirlemesi — dört sorunun tam gerekçesi),
   **D-199/D-200/D-201** (Vorion'un doğrulanmış gerçek API şekli — Synchronous/Streaming
   Prediction, `x-api-key`, multipart `data` alanı; yapılandırılmış çıktının kendisi HİÇ
   görülmedi, bu dilimin §2.1'i), **D-125** (generic-shell deseni —
   `EntryReferenceField`/`EntryImagesField`/`EntryRoundField`, `EntryProposalField`'ın
   dördüncü uygulaması), **D-15/D-16/D-18** (assistant proposes/human accepts,
   critique-before-draft, provenance zorunluluğu — LOCKED, bu dilimde de tam uygulanır),
   **P-47** (`editDistance` hesaplanmıyor — bu dilimin gerçek Accept/Edit&Accept/Reject
   akışı bunu doğal olarak gerektirebilir, §2.6).
3. `SPEC.md` §8.2 (`complete_structured`/`capabilities()` taslağı), §8.6 (dört mod —
   bu dilim yalnızca **Draft**'ı hedefliyor, Critique/Extract/Review kapsam dışı, §3), §8.7
   (structured output contract — prompt versiyonlama, Zod→JSON Schema, doğrulama+tek retry),
   §8.13 (Provenance/`editDistance`), §8.14 (hata modları — şema doğrulama başarısızlığı,
   ikinci denemede de başarısızsa ham yanıtı metin olarak göster, HİÇBİR ŞEY YAZMA).
4. `src/methods/types.ts` — `MethodPlugin<TPayload>`'ın `schema: ZodType<TPayload>` alanı
   zaten var (D-203'ün kendi bulgusu) — bu dilim SPEC §8.7'nin "her method zaten bir Zod
   şeması taşıyor" cümlesini doğrudan kullanır, yeni bir şema mekanizması icat ETMEZ.
   `src/methods/pareto/schema.ts` — referans method'un gerçek, basit şekli:
   `{unit: string, categories: [{id, label, count}]}`.
5. `src/app/routes/workspace/EntryReferenceField.tsx` — D-125'in generic-shell deseninin
   somut örneği: `MethodPlugin`'de deklaratif bir alan (`referenceRoles`), component
   `EntryEditorDialog`'da başlık alanının yanında render ediliyor, kendi IPC/state
   mantığını taşıyor, method'un `Editor`'ı bunun varlığından habersiz. `EntryProposalField`
   aynı deseni (dördüncü kez) uygulayacak.
6. `src-tauri/src/ai/vorion.rs` + `provider.rs` — Dilim 1/2'nin gerçek kodu, `complete()`'in
   SSE ayrıştırma şekli (`drain_sse_events`) ve `test_connection`'ın multipart `data`
   şekli. `complete_structured` muhtemelen benzer bir gövde kullanacak ama **bu tahmindir**.
7. **`vorionai.com/docs` — Barış'ın kendi yetkili tarayıcı oturumunda.** Bu dilimin
   **birinci ve en kritik** doğrulama yükü: D-199'un bilerek çözülmemiş bıraktığı soru —
   yapılandırılmış çıktı (1) Prediction ailesinin `data` gövdesinde bir
   `response_format`/`schema` parametresi mi, (2) tamamen ayrı bir endpoint mi, yoksa
   (3) hiç yok, yalnızca prompt mühendisliğiyle mi elde edilecek. D-200/D-201'in aynı
   disiplini: ekran görüntüsü, asla tahmin. §2.1 bunu kodlamadan önce netleştirmeden hiçbir
   Rust kodu yazılmaz.

---

## 2. Kapsam

### 2.1 Açık soru — KODLAMADAN ÖNCE Vorion'un gerçek şekli doğrulanmalı

D-199'un kendi bıraktığı soru, D-203'ün kendi bilerek bu oturuma bıraktığı iş: Vorion'un
Prediction ailesi bugüne kadar görülen şekliyle yalnızca `prompt.text` + `llm_name` +
opsiyonel alanlar alıyor — yapılandırılmış çıktı hiç görülmedi. Barış'ın ekran görüntüsü
(veya "Try It" denemesi) olmadan bu dilimin Rust tarafı yazılamaz. Üç gerçek olasılık:

- **(a)** Ayrı bir alan var (`response_format`/`json_schema` gibi) ama D-199/200/201'in
  taramaları LLM Configuration/Predictions dışında bir alt menüyü hiç kapsamadı.
- **(b)** Hiç yok — yapılandırılmış çıktı yalnızca prompt mühendisliğiyle (modele "yalnızca
  şu JSON şemasına uyan bir yanıt ver" denip yanıt `serde_json`+Zod-türetilmiş şemayla
  ayrıştırılıp doğrulanarak) elde edilir. Bu durumda `complete_structured` Rust tarafında
  aslında `complete()`'i (var olan, streaming olmayan bir Synchronous çağrıyla) sarmalayan
  ince bir katman olur — **muhtemel** ama doğrulanmadan varsayılmaz.
- **(c)** Üçüncü bir olasılık doğrulama sırasında ortaya çıkabilir — bu oturumun kendi
  bulgusu, önceden tahmin edilmez.

Sonuç ne olursa olsun `capabilities()`'in `json_schema: bool` alanı bu bulguyu yansıtır.

### 2.2 Rust — `LlmProvider` trait'ine `complete_structured`/`capabilities()`

`provider.rs`'e SPEC §8.2'nin taslağına yakın (§2.1'in gerçek bulgusuna göre uyarlanmış):

```rust
async fn complete_structured(&self, req: StructuredRequest) -> Result<serde_json::Value, AiError>;
fn capabilities(&self) -> Capabilities;
```

`VorionProvider` implement eder. `StructuredRequest` en azından `prompt: String`,
`schema: serde_json::Value` (JSON Schema), `model_id: String` taşır. Yanıt ham
`serde_json::Value` olarak döner — Zod doğrulaması TS tarafında yapılır (§2.5), Rust şema
anlamını hiç bilmez, yalnızca taşır (D-04'ün "dumb serializer" ilkesinin bu katmandaki
karşılığı).

### 2.3 Prompt kütüphanesi mekanizması

D-203'ün kararı: `src/ai/prompts/{step}/{methodId}.{version}.md`, front-matter'da `mode`
(bu dilim yalnızca `draft`), gerekli context slice'ları, çıktı şema referansı —
`src/content/coaching/{tr,en}/step-N.md`'nin (Faz 3) "içerik dosyada yaşar" deseninin
aynısı, JSX'e/koda gömülü string literal DEĞİL. `promptVersion` gerçek bir dosya
adı/sürüm dizesi olur (örn. `"pareto.v1"`), `Provenance.model.promptVersion`'a doğrudan
yazılır — D-201'in `"bare-chat-v1"` geçici sabitinin yerini gerçek bir mekanizma alır (yalnızca
Pareto için; `AssistantPanel`'in kendi serbest sohbeti dokunulmaz, hâlâ `"bare-chat-v1"`
kullanabilir).

Bu dilim yalnızca **Pareto**'nun kendi prompt dosyasını yazar (J3'ün genelleştirme işi
kapsam dışı, §3). Prompt dosyasının front-matter şeması ve okuma mekanizması (muhtemelen
Rust'ta derleme zamanında `include_str!` mi, yoksa çalışma zamanında dosya sisteminden mi
okunacağı — Tauri'nin resource bundling'i düşünülerek) bu dilimin kendi tasarım kararı.

### 2.4 `EntryProposalField` — yeni generic-shell alanı

D-125'in dördüncü uygulaması (D-203'ün Soru 4 kararı): `MethodPlugin` yeni bir opsiyonel
alan taşır (örn. `aiProposal?: { promptFile: string }` veya benzeri — kesin şekil bu
oturumun kararı, `referenceRoles`/`imageSlots`'ın "declare, don't render" deseni
korunmalı). `EntryEditorDialog`'da başlık alanının yanında yeni bir "AI ile öner"
tetikleyicisi — yalnızca bu alanı deklare eden method'larda görünür (bu dilimde yalnızca
Pareto). Tetiklendiğinde:

1. Method'un şeması `z.toJSONSchema()` ile JSON Schema'ya çevrilir — **Zod 4.4.3 zaten
   projede** (`package.json`), native `toJSONSchema` desteği olabilir, üçüncü parti bir
   paket (`zod-to-json-schema` vb.) eklemeden önce **güncel Zod dokümantasyonuna karşı
   doğrulanmalı** (CLAUDE.md'nin "kütüphane API'lerini hafızadan kodlama" kuralı burada da
   geçerli).
2. Kullanıcı elle veri girer/yapıştırır (dosya YOK, bu J2'nin işi) — nasıl bir arayüz
   (serbest metin kutusu mu, Pareto'nun kendi kategori listesine benzer bir mini-form mu)
   bu oturumun kararı.
3. `complete_structured` çağrılır, dönen `serde_json::Value` Pareto'nun Zod şemasına karşı
   doğrulanır.
4. Başarısızlıkta: doğrulama hatalarıyla birlikte **tek** retry (§8.7); ikinci
   başarısızlıkta ham yanıt kullanıcıya metin olarak gösterilir, **hiçbir şey yazılmaz**
   (§8.14).
5. Başarıda: taslak payload bir önizleme olarak render edilir (Pareto'nun kendi `Editor`'ı
   yeniden kullanılabilir mi, yoksa salt-okunur bir özet mi — bu oturumun kararı), gerçek
   **Accept / Edit & Accept / Reject** üçlüsü (D-15'in LOCKED kuralı, D-201'in basitleştirdiği
   tekli-textarea deseni DEĞİL — burası şemaya bağlı yapılandırılmış veri, serbest metin
   değil).
6. Accept → `buildAddEntryCommand` (veya güncelleniyor bir entry'yse `buildUpdateEntryCommand`)
   gerçek bir `Provenance` ile çağrılır: `origin: "ai-accepted"` (düzenlenmediyse) veya
   `"ai-edited"` (düzenlendiyse), `model.{providerId: "vorion", modelId, promptVersion}`,
   `generatedAt`, `acceptedBy` (proje sahibinin adı, D-201'in emsali).

`AssistantPanel`'in mevcut serbest-metin sohbeti bu dilimde **dokunulmaz** — paralel kalır,
D-203'ün Soru 4 kararının gereği.

### 2.5 Zod doğrulama + retry

§8.7: "Validate the response against the Zod schema on return. On failure, retry once with
the validation errors appended; on second failure, surface the raw response to the user as
text and do not write anything." Bu dilimin kendi TDD hedefi — hem başarı hem iki-kez-
başarısızlık yollarının testleri.

### 2.6 `editDistance` (P-47) — doğal kapanma fırsatı, kontrol et

Gerçek bir Edit&Accept ayrımı bu dilimde ilk kez var oluyor (D-201'in basit booleanının
yerine). `Provenance.editDistance` (`0..1 optional`) zaten şemada duruyor, hiç
hesaplanmıyor. Bu dilim normalize edilmiş bir string-mesafe (Levenshtein benzeri) hesaplayıp
dolduruyor mu, yoksa P-47'yi yine mi açık bırakıyor — **bu oturumun kendi kararı**, ama
şemaya bağlı taslağın hangi alanları değiştiğini (tüm payload'ın JSON-serialize edilmiş hali
üzerinden mi, yoksa alan alan mı) düşünmeden "kolayca kapatılabilir" varsayılmasın; küçük ve
kendi içinde tamam ise kapatılsın, değilse P-47 gerekçesiyle birlikte açık kalsın.

### 2.7 Done-koşulu

- Barış'ın vorionai.com/docs doğrulaması tamamlandı, `complete_structured`'ın gerçek şekli
  (§2.1'in üç olasılığından biri) kayda geçti.
- Pareto method kartında yeni bir "AI ile öner" tetikleyicisi var, elle girilen bir veriyle
  gerçek bir Vorion çağrısı yapıyor, dönen yanıt Pareto'nun Zod şemasına karşı doğrulanıyor.
- Accept / Edit & Accept / Reject üçlüsü gerçek, Accept sadece kullanıcı onayıyla
  `ProjectModel`'e yazıyor — hiçbir otomatik yazma yolu yok (D-15).
- Yazılan entry gerçek bir `Provenance` taşıyor (model, promptVersion, generatedAt,
  acceptedBy, mümkünse editDistance).
- `npm test`/`cargo test` yeşil, exit code ayrı kontrol edilir (D-143'ün dersi — asla
  `tail`'e pipe'lanmaz), `npm run lint`/`npm run build`, `cargo clippy --all-targets -- -D
  warnings`/`cargo fmt -- --check` hepsi temiz.
- Anahtar sızıntısı testi (D-200'ün emsali) bu dilimin yeni IPC yüzeyi için de geçerli
  kalıyor mu diye tekrar doğrulanır — `complete_structured` de Rust'ta anahtarı okuyor,
  TS'e hiç geçirmiyor olmalı.

---

## 3. Kapsam dışı

- **J2** — gerçek dosya içeri alma (§8.9, xlsx/csv okuma+örnekleme), gerçek redaction
  (§8.11). Bu dilim elle-girilen veriyle çalışır.
- **J3** — prompt kütüphanesinin Pareto ötesindeki 56 method'a genelleştirilmesi.
- §8.6'nın Critique/Extract/Review modları — yalnızca Draft.
- §8.10 (A3 yerleştirme optimizeri), §8.12 (maliyet sayacı) — Faz 10.
- P-48 (Resume Stream), P-49 (E2E mock doğrulaması) — dokunulmaz, yalnızca not düşülür.
- Vorion'un Agent/RAG/Marketplace/Custom Assistants yüzeyi — D-199'un LOCKED sınırı,
  yapılandırılmış çıktı da yalnızca LLM Service'in Prediction ailesinden istenir.
- §8.5'in gerçek New Project AI adımı — hâlâ D-201'in geçici debug anahtarı üzerinden
  test edilir, bu dilim onu değiştirmez (dokunulursa gerekçesiyle not düşülsün).

---

## 4. Bütçe ve kapanış disiplini

§2.1'in kendi doküman-doğrulama adımı, Rust/TS kodu yazılmadan önce tamamlanmalı — Faz
8'in her iki dilimindeki aynı ders (Vorion'un gerçek şekli tahmin edilemez) burada daha da
katmanlı: hem yapılandırılmış-çıktının kendi şekli hem de Zod→JSON Schema dönüşümünün
Vorion'un beklediği formatla (JSON Schema draft sürümü, `$schema` alanı vb.) uyumlu olup
olmadığı doğrulanmalı. Bu, Faz 9'un ilk "yeni alt sistem" dilimi (dört gerçek yeni parça:
`complete_structured`, prompt-kütüphanesi dosya mekanizması, `EntryProposalField`,
gerçek Accept/Edit&Accept/Reject) — D-114'ün "dilim başına bir mekanizma" bütçesi gergin,
eğer §2.1'in doğrulaması beklenenden karmaşık çıkarsa (örn. gerçekten ayrı bir endpoint,
kendi auth/rate-limit davranışıyla) bu dilim ikiye bölünmeyi düşünmeli — tek oturumda
bitirmeye zorlanmasın.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin J1 satırı
güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir. P-47 kapandıysa/kapanmadıysa
açıkça kaydedilir. J2'nin kendi launch prompt'u bu oturumun kapanışında veya bağımsız
olarak yazılabilir.

---

**Model önerisi:** Vorion'un yapılandırılmış-çıktı şeklinin doğrulanması (§2.1) ve
`EntryProposalField`'ın Accept/Edit&Accept/Reject tasarımı gerçek mimari kararlar —
D-28'in routing mantığına göre Opus değerlendirilebilir, özellikle §2.1'in sonucu
"(a) ayrı endpoint" çıkarsa. Sonuç "(b) yalnızca prompt mühendisliği" ise Sonnet 5 yeterli
kalır — trait genişletmesi Dilim 1/2'de kurulan desenin devamı olur.
