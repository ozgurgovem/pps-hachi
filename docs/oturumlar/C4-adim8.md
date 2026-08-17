# OTURUM C4 — ADIM 8 tasarım turu + inşası (Oturum C'nin dördüncü dilimi)

> `docs/oturumlar/C-yontem-plugin-insasi.md`'nin önerdiği altı dilimden (§3) dördüncüsü.
> **C1, C2, C3 BİTTİ** — C1: durum glifi (P-37, 4/5), fishbone geometrisi (P-34), B1'in 5./6.
> alan ekleri (D-180). C2: `five-n1k` + `problem-impact` plugin'leri, sıfır yeni mekanizma
> (D-181). C3: `kpi-strip` mekanizması + ADIM 7'nin ilk gerçek plugin'i, P-31/P-36 kapandı
> (D-182). Bu dosya C4'ün kapsamıdır: B1'in §13.4 kalan **dört adayı** — Sustainment Audits
> (ADIM 7), 7-belge-türü Document Updates izleyicisi (ADIM 8), Yokoten izleyicisi (ADIM 8),
> 8-soruluk Lessons Learned checklist'i (ADIM 8). **Yeni mekanizma gerektirmez** — dördü de
> mevcut `rowTable`/`fieldForm` substratlarıyla (D-115/D-127) karşılanıyor; C3'ten farkı budur.
> Bütçe borcu mekanizmada değil, **alan listesi + substrat seçimi + olası referans-rolü**
> kararlarında — aşağıdaki §2.2 kodlamadan önce çözülmeli.
>
> Kanonik konum: `docs/oturumlar/C4-adim8.md`. Yazıldı: 2026-08-17, C3'ün kapanışının hemen
> ardından, Barış'ın açık isteğiyle ("evet, şimdi yaz").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      docs/oturumlar/C-yontem-plugin-insasi.md \
      src/methods/registry.ts src/methods/types.ts src/domain/model/reference.ts \
      src/methods/checkSheet/index.ts src/methods/checkSheet/schema.ts \
      src/methods/checkSheet/Editor.tsx src/methods/checkSheet/renderToA3.ts \
      src/methods/tpmLossTaxonomy/index.ts src/methods/tpmLossTaxonomy/schema.ts \
      src/methods/tpmLossTaxonomy/Editor.tsx src/methods/tpmLossTaxonomy/renderToA3.ts \
      src/methods/shared/rowTable.ts src/methods/shared/RowTableEditor.tsx \
      src/methods/shared/fieldForm.ts src/methods/shared/FieldFormEditor.tsx \
      src/methods/actionItem/index.ts src/methods/kpiStrip/index.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-17'de doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (plan onayı, TDD, i18n),
   ve "Current state"in **Oturum C — C1/C2/C3** paragrafları.
3. `reference/TEMPLATE_ANALYSIS.md` §13.1'in **"Effectiveness Check"** ve **"Standardization,
   Yokoten & Lessons Learned"** satırları — bu dilimin dört adayının **gerçek, referanstan
   doğrulanmış alan listeleri** zaten burada, icat edilmiyor. §13.4 (adayların kısa özeti) ve
   §13.2 (`Lists & Settings` sözlüğü — Status/Priority/Verification/Approval seçenek listeleri
   buradan gelir).
4. `DECISIONS.md`: **D-114** (dilim disiplini), **D-115** (`rowTable` — yinelenen kayıt
   substratı), **D-122** (`tpmLossTaxonomy` — sabit kategori ızgarası, bir row-table DEĞİL,
   kullanıcı satır ekleyip çıkaramıyor), **D-127** (`fieldForm` — tek kayıt, sabit alan
   substratı), **D-116/D-124/D-139** (referans rolleri — ne zaman bir yöntem başka bir entry'ye
   işaret eder, ne zaman etmez).
5. `src/methods/checkSheet/*` — Sustainment Audits'in **en yakın emsali**: kullanıcının serbestçe
   satır ekleyip çıkardığı, `RowTableEditor` tabanlı bir "yinelenen kayıt" yöntemi.
6. `src/methods/tpmLossTaxonomy/*` — Document Updates izleyicisinin **en yakın emsali**: sabit
   sayıda kategori/satır (kullanıcı ekleyip çıkaramaz), her satırın kendi sabit alanları var.
7. `src/domain/model/reference.ts` + `src/methods/actionItem/index.ts` — §2.2'nin referans-rolü
   sorusu için: `actionItem`'ın bugün hangi rolleri kabul ettiğini, `REFERENCE_ROLES`'un neyi
   zaten kapsadığını gör.

---

## 2. Kapsam

### 2.1 Dört adayın gerçek alan listeleri (§13.1'den, icat değil transkripsiyon)

**1) Sustainment Audits (ADIM 7)** — periyodik/yinelenen denetim kaydı, tek-seferlik
`checkSheet`'ten farklı: her satır bir denetim *olayı*. Alanlar (§13.1 "Effectiveness Check"):
Audit date · Area/line · Standard checked · Sample size · Conforming · Nonconforming ·
Compliance % · Auditor · Finding · Reaction action ID · Next audit · Status (Planned/Verified/
Rejected). D-120 gereği sayısal alanlar (Sample size, Conforming, Nonconforming, Compliance %)
`string`-typed kalır (`RowTableEditor`'ın tüm alanları zaten böyle).

**2) Document Updates izleyicisi (ADIM 8)** — **7 sabit satır** (kullanıcı ekleyip çıkaramaz,
`tpmLossTaxonomy`'nin D-122 deseni): PFMEA · Control Plan · Work Instruction · Inspection
Standard · Training/Competence · Layered Process Audit · APQP/PPAP record. Her satırın sabit
alanları: Update required? (Yes/No) · Doc ID · Current→New revision · Owner · Due/Completion
date · Status · Approval · Evidence · Customer submission? (Yes/No). Şipping edilmiş
`pfmeaLinkage` tek belgeye odaklı — bu, yediyi ayrı ayrı izleyen daha geniş bir yöntem, `pfmeaLinkage`
DEĞİŞMEZ.

**3) Yokoten (yatay yayılım) izleyicisi (ADIM 8)** — yinelenen kayıt, `checkSheet` deseninde
`RowTableEditor`. Alanlar: Site/line/product · Applicability · Risk reviewed · Action required ·
Owner · Due date · Status · Completion evidence · Effectiveness checked · Check date · Result ·
Approval · Notes.

**4) Lessons Learned checklist'i (ADIM 8)** — **8 sabit soru**, her biri uzun serbest metin —
bu bir liste değil (`fieldForm` deseni, D-127), her soru kendi alanı: "What went well?" ·
"What failed or was delayed?" · "What evidence changed our thinking?" · "What should be
reused?" · "What should be avoided?" · Coaching-capability lesson · Customer communication
lesson · Final closure rationale.

### 2.2 Kodlamadan önce Barış'a `AskUserQuestion` ile sorulacaklar

Alan listeleri kesin (§2.1) — geriye kalan gerçek kararlar **substrat + referans-rolü**
seçimleri, C3'ün §2.2'sinden daha küçük ama yine de kodlamadan önce onaylanmalı:

- **Referans rolleri (D-116):** Sustainment Audits'in `Reaction action ID`'si ve Document
  Updates'in `Evidence`'ı, kavramsal olarak `actionItem`/bir kök-neden kaydına işaret ediyor
  olabilir. Öneri: **hiçbiri bu turda referans rolü almasın** — dördü de C3'ün `kpi-strip`'i
  gibi düz metin alanı olarak başlasın (Doc ID/Reaction action ID kullanıcı elle yazar), çünkü
  hiçbiri D-139'un same-step-reference emsalindeki gibi net bir hedef adayına sahip değil ve
  D-116'nın `fromSteps` daralması burada belirsiz (ADIM 6'nın `actionItem`'ı mı, ADIM 5'in
  `countermeasure`'ı mı?). Referans, gerçek kullanım bunu gerektirdiğinde eklenir (YAGNI).
- **Sustainment Audits hangi step'e kayıtlı olsun:** §13.1/§13.4 ADIM 7 diyor (kpi-strip'le
  aynı adım, farklı içerik — kpi-strip tek-seferlik KPI karosu, bu yinelenen denetim kaydı).
  Öneri: `steps: [7]`.
- **Dördünün de i18n/etiket dili:** İngilizce alan adları (§13.1'den) TR'ye çevrilecek — bu
  oturumun kendi işi, ayrıca sorulmuyor (önceki dilimlerin hepsi TR/EN'i birlikte yazdı).

### 2.3 İnşa

Dört yeni plugin, her biri C1-C3'ün dosya şeklini izler (`index.ts`/`schema.ts`/`Editor.tsx`/
`renderToA3.ts` + üç test dosyası):

- `sustainmentAudit` (ADIM 7) — `RowTableEditor` (D-115), `checkSheet`'in birebir deseni.
- `documentUpdatesTracker` (ADIM 8) — sabit 7 satır (D-122'nin `tpmLossTaxonomy` deseni,
  `RowTableEditor` DEĞİL).
- `yokotenTracker` (ADIM 8) — `RowTableEditor` (D-115).
- `lessonsLearned` (ADIM 8) — `FieldFormEditor` (D-127), 8 sabit `textarea` alanı.

Hiçbiri yeni bir `A3ImageKind`/`ChartSpec`/UI mekanizması gerektirmiyor — dördü de düz `lines`
üretir (D-99/D-102'nin temel sözleşmesi), `rasterize.ts`/`place.ts`'e dokunulmaz.

---

## 3. Kapsam dışı

- D-153'ün başlık bandındaki **"Genel RAG"** alanı (B1 §13.4 aday 7) — bir method plugin'i
  değil, proje başlık/manifest modelinin parçası; ayrı iş, bu dilimin kapsamı değil.
- `whyWhyTree` diyagramı + terminal-durum alanı + referans mimarisi (P-35) — **C5**.
- `MethodPlugin.tier` + iki-bölümlü `MethodBand` + sürükle-tutamaç esnek tahsis arayüzü
  (D-169/D-170) — **C6**.
- Şablon dosyasının kendisi (`src/a3/templates/*`) — D-95, Faz 11.
- `pfmeaLinkage`'ı Document Updates izleyicisiyle birleştirmek/değiştirmek — ikisi ayrı kalır,
  §2.1 madde 2'nin kendi notu.

---

## 4. Bütçe ve kapanış disiplini

C1/C2/C3'ün kendi kapanışında uygulanan disiplin aynen geçerli: TDD (schema/Editor/renderToA3 +
üç test dosyası), TR/EN i18n anahtarları birlikte, `npm test`/`npm run lint`/`npm run build` ve
`cargo test`/`cargo clippy`/`cargo fmt` hepsi yeşil olmadan iş bitmiş sayılmaz — `npm test`'in
**exit code**'u kontrol edilir (D-143'ün dersi), yalnızca yazdırılan sayıya güvenilmez.

**§2.2'nin üç sorusu kodlamadan önce cevaplanmalı.** Dördü tek oturumda bitecek kadar küçük —
C3'ten farklı olarak hiçbiri yeni mekanizma taşımıyor, dördü de mevcut iki substratın (rowTable/
fieldForm) düz uygulaması.

Kapanışta: `TEMPLATE_ANALYSIS.md` §13.4/§14.8, `DECISIONS.md`, `CLAUDE.md` güncellenir,
`docs/oturumlar/README.md`'nin tablosuna bir satır eklenir.

---

**Model önerisi:** Sonnet — D-28'in "yüksek hacimli implementasyon" sınıfı, C1/C2/C3'le aynı.
§2.2'nin üç sorusu D-28'in "mimari karar" eşiğine değmiyor (üçü de zaten mevcut substrat/desen
arasından seçim) — Sonnet üzerinde `AskUserQuestion` ile çözülebilir, Opus'a geçiş gerekmez.
