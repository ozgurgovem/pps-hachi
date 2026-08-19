# FAZ 7 — Kapsam belirleme (kod YAZILMAZ, yalnızca ölçüm + dilim planı)

> D-114'ün beş dilimi (6a–6e) ve `SPEC.md`'nin kendi Faz 6 planı 2026-08-19'da tamamen
> kapandı (Oturum 6e-2, D-194). `SPEC.md` §6'nın kendi faz tablosu sırada **Faz 7**'yi
> gösteriyor: "Coaching content, readiness rules, traceability view, step-7→4 loop,
> appendix overflow — Done when: All gate rules fire correctly against a
> deliberately-bad test project."
>
> Bu **Oturum A'nın kendi emsali**: ölçüm + karar, kod yok. D-149 (arayüz planı) ve
> D-114 (Faz 6 planı) ikisi de kendi işlerine tam olarak böyle başladı — önce oku ve
> ölç, sonra dilimlere böl, sonra Barış'a sun, sonra kodla. Faz 7'yi tek oturumda
> yazmaya kalkışmak Anayasa Madde 1/G1'in (bütçesiz büyük iş) tam kendisi: dört ayrı
> alt-teslimat (gate kuralları, traceability görünümü, step-7→4 döngüsü, appendix
> overflow) tek cümlede sıralanmış görünüyor ama veri modeli açısından birbirinden çok
> farklı olgunlukta — bazıları zaten var, bazıları hiç yok.
>
> Kanonik konum: `docs/oturumlar/faz7-kapsam-belirleme.md`. Yazıldı: 2026-08-19,
> 6e-2'nin kapanışının hemen ardından, Barış'ın açık isteğiyle ("yeni oturum için
> prompt verir misin?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      src/domain/model/stepState.ts \
      src/domain/model/entry.ts \
      src/domain/model/reference.ts \
      src/domain/selectors/index.ts \
      src/methods/registry.ts src/methods/types.ts \
      src/app/routes/workspace/StepPage.tsx \
      src/app/routes/workspace/RoundsBand.tsx \
      src/app/routes/workspace/SignOffPanel.tsx \
      src/app/routes/workspace/EntryReferenceField.tsx \
      src/methods/actionItem/schema.ts \
      src/methods/resultVerdict/fields.ts \
      src/methods/hypothesisVerification/schema.ts \
      src/a3/buildA3Layout.ts \
      package.json
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-19'da
doğrulandı, Oturum 6e-2'nin kapanışının hemen ardından.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md`. **`AKIS.md`'yi bu oturum okumana gerek YOK** — bu oturum kod
   yazmıyor, yalnızca okuyor ve `docs/`/`DECISIONS.md`'ye yazıyor (istisna: eğer okuma
   sonunda "aslında küçük, tek dilimlik bir iş" sonucuna varırsan ve Barış aynı
   oturumda kodlamanı isterse, o noktada dur ve `AKIS.md`'yi oku).
2. `SPEC.md` §1.2 (satır 56-81, sekiz gate kuralı S1-S8, kelimesi kelimesine) ve §4.2'nin
   traceability paragrafı (satır 482-484: "renders these as a traceability view... warns
   on orphans... this traceability chain is what an IATF auditor asks for, and no
   generic A3 tool provides it — make it a headline feature"). §6'nın kendi Faz 7 satırı
   (satır 553) ve Faz 8-10'un "Phases 8–10 are additive" notu (satır 562-564) — Faz 7
   AI katmanından önceki SON faz, yani ondan sonra üç AI fazı geliyor.
3. `CLAUDE.md`'nin "Current state"inin en üstteki özet satırı (artık "Phase: 6 of 12 —
   DONE") ve D-53/D-85'i anan her not — bunlar "Faz 7'nin kendi işi" diye ileri atılmış
   gerçek referanslar, kelimesi kelimesine ne beklendiğini gösteriyorlar:
   - `src/domain/model/stepState.ts`'in kendi yorum bloğu: `readiness` D-53 tarafından
     bilinçli olarak **saklanmıyor** — "derived, not stored", `src/domain/readiness/`
     adında (henüz var olmayan) bir seçici modülünde yaşaması planlanmış.
   - `src/methods/types.ts`'in `readiness` alanı hâlâ "Phase 7's gate rules" notuyla
     bilinçli olarak yok.
   - D-116/D-124/D-125/D-126 (hepsi referans altyapısını kurarken) tekrar tekrar "Phase
     7's traceability view" diyor — yani referans **verisi** (D-116) çoktan var,
     **görünüm** yok. `findOrphanedReferences`/`findReferencesTo`/
     `listReferenceableEntries` (`src/domain/selectors/`) zaten hazır seçiciler.
4. `DECISIONS.md`: D-53, D-58 (rounds/signOff, 6d'de bağlandı), D-85 (step durumları —
   şu an yalnızca empty/inProgress, complete/flagged Faz 7'yi bekliyor), D-100
   (appendix overflow mekanizması — **zaten var**, Faz 4'ten beri), D-116/D-117
   (referans + orphan seçicileri — **zaten var**), D-192 (6d'nin rounds/signOff +
   "Return to Step 4" manuel kontrolü — **zaten var**, `RoundsBand.tsx`). P-38 (days
   late — S6/S7 kapılarıyla kesişebilir), P-39 (whyWhyTree düğüm-seviyesi referans —
   S4'ün "kök neden verified" kuralıyla doğrudan kesişiyor, ertelenmiş).
5. Kendi taramanı yap (körü körüne bu listeye güvenme — D-137'nin kendi dersi): sekiz
   kuralın her biri hangi veriye ihtiyaç duyuyor, o veri hangi method'da var mı yok mu?
   Başlangıç noktası olarak bu oturumun kendi ön taraması (doğrulanmalı):

   | Kural | İhtiyaç duyduğu veri | 2026-08-19 itibariyle var mı? |
   |---|---|---|
   | S1 (gap sayısallaştırılmış) | sayı + birim + baseline dönem | `gapStatement`'ın alanları — kontrol et |
   | S2 (en az bir veri-temelli girdi + PoC var) | Step 2'de pareto/trend/checkSheet/stratification + `pointOfCause` referansı | `pointOfCause` zaten Step 2'nin referans hedefi (D-116) |
   | S3 (SMART hedef dolu) | `smartTarget`'ın metric/baseline/target/unit/dueDate alanları | muhtemelen zaten dolu-kontrolü yapılabilir bir şekilde var |
   | S4 (kök neden `verified=true`, 5-Why kişide bitmemiş) | bir `verified` alanı — **hiçbir root-cause method'unda `grep -rn "verified"` bulunamadı**, yalnızca bir yorumda geçiyor | **muhtemelen YOK** — `hypothesisVerification`'ın `confidencePercent`/`residualUncertainty`/`customerRelevance` (D-180) alanları bunun yerini tutuyor mu, yoksa ayrı bir alan mı gerekiyor, netleştirilmeli |
   | S5 (karşı önlem doğrulanmış köke bağlı + hiyerarşi gerekçesi) | `countermeasure`'ın `rootCause` referansı (var, D-116) + `errorProofingHierarchy`'nin gerekçe alanı | referans var, hiyerarşi gerekçesi kontrol edilmeli |
   | S6 (aksiyonun owner/dueDate'i) | `actionItem.owner`/`actionItem.dueDate` | **VAR** (`src/methods/actionItem/schema.ts`) |
   | S7 (process confirmation boş değil, "Return to Step 4") | `sustainmentAudit` (Adım 7'nin kendi audit log'u) + `RoundsBand` | döngü kontrolü **VAR** (D-192); "process confirmation boş" kontrolü netleştirilmeli |
   | S8 (döküman güncellendi + yokoten dolu) | `documentUpdatesTracker`/`yokotenTracker` (C4'te geldi) | veri var, "boş mu" kontrolü henüz hiçbir yerde okunmuyor |

6. `src/app/routes/workspace/StepPage.tsx`/`StepPage`'in çağırdığı `StepStepper` —
   D-85'in "empty/inProgress only this phase" notunun hâlâ doğru olup olmadığını kontrol
   et (6d/6e-1/6e-2 hiçbiri bu dosyaya dokunmadı, ama emin ol).

---

## 2. Bu oturumun işi

**Kod YAZMA.** Bu oturumun tek çıktısı: (1) yukarıdaki tabloyu gerçek koda karşı
doğrulanmış hale getirmek — her S1-S8 için "veri var / kısmen var / hiç yok" kesin
tespiti, (2) `docs/oturumlar/README.md`'nin "Faz 6'nın kendi dilimleri" bölümüne
benzer bir **Faz 7 dilim tablosu** önerisi (kaç dilim, hangi sırayla, hangi dilim hangi
yeni mekanizmayı taşıyor — D-114'ün "dilim başına bir yeni mekanizma" bütçesini
uygula), (3) gerçek açık tasarım sorularını `AskUserQuestion` ile Barış'a sormak.

### 2.1 Muhtemel gerçek açık sorular (kesin değil — dosyaları okuduktan sonra doğrula)

1. **S4'ün `verified` alanı nereden gelecek?** Yeni bir boolean alan mı (hangi
   method(lar)a — `whyWhyTree`, `faultTree`, `causeEffectMatrix`, `fiveWhy`,
   `threeLeggedFiveWhy`'ın hepsine mi, yoksa `hypothesisVerification`'ın zaten Oturum
   C1'de eklenen `confidencePercent`/`residualUncertainty` alanları mı bu işi zaten
   görüyor (bir eşik mi belirlenecek — örn. `confidencePercent >= 80` "verified" sayılır
   mı)? P-39 (whyWhyTree'nin düğüm-seviyesi doğrulama referans mimarisi, D-185'te
   kararlaştırıldı ama inşa edilmedi) bununla doğrudan kesişiyor — aynı oturumda mı
   çözülecek, yoksa bu gate kuralı P-39'un inşasını beklemeden `hypothesisVerification`
   entry-seviyesinde mi çalışacak?
2. **Traceability görünümü nerede yaşayacak?** Ayrı bir rota/sayfa mı (`/traceability`),
   yoksa `RightPanel`'in üçüncü bir sekmesi mi (Preview/Assistant'ın yanında), yoksa
   Step 8'in `SignOffPanel`'i gibi belirli bir adıma mı bağlı? SPEC "headline feature"
   diyor ama yerleşimini söylemiyor.
3. **"Provisional" A3 işareti nasıl görünür?** SPEC "the A3 preview marks the step
   provisional" diyor — bu, `HtmlA3Renderer`'da o bloğun kenarına bir işaret mi
   (yeni bir görsel dil, D-165/D-41'in üçüncü bir katmanı olur mu, yoksa mevcut
   şekil-kodlu durumu mu ödünç alır), yoksa yalnızca `StepStepper`'daki amber uyarı mı
   (A3'e hiç yansımıyor, yalnızca çalışma alanında)? SPEC'in kendi cümlesi ikisini de
   ima ediyor ("non-blocking amber advisory in the step header" VE "A3 preview marks
   the step provisional") — iki ayrı görsel mi, yoksa tek bir mekanizmanın iki
   yansıması mı?
4. **Dilim sayısı ve sırası.** Muhtemel aday bölünme (Barış'a önerilecek, kesin değil):
   - **G1** — `src/domain/readiness/` seçici modülü + sekiz kuralın hepsi (tek
     mekanizma: "readiness bir seçicidir, hiç saklanmaz", D-53'ün zaten kilitlediği
     tasarım) + `StepStepper`'ın complete/flagged durumları.
   - **G2** — Traceability görünümü (yeni bir UI yüzeyi, G1'in ürettiği veriyi okur).
   - **G3** — "Provisional" A3 işareti (D-102/D-165 sınıfı bir görsel karar, kendi
     Block Visual Verification Loop'unu hak eder — CLAUDE.md'nin kendi kuralı).
   - Step-7→4 döngüsü ve appendix overflow **muhtemelen ayrı dilim GEREKTİRMİYOR** —
     ikisi de zaten var (D-192, D-100); bu oturumun kendi görevi bunu doğrulamak,
     varsaymak değil.

### 2.2 Kapsam dışı (bu oturumda kesinlikle karara BAĞLANMAZ)

- Faz 8-10 (AI katmanı) — SPEC'in kendi "Phases 8–10 are additive" notu, Faz 7 bitmeden
  başlamaz.
- Coaching **içeriğinin** kendisi (`src/content/coaching/*.md`) — Faz 3'te zaten
  yazıldı (16 dosya). Faz 7'nin "Coaching content" bulletinin ne eklediği (gate
  durumuna göre farklı öğüt mü, yoksa yalnızca mevcut içeriğin kalite geçişi mi)
  belirsiz — bu oturumun kendi sorularından biri olabilir, ama İÇERİK YAZMAK bu
  oturumun işi değil.

---

## 3. Bütçe ve kapanış disiplini

Açılışta kaba bir tahmin ver (Anayasa Madde 1). Bu **ölçüm** oturumu — Oturum A'nın
kendi büyüklüğüyle kıyaslanabilir (tek oturumda bitti, kod yok). Sekiz kuralın veri
durumunu tek tek doğrulamak asıl iştir; tahmin etmek değil.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturumun kendi bulgu ve dilim
planı), `docs/oturumlar/README.md`'ye Faz 7'nin kendi dilim tablosu (Faz 6'nın "Faz
6'nın kendi dilimleri" bölümüne benzer yeni bir bölüm), `CLAUDE.md`'nin "Current
state"ine "Phase: 7 of 12 — kapsam belirlendi, henüz inşa edilmedi" türü bir güncelleme.
Kod yok, commit gerekmiyor ama docs değişikliği yine de commit'lenmeli (yalnızca docs
dokunduğu için düşük riskli — `AKIS.md`'nin kalıcı commit yetkisi burada da geçerli).

---

**Model önerisi:** Sonnet 5 yeterli — bu bir kod-yazma değil envanter/karar oturumu, en
ağır iş sekiz kuralın kod tabanında gerçekten karşılığı olup olmadığını doğrulamak
(grep + okuma), D-28'in Opus'u önerdiği "yeni mimari mekanizma tasarımı" profiline tam
oturmuyor — asıl mimari kararlar (readiness'ın nerede yaşayacağı) zaten D-53 tarafından
önceden kilitlenmiş, bu oturum onu uygulamıyor, yalnızca kapsamını çıkarıyor.
