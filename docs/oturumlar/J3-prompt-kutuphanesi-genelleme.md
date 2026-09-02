# OTURUM Faz 9 — J3: Prompt kütüphanesinin Pareto'dan registry'nin geri kalanına genelleşmesi

> J1 (Vorion yapılandırılmış çıktı + Pareto referans önerisi, D-204) ve J2 (gerçek dosya
> içeri alma + temel redaction, D-205) BİTTİ. Faz 9'un kendi üç dilimlik planının üçüncüsü
> ve sonuncusu budur — **yeni bir mekanizma YOK**, J1'in kurduğu mekanizma (prompt dosyası +
> `MethodPlugin.aiProposal` + `EntryProposalField`'ın zaten genel olan akışı) `pareto`'dan
> registry'nin geri kalan method'larına tekrarlanıyor.
>
> **Bu dosya J3'ün TAMAMINI değil, kendi kapsamını + J3'ün sekiz diliminin tam planını**
> taşıyor — Oturum C'nin kendi `C-yontem-plugin-insasi.md`'si gibi, ama ayrı bir "kapsam
> belirleme, kod yok" oturumuna gerek duyulmadı: envanter çıkarmak ucuzdu (registry zaten
> grep edilebilir), bu yüzden plan + birinci dilimin kendi talimatları AYNI dosyada. Sıradaki
> dilimler (J3-2..J3-8) kendi launch prompt'larını alacak ama her biri bu dosyanın §2.1'ine
> **geri referans verecek**, envanteri yeniden çıkarmayacak (Madde 1 — aynı işi iki kez
> yapma).
>
> Kanonik konum: `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`. Yazıldı: 2026-09-01,
> J2'nin kapanışının hemen ardından, Barış'ın isteğiyle ("sıradaki için prompt paylaşır
> mısın").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/J1-pareto-yapilandirilmis-oneri.md \
      docs/oturumlar/J2-dosya-iceri-alma-redaction.md \
      src/methods/types.ts \
      src/methods/registry.ts \
      src/methods/registry.test.ts \
      src/methods/pareto/index.ts \
      src/ai/prompts/2/pareto.v1.md \
      src/ai/prompts/library.ts \
      src/ai/prompts/library.test.ts \
      src/ai/prompts/frontMatter.ts \
      src/app/routes/workspace/EntryProposalField.tsx \
      src/app/routes/workspace/EntryEditorDialog.tsx
```

Hepsi 2026-09-01'de var olmalı; eksik/adı değişmiş bir tane varsa **DUR ve Barış'a söyle**.

Ayrıca §2.1'in kendi envanterini gerçek koda karşı yeniden doğrula — bu dosya yazıldıktan
sonra registry değişmiş olabilir:

```bash
grep -rln "aiProposal:" src/methods/*/index.ts     # yalnızca pareto bekleniyor
grep -c "export const .*_METHOD_ID" src/methods/*/index.ts | wc -l   # 57 method dosyası bekleniyor
```

Sayı 57'den farklıysa ya da `pareto` dışında bir method zaten `aiProposal` taşıyorsa, §2.1'in
envanterini **yeniden çıkar**, körü körüne bu dosyadaki tabloya güvenme.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-203** (Faz 9'un üç dilimlik planı, J3'ün kendi tanımı), **D-204** (J1 —
   prompt dosyası şekli, `aiProposal` alanı, `EntryProposalField`'ın Accept/Edit&Accept/Reject
   akışı, `getPromptFile` mekanizması), **D-205** (J2 — bu dilimi ETKİLEMİYOR, dosya içeri
   alma ayrı bir mekanizma; yalnızca "prompt dosyaları İngilizce kalıyor, i18n split YOK"
   kararının hâlâ geçerli olduğunu doğrulamak için okunmaya değer).
3. `SPEC.md` §8.6 (**bu dilimin asıl içerik kaynağı** — her adım için "what good assistance
   looks like here" satırı, her yeni prompt dosyasının kendi role-framing paragrafının
   temeli), §8.7 (yapılandırılmış çıktı sözleşmesi — J1'de zaten inşa edildi, burada yalnızca
   tekrarlanıyor), §8.1 (LOCKED ilkeler, özellikle "nothing enters the project without a
   human accepting it" — her yeni method için de geçerliliğini teyit et).
4. `src/ai/prompts/2/pareto.v1.md` — **her yeni prompt dosyasının kendi şablonu.** Front-matter
   şekli (mode/methodId/step/version/outputSchema/contextSlices), sonra: rol çerçevesi (bir
   paragraf — "you are assisting a quality engineer... for Step N ('...') of a Toyota PPS
   report"), "your job" cümlesi, sonra şemanın HER alanı için ayrı, somut, halüsinasyon-karşıtı
   rehberlik ("if genuinely absent, use X"; "do not fabricate — omit rather than guess"; boş
   bir öneri, yanlış bir öneriden iyidir). Bu kalıp taklit edilecek, kısaltılmayacak — J1'in
   kendi kalite çıtası budur.
5. `src/methods/registry.test.ts` — özellikle `describe("reference roles across the
   registry")`/`describe("MethodPlugin.tier")` blokları: registry-geneli DEĞİŞMEZLER tek bir
   testle nasıl doğrulanıyor (örn. "is declared by exactly the six methods..."), bu dilimin
   kendi yeni testi de aynı desende olmalı — 9 ayrı ad-hoc test değil, tek bir jenerik
   değişmez.

---

## 2. Kapsam

### 2.0 Neden yeni bir mekanizma YOK

J1'in kendi işi tamdı: `MethodPlugin.aiProposal?: {promptVersion}` alanı, `getPromptFile`
(prompt kütüphanesi), `EntryProposalField` (generic-shell UI, D-125'in dördüncü uygulaması),
`proposeStructuredEntry` (retry-once orkestasyon) — hiçbiri Pareto'ya özel değil, hepsi
`plugin.schema`/`plugin.id`/`plugin.aiProposal.promptVersion` üzerinden JENERIK çalışıyor.
`EntryEditorDialog.tsx`'in kendi render koşulu zaten `project && plugin.aiProposal &&
project.meta.ai.modelId` — yeni bir method bu üçünü sağladığı an otomatik olarak çalışır.
**J3'ün TÜM işi**: (a) her method için bir prompt dosyası yazmak, (b) o method'un
`index.ts`'ine `aiProposal: {promptVersion: "v1"}` eklemek, (c) registry-geneli bir
değişmezle bunu doğrulamak. Bu, Oturum 6a/6c'nin "N yeni method, sıfır yeni mekanizma"
şekliyle aynı — J1/J2'nin gerçek mimari kararlarından daha hafif, bu yüzden dilim başına
daha büyük bir batch (bir adımın tüm method'ları) makul.

### 2.1 Tam envanter — 57 method, adım/aday durumu

`grep`'le çıkarıldı (bu dosyanın kendi §0'ı yeniden doğrulamanı istiyor). **Aday DEĞİL**
sütunundaki iki sınıf kasıtlı olarak dışlandı:

- **Fotoğraf-taşıyan 5 method** (`defect-photo-board`, `gemba-observation-log`,
  `spaghetti-diagram`, `value-stream-map`, `before-after-photos`): SPEC §8.8 açık —
  "Photos stay photos... the assistant may propose crops, annotation callouts and captions"
  — bu TAMAMEN FARKLI bir AI özelliği (var olan bir fotoğrafa açıklama/kırpma önerisi),
  J1'in kurduğu "metinden yapılandırılmış payload öner" deseniyle aynı şey değil. Bu
  dilimin kapsamı dışında, kendi geleceğinde ayrı bir mekanizma gerektirir.
- **`generic-text`** (tüm 8 adımda): şeması serbest metin, `steps: STEP_IDS` (tek bir adıma
  ait değil) — bir prompt dosyasının hangi adımın klasörüne (`src/ai/prompts/{step}/`)
  gideceği belirsiz, ve "serbest metin öner" zaten `AssistantPanel`'in kendi işi
  (D-203'ün kendi "AssistantPanel'e katlanmaz" kararı tersten de geçerli: generic-text'in
  aiProposal'ı AssistantPanel'in tekrarı olurdu).

Kalan **50 method** gerçek aday. Adım sırasına göre:

| Adım | SPEC §8.6'nın kendi satırı (özet) | Method'lar (methodId) | Sayı |
|---|---|---|---|
| 1 | Gap quantified mi? 5W2H'yi doldur. Şikayetten müşteri/parça/PPM/tarih çıkar. Containment öner. | `gap-statement`, `five-g-5n1k`, `five-n1k`, `five-w2h`, `voc-complaint-record`, `containment-ica`, `problem-type-classifier`, `tpm-loss-taxonomy`, `problem-impact` | 9 |
| 2 | Stratifikasyon boyutları öner. Pareto/trend spec üret. Vital few'i adlandır. Ölçüm sistemi güvenilir mi? | `category-breakdown`, `check-sheet`, `distribution-chart`, `is-is-not`, `msa-gage-rr`, `point-of-cause`, `process-flow-sipoc`, `stratification-matrix`, `trend` (`pareto` J1'de BİTTİ) | 9 |
| 3 | Hedefi SMART'a çevir, baseline'a karşı sağlık kontrolü yap. | `smart-target` | 1 |
| 4 | 4M'ye göre fishbone dalları tohumla. Her Why bağını nedensellik için test et. "Operatör hata yaptı" çıkmazını tespit et. | `cause-effect-matrix`, `comparative-analysis`, `fault-tree`, `fishbone`, `five-why`, `hypothesis-verification`, `pfmea-linkage`, `three-legged-five-why`, `why-why-tree` | 9 |
| 5 | Doğrulanmış her kök nedene karşı countermeasure öner, error-proofing hiyerarşisinde sınıflandır. | `cost-approval`, `countermeasure`, `error-proofing-hierarchy`, `impact-effort-matrix`, `side-effect-risk-assessment`, `trial-plan`, `weighted-decision-matrix` | 7 |
| 6 | Kabul edilen countermeasure'lardan action plan taslağı çıkar. Eksik owner/tarih işaretle. | `action-item`, `ica-pca-transition`, `implementation-issues-log`, `training-communication-record`, `trial-result-log` | 5 |
| 7 | Öncesi/sonrası veriyi analiz et, doğru kontrolü çalıştır, dürüst bir verdict ver. | `kpi-strip`, `realized-cost-benefit`, `result-verdict`, `statistical-confirmation`, `sustainment-audit` | 5 |
| 8 | Hangi dokümanların güncellenmesi gerektiğini öner. Read-across adayları öner. Lessons-learned taslağı çıkar. | `document-updates-tracker`, `lessons-learned`, `open-items-next-problem`, `sustain-plan`, `yokoten-tracker` | 5 |

Toplam: 9+9+1+9+7+5+5+5 = **50**. `referenceRoles` taşıyan method'lar (`hypothesis-
verification`, `countermeasure`, `error-proofing-hierarchy`, `side-effect-risk-assessment`,
`action-item`, `ica-pca-transition`) da bu listede — bir method'un referans alması, onun
kendi `aiProposal`'ının olmasını engellemiyor (ikisi ortogonal, `EntryProposalField` ve
`EntryReferenceField` `EntryEditorDialog` içinde yan yana render ediliyor).

### 2.2 Sekiz dilimlik plan

Bir adım = bir dilim — her adımın SPEC §8.6 satırı doğal olarak o adımın TÜM prompt
dosyalarını besliyor (aynı role-framing paragrafının varyasyonları), ve `EntryProposalField`
zaten jenerik olduğu için her method'un işi kabaca eşit (bir prompt dosyası + bir alan
ekleme + bir değişmez testi büyümesi).

| Dilim | Adım | Method sayısı | Durum |
|---|---|---|---|
| **J3-1 (bu dosyanın kendi kapsamı)** | 1 | 9 | ✅ BİTTİ (D-206, 2026-09-01) |
| J3-2 | 2 | 9 | henüz yazılmadı |
| J3-3 | 3 | 1 | henüz yazılmadı |
| J3-4 | 4 | 9 | henüz yazılmadı |
| J3-5 | 5 | 7 | henüz yazılmadı |
| J3-6 | 6 | 5 | henüz yazılmadı |
| J3-7 | 7 | 5 | henüz yazılmadı |
| J3-8 | 8 | 5 | henüz yazılmadı |

J3-3 (1 method) tek başına bir oturuma değmeyebilir — J3-3'ün kendi launch prompt'unu yazan
oturum, Adım 3'ü Adım 4 ile (J3-3+J3-4, 10 method) birleştirmeyi düşünebilir; bu o oturumun
kendi kararı, burada zorlanmıyor.

### 2.3 THIS session'ın kendi işi: J3-1 (Adım 1, 9 method)

Her method için:

1. `src/ai/prompts/1/{methodId}.v1.md` yaz — `pareto.v1.md`'nin kalıbını izleyerek:
   front-matter (`mode: draft`, `methodId`, `step: 1`, `version: v1`, `outputSchema:
   {methodId}`, `contextSlices: []` — P-50 hâlâ açık, otomatik context toplama yok), rol
   çerçevesi paragrafı (Adım 1'in kendi adı: "Define the Problem"), "your job" cümlesi,
   sonra o method'un GERÇEK şemasının (`src/methods/{methodId}/schema.ts`'i oku) her alanı
   için somut rehberlik. `tpm-loss-taxonomy`/`problem-type-classifier` gibi sabit-alan
   şemalarda (serbest liste değil) rehberlik "hangi durumda hangi kategori/severity"
   şeklinde olabilir — Pareto'nun "omit rather than guess" ilkesi burada da geçerli: veri
   yetersizse alan boş bırakılır, uydurulmaz.
2. `src/methods/{methodId}/index.ts`'e `aiProposal: { promptVersion: "v1" }` ekle —
   `pareto/index.ts`'teki tam olarak aynı satır, farklı method.
3. i18n dokunma — J1'in kendi bulgusu hâlâ geçerli: prompt dosyaları modele gidiyor,
   kullanıcıya gösterilmiyor, tr/en split gerekmiyor.

### 2.4 Test stratejisi — 9 ayrı test değil, TEK bir registry-geneli değişmez

`registry.test.ts`'in kendi "reference roles across the registry" desenini tekrarla: yeni
bir `describe("MethodPlugin.aiProposal across the registry")` bloğu ekle, en az şunu
doğrulayan bir test yaz:

> Her `aiProposal` taşıyan method için, `getPromptFile(method.steps[0], method.id,
> method.aiProposal.promptVersion)` gerçek, yüklenebilir bir dosya döndürür (`undefined`
> DEĞİL) ve o dosyanın `frontMatter.outputSchema === method.id`.

Bu TEK test, bu dilimin eklediği 9 method'u da, gelecekteki J3-2..J3-8'in ekleyeceklerini de
otomatik kapsar — Madde 2'nin "tekrarı gördüğün an soyutla" ilkesinin ta kendisi, dokuz kez
elle yazılacak neredeyse-aynı testin yerine.

Ayrıca (isteğe bağlı ama önerilir): J2'nin kendi `paretoFromXlsxAttachment.probe.test.ts`
deseni yalnızca Pareto'ya özeldi (dosyadan gelen veri) — bu dilim dosya-tabanlı değil, elle
girilen veri kullanıyor (J1'in kendi deseni), o yüzden yeni bir probe testi GEREKMİYOR;
`EntryProposalField.test.tsx`'in kendi mevcut testleri zaten `plugin.schema`/`plugin.
aiProposal` üzerinden jenerik çalışıyor, hiçbir yeni method için o dosyada değişiklik
gerekmez.

### 2.5 Done-koşulu (J3-1)

- 9 yeni prompt dosyası (`src/ai/prompts/1/*.v1.md`), her biri Pareto'nun kalite çıtasında
  (rol çerçevesi + alan-bazlı halüsinasyon-karşıtı rehberlik, jenerik/boş bir şablon DEĞİL).
- 9 method'un `index.ts`'i `aiProposal` alanı kazandı.
- `registry.test.ts`'e eklenen tek jenerik değişmez, 9'unu da (ve varsa `pareto`'yu) kapsıyor
  ve GERÇEKTEN kırmızıdan yeşile geçtiği doğrulanıyor (bir method'un `promptVersion`'ını
  bilerek yanlış yaparak test edilir, sonra düzeltilir — mutation-check, bu projenin kendi
  disiplini).
- `npm test`/`cargo test` yeşil, exit code ayrı kontrol edilir (D-143'ün kendi dersi —
  `tail`'e pipe'lamadan), `npm run lint`/`npm run build`, `cargo clippy`/`cargo fmt` hepsi
  temiz (bu dilim Rust'a HİÇ dokunmuyor — `cargo test` sayısının değişmediğini doğrulamak
  yeterli).
- `scripts/gen-a3-fixture.ts` yeniden çalıştırılmaz (bu dilim `buildA3Layout`'a, template
  stiline, `A3ImageKind`'a dokunmuyor — grep ile doğrula, önceki dilimlerin aynı kontrolü).

---

## 3. Kapsam dışı

- J3-2..J3-8 (Adım 2-8'in geri kalan 41 method'u) — kendi launch prompt'ları, bu dosyanın
  §2.1/§2.2'sine geri referans verir.
- Fotoğraf-taşıyan 5 method'un "crop/caption öner" özelliği (§8.8'in kendi ayrı yeteneği) —
  §2.1'in kendi dışlama kararı.
- `generic-text`'in kendi aiProposal'ı — §2.1'in kendi dışlama kararı.
- SPEC §8.6'nın Critique/Extract/Review modları — J1/J2 gibi bu dilim de yalnızca `draft`
  modunu kullanıyor.
- §8.10 (A3 placement optimizer), §8.12 (maliyet sayacı) — Faz 10.
- P-39 (why-why-tree'nin node-seviyeli referans mimarisi), P-47/P-48/P-49/P-50/P-51/P-52 —
  hiçbiri dokunulmuyor.
- pdf/docx/pptx içeri alma — J2'nin kendi kapsam dışı bıraktığı, hâlâ öyle.

---

## 4. Bütçe ve kapanış disiplini

Adım 1'in 9 method'u muhtemelen J1/J2'den daha az riskli — yeni mimari karar yok, tekrarlanan
bir kalıp. Ama 9 method'un HER birine gerçek, özenli prompt mühendisliği (Pareto'nun kendi
çıtası) gerekiyor — bu kısaltılırsa (jenerik/şablon-vari prompt'lar), J3'ün tamamı düşük
kaliteli bir mekanik alıştırmaya döner ve SPEC §8.1'in "the root cause it invents will be
plausible and wrong" uyarısı tam olarak burada gerçekleşir. 9 method bir oturumda gerçekten
sığmıyorsa, adımın kendi içinde bölünsün (örn. 5+4) — zorlanmasın.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bir sonraki: **D-206**), bu dosyanın §2.2
tablosundaki J3-1 satırı "BİTTİ" olarak güncellenir, `docs/oturumlar/README.md`'nin J3 satırı
güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir. **J3-2'nin kendi launch
prompt'u** yazılır — ama KISA olabilir, bu dosyanın §2.1 envanterine/§2.3'ün kalıbına
doğrudan referans vererek, aynı tabloyu yeniden üretmeden.

---

**Model önerisi:** Bu dilimde gerçek bir mimari karar YOK — J1/J2'nin Opus-değerlendirilebilir
kararlarının aksine, saf tekrar + prompt mühendisliği. Sonnet 5 yeterli. Tek dikkat noktası
prompt KALİTESİ (halüsinasyon-karşıtı rehberlik, Pareto'nun çıtası) — bu bir model gücü
sorunu değil, zaman/özen sorunu.
