# OTURUM G2 — Traceability görünümü (RightPanel'in 3. sekmesi, Faz 7'nin ikinci dilimi)

> `docs/oturumlar/G1-readiness-secici.md`'nin oturumu **BİTTİ** — 2026-08-20 (D-196):
> `src/domain/readiness/` seçici modülü + sekiz gate kuralının (S1-S8) hepsi +
> `StepStepper`'ın `complete`/`flagged` durumları + `StepPage`'in `ReadinessAdvisory`'si
> şipping edildi, `npm test` 1143/1143, tüm gate'ler yeşil. Bu dosya D-195'in üç
> dilimlik Faz 7 planının **G2**'sidir: Traceability görünümü. G3 ("provisional" A3
> kenar işareti, kendi Block Visual Verification Loop turunu gerektiren en pahalı
> dilim) hâlâ ayrı ve bu oturumun kapsamı DIŞINDA.
>
> **G2'nin kendi açık soruları var, kodlamadan önce sorulmalı** (§2.1) — SPEC.md'nin
> "show me the chain from problem to standard" cümlesi bir görsel/UI şekli
> belirtmiyor, ve bu oturumun kendi taraması gerçek referans grafiğinin SPEC'in
> "to standard" kısmının iddia ettiğinden daha eksik olduğunu buldu (aşağıya bkz.).
>
> Kanonik konum: `docs/oturumlar/G2-traceability-gorunumu.md`. Yazıldı: 2026-08-20,
> G1'in kapanışının hemen ardından, Barış'ın açık isteğiyle ("yeni oturum için
> promptu paylaşır mısın?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md docs/oturumlar/G1-readiness-secici.md \
      src/domain/readiness/index.ts src/domain/readiness/evaluateReadiness.ts \
      src/domain/selectors/index.ts src/domain/selectors/findOrphanedReferences.ts \
      src/domain/model/reference.ts src/domain/model/entry.ts src/domain/model/projectModel.ts \
      src/methods/registry.ts src/methods/types.ts \
      src/app/routes/workspace/RightPanel.tsx src/app/routes/workspace/StepStepper.tsx \
      src/ui/Tabs.tsx src/state/projectStore.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-20'de
doğrulandı, G1'in kapanışının hemen ardından.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (plan onayı, TDD,
   i18n), ve "Current state"in **G1** paragrafı (D-196'nın özeti — hangi seçici hangi
   şekilde inşa edildi, `readiness` modülünün `src/methods/*`'tan sıfır import taşıma
   kararı özellikle önemli, G2 de aynı disiplini miras alacak).
3. `SPEC.md` §4.2 (satır ~480-484): "Cross-step references are first-class... The app
   renders these as a traceability view ('show me the chain from problem to standard')
   and warns on orphans. This traceability chain is what an IATF auditor asks for, and
   no generic A3 tool provides it — make it a headline feature." Bu cümle bir görsel
   şekil belirtmiyor — §2.1'in kendi açık sorusu budur.
4. `DECISIONS.md`: **D-196** (G1'in tam kaydı — `evaluateReadiness`'in dönüş tipi,
   `src/methods/*`'tan sıfır import kararının gerekçesi), **D-116** (referans
   mimarisi — `EntryReference{role, targetEntryId}`, dört rol sabiti:
   `pointOfCause`/`rootCause`/`countermeasure`/`containment`, LOCKED), **D-117**
   (orphan seçicileri — `findOrphanedReferences`/`findReferencesTo`/
   `listReferenceableEntries`, zaten var, hiç değişmeyecek — bu oturum yalnızca
   OKUR), **D-123** (PFMEA linkage'ın `meta.linkedRecords[]`'a gittiği, `Entry`
   seviyesinde bir referans OLMADIĞI — bu yüzden traceability görünümünün kapsamı
   dışında kalır, aşağıya bkz.), **D-195** (Faz 7'nin üç dilimlik planının kaynağı).
5. Kendi taramanı yap (körü körüne bu listeye güvenme — D-137'nin kendi dersi): hangi
   metodlar `referenceRoles` taşıyor, hangi rolle, hangi yöne? Bu oturumun kendi ön
   taraması (`grep -rn "REFERENCE_ROLES\." src/methods/*/index.ts`), doğrulanmalı:

   | Referans sahibi (Step) | Rol | Hedef step | Not |
   |---|---|---|---|
   | `hypothesis-verification` (4) | `pointOfCause` | 2 | tek değerli |
   | `countermeasure` (5) | `rootCause` | 4 | çok değerli |
   | `error-proofing-hierarchy` (5) | `countermeasure` | 5 | **aynı step** — D-179'un same-step emsali |
   | `side-effect-risk-assessment` (5) | `countermeasure` | 5 | **aynı step** |
   | `action-item` (6) | `countermeasure` | 5 | tek değerli |
   | `ica-pca-transition` (6) | `containment` + `countermeasure` | 6 + 5 | **tek metod, iki rol** |

   **Bu tablonun kendi bulgusu — G2'nin açık sorularından birinin kaynağı:** SPEC'in
   "chain from problem to standard" cümlesi Adım 8'e (standardizasyon) kadar
   uzanıyormuş gibi okunuyor, ama yukarıdaki tabloda **Step 7/8'i hiçbir referans rolü
   hedeflemiyor** — `resultVerdict`/`sustainmentAudit`/`documentUpdatesTracker`/
   `yokotenTracker`'ın hiçbiri `referenceRoles` taşımıyor (kontrol et:
   `grep -rn "referenceRoles" src/methods/resultVerdict src/methods/sustainmentAudit
   src/methods/documentUpdatesTracker src/methods/yokotenTracker` boş dönmeli). Yani
   bugünkü veri modeliyle traceability görünümü yapısal olarak yalnızca **Step 2 → 4 →
   5 → 6** zincirini gösterebilir; "standarda kadar" kısmı G2'nin inşa edebileceği bir
   şey değil, veri modelinde yok. Bunu G2'nin kendi kapsamına Barış'a AÇIKÇA
   söylemeden sessizce dar tutmak Anayasa Bölüm 4'ün "eksik kod" hatasını "yanlış kod"
   gibi gizlemek olur.
6. `src/app/routes/workspace/RightPanel.tsx` — `TabsRoot`/`TabsList`/`TabsTrigger`/
   `TabsContent` zaten iki sekmeyle (`preview`, koşullu `assistant`) kurulu (satır
   148-204). G2 üçüncü bir `TabsTrigger`/`TabsContent` çifti ekler — bu sekmenin adı
   ve varsayılan olarak açık mı kapalı mı geldiği bu oturumun kendi kararı.

---

## 2. Kapsam

### 2.1 Açık sorular — KODLAMADAN ÖNCE `AskUserQuestion` ile Barış'a sorulmalı

1. **Görünümün şekli.** SPEC "show me the chain from problem to standard" diyor ama
   bir UI şekli söylemiyor. Üç gerçek seçenek:
   - **Seçenek A — Metin/liste tabanlı, girintili zincir görünümü.** Her Step 2 point-
     of-cause entry'sinden başlayarak `findReferencesTo` ile içe dönük tarama, her
     seviyede bir girinti artışı (`Adım 2: [başlık] → Adım 4: [başlık] → Adım 5:
     [başlık] → Adım 6: [başlık]`). En ucuz — yeni bir görsel bileşen gerektirmiyor,
     `src/ui`'nin var olan primitive'leriyle (liste, `Badge`) inşa edilebilir. G1'in
     kendi "sıfır yeni görsel dil" disiplinini sürdürür.
   - **Seçenek B — Görsel düğüm-grafiği (React Flow).** `fishbone`/`whyWhyTree` zaten
     React Flow kullanıyor (D-102/D-103), aynı deseni burada da kullanmak mümkün.
     SPEC'in "headline feature" çerçevelemesine daha çok yakışır, ama gerçek bir yeni
     mekanizma — D-114'ün "dilim başına bir yeni mekanizma" bütçesini zorlar (G1 zaten
     kendi mekanizmasını harcadı: `src/domain/readiness/`) ve interaktif bir grafik
     düzeni (layout) kendi tasarım turu ister.
   - **Seçenek C — İki aşamalı: bu oturumda A, B ayrı bir gelecek dilime.** A'yı şimdi
     şipping et, B'yi B'nin kendi görsel karar sürecini (muhtemelen kendi Block Visual
     Verification Loop'una benzer bir arayüz karar turu) gerektiren ayrı bir G4/G-ek
     dilimine ertele.
2. **"Standarda kadar" boşluğu nasıl gösterilsin?** §1'in kendi bulgusu: bugünkü
   referans grafiği Step 6'da bitiyor, Step 7/8'e uzanmıyor. Üç seçenek:
   - Zincir Step 6'da dursun, Adım 7/8 hiç gösterilmesin (en dürüst, ama SPEC'in "to
     standard" vaadini kısmen karşılıyor).
   - Zincirin sonuna, veri olmasa bile Adım 7/8'in "bu adımlar henüz zincire bağlı
     değil" diye bir notla eklensin (SPEC'in niyetini görünür kılar, ama gösterilecek
     gerçek veri yok).
   - Bu oturumda yeni bir referans rolü daha eklensin (örn. `action-item`'ı
     `sustainment-audit`/`result-verdict`'e bağlayan bir rol) — bu G2'nin kendi
     "yeni mekanizma" bütçesini traceability GÖRÜNÜMÜNDEN referans MİMARİSİNE
     kaydırır, muhtemelen kapsam dışı bırakılmalı ama Barış'a sorulmadan
     varsayılmamalı.
3. **Tıklanabilirlik.** Bir zincir düğümüne tıklamak ilgili adıma gitsin mi
   (`useProjectStore.setActiveStep`, `StepStepper`'ın "tıklama zıplatır" emsaliyle
   aynı)? Ucuz ve muhtemelen istenen bir davranış, ama örtük varsayılmak yerine
   sorulmalı — G1'in "her karar açıkça onaylanır" disiplini.

### 2.2 Orphan uyarısı — zaten var olan seçiciyi görünür kıl

`findOrphanedReferences(project)` (D-117, `src/domain/selectors/findOrphanedReferences.ts`)
zaten dangling her referansı `{stepId, entryId, entryTitle, reference}` şeklinde
döndürüyor — bu oturumun kendi işi SPEC'in "warns on orphans" cümlesini gerçekten
görünür kılmak, yeni bir seçici yazmak değil. G1'in `ReadinessAdvisory`'sinin
`border-danger`/`text-danger` görsel dilini (D-196'da zaten `--color-danger`
token'ına bağlandı) burada da yeniden kullanmak, yeni bir renk kararı almaktan
kaçınır.

### 2.3 Readiness verisini okuma

D-195/D-196'nın kendi notu: G2, G1'in ürettiği `evaluateReadiness(project)` sonucunu
da okuyacak — zincirdeki bir düğümün ait olduğu adım `flagged` ise (örn. bir
countermeasure'ın kök nedeni henüz S4 tarafından doğrulanmamışsa), bu görünümde
görünür olmalı mı, yoksa G2 salt referans grafiğine mi odaklanmalı? Bu, §2.1
madde 1'in seçtiği görünüm şekliyle iç içe bir karar — A seçilirse ucuz (zincir
satırına bir `Badge` eklemek), B seçilirse düğüm rengi/şekli olabilir. Uygulama
detayı, ayrıca sorulmasına gerek yok — §2.1'in cevabına göre bu oturumun kendi kararı.

---

## 3. Kapsam dışı (bu oturumda kesinlikle inşa EDİLMEZ)

- **G3** — "Provisional" A3 kenar işareti. Kendi Block Visual Verification Loop
  turunu gerektiriyor, G1'in readiness verisini tüketecek ama bu oturumun işi DEĞİL,
  `HtmlA3Renderer.tsx`/`buildA3Layout.ts`'e DOKUNULMAZ.
- **Yeni referans rolleri veya `meta.linkedRecords[]`'ı yazan bir mekanizma.** D-123
  LOCKED — PFMEA gibi harici dokümanlar `Entry.references[]`'a değil
  `meta.linkedRecords[]`'a gider, ama bugün hiçbir komut/UI oraya yazmıyor
  (`grep -rn "linkedRecords" src/` ile doğrula — yalnızca şema tanımı var). Bu
  oturum `meta.linkedRecords[]` için bir editör YAZMAZ; traceability görünümü
  onu (boş olduğu için) göstermeyebilir, bu kabul edilebilir bir boşluktur.
- **G1'in kendi seçicisi/kuralları.** `src/domain/readiness/evaluateReadiness.ts`
  yalnızca OKUNUR, hiçbir kural değiştirilmez veya eklenmez.
- **`findOrphanedReferences`/`findReferencesTo`/`listReferenceableEntries`'in kendi
  mantığı.** D-117 LOCKED, yalnızca tüketilir.

---

## 4. Bütçe ve kapanış disiplini

Açık sorular (§2.1) **hemen, kodlamadan önce** `AskUserQuestion` ile sorulur — cevap
gelmeden yazılan görünüm yeniden yapılır (bu repo'nun kendi tekrarlanan dersi, C5/C6/
6d/G1 hepsi aynı sırayı izledi). Sonrasında TDD: seçilen görünüm şekli her ne olursa
olsun, altındaki veri-birleştirme mantığı (zincir kurma, orphan listeleme) saf bir
fonksiyon olarak `src/domain/` veya `src/app/routes/workspace/` altında test edilebilir
tutulmalı — component testleri UI'ı, birim testleri zincir mantığını doğrular.
`npm test`/`npm run lint`/`npm run build` ve `cargo test`/`cargo clippy`/`cargo fmt`
hepsi yeşil olmadan iş bitmiş sayılmaz (D-143'ün dersi: exit code'u ayrı kontrol et,
`tail`'e pipe'lama).

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin Faz 7
tablosuna G2 satırının durumu güncellenir, `CLAUDE.md`'nin Current state'ine G2'nin
özeti eklenir. **G3'ün kendi prompt dosyası** (bu dosyanın deseniyle, ama G3'ün kendi
Block Visual Verification Loop gereksinimini de içeren) G2'nin kapanışında yazılır.

---

**Model önerisi:** Sonnet 5 yeterli — D-116/D-117 mimari kararları zaten kilitli, bu
oturum onları tüketen bir arayüz inşa ediyor, yeni bir mimari mekanizma tasarlamıyor
(Seçenek A seçilirse). Seçenek B (React Flow görsel grafik) seçilirse bile,
`fishbone`/`whyWhyTree`'nin zaten kurduğu desenin bir tekrarı — D-28'in Opus'u
önerdiği "sıfırdan yeni mimari" sınıfına oturmuyor.
