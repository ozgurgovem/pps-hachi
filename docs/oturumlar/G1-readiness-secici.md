# OTURUM G1 — Readiness seçicisi + sekiz gate kuralı + StepStepper/StepPage arayüzü (Faz 7'nin ilk dilimi)

> `docs/oturumlar/faz7-kapsam-belirleme.md`'nin kapsam belirleme oturumu **BİTTİ**
> 2026-08-19 (D-195) — sekiz gate kuralının (SPEC.md §1.2 S1-S8) her biri gerçek koda
> karşı doğrulandı, üç dilime bölündü (G1/G2/G3), üç gerçek açık tasarım sorusu
> `AskUserQuestion` ile Barış'a soruldu ve cevaplandı. Bu dosya **G1**'in kapsamıdır:
> `src/domain/readiness/` seçici modülü (D-53'ün zaten kilitlediği tasarım: derived,
> never stored) + sekiz kuralın hepsi + `StepStepper`'ın `complete`/`flagged` durumları
> (Badge zaten hazır, kullanılmıyor) + `StepPage`'in amber advisory'si. **G1'in kendi
> tek yeni mekanizması** (D-114) — readiness seçicisi ve onu tüketen iki arayüz noktası;
> geri kalan yedi kuralın verisi zaten var, yalnızca okunuyor.
>
> **G1'in kendi açık sorusu var, kodlamadan önce sorulmalı** (§2.1) — S1 (gap
> sayısallaştırma) hiçbir Step 1 metodunda yapılandırılmış alan taşımıyor, bu session
> prompt'unun kendisi bir öneri yapmıyor, üç gerçek seçenek var.
>
> Kanonik konum: `docs/oturumlar/G1-readiness-secici.md`. Yazıldı: 2026-08-19,
> kapsam belirleme oturumunun kapanışının hemen ardından, Barış'ın açık isteğiyle
> ("yeni oturum için promptu paylaşır mısın?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md docs/oturumlar/faz7-kapsam-belirleme.md \
      src/domain/model/stepState.ts src/domain/model/entry.ts \
      src/methods/types.ts src/methods/registry.ts \
      src/ui/Badge.tsx \
      src/app/routes/workspace/stepStatus.ts \
      src/app/routes/workspace/StepStepper.tsx \
      src/app/routes/workspace/StepPage.tsx \
      src/app/routes/workspace/WorkspaceShell.tsx \
      src/app/routes/workspace/RoundsBand.tsx \
      src/methods/gapStatement/schema.ts \
      src/methods/problemImpact/schema.ts \
      src/methods/pointOfCause/index.ts \
      src/methods/smartTarget/schema.ts \
      src/methods/hypothesisVerification/schema.ts src/methods/hypothesisVerification/columns.ts \
      src/methods/whyWhyTree/schema.ts \
      src/methods/errorProofingHierarchy/schema.ts src/methods/errorProofingHierarchy/levels.ts \
      src/methods/countermeasure/index.ts \
      src/methods/actionItem/schema.ts \
      src/methods/resultVerdict/fields.ts \
      src/methods/sustainmentAudit/schema.ts \
      src/methods/documentUpdatesTracker/schema.ts \
      src/methods/yokotenTracker/schema.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-19'da
doğrulandı, kapsam belirleme oturumunun kapanışının hemen ardından.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (plan onayı, TDD,
   i18n), ve "Current state"in **Faz 7** paragrafı (D-195'in özeti).
3. `docs/oturumlar/faz7-kapsam-belirleme.md` — kapsam belirleme oturumunun kendi
   promptu, özellikle §1 madde 5'in S1-S8 tablosu (bu G1'in ham verisi).
4. `DECISIONS.md`: **D-195** (bu dilimin kaynağı — sekiz kuralın kod karşılığı + üç
   `AskUserQuestion` cevabı, tam metin), **D-53** (`readiness` asla saklanmaz, seçici
   olarak yaşar — bu G1'in mimari çerçevesi, yeniden tartışılmaz), **D-85**
   (`StepStatus`'un hâlâ yalnızca `empty`/`inProgress` döndürdüğü — bunu genişletmek bu
   dilimin işi), **D-116/D-117** (referans + orphan seçicileri, S2/S5'in çapraz-entry
   okumaları bunlara benzer bir desen kullanır ama bunlara dokunmaz), **D-192**
   (rounds/signOff — `RoundsBand`'in "Yeni analiz turu başlat" kontrolü **LOCKED** ve
   kasıtlı olarak koşulsuz, S7'nin gate kuralı bu davranışa dokunmaz, yalnızca okur).
5. `SPEC.md` §1.2 (satır 56-81) — sekiz kuralın kelimesi kelimesine metni, D-195'in
   tablosuyla yan yana oku.

---

## 2. Kapsam

### 2.1 Açık soru — KODLAMADAN ÖNCE `AskUserQuestion` ile Barış'a sorulmalı

S1: "gap must be quantified (a number + unit + baseline period). A problem statement
with no number is flagged." Kapsam belirleme oturumunun bulduğu gerçek: hiçbir Step 1
metodu (ne Step 1'in varsayılanı `gapStatement`, ne `fiveG5N1K`, ne `fiveN1K`, ne
`problemImpact`) yapılandırılmış bir sayı+birim+baseline-dönem alanı taşımıyor.
`gapStatement`'ın üç alanı (`ideal`/`actual`/`gap`) serbest metin; `problemImpact`'in
sayısal alanları (`monthlyLoss`/`yearlyLoss`, ayrıca `unit` + Pareto `categories[].count`)
finansal etki taşıyor, sorunun kendi büyüklüğünü değil, ve `problemImpact` zaten
opsiyonel bir ek (garanti panel değil). Bu prompt bir öneri **yapmıyor** — üç gerçek
seçenek var, C5'in kendi §2.3 hassasiyetiyle aynı düzeyde bir tasarım kararı:

- **Seçenek A — `gapStatement`'a yeni yapılandırılmış alanlar ekle.** Örn.
  `baselineValue: number`, `actualValue: number`, `unit: string`, `baselinePeriod:
  string` — mevcut üç serbest-metin alanının (`ideal`/`actual`/`gap`) YANINA, S3'ün
  `smartTarget`'ıyla aynı desen (D-38, açık sayısal alanlar). En doğru SPEC okuması,
  ama Phase 1'den beri şipping edilmiş bir varsayılan metodun şemasına dokunuyor —
  Editor UI + i18n + (additive olduğu için migration gerekmez, D-52) eklenmesi
  gerekiyor. `fiveG5N1K` (SPEC §3.0'ın Türkiye'ye özgü varsayılanı) da aynı boşluğu
  taşıyor — bu seçenek ikisine de mi uygulanır, yoksa yalnızca `gapStatement`'a mı?
- **Seçenek B — `gap` serbest metninden sayı ayrıştır (regex).** Hiçbir şemaya
  dokunmaz, en ucuz, ama kırılgan — "%4,2" gibi bir Türkçe ondalık formatını, birimi
  (adet/dk/₺) ayrı okumayı, "geçen ay" gibi bir baseline dönemini metinden güvenilir
  ayrıştırmak gerçek bir doğrulama değil, bir tahmin. S3'ün kendi tasarımı
  (`smartTarget`'ın AÇIK alanları, metin ayrıştırma değil) bu seçeneğe karşı bir emsal.
- **Seçenek C — Step 1'de HERHANGİ bir sayısal-veri-taşıyan entry varlığını yeterli
  say.** `problemImpact.categories.length > 0` (veya benzeri) S1'i geçirir — S4'ün
  "iki bağımsız sinyal" çözümüyle aynı aile. En ucuz kod, ama sorunun KENDİSİNİN
  sayısallaştırıldığını garanti etmez — kullanıcı alakasız bir maliyet paneli ekleyip
  gap'in kendisini hiç sayısallaştırmadan S1'i geçebilir, SPEC'in niyetini (gap'in
  ölçülmesi) atlıyor.

### 2.2 Readiness seçici modülü — `src/domain/readiness/`

D-53'ün kilitlediği tasarım: `readiness` hiçbir zaman `ProjectModel`'de saklanmaz,
`entries`'ten türetilen bir seçici dönüş tipi olarak yaşar (`StepState.readiness`
`stepState.ts`'in kendi yorumunda zaten bu modülü adlandırıyor). Kapsam belirleme
oturumunun doğruladığı sekiz kuralın veri kaynağı — 2.1'in cevabı S1'i netleştirdikten
sonra hepsi mekanik:

| Kural | Veri kaynağı |
|---|---|
| S1 | §2.1'in cevabına bağlı |
| S2 | Step 2'de `methodId` ∈ {`"pareto"`, `"trend"`, `"check-sheet"`, `"stratification-matrix"`} olan en az bir entry VAR MI + Step 2'de `methodId === "point-of-cause"` olan en az bir entry VAR MI (ikisi ayrı, ikisi de yoksa iki farklı flag mesajı — SPEC iki ayrı cümle) |
| S3 | Step 3'teki `smart-target` entry'(leri)nin `metric`/`baseline`/`target`/`unit`/`dueDate` alanlarının hepsi dolu mu (`smartTarget/schema.ts`) |
| S4 | Step 4'te `methodId === "hypothesis-verification"` olan entry'lerin `rows[].verdict === "confirmed"` VEYA `methodId === "why-why-tree"` olan entry'lerin `nodes[].outcome === "confirmedRootCause"` (`WHY_WHY_OUTCOMES`, `whyWhyTree/schema.ts`) — ikisinden biri yeterli (Barış'ın cevabı, D-195) |
| S5 | Step 5'teki her `countermeasure` entry'sinin `references[]`'ında `role === "rootCause"` VAR MI + (o countermeasure'a `role: "countermeasure"` ile bağlı `error-proofing-hierarchy` entry'si VARSA) `level === "procedure"` (en zayıf, `levels.ts`) İKEN `note` boş mu — çapraz-entry okuma, `findReferencesTo`'nun (D-117) yaptığına benzer bir tarama gerekir ama kendi mantığı |
| S6 | Step 6'daki her `action-item` entry'sinin `owner`/`dueDate` alanları dolu mu |
| S7 | Step 7'de `methodId === "sustainment-audit"` olan entry'lerin `rows.length === 0` mu (mekanik "boş" kontrolü) — `RoundsBand`/`resultVerdict`'e DOKUNULMAZ, yalnızca okunur |
| S8 | Step 8'de `document-updates-tracker` entry'sinin 7 sabit kategorisinden (`pfmea`/`controlPlan`/`workInstruction`/`inspectionStandard`/`trainingCompetence`/`layeredProcessAudit`/…) en az biri dolu mu + `yokoten-tracker` entry'(leri)nin `rows.length === 0` mu |

Seçicinin dönüş tipi (`ReadinessResult` veya benzeri) ve tam imzası bu oturumun kendi
implementasyon kararı — `stepState.ts`'in kendi yorumu bir başlangıç noktası veriyor
("computed from `entries`") ama kesinleştirmiyor. Bir adımın readiness'i muhtemelen
`{ status: "ok" | "flagged"; warnings: readonly string[] }` şeklinde bir şey olur —
i18n'li mesaj metinleri değil, mesaj **anahtarları** (`workspace.readiness.s1`, vb.)
taşımalı, çünkü SPEC'in coach-content dosyaları zaten `src/content/coaching/{tr,en}/`
altında ayrı yaşıyor (CLAUDE.md'nin kendi kuralı: "All user-facing strings go through
i18next").

### 2.3 `StepStepper`'ın `complete`/`flagged` durumları

`src/ui/Badge.tsx` zaten `complete`/`flagged` variant'larını tanımlı tutuyor, hiç
kullanılmıyor — bu G1'in UI maliyetini düşürüyor, yeni bir Badge variant'ı **eklemek
gerekmiyor**. `stepStatus.ts`'in D-85'in işaretlediği `StepStatus` tipi (`"empty" |
"inProgress"`) genişletilmeli (`"complete" | "flagged"` eklenir) — bir adımın hangi
durumda olduğu artık yalnızca `entries.length` değil, 2.2'nin readiness sonucuna da
bakmalı: `flagged` (readiness uyarısı varsa) > `inProgress` (entry var, uyarı yok) >
`empty` (entry yok). `complete` durumunun kesin tanımı ("tüm entry'ler dolu VE hiç
readiness uyarısı yok" mu, yoksa "en az bir entry var VE hiç uyarı yok" mu — SPEC bunu
netleştirmiyor) da bu oturumun kendi kararı; belirsizse Barış'a sor.

### 2.4 `StepPage`'in amber advisory'si

`StepPage.tsx`'in **zaten** bir `advisory: string | null` prop'u var, ama bu **farklı
bir amaç için** kullanılıyor — `WorkspaceShell.tsx`'in `advisoryStepId` state'i, boş bir
adıma atlarken gösterilen bir "bu normal, endişelenme" mesajı (SPEC §2.2'nin "jumping to
a step with no entries yet is always allowed" cümlesi). SPEC'in S1-S8 için istediği amber
advisory ("Failing a rule shows a non-blocking amber advisory in the step header") **ayrı
bir kavram** — aynı adımda aynı anda iki farklı advisory gösterilebilir mi (boşluk +
readiness uyarısı), yoksa `advisory` prop'u ikisini birden mi taşımalı (öncelik sırası
gerekir) — bu implementasyon kararı bu oturumun işi. `<p role="status">` biçemi zaten
var, yeniden kullanılabilir.

---

## 3. Kapsam dışı (bu oturumda kesinlikle inşa EDİLMEZ)

- **G2** — Traceability görünümü (RightPanel'in 3. sekmesi, D-195'in Barış'ın cevabı).
  G1'in ürettiği readiness verisini okuyacak ama G1'in kendi işi değil, ayrı oturum.
- **G3** — "Provisional" A3 kenar işareti (D-165/D-41'in üçüncü görsel katmanı). Kendi
  Block Visual Verification Loop turunu gerektiriyor, G1'in readiness verisini tüketecek
  ama bu oturumda `HtmlA3Renderer.tsx`/`buildA3Layout.ts`'e DOKUNULMAZ.
- **`RoundsBand`/`SignOffPanel`'in kendi davranışı** — D-192 LOCKED, S7'nin gate kuralı
  yalnızca okur, `RoundsBand`'in "Yeni analiz turu başlat" kontrolünü koşullu hale
  getirmek bu oturumun işi DEĞİL (D-192'nin kendi kasıtlı tasarımı: manuel ve koşulsuz).
- Coaching **içeriğinin** kendisi (`src/content/coaching/*.md`) — Faz 3'te zaten
  yazıldı; readiness mesajları için yeni i18n anahtarları eklenir ama coaching
  metodolojisi bu oturumda yeniden yazılmaz.
- Şablon geometrisi (`src/a3/templates/*`) — D-95, Faz 11.

---

## 4. Bütçe ve kapanış disiplini

Açık soru (§2.1) **hemen, kodlamadan önce** `AskUserQuestion` ile sorulur — cevap
gelmeden yazılan seçici yeniden yapılır (bu repo'nun kendi tekrarlanan dersi, C5/C6/6d
hepsi aynı sırayı izledi). Sonrasında TDD: seçici saf fonksiyonlardır, her kural için
ayrı test (dokuz test dosyası kadar küçük parçalar yerine `readiness.test.ts` içinde
sekiz `describe` bloğu daha okunabilir olabilir — karar implementasyonun kendi işi).
`npm test`/`npm run lint`/`npm run build` ve `cargo test`/`cargo clippy`/`cargo fmt`
hepsi yeşil olmadan iş bitmiş sayılmaz (D-143'ün dersi: exit code'u ayrı kontrol et,
`tail`'e pipe'lama).

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin Faz 7
tablosuna G1 satırının durumu güncellenir, `CLAUDE.md`'nin Current state'ine G1'in özeti
eklenir. **G2'nin kendi prompt dosyası mı yazılacak yoksa bu dosyanın kendi deseni mi
tekrar kullanılacak** — o karar G1'in kapanışında verilir.

---

**Model önerisi:** Sonnet 5 yeterli — D-53 mimari kararı zaten kilitli, bu oturum onu
uyguluyor, yeni bir mimari mekanizma tasarlamıyor (D-28'in Opus'u önerdiği sınıfa
oturmuyor). §2.1'in açık sorusu bir ürün/UX kararı, derin mimari muhakeme gerektirmiyor —
`AskUserQuestion` ile Sonnet üzerinde de çözülebilir, C2-C4'ün kendi emsaliyle aynı.
