# OTURUM W1-İNŞA — Adım genel bakış: gerçek kod

> W1'in kendisi (`docs/oturumlar/W1-adim-genel-bakis.md`) iki parçaya ayrıldı: o dosyanın
> kendi oturumu **tasarım + Block Visual Verification Loop**'u kapsadı ve BİTTİ — dört tur
> maket, Barış'ın son sözü: **"yaptığın değişiklikler gayet yeterli. Teşekkürler."** Bu
> dosya o onayın **kod karşılığını** yazan, YENİ, temiz bir oturumun kendi launch prompt'u
> (Anayasa Madde 4 — "bir iş birimi = bir temiz oturum", G4).
>
> Kanonik konum: `docs/oturumlar/W1-insa.md`. Yazıldı: 2026-09-06, tasarım oturumunun
> kapanışında. Tam tasarım kaydı: `DECISIONS.md` D-218 (ve kapsam kaydı D-217). **Bu dosya
> D-218'i ÖZETLEMEZ, ONU UYGULAR** — kod yazarken D-218'in kendi metnine geri dönüp
> doğrulayın, burası yalnızca uygulama sırasını ve somut içerik/isimlendirme kararlarını
> taşıyor.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/W1-adim-genel-bakis.md \
      src/app/routes/workspace/WorkspaceShell.tsx \
      src/app/routes/workspace/StepStepper.tsx \
      src/app/routes/workspace/StepStepper.test.tsx \
      src/app/routes/workspace/StepPage.tsx \
      src/app/routes/workspace/stepStatus.ts \
      src/app/routes/workspace/AssistantPanel.tsx \
      src/app/routes/workspace/RightPanel.tsx \
      src/app/routes/workspace/a3PreviewWindow/window.ts \
      src/state/projectStore.ts \
      src/domain/model/stepId.ts \
      src/domain/readiness/evaluateReadiness.ts \
      src/index.css \
      src/i18n/locales/tr/common.json \
      src/i18n/locales/en/common.json
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**. Ayrıca `DECISIONS.md`'nin son
D-numarasının **D-218 veya üstü** olduğunu doğrulayın — eğer D-218 yoksa bu prompt yanlış bir
depo durumuna karşı yazılmış demektir, devam etmeyin.

```bash
grep -n "^| D-218" DECISIONS.md   # VAR olmalı — onaylanan somut token'ların kaydı
grep -c "openInNewWindow" src/i18n/locales/tr/common.json   # ≥1 — yeniden kullanılacak buton örneği
grep -n "activeStepId: 1" src/state/projectStore.ts   # VAR bekleniyor — bu prompt bunu `null`'a çevirecek
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/W1-adim-genel-bakis.md`'nin TAMAMI — bu dosyanın kendi done-koşulu (§2.5)
   hâlâ geçerli hedef; bu prompt onu nasıl karşılayacağını somutlaştırıyor.
3. `DECISIONS.md` D-218 (bu oturumun tasarım kaydı) ve D-217 (kapsam kaydı) — **onaylanan
   somut değerlerin TEK kaynağı burasıdır**, aşağıdaki §2 bunları tekrar üretiyor ama D-218
   ile bu dosya çelişirse D-218 kazanır.
4. `src/state/projectStore.ts` — `activeStepId: StepId` (satır ~51, ~95), `loadProject`'in
   `activeStepId: 1` ataması (satır ~119), `setActiveStep(stepId: StepId)` (satır ~68, ~141).
5. `src/app/routes/workspace/WorkspaceShell.tsx` — bugünkü üç-sütun yerleşimi, `handleNavigate`
   (boş adıma atlama advisory'si).
6. `src/app/routes/workspace/StepStepper.tsx` — KALDIRILACAK gerçek bileşen; `getStepStatus`
   (`stepStatus.ts`) ve `evaluateReadiness` (`src/domain/readiness`) DOKUNULMADAN yeniden
   kullanılacak.
7. `src/app/routes/workspace/StepPage.tsx` — bugünkü `<h1>{stepId}. {t(...)}</h1>` başlığı,
   YENİ "ADIM-4. KÖK NEDEN ANALİZİ" biçimine dönüşecek satır.
8. `src/app/routes/workspace/AssistantPanel.tsx` — `activeStepId` okuyan, `project.steps[activeStepId]`
   yazan `handleAccept` (satır ~131, ~145). `activeStepId: StepId | null` olunca bu satırlar
   **tip hatası verecek** — bilerek, düzeltilmesi gereken gerçek bir null-safety noktası.
9. `src/app/routes/workspace/RightPanel.tsx` — `openOrFocusA3PreviewWindow`/
   `pushDescriptorToPreviewWindow`/`listenForPreviewReady`'nin ZATEN NASIL çağrıldığı (§2.4'ün
   "A3 Önizleme" düğmesi bunu BİREBİR taklit edecek).
10. `src/index.css` — bugünkü `@theme` bloğu (`--color-*` token'ları, `--font-*` aileleri,
    self-hosted `@fontsource` import'ları). §2.6 buraya YENİ, katkısal (additive) token'lar
    ekleyecek — MEVCUT hiçbir token'ı değiştirmeden.
11. `src/i18n/locales/{tr,en}/common.json`'ın `workspace.*` ad alanı — §2.3/§2.4/§2.5'in yeni
    key'lerinin ekleneceği yer, mevcut `workspace.steps.{N}.name`/`workspace.stepAriaLabel`
    ile aynı düzeyde.

---

## 2. Kapsam — onaylanan tasarımın kod karşılığı

### 2.1 State: `activeStepId: StepId | null`

- `ProjectStoreState.activeStepId: StepId | null`.
- `setActiveStep`'in imzası **genişler**: `setActiveStep(stepId: StepId | null)`. Mevcut tüm
  çağıranlar (`TraceabilityView`, `MockAuditPanel`, `WorkspaceShell.handleNavigate`) zaten
  gerçek bir `StepId` geçiyor — DEĞİŞMEZLER. Tek yeni çağıran: "İniş" düğmesi,
  `setActiveStep(null)` çağırır.
- `loadProject`'teki `activeStepId: 1` → `activeStepId: null`. Bu, **D-100'ün "asla örtük bir
  varsayım yapma" ruhuyla** bilinçli bir davranış değişikliği — bugün her proje açılışında
  Adım 1'e düşülüyor, artık iniş görünümüne düşülecek. `WorkspaceShell.test.tsx` ve projede
  bu varsayıma dayanan diğer testler (`grep -rn "activeStepId" src/**/*.test.tsx` ile
  bulunmalı) buna göre güncellenmeli — bir testin Adım 1'in içeriğini doğrulamak istiyorsa
  artık ÖNCE `setActiveStep(1)` çağırması ya da bir karta tıklaması gerekir.

### 2.2 `StepStepper.tsx` kaldırılıyor

- `src/app/routes/workspace/StepStepper.tsx` ve `StepStepper.test.tsx` SİLİNİR.
- `getStepStatus`/`isStepEmpty`/`StepStatus` (`stepStatus.ts`) ve `evaluateReadiness`
  (`src/domain/readiness`) **DEĞİŞMEDEN** kalır — hem yeni `StepOverview` hem `StepQuickJump`
  bunları aynen kullanır.

### 2.3 Yeni bileşen: `StepOverview.tsx` (iniş görünümü)

`WorkspaceShell`, `activeStepId === null` iken `StepPage` yerine bunu render eder.

**İçerik** — sekiz kart, her biri:
- Numara etiketi: `t("workspace.stepNumberLabel", { step })` (yeni key, aşağıda).
- Durum: `getStepStatus` sonucu, `Badge` bileşeniyle (D-49'un mevcut `Badge`'i — bu YENİ
  görsel yönden ETKİLENMEZ, D-218'in kapsam sınırı: yalnızca bu iki yeni yüzeyin KENDİ yeni
  öğeleri Farplas tokenlarını kullanır, `Badge` gibi paylaşılan bir bileşen DEĞİŞMEZ. Kartın
  kendi çerçevesi/tipografisi yeni tokenları kullanır, içine gömülü `Badge` component'i
  olduğu gibi kalır — maket bunu bir "chip" olarak gösterdi ama bu YALNIZCA görsel bir öneriydi;
  paylaşılan `Badge`'i DEĞİŞTİRMEK P-58'in kapsamı, bugün değil. Build session bu ikisi
  arasında görsel bir uyumsuzluk fark ederse, `Badge`'in KENDİSİNİ değiştirmeden, kart
  içinde `Badge`'i saran küçük bir wrapper stil ile fark kapatılabilir.)
- Ad: `t(\`workspace.steps.${stepId}.name\`)` (mevcut key, değişmedi).
- Kısa açıklama: `t(\`workspace.steps.${stepId}.cardPurpose\`)` (YENİ key).
- Nasıl-giriş: `t(\`workspace.steps.${stepId}.cardHowTo\`)` (YENİ key).
- Giriş sayısı: `t("workspace.entriesBand.entryCount", { count })` (mevcut key).
- Tıklama: `onNavigate(stepId)` — `WorkspaceShell.handleNavigate`'in AYNISI (advisory mantığı
  dahil, D-100'ün "reassurance, not a warning" ilkesi).

**Başlık satırı**: "Adımlar" (`workspace.stepOverview.heading`) + özet (kaç tamamlandı/kaç
işaretli — `evaluateReadiness`'ten türetilir, format serbest, build session'ın kendi kararı)
+ **"A3 Önizleme" düğmesi** (§2.4).

**Kart içeriği — Barış'ın maket turunda ONAYLADIĞI GERÇEK metin, aynen kullanılacak** (TR;
EN aşağıda ayrı bir blokta — EN metnin kendisi görsel olarak ONAYLANMADI, yalnızca TR
maket'te göründü, ama CLAUDE.md'nin "TR ve EN key'leri birlikte eklenir" kuralı gereği EN
sürümü de bu oturumda yazılmalı):

```json
{
  "1": { "cardPurpose": "Standart ile fiilen olan arasındaki farkı bir sayı, birim ve referans dönemle ifade edin — yorum değil.", "cardHowTo": "Bir boşluk ifadesiyle başlayın: olması gereken, olan ve aradaki fark ne kadar." },
  "2": { "cardPurpose": "Problemi tek bir makine, vardiya veya hata tipi gibi somut bir dilime daraltın — neden diye sormadan önce.", "cardHowTo": "Gerçek veriye dayanan bir Pareto, trend, kontrol formu veya tabakalama girişi ekleyin." },
  "3": { "cardPurpose": "Sebep aramaya başlamadan önce ölçülebilir bir hedefe bağlanın — pratikte en sık atlanan adım.", "cardHowTo": "Metrik, referans değer, hedef değer, birim ve tarihi olan bir SMART hedef ekleyin." },
  "4": { "cardPurpose": "Sistemik, değiştirilebilir bir faktöre ulaşana kadar tekrar tekrar \"neden\" diye sorun — bir kişiyi suçlamadan.", "cardHowTo": "Adım 2'nin bulduğu sebep noktasından bir balık kılçığı veya 5 Neden zinciri kurun ve sonucu doğrulayın." },
  "5": { "cardPurpose": "Neyin değişeceğini seçin ve alternatiflere karşı neden daha iyi olduğunu savunun — her önlem doğrulanmış bir kök nedene bağlanır.", "cardHowTo": "Adım 4'teki bir kök nedene bağlı, hata önleme hiyerarşisinde derecelendirilmiş bir karşı önlem ekleyin." },
  "6": { "cardPurpose": "Karşı önlemleri sahibi ve tarihi belli somut aksiyonlara dönüştürün ve sonuna kadar takip edin.", "cardHowTo": "Her aksiyonu kaydedin ve yalnızca gerçekten tamamlandığında tamamlandı olarak işaretleyin." },
  "7": { "cardPurpose": "Adım 3'teki hedefe ulaşılıp ulaşılmadığını ve önlemin tasarlandığı gibi yürütülüp yürütülmediğini kontrol edin.", "cardHowTo": "Hedefe karşı sonucu kaydedin ve süreci sahada doğrulayın — yalnızca kağıt üzerinde değil." },
  "8": { "cardPurpose": "Düzeltmeyi işin gerçekten yapılma biçimine kilitleyin ve aynı hatanın olabileceği her yere yaygınlaştırın.", "cardHowTo": "İlgili standart dokümanları güncellendi olarak işaretleyin ve yokoten tablosunda nereye uygulanacağını belirtin." }
}
```

EN (bu oturumda birlikte yazılan çeviri — TR ile aynı anlam, ayrı ayrı görsel onay
gerekmiyor, bu projenin i18n içeriği için hiçbir zaman istenmedi):

```json
{
  "1": { "cardPurpose": "State the gap between the standard and what's actually happening, in a number, a unit and a baseline period — not an opinion.", "cardHowTo": "Start with a gap statement: what should be happening, what actually is, and by how much." },
  "2": { "cardPurpose": "Narrow the problem to one specific slice — one machine, one shift, one failure mode — before asking why.", "cardHowTo": "Add a Pareto, trend, check sheet or stratification entry backed by real data." },
  "3": { "cardPurpose": "Commit to a measurable target before searching for causes — the step most often skipped in practice.", "cardHowTo": "Add a SMART target: metric, baseline, target value, unit and due date." },
  "4": { "cardPurpose": "Ask why, repeatedly, until you reach a systemic, changeable factor — never a person to blame.", "cardHowTo": "Build a Fishbone or 5-Why chain from the point of cause Step 2 found, and verify the result." },
  "5": { "cardPurpose": "Choose what to change and defend why it beats the alternatives — every countermeasure traces back to a verified root cause.", "cardHowTo": "Add a countermeasure linked to a Step 4 root cause, ranked in the error-proofing hierarchy." },
  "6": { "cardPurpose": "Turn countermeasures into concrete actions with a named owner and a due date, and follow through.", "cardHowTo": "Log each action item and mark it done only when it's actually done." },
  "7": { "cardPurpose": "Check whether the Step 3 target was met and the countermeasure ran as designed — not just whether the number moved.", "cardHowTo": "Record the result against the target and confirm the process on the floor, not just on paper." },
  "8": { "cardPurpose": "Lock the fix into how work is actually done, and spread it to every place the same failure could happen.", "cardHowTo": "Mark the relevant standard documents updated and list where else this applies (yokoten)." }
}
```

### 2.4 "A3 Önizleme" düğmesi — D-133'ün YENİDEN KULLANIMI, yeni mekanizma DEĞİL

`StepOverview`'ın başlık satırına bir düğme: `t("workspace.stepOverview.openA3Preview")`
(TR: "A3 Önizleme", EN: "A3 Preview"). Tıklanınca `RightPanel.tsx`'in bugün "Yeni pencerede
aç" için yaptığının AYNISI: `openOrFocusA3PreviewWindow()` + gerekiyorsa
`pushDescriptorToPreviewWindow`/`listenForPreviewReady`. **Yeni bir IPC/pencere mekanizması
YAZILMAYACAK** — `a3PreviewWindow/window.ts`'ten doğrudan import.

### 2.5 Yeni bileşen: `StepQuickJump.tsx` (hızlı-atlama şeridi)

`WorkspaceShell`, `activeStepId !== null` iken `StepPage`'in ÜSTÜNE bunu render eder (merkez
sütun içinde, `StepPage`'in kendisiyle aynı flex-column konteynerde).

- Sol taraf: "İniş" düğmesi (`workspace.quickJump.backToOverview`, TR: "İniş", EN:
  "Overview"; `aria-label` ayrı bir key: `workspace.quickJump.backToOverviewAriaLabel`, TR:
  "İniş görünümüne dön", EN: "Back to step overview") — `setActiveStep(null)`.
- Sağ taraf: sekiz düğme, her biri `t("workspace.stepNumberLabel", { step })` metni + D-41'in
  ■/▲/● glyph'i (bkz. `src/methods/shared/statusGlyph.ts` — AMA DİKKAT: `statusGlyph.ts`'in
  `positive`/`caution`/`negative` tonları `A3TextTone`'dur, `StepStatus`
  (`empty`/`inProgress`/`complete`/`flagged`) DEĞİL. Doğrudan import ETMEYİN — maket bu iki
  vokabüleri elle eşledi: `complete → ■`, `flagged → ▲`, `empty → ●` (soluk/hollow). Bu
  eşleme `StepQuickJump.tsx`'in kendi küçük, yerel bir sabiti olsun, `statusGlyph.ts`'i
  import etmeye ÇALIŞMAYIN — anlamsal olarak farklı iki enum'u zorla birleştirmek olur).
  `aria-label`: `t("workspace.stepAriaLabel", { step, name })` (mevcut key).
  Tıklama: `onNavigate(stepId)` (WorkspaceShell'in `handleNavigate`'i).
- Aktif adım vurgusu: `stepId === activeStepId` → dolu accent arkaplan (mevcut `Badge`'in
  `flagged` vurgusuna benzer bir görsel ağırlık, ama bu şeridin kendi stili — D-218'in yeni
  token'larını kullanır).

### 2.6 Adım sayfası başlığı — "ADIM-4. KÖK NEDEN ANALİZİ"

`StepPage.tsx`'teki:
```tsx
<h1 className="...">{stepId}. {t(`workspace.steps.${stepId}.name`)}</h1>
```
yerine:
```tsx
const { i18n } = useTranslation();
const stepLabel = t("workspace.stepNumberLabel", { step: stepId });
const stepName = t(`workspace.steps.${stepId}.name`);
const title = `${stepLabel}. ${stepName}`.toLocaleUpperCase(i18n.language === "tr" ? "tr" : undefined);
```
**Neden `i18n.language`, `project.meta.language` DEĞİL**: başlık arayüz kromu (chrome) —
`workspace.steps.{N}.name` zaten `t()` ile, yani aktif ARAYÜZ diliyle okunuyor; dışa
aktarılan A3 içeriğinin kendi dili (`project.meta.language`, D-188) ayrı bir kavram, burada
karıştırılmamalı.

**Neden `.toLocaleUpperCase(...)`, düz `.toUpperCase()` DEĞİL**: Türkçe küçük "i" büyütülünce
noktalı "İ" olmalı (`"analizi"` → `"ANALİZİ"`), ama `.toUpperCase()` bunu İngilizce kural
kullanarak yanlış yapar (`"ANALIZI"`, noktasız I). Bu proje CLAUDE.md'nin kendi "Turkish
characters... will be tested with real Turkish data" uyarısını taşıyor — burası tam olarak o
sınıfın bir örneği. Bir regresyon testi yazın: `"Kök Neden Analizi"` + `"tr"` →
`"KÖK NEDEN ANALİZİ"` (`"ANALIZI"` değil).

### 2.7 `workspace.stepNumberLabel` — üç yerde de kullanılan TEK key

Kart, şerit ve başlık — üçü de AYNI `workspace.stepNumberLabel` key'ini okur (D-114'ün "iki
temsil, tek kaynak" disiplini): TR `"Adım-{{step}}"`, EN `"Step-{{step}}"`.

### 2.8 `AssistantPanel.tsx` — null-safety düzeltmesi (zorunlu, küçük)

`activeStepId: StepId | null` olduğunda `AssistantPanel`'in bugünkü
`project.steps[activeStepId]` (satır ~131) ve `buildAddEntryCommand(step, activeStepId, ...)`
(satır ~145) **tip hatası verir** — bu RightPanel'in kendisi DEĞİŞMİYOR (§2.4'ün "RightPanel
LOCKED" kararı bozulmuyor), yalnızca paylaştığı state'in tipi değiştiği için kaçınılmaz bir
düzeltme:

- `handleAccept`'in başına guard: `if (state.phase !== "done" || !project || activeStepId === null) return;`
- Accept düğmesi `disabled={!editedText.trim() || activeStepId === null}` olsun.
- `activeStepId === null` iken küçük bir ipucu metni göster: YENİ key
  `workspace.assistant.noActiveStep` (TR: "Bu yanıtı bir adıma eklemek için önce iniş
  görünümünden bir adım seçin.", EN: "Select a step from the overview first to add this
  response.").

Bu, RightPanel'in "Asistan" sekmesinin davranışını YENİDEN TASARLAMIYOR — yalnızca "hiçbir
adım seçili değilken buraya bir şey eklenemez" gerçeğini kullanıcıya söylüyor. W2'nin kendi
işi (P-59) bu sekmeyi adım-bağlamlı hale getirmek; bu düzeltme yalnızca çökmeyi/tip hatasını
önlüyor.

### 2.9 Görsel token'lar — D-218'in somut değerleri, KATKISAL (additive) olarak eklenir

`src/index.css`'in `@theme` bloğuna YENİ, `--color-fp-*` önekli token'lar eklenir — MEVCUT
`--color-surface`/`--color-ink`/`--color-accent`/vb. HİÇBİRİ değişmez, silinmez,
yeniden adlandırılmaz:

```css
@theme {
  /* ... mevcut token'lar DOKUNULMADAN kalır ... */

  /* Farplas kurumsal kimliği — YALNIZCA StepOverview/StepQuickJump/StepPage başlığı
   * kullanır (D-218). Uygulamanın geri kalanı hâlâ yukarıdaki --color-accent/vb.'yi
   * kullanır — bu kasıtlı, geçici bir ikili durum (P-58 kapanana kadar). */
  --color-fp-teal: #2e9aae;
  --color-fp-teal-deep: #22808f;
  --color-fp-red: #da2032;
  --color-fp-charcoal: #3b3d42;
  --color-fp-gray-dark: #808080;
  --color-fp-gray-mid: #b0b0b0;
  --color-fp-gray-light: #d9d9d9;

  --font-fp-display: "Source Sans 3", sans-serif;
}
```

**Karanlık tema değerleri Barış'a HİÇ gösterilmedi** — maket yalnızca açık temada
onaylandı; yukarıdaki `--color-fp-*` değerlerinin karanlık temadaki karşılıkları (mockup'ta
denenen `#59c2d6`/`#ef6b78`/vb.) benim kendi tahminimdi, GÖRSEL OLARAK DOĞRULANMADI. Bu iki
bileşen `ThemeProvider`'ın karanlık temasında gerçekten okunur/tutarlı mı — build session
kendi gözüyle kontrol etmeli, gerekirse yeni bir kısa görsel tur (yalnızca karanlık tema için)
açılabilir.

**Yazı tipi — self-hosted, Google Fonts CDN DEĞİL**: maket yalnızca Artifact ortamının
CSP'si Google Fonts'a izin verdiği için CDN linki kullandı; gerçek uygulama çevrimdışı
çalışabilmeli (SPEC'in kendi ilkesi). `@fontsource/source-sans-3` paketini kurun
(`npm install @fontsource/source-sans-3`), `src/index.css`'e mevcut üç fontun yanına aynı
desenle ekleyin:
```css
@import "@fontsource/source-sans-3/300.css";
@import "@fontsource/source-sans-3/400.css";
@import "@fontsource/source-sans-3/600.css";
@import "@fontsource/source-sans-3/700.css";
```

**Köşe yuvarlaklığı/gölge**: yeni özel token İCAT ETMEYİN — Tailwind v4'ün kendi varsayılan
skalasını (`rounded-xl`/`rounded-2xl`, `shadow-sm`/`shadow-lg`) doğrudan kullanın. Maket
"16-20px kart, 10-12px kontrol" göstergesini kabaca Tailwind'in `rounded-2xl`/`rounded-lg`
karşılıklarıyla eşleyin — piksel-kusursuz eşleşme gerekmiyor, D-218'in kendi metni de bunu
tam bir sabit olarak vermiyor.

### 2.10 Alt "A3 blok önizlemesi" bandı — GERÇEK KODA GİRMEYECEK

Maket, bu bandın (W3'ün gerçek işi) sayfanın altında geniş bir şerit olarak oturacağını
DOĞRULADI — ama bunun bir "yakında" yer tutucusu olarak GERÇEK ÜRÜNE girmesi ÖNERİLMİYOR
(D-218): yarım kalmış bir özellik izlenimi verir. **Bu oturum bu bandı YAZMAZ.** W3 kendi
launch prompt'unda bu yerleşim kararını (altta, tam genişlik, `StepPage`'in bantlarının
altında) miras alır.

---

## 3. Kapsam dışı

- W2 (adım sayfasının kendisi — sayfa-içi entry düzenleme, `EntryEditorDialog`'un taşınması)
  ve W3 (canlı kırpılmış önizleme) — DEĞİŞMEDEN kalır.
- `RightPanel`'in altı sekmesinin davranışı — §2.8'in AssistantPanel düzeltmesi HARİÇ,
  hiçbiri yeniden tasarlanmıyor.
- Adım-özel AI destek chatbox'ı (P-59) — W2'nin kendi launch prompt'una eklenecek, bugün
  değil.
- D-218'in yeni görsel yönünün uygulamanın geri kalanına (Button/Badge/Input/Select/Dialog/
  StepTick/ThemeToggle) yayılması (P-58) — kendi ayrı, büyük bir dilim, bugün değil.
- Coaching içeriğinin (`step-N.md`) kendisi — değişmiyor, yalnızca kart metninin kaynağı
  (§2.3) ondan BAĞIMSIZ yeni içerik.
- Karanlık temanın Farplas token'ları için görsel onayı — §2.9'un kendi notu, gerekirse ayrı
  bir kısa tur.

---

## 4. Bütçe ve kapanış disiplini

Tasarım zaten onaylı — bu saf bir uygulama oturumu, yeni bir mockup turu GEREKMİYOR. Kaba
tahmin: ~3 yeni dosya (`StepOverview.tsx`, `StepQuickJump.tsx`, ikisinin testleri) + ~5
değişen dosya (`WorkspaceShell.tsx`, `StepPage.tsx`, `AssistantPanel.tsx`,
`projectStore.ts`, `src/index.css`) + i18n eklemeleri + `StepStepper.tsx`/`.test.tsx` silme +
mevcut testlerde `activeStepId` varsayımı düzeltmeleri.

Kapanışta:
- `npm test` yeşil, **exit code ayrıca `echo $?` ile kontrol edilsin** (D-143'ün kendi
  dersi — yalnızca "N/N" yazısına güvenmeyin), `npm run lint`/`npm run build` temiz.
- `cargo test`/`cargo clippy --all-targets -- -D warnings`/`cargo fmt -- --check` yeniden
  çalıştırılsın (doğrulama amaçlı — bu dilim TS/React-only, Rust'a dokunmuyor, `git status
  src-tauri/` boş kalmalı).
- `DECISIONS.md`'ye yeni bir D-numarası — bu oturumun GERÇEK kod değişikliklerini, test
  sayılarını, ve §2.9'un dark-mode notunun durumunu kaydeder.
- `docs/oturumlar/README.md`'nin W1 satırı "✅ BİTTİ" olarak güncellenir.
- `CLAUDE.md`'nin "Current state"ine kısa özet.
- `SPEC.md` §2.2'nin "Left rail" paragrafı, yeni iniş görünümü + hızlı-atlama modelini
  yansıtacak şekilde düzeltilir (W1-adim-genel-bakis.md'nin kendi §4'ünün sözü verdiği iş —
  o dosya kod yazılmadığı için bunu erteledi, gerçek kod artık var, şimdi düzeltilmeli).
- W2'nin kendi launch prompt'u bu kapanışta yazılabilir (K1'in kendi launch prompt'unun
  D-213 ile aynı oturumda yazılması emsali) — artık P-59'un (adım-özel AI chatbox) kapsamını
  da taşıyacak.

---

**Model önerisi**: Bu tamamen mekanik bir uygulama oturumu (tasarım kararları zaten D-218'de
sabit) — Sonnet 5 yeterli, Opus'a gerek yok.
