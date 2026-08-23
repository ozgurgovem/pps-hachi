# OTURUM G3 — "Provisional" A3 kenar işareti (Faz 7'nin üçüncü ve son dilimi)

> `docs/oturumlar/G2-traceability-gorunumu.md`'nin oturumu **BİTTİ** — 2026-08-21 (D-197):
> `RightPanel`'in üçüncü sekmesi olarak metin/liste tabanlı traceability görünümü
> (`src/app/routes/workspace/traceability.ts` + `TraceabilityView.tsx`), kopuk-referans
> uyarısı, "Adım 7/8 zincire bağlı değil" notu, tıklanabilir düğümler — hepsi şipping
> edildi, `npm test` 1156/1156. Bu dosya D-195'in üç dilimlik Faz 7 planının **G3**'üdür
> — planın son dilimi. G1 (readiness seçicisi + gate kuralları) ve G2 (traceability
> görünümü) ikisi de bitti; Faz 7'nin geri kalan tek işi bu.
>
> **G3, D-195'in kendi notuna göre üç dilimin en pahalısı** — kendi Block Visual
> Verification Loop turunu gerektiren tek dilim (`CLAUDE.md`'nin kendi kuralı, aşağıya
> bkz. §2.4). G1/G2 saf mantık + mevcut primitiflerdi; G3 A3 sayfasının kendi görsel
> diline yeni bir katman ekliyor (D-165/D-41'in üçüncü görsel katmanı).
>
> Kanonik konum: `docs/oturumlar/G3-provisional-kenar-isareti.md`. Yazıldı: 2026-08-21,
> G2'nin kapanışının hemen ardından, `CLAUDE.md`'nin kendi "G2'nin kapanışında G3'ün
> promptu yazılır" talimatı gereği.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md docs/oturumlar/G1-readiness-secici.md \
      docs/oturumlar/G2-traceability-gorunumu.md \
      src/domain/readiness/index.ts src/domain/readiness/evaluateReadiness.ts \
      src/a3/descriptor.ts src/a3/buildA3Layout.ts src/a3/methodContract.ts \
      src/a3/templates/types.ts src/a3/templates/farplas-7step-tr.ts \
      src/a3/render/HtmlA3Renderer.tsx \
      src-tauri/src/xlsx/writer.rs src-tauri/src/xlsx/descriptor.rs \
      reference/TEMPLATE_ANALYSIS.md
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-21'de
doğrulandı, G2'nin kapanışının hemen ardından.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (özellikle **Block
   Visual Verification Loop**'un tam tanımı — bu G3'ün merkezi çalışma yöntemi), ve
   "Current state"in **G1** ve **G2** paragrafları (D-196/D-197'nin özeti).
3. `SPEC.md` §1.2 (satır ~56-60): "Each step has a `readiness` evaluation. Failing a
   rule shows a non-blocking amber advisory in the step header; the user can proceed
   but **the A3 preview marks the step 'provisional'**." Bu cümle G3'ün tüm kapsamı —
   dikkat: "preview" kelimesi kullanılıyor, "export" değil. §2.1'in kendi açık sorusu
   (aşağıya bkz.) tam olarak bunun üstüne kurulu.
4. `DECISIONS.md`: **D-195** (Faz 7'nin üç dilime bölünme kararı — G3'ün "en pahalı
   dilim, kendi Block Visual Verification Loop'unu gerektiriyor" notunun kaynağı),
   **D-196** (G1'in tam kaydı — `evaluateReadiness`'in dönüş tipi: her step için
   `{status: "ok" | "flagged", warnings: ReadinessWarning[]}`), **D-197** (G2'nin tam
   kaydı), **D-165** (v2 dahil — Layer A'nın goal-state yeşil/mavi/kırmızı paleti +
   6 yeni 5N1K-kategori tonu; G3'ün yeni işareti bu iki katmanla da renk çakışması
   YAPMAMALI — "hiçbir renk iki anlama gelmez" kuralı B3 boyunca üç kez teyit edildi,
   bkz. `TEMPLATE_ANALYSIS.md` §14), **D-41** (şekil-kodlu durum göstergesi — kare/
   üçgen/daire, renk yalnızca pekiştirme — P-37/D-180'in dört metoda uyguladığı desen;
   "provisional" da bir DURUM olduğu için bu deseni mi genişletiyor yoksa D-41'in
   kapsamı dışında mı kalıyor, kendi açık sorusu, aşağıya bkz.), **D-100** (never-
   truncate garantisi — appendix'e düşen bir entry'nin "provisional" durumu appendix
   sayfasında da görünmeli mi, yoksa yalnızca ana sayfada mı — açık soru), **D-102**
   (block/zone mekanizması — G3'ün yeni işareti muhtemelen buna benzer bir "block
   metadata" alanı ekleyecek, aşağıdaki §1.6'nın bulgusuna bkz.), **D-143** (exit code
   ayrı kontrol, `tail`'e pipe'lama).
5. `docs/oturumlar/faz7-kapsam-belirleme.md` §3 madde 3 (varsa) — kapsam belirleme
   oturumunun "provisional" işareti için sorduğu ilk taslak soru; D-195'in kendi
   `AskUserQuestion` cevabı ("A3 bloğunun kenarında yeni görsel işaret") bunun üstüne
   kondu, ama tur o zaman **şekli** sormadı — yalnızca "nerede" sorusunu kapattı
   (StepStepper Badge'i değil, A3 bloğunun kenarı).
6. Kendi taramanı yap (körü körüne bu listeye güvenme — D-137'nin kendi dersi):
   - `src/a3/descriptor.ts`'te `A3LayoutDescriptor`/`SheetDescriptor` düz bir hücre
     grid modeli — birinci sınıf bir "Block" nesnesi YOK. En yakın emsal
     `OverflowWarning` (`§120-135`): `{ stepIds: readonly StepId[], ... }` şeklinde,
     descriptor'a ayrı bir dizi olarak ekleniyor. Yeni bir "provisional" işareti muhtemelen
     aynı deseni izleyecek — `A3LayoutDescriptor`'a `readonly provisionalSteps: readonly
     StepId[]` (veya benzeri) yeni bir alan, ama bu bu oturumun kendi mimari kararı,
     burada varsayılmıyor.
   - `src/a3/templates/types.ts`'teki `TemplateBlock` (`§35-45`) her printed bloğun
     `appSteps`/`headerRange`/`contentColumns`/`contentRows` geometrisini taşıyor — bir
     kenar işaretinin nereye çizileceğini bulmak için gereken tüm koordinatlar zaten
     orada.
   - `src/a3/buildA3Layout.ts`'in imzası `buildA3Layout(project: ProjectModel, template,
     options)` — **zaten tam `ProjectModel`'i alıyor**, yani `evaluateReadiness(project)`
     (D-196, saf, `React` içermiyor, `src/domain/readiness`'ten `src/a3`'e import D-43/
     D-94'ün purity boundary'sini BOZMAZ — ikisi de `src/domain`'in altında) bu fonksiyonun
     içinden çağrılabilir hale gelmiş durumda, ayrı bir parametre olarak dışarıdan
     taşınması ZORUNLU değil. Bu bir mimari seçenek, karar değil — G3 kendi kararını
     verecek (örn. saf fonksiyonun "girdi = sadece ne render edileceği" ilkesini korumak
     için readiness'i yine de bir parametre yapmak isteyebilir).
   - `src-tauri/src/xlsx/writer.rs` — "provisional" işareti yalnızca `HtmlA3Renderer.tsx`
     (ekran/print önizlemesi) için mi, yoksa gerçekten export edilen `.xlsx`'e de mi
     yazılacak? SPEC'in "the A3 **preview** marks..." lafzı yalnızca önizlemeyi işaret
     ediyor gibi okunabilir, ama bu uygulamanın kendi teması IATF denetimi için
     "defensible" bir çıktı üretmek (`CLAUDE.md`'nin AI katmanı bölümü, "provenance on
     every entry" ilkesi) — dışa aktarılan dosyada hiçbir iz bırakmayan bir "provisional"
     işareti, denetçinin gördüğü belgeyle uygulama içindeki durumun ayrışması riski
     taşır. §2.1'in kendi açık sorusu bu — ayrıntı aşağıda.

---

## 2. Kapsam

### 2.1 Açık sorular — KODLAMADAN ÖNCE `AskUserQuestion` ile Barış'a sorulmalı

1. **İşaret yalnızca önizlemede mi, yoksa export edilen `.xlsx`'e de mi yazılsın?**
   SPEC'in lafzı yalnızca "preview" diyor. Üç gerçek seçenek:
   - **Seçenek A — Yalnızca önizleme (`HtmlA3Renderer.tsx`).** SPEC'in lafzına birebir
     sadık, en ucuz — Rust tarafına hiç dokunulmaz. Ama: export edilen dosya, hâlâ
     eksik/doğrulanmamış bir stepin işaretsiz göründüğü tek gerçek kayıt haline gelir.
   - **Seçenek B — Hem önizleme hem export.** SPEC'in lafzından fazlası ama uygulamanın
     kendi "defensible document" temasına daha sadık. `src-tauri/src/xlsx/writer.rs`'a
     dokunmayı ve muhtemelen descriptor'a yeni bir alan taşımayı gerektirir — Rust
     tarafında yeni test(ler) demektir.
   - **Seçenek C — Yalnızca önizleme, ama export sırasında ayrı bir uyarı/onay diyaloğu**
     ("N adım hâlâ provisional, yine de dışa aktarılsın mı?"). SPEC'in lafzına sadık
     kalır ama export akışına yeni bir UI adımı ekler — `RightPanel.tsx`'in `handleExport`
     fonksiyonuna dokunur.
2. **Görsel işaretin şekli.** D-195 yalnızca "A3 bloğunun kenarında yeni görsel işaret"
   dedi — kenar çizgisinin rengi/deseni, bir köşe etiketi/rozeti eşlik edip etmeyeceği,
   D-41'in şekil-kodlu durum dilini (kare/üçgen/daire, P-37/D-180) genişletip
   genişletmeyeceği hiçbiri henüz karara bağlanmadı. Bu, kod yazmadan önce sorulacak bir
   "hangi seçenek" sorusu değil — **`CLAUDE.md`'nin Block Visual Verification Loop'unun
   kendisi bu kararı üretir** (§2.4'e bkz.), burada yalnızca Barış'a "bu oturum bu döngüyü
   çalıştıracak" diye bilgi verilir, seçenekler arasından seçim yapılmaz.
3. **Appendix'e düşen bir entry'nin provisional durumu appendix sayfasında görünsün mü?**
   D-100'ün never-truncate garantisi gereği, bir stepin bütçesini aşan entry'ler appendix
   sayfasına düşüyor (ana sayfada değil). O stepin kendisi "provisional" ise, appendix
   sayfasındaki o entry de bir şekilde işaretlenmeli mi, yoksa işaret yalnızca ana A3
   sayfasındaki bloğun kenarında mı kalsın? İki seçenek: **yalnızca ana sayfa** (en ucuz,
   appendix zaten "bu entry sığmadı" diye ayrı bir sinyal taşıyor) veya **appendix
   satırına da küçük bir not** (tutarlı ama yeni bir appendix-render yolu ister).
4. **Step 7→4 döngüsü (D-192) provisional durumunu nasıl etkiliyor?** Bir stepte
   "Yeni analiz turu başlat" ile açılmış bir round varken, o roundun ait olduğu adımlar
   (`RoundsBand`, D-192) provisional sayılmalı mı? `evaluateReadiness` bugün round'dan
   habersiz (yalnızca `entries`/`payload` okuyor) — bu soru "hayır, G1'in mevcut
   readiness sonucu yeterli" ise ucuz, "evet" ise G1'in LOCKED kapsamına (§3'te
   kapsam dışı bırakılan "G1'in kendi seçicisi/kuralları") dokunmayı gerektirebilir,
   ki bu G3'ün DEĞİL G1'in işi olurdu — muhtemelen "hayır" cevabı beklenir ama
   varsayılmadan sorulmalı.

### 2.2 Block Visual Verification Loop — bu oturumun merkezi yöntemi

`CLAUDE.md`'nin "How I want you to work" bölümündeki döngü **istisnasız** uygulanır:

1. Hangi blok(lar) etkileniyor — muhtemelen sekiz ADIM bloğunun HEPSİ potansiyel olarak
   provisional olabilir, yani işaretin kendisi tek bir görsel dil, sekiz kez uygulanır.
2. Gerçek pt→px ölçekte, gerçek örnek içerikle statik HTML/CSS maket — hem "provisional"
   hem "temiz" (ok) durumdaki aynı bloğu yan yana göstermek muhtemelen en ikna edici.
3. Varsa gerçek referans crop (D-165/D-41'in zaten kullandığı `reference/visual/*` veya
   B3'ün kendi kümülatif artifact'i, `https://claude.ai/code/artifact/b1ae2136-9785-4985-
   b7a3-587663d38466` — provisional/eksik durumu gösteren bir emsal yoksa bu adım atlanır,
   uydurma referans YAPILMAZ).
4. Claude Artifact olarak yayınla.
5. Barış'ın somut/görsel geri bildirimi.
6. Aynı dosya yolunda yeniden yayınla.
7. Onaylanınca kesin değerler `TEMPLATE_ANALYSIS.md`/`DECISIONS.md`'ye **hemen** yazılır.
8. (Tek görsel dil sekiz bloğa uygulandığı için burada "sıradaki bloğa geç" adımı yok —
   ama işaretin sekiz blokta da gerçekten tutarlı göründüğünü doğrulamak için tam
   sayfalık bir önizleme mockup'ı §2.2 madde 2'nin bir parçası olmalı.)

### 2.3 Veri katmanı — muhtemelen küçük, TDD

§1.6'nın bulgusu: `evaluateReadiness(project)` zaten var ve saf. G3'ün veri-katmanı işi
büyük ihtimalle `buildA3Layout`'a (veya çağıranına) hangi `appSteps`'in provisional
olduğunu ulaştırmak ve `A3LayoutDescriptor`'a `OverflowWarning`'in emsaliyle yeni bir alan
eklemek kadar küçük olabilir — ama bu bir varsayım, G3'ün kendi kararı. Ne olursa olsun:
saf fonksiyon → birim test (`buildA3Layout.test.ts`'in golden-file deseniyle tutarlı),
`HtmlA3Renderer` → component/görsel test, `writer.rs`'a dokunulursa (Seçenek B/C) → Rust
tarafı için D-97'nin normalize edilmiş yapısal karşılaştırma deseni.

---

## 3. Kapsam dışı (bu oturumda kesinlikle inşa EDİLMEZ)

- **G1'in kendi seçicisi/kuralları.** `src/domain/readiness/evaluateReadiness.ts`
  yalnızca OKUNUR (veya §2.1 madde 4'ün cevabına göre round-farkındalığı tartışılır ama
  değişiklik G1'e değil ayrı bir karara bağlanır).
- **G2'nin traceability görünümü.** `src/app/routes/workspace/traceability.ts`/
  `TraceabilityView.tsx` LOCKED, dokunulmaz.
- **D-165/D-41'in mevcut katmanlarının yeniden tasarımı.** Layer A (goal-state), Layer B
  (5N1K kategorileri), D-41'in şekil-kodlu durum göstergesi — hepsi LOCKED. G3 bunlara
  ÜÇÜNCÜ, ayrı bir katman ekliyor, mevcut ikisini değiştirmiyor.
- **P-46 (S4'ün kişi-suçlama yarısı).** Ayrı, dosyalanmış, bu oturumun işi değil.
- **P-31/P-36/P-37'nin kapanmamış artıkları** (varsa) — bu oturumun kapsamı yalnızca
  "provisional" işareti, D-41'in genel şekil/renk envanterini yeniden açmak değil.

---

## 4. Bütçe ve kapanış disiplini

Açık sorular (§2.1) **hemen, kodlamadan önce** `AskUserQuestion` ile sorulur. Block Visual
Verification Loop (§2.2) kendi bütçesini taşır — `CLAUDE.md`'nin kendi uyarısı: "bir blok
(veya sıkı ilişkili çift) her biri potansiyel olarak 2+ geri bildirim turu alan sekiz blok
tek oturuma sıkıştırılırsa Anayasa G1/G4 bölgesidir." G3'te SEKİZ ayrı blok yerine **tek bir
görsel dil sekiz kez uygulanıyor** olması bunu hafifletir (sekiz ayrı tasarım kararı değil,
bir tasarım kararının sekiz doğrulaması) ama yine de bütçeyi gözet — işaretin kendisi ilk
turda onaylanmazsa ikinci bir clean session'a bölünmesi meşrudur, tek oturumda ısrar
ETMEYİN.

`npm test`/`npm run lint`/`npm run build` ve (Seçenek B/C seçilirse) `cargo test`/
`cargo clippy`/`cargo fmt` hepsi yeşil olmadan iş bitmiş sayılmaz (D-143'ün dersi: exit
code'u ayrı kontrol et, `tail`'e pipe'lama).

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin Faz 7
tablosuna G3 satırının durumu güncellenir, `CLAUDE.md`'nin Current state'ine G3'ün özeti
eklenir — ve bu satır **D-195'in dört-dosyalık (A, B1-B3, C1-C6, D1-D2 tarzı) planının**
değil, **Faz 7'nin kendisinin** kapanışı olur: G1/G2/G3 hepsi bitince `SPEC.md`'nin Faz 7
satırı ("Coaching content, readiness rules, traceability view, step-7→4 loop, appendix
overflow") tam olarak karşılanmış olur — `docs/oturumlar/README.md`'nin Faz 7 bölümü buna
göre "TAMAMEN BİTTİ" diye kapatılabilir, Faz 8'in kendi launch prompt'u ayrı bir gelecek
oturumun işi.

---

**Model önerisi:** Sonnet 5 veri katmanı için yeterli (D-196/D-197'nin zaten kurduğu
desenin bir tekrarı). Block Visual Verification Loop'un kendisi (statik HTML/CSS maket
üretimi, artifact yayınlama) da Sonnet 5'in bugüne kadar B3/D2b boyunca zaten yaptığı iş —
Opus'a yükseltme gerektiren bir "sıfırdan yeni mimari" yok, D-165/D-41'in zaten kurduğu
görsel dil sözlüğüne (Layer A/B, şekil-kodlu durum) üçüncü bir girdi ekleniyor.
