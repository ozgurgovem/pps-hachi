# OTURUM Faz 9 — J2: Gerçek dosya içeri alma + temel redaction

> J1 (Vorion yapılandırılmış çıktı + Pareto referans önerisi) BİTTİ (D-204, 2026-08-31).
> `EntryProposalField` gerçek, elle-girilen veriyle uçtan uca çalışıyor; `LlmProvider.
> complete_structured`/`capabilities()` gerçek; prompt kütüphanesi mekanizması gerçek.
> **Bu dosya D-203'ün üç dilimlik planının ikincisini uygular.** Faz 9'un kendi lafzî
> done-koşulu ("propose a valid Pareto entry from an uploaded xlsx") J1'de DEĞİL, bu dilimde
> kapanır — J1 yalnızca elle-girilen veriyle çalışıyordu, dosya hiç yoktu.
>
> Kanonik konum: `docs/oturumlar/J2-dosya-iceri-alma-redaction.md`. Yazıldı: 2026-09-01,
> Barış'ın isteğiyle ("yeni oturum için prompt paylaşır mısın").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/J1-pareto-yapilandirilmis-oneri.md \
      src-tauri/Cargo.toml \
      src-tauri/src/images/mod.rs \
      src-tauri/src/images/ingest.rs \
      src-tauri/src/ai/settings.rs \
      src/domain/model/projectModel.ts \
      src/app/routes/workspace/EntryProposalField.tsx \
      src/app/routes/workspace/entryProposal.ts \
      src/ai/structuredIpc.ts \
      src/ai/prompts/2/pareto.v1.md \
      src/app/routes/workspace/EntryImagesField.tsx
```

Hepsi 2026-09-01'de var olmalı; eksik/adı değişmiş bir tane varsa **DUR ve Barış'a söyle**.

Ayrıca şunu da doğrula — J1'in kendi kapanış oturumunun tarayıp bulduğu gerçekler hâlâ geçerli mi:

```bash
grep -n "RedactionPolicySchema = z.looseObject({})" src/domain/model/projectModel.ts   # VAR bekleniyor
grep -n "calamine" src-tauri/Cargo.toml                                                # 0.36.1 bekleniyor
grep -rln "calamine" src-tauri/src --include="*.rs"                                    # BOŞ bekleniyor — yalnızca tests/xlsx.rs'te
cat src-tauri/src/ingest/mod.rs                                                        # BOŞ bekleniyor (yalnızca .gitkeep var, mod.rs bile yok)
grep -n "aiProposal" src/methods/pareto/index.ts                                       # VAR bekleniyor — {promptVersion: "v1"}
```

**Gerçek, bu oturumun kendi taramasından bulunan bir fayda:** `src-tauri/src/ingest/`
Faz 0'dan beri (2026-08-02) boş bir iskelet dizin olarak duruyor — `.gitkeep` dışında hiçbir
şeyi yok, `lib.rs`'te `mod ingest;` bile YOK. Bu dilim muhtemelen bu dizini gerçek bir modülle
doldurup kullanacak ilk dilim; yeni bir dizin açmadan önce bunu kontrol et.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-203** (Faz 9'un kendi kapsam belirlemesi — J1/J2/J3 üç dilimlik planın
   tam gerekçesi, J2'nin "önce ingestion, redaction'la BİRLİKTE" kararının kaynağı), **D-204**
   (J1'in kapanışı — `EntryProposalField`'ın gerçek şekli, `complete_structured`'ın Synchronous
   Prediction üzerine kurulu olduğu, prompt kütüphanesi mekanizması), **D-118/D-193** (6e-1'in
   image ingestion deseni — `image_import` komutu, Rust dosyayı kendi okuyor, ham bayt hiç
   TS'e geçmiyor; J2'nin dosya-okuma yarısı bunun BENZERİ ama **aynısı DEĞİL**, bkz. §2.1'in
   kendi uyarısı), **P-50** (prompt front-matter'ının `contextSlices` alanı hâlâ tüketilmiyor —
   J2 bunu doğal olarak kapatabilir mi, kontrol et, kapatmıyorsa neden açık kaldığı not
   düşülsün).
3. `SPEC.md` §8.9 (Reading files, images and tables — bu dilimin ana kapsamı, yalnızca
   xlsx/csv yarısı), §8.11 (Trust boundary and redaction — `RedactionPolicy` tipinin kendi
   taslağı: `mode`/`terms`/`preserveNumbers`), §8.4 (Settings → AI providers'ın "Attachment
   policy" alt bölümü — bu dilimin kapsamı DIŞINDA, §3'e bak, ama redaction policy'nin nihai
   yuvası burası), §8.1 (LOCKED ilkeler — özellikle "kullanıcının verisi kullanıcınındır" ve
   "hiçbir şey onay olmadan gönderilmez").
4. `src-tauri/src/images/` (6e-1, D-118/D-193): `ingest.rs`'in EXIF-strip + downscale +
   re-encode deseni, `error.rs`'in kendi `ImageIngestError` şekli. J2'nin kendi
   xlsx-okuma-hata tipi muhtemelen benzer bir şekilde küçük tutulmalı (yalnızca gerçek bir
   çağıranın kurduğu variant'lar — `AiError`'ın kendi disiplini, D-200).
5. `src/app/routes/workspace/EntryProposalField.tsx` + `entryProposal.ts` (J1, D-204):
   şu an yalnızca bir `Textarea`'ya elle yapıştırılan ham metinle çalışıyor. Bu dilimin işi
   buraya bir dosya-yükleme yolu eklemek — **metni tamamen değiştirmek değil**, SPEC §8.9'un
   kendi metni de dosya İÇERİĞİNİ nihayetinde bir "compact structured representation"a
   çeviriyor, ki bu da sonunda modele giden PROMPT METNİNİN bir parçası oluyor; mimari olarak
   dosyadan gelen özet ile elle yapıştırılan metin aynı `userInput` yuvasına akabilir.
6. `src/domain/model/projectModel.ts`'in `RedactionPolicySchema`/`AiMetaSchema.redaction`'ı —
   şu an `z.looseObject({})`, SPEC §8.11'in taslağına göre gerçek alanlar kazanacak.

---

## 2. Kapsam

D-203'ün kendi kararı: **yalnızca xlsx/csv** (SPEC §8.9'un pdf/docx/pptx/image-ingestion
yarısı DEĞİL — Faz 9'un lafzî done-koşulu zaten "uploaded xlsx" diyor, kapsamı orada tut).

### 2.1 Rust — gerçek dosya okuma + örnekleme (bu dilimin birinci yeni mekanizması)

`calamine`'i ilk kez ÜRETİM koduna bağla (bugüne kadar yalnızca `tests/xlsx.rs`'in kendi
round-trip okuması içindi — Phase 4'ün kendi yazdığı dosyayı geri okuyordu, **bilinen, kontrol
edilmiş bir şema**; J2'nin okuduğu dosya KULLANICININ KENDİ dosyası, şekli önceden hiç
bilinmiyor — farklı, daha geniş bir problem).

**calamine'in gerçek güncel API'sine karşı doğrulanmadan kod yazma** (CLAUDE.md'nin kendi
kütüphane-API'lerini-hafızadan-kodlama yasağı) — `Cargo.toml`'daki `0.36.1` hâlâ güncel mi,
`Reader` trait'inin sayfa/hücre-tipi introspeksiyonu (başlık satırı, sütun veri tipleri) gerçek
dokümantasyonda nasıl görünüyor, kontrol et.

**Rust dosyayı kendi okur** — D-118'in image ingestion'daki "ham bayt hiç TS'e geçmez"
ilkesinin aynısı, ama akış FARKLI: `image_import` sonunda dosyayı `.ppsx`'e YAZIYOR (kalıcı bir
asset); bir spreadsheet'in HAM İÇERİĞİ kalıcı olarak saklanmaz — yalnızca modele gidecek özet
saklanır (ki o da SPEC §8.13'ün kendi kuralına göre `ai-log.jsonl`'a bile gövde olarak
yazılmıyor, yalnızca metadata). Yani J2'nin yeni Rust komutu muhtemelen `image_import`'un
`write_ppsx`/`expected_modified_ms` eşzamanlılık makinesini HİÇ ihtiyaç duymuyor — daha basit:
dosya yolu al, oku, örnekle, özet JSON döndür, bitir.

**Bu oturumun kendi kararı olması gereken somut sorular** (kodlamadan önce netleştir, gerekirse
Barış'a `AskUserQuestion`):
- Örnekleme stratejisi: SPEC "schema + statistics + a stratified sample, not 50,000 rows"
  diyor ama tam algoritma değil — ilk N satır mı, rastgele N mi, gerçekten stratified (her
  benzersiz kategori/sütun değerinden en az bir örnek) mi? Pareto'nun kendi şekli
  (`{unit, categories: [{label, count}]}`) düşünülürse, muhtemelen "her ayrı kategori
  değerinden bir satır + toplam sayı" en doğal cevap — ama bu J2'nin kendi kararı.
- Satır/bayt tavanı: sabit bir sayı mı (D-118/D-193'ün "2400px/JPEG-85" gibi sabit-sayı
  emsali), yoksa Settings'te ayarlanabilir mi? D-118'in kendi emsali bu dilim için de
  önerilir — YAGNI, ayarlanabilir bir Attachment Policy §8.4'ün kendi kapsamı, §3'e bak.
- Hata sınıfları: bozuk/parolalı/desteklenmeyen-format bir xlsx, boş bir sayfa, başlıksız bir
  tablo — her biri için ayrı bir `XlsxIngestError` variant'ı mı, yoksa tek bir genel hata mı
  (D-200'ün "yalnızca gerçek bir çağıranın kurduğu variant" disiplinini unutma).

### 2.2 Redaction — temel gerçek bir `RedactionPolicySchema` (D-203'ün ikinci parçası)

SPEC §8.11'in taslağı:
```ts
type RedactionPolicy = {
  mode: 'off' | 'customers' | 'customers-and-parts' | 'custom'
  terms: string[]
  preserveNumbers: true
}
```

D-203'ün kararı: bu J2 ile BİRLİKTE gelir, ertelenmez — J2'nin gerçek üretim tablo içeriğini
Vorion'a göndermeye başladığı an, §8.1'in LOCKED "kullanıcının verisi kullanıcınındır" ilkesi
teorik olmaktan çıkar.

**Açık soru, bu oturumun kararı**: redaction NEREDE uygulanır — Rust'ta örnekleme sırasında
(SPEC §8.11'in kendi cümlesi: "Redaction runs on the Rust side, after ingestion, before
transmission" — bu Rust'ı işaret ediyor), yoksa TS'te `EntryProposalField`'ın prompt'u
oluşturduğu yerde mi? SPEC'in kendi metni Rust'ı işaret ediyor gibi görünse de, "session-scoped
token map"in (redaction'ın tersine çevrilebilir tarafı — yanıt geldiğinde "Müşteri A" gerçek
adla geri değiştiriliyor) TS tarafında mı Rust tarafında mı yaşayacağı ayrı bir karar.
**Minimal, gerçek bir ilk sürüm** öneriliyor: `mode: "off" | "customers"`, `terms: string[]`
(kullanıcının elle girdiği bir liste), `preserveNumbers: true` sabit — `"customers-and-parts"`/
`"custom"` modları SPEC'te var ama bu dilimin kendi "temel gerçek" hedefini aşabilir, kapsam
dışına düşürülüp düşürülmeyeceği bu oturumun kararı.

Redaction policy'nin KULLANICIYA gösterileceği bir arayüz gerekiyor mu bu dilimde, yoksa
D-201'in "Enable AI for this project (debug)" emsali gibi geçici bir yer mi yeterli? SPEC §8.4
gerçek yuvasının Settings → AI providers olduğunu söylüyor ama o ekranın kendisi henüz bu
kadar zengin değil — yeni bir tam Settings bölümü inşa etmek D-114'ün bütçesini aşabilir.

### 2.3 Attachment review sheet — SPEC'in kendi zorunlu tuttuğu, D-203'ün adını anmadığı üçüncü parça

> "Before any send, an attachment review sheet shows exactly what will be transmitted: file
> names, sizes, extracted row/page counts, redactions applied, estimated tokens and cost. The
> user confirms. This is a one-click confirm, not a wall, but it exists." (§8.9)

**Bu D-203'ün kendi J2 tanımında adı geçmeyen, ama SPEC'in lafzen zorunlu tuttuğu gerçek bir
üçüncü mekanizma** — §4'ün kendi bütçe uyarısına bak, bu dilimi kalabalıklaştırıyor olabilir.
Token/maliyet tahmini §8.12'nin kendi kapsamı (Faz 9/10, J1'in kendi §3'ünde de kapsam dışı
bırakılmıştı) — bu dilim yalnızca dosya adı/boyut/satır sayısı/uygulanan redaksiyon'u
gösterebilir, tam maliyet tahmini olmadan; bu daraltma bu oturumun kendi kararı, ama
Barış'a not düşülmeli.

### 2.4 `EntryProposalField`'a dosya-yükleme yolu ekleme

J1'in kendi `Textarea` + "Öner" akışı DEĞİŞTİRİLMİYOR — bir dosya seçildiğinde okunan/örneklenen
özet metni, kullanıcının elle yazdığı `rawInput`'un YERİNE ya da YANINA mı geçiyor (SPEC'in
"stratified sample" çıktısı zaten metin-benzeri bir özet, `buildProposalPrompt`'un `userInput`
parametresine doğrudan akabilir)? `@tauri-apps/plugin-dialog`'un `open()` fonksiyonu +
`EntryImagesField.tsx`'in kendi dosya-seçme deseni (path seç → Rust'a path gönder → Rust
okur/işler → sonucu TS'e döndür) burada da uygulanabilir — image ingestion'ın `IMAGE_FILTER`
sabitinin xlsx/csv karşılığı (`{name: "Spreadsheets", extensions: ["xlsx", "csv"]}`).

### 2.5 P-50'nin doğal kapanma fırsatı

J1'in prompt front-matter'ındaki `contextSlices` alanı hâlâ tüketilmiyordu (P-50). Bir dosyadan
gelen örnek veri "context" mi yoksa "userInput"'un bir biçimi mi — eğer bu dilim onu doğrudan
`userInput`'a akıtırsa (§2.4'ün önerdiği gibi), P-50 muhtemelen yine açık kalır (gerçek bir
otomatik PROJE bağlamı toplama hâlâ yok — yalnızca kullanıcının kendi seçtiği dosya). Kapanıp
kapanmadığını açıkça kaydet, "kolayca kapatılabilir" varsayma (P-47'nin kendi J1'deki dersi).

### 2.6 Done-koşulu

- Kullanıcı gerçek bir xlsx (veya csv) dosyası seçebiliyor, Rust onu okuyup örnekleyip özet
  döndürüyor — `calamine`'in gerçek güncel API'sine karşı doğrulanmış kod.
- Attachment review sheet gerçek: dosya adı/boyut/satır sayısı/uygulanan redaksiyon gösteriyor,
  kullanıcı onaylamadan hiçbir şey Vorion'a gitmiyor.
- `RedactionPolicySchema` gerçek alanlar taşıyor (en azından `mode: "off"|"customers"`,
  `terms`, `preserveNumbers: true`), en az `"customers"` modu gerçekten bir terimi maskeleyip
  yanıt geldiğinde geri çeviriyor (session-scoped token map).
- Faz 9'un kendi lafzî done-koşulu gerçekten kanıtlanmış: bir örnek xlsx'ten Pareto'nun
  `EntryProposalField`'ı üzerinden geçerli bir öneri üretiliyor (elle yazılmış bir test/probe
  ile de olsa — gerçek Tauri penceresi bu ortamda yine mevcut değil, D-105/D-113/D-136/D-200/
  D-201/D-204'ün aynı dürüst-owed sınıfı).
- `npm test`/`cargo test` yeşil, exit code ayrı kontrol edilir, `npm run lint`/`npm run build`,
  `cargo clippy --all-targets -- -D warnings`/`cargo fmt -- --check` hepsi temiz.
- Anahtar sızıntısı testi yeniden doğrulanır (bu dilim de bir dosya yolu + (redaction sonrası)
  içerik Rust'tan Vorion'a gönderiyor — anahtarın kendisi hâlâ yalnızca Rust'ta okunuyor mu).
- P-50 kapandıysa/kapanmadıysa açıkça kaydedilir.

---

## 3. Kapsam dışı

- pdf/docx/pptx içeri alma (§8.9'un geri kalanı) — yalnızca xlsx/csv, D-203'ün kendi
  daraltması.
- §8.4'ün tam Settings → AI providers "Attachment policy" arayüzü (max file size toggle'ı,
  downscale/EXIF-strip switch'leri) — J2 yalnızca xlsx/csv'nin kendi sabit tavanlarını
  kullanır, kullanıcı-ayarlanabilir bir arayüz inşa etmez (D-118/D-193'ün emsali).
- `"customers-and-parts"`/`"custom"` redaction modları — §2.2'nin kendi önerisiyle bu dilimin
  kapsamı dışına düşebilir, ama kesin karar bu oturumun.
- §8.12 (maliyet sayacı, tam token tahmini) — Faz 10.
- J3 (prompt kütüphanesinin Pareto ötesine genelleştirilmesi) — kendi dilimi.
- P-48 (Resume Stream), P-49 (E2E mock doğrulaması) — dokunulmaz.
- İçeri alınan dosya içeriğinin `.ppsx`'e kalıcı olarak yazılması — SPEC'in kendi "prompt ve
  yanıt gövdeleri varsayılan olarak saklanmaz" ilkesi (§8.13) buraya da uygulanır, dosya
  içeriği yalnızca bu istek için yaşar.

---

## 4. Bütçe ve kapanış disiplini

**Bu dilim, J1'in kendi "dört gerçek yeni parça" uyarısından daha yoğun olabilir.** D-203'ün
kendi J2 tanımı iki parça sayıyordu (ingestion + redaction), ama SPEC'in kendi metni §8.9'da
**üçüncü** bir zorunlu mekanizma daha taşıyor (attachment review sheet, §2.3) ve
`EntryProposalField`'a dosya-yükleme entegrasyonu (§2.4) dördüncü, küçük ama gerçek bir
değişiklik. D-114'ün "dilim başına bir yeni mekanizma" bütçesi burada gerçekten gergin —
§0'ın kendi ön taraması beklenenden daha karmaşık çıkarsa (örn. calamine'in gerçek API'si
tahmin edilenden farklıysa, ya da redaction'ın Rust-mı-TS-mi sorusu derin bir mimari karara
dönüşürse), **bu dilim ikiye bölünmeyi düşünmeli**: J2a (dosya okuma + örnekleme + `Entry
ProposalField` entegrasyonu, redaction YOK, `mode: "off"` sabit) / J2b (gerçek redaction +
attachment review sheet). Tek oturumda bitirmeye zorlanmasın — J1'in kendi §4'ü de aynı
uyarıyı yaptı ve o dilim tek oturumda bitti, ama bu daha yoğun.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bir sonraki: **D-205**), `docs/oturumlar/
README.md`'nin J2 satırı güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir. P-50
kapandıysa/kapanmadıysa açıkça kaydedilir. J3'ün kendi launch prompt'u bu oturumun kapanışında
veya bağımsız olarak yazılabilir.

---

**Model önerisi:** §2.1'in calamine-doğrulaması ve §2.2'nin redaction-nerede-uygulanır kararı
gerçek mimari kararlar — D-28'in routing mantığına göre Opus değerlendirilebilir, özellikle
dilim ikiye bölünürse J2b'nin (redaction + review sheet) kendisi. §2.1'in dosya-okuma yarısı
J1'in Rust deseninin (VorionProvider, image ingestion) devamı niteliğinde — Sonnet 5 yeterli
kalabilir.
