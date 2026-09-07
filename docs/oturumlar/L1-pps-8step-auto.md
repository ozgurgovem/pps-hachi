# OTURUM Faz 11 — L1: `pps-8step-auto` statik geometri + template registry + blok görsel dili

> Faz 11'in kendi kapsam belirleme oturumu (D-223, 2026-09-06) BİTTİ. Dört açık tasarım sorusu
> `AskUserQuestion` ile Barış'a soruldu, dördü de netleşti (üçü bu oturumun önerisinin DIŞINDA
> — Barış daha dar/daha bütünleşik bir yol seçti). Bu dosya o kararların **birinci ve tek
> planlanmış** dilimini uygular. Faz 11'in kendi üç dilimlik planı (tam kayıt `DECISIONS.md`
> D-223, `docs/oturumlar/README.md`'nin Faz 11 tablosu):
>
> - **L1 (bu dosya)** — `pps-8step-auto`'nun statik sayfa geometrisi + template registry
>   (`a3Preview.ts`'in gerçekten `project.templateId`'yi okuması + yeni-proje seçici UI) +
>   blok görsel dili (D-47/D-165 paleti + header identity band + `gapStatement`'ın ADIM 1
>   genişlemesi), kendi Block Visual Verification Loop onay turuyla kapanır (P-43'ü de kapatır).
> - **L2** — Template switching mekanizması (`farplas-7step-tr` ↔ `pps-8step-auto`,
>   preserve-every-entry + appendix-öncesi uyarı). L1 bitmeden anlamsız.
> - **L3** — Esnek tahsis solver (D-158/159/160) + drag-handle arayüzü (D-170). Barış'ın kendi
>   kararıyla ertelendi, L2'ye göre sırası kesin değil.
>
> Kanonik konum: `docs/oturumlar/L1-pps-8step-auto.md`. Yazıldı: 2026-09-06, D-223'ün
> kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md reference/TEMPLATE_ANALYSIS.md \
      src/domain/model/projectModel.ts \
      src/domain/model/createProject.ts \
      src/a3/templates/types.ts \
      src/a3/templates/farplas-7step-tr.ts \
      src/a3/methodContract.ts \
      src/a3/buildA3Layout.ts \
      src/a3/layout/budget.ts \
      src/a3/layout/place.ts \
      src/a3/layout/placeZones.ts \
      src/app/routes/workspace/a3Preview.ts \
      src/app/routes/launch/createProjectFlow.ts \
      src/app/routes/launch/LaunchScreen.tsx \
      src/methods/registry.ts \
      src/methods/gapStatement/schema.ts \
      src/methods/gapStatement/renderToA3.ts \
      src/methods/smartTarget/renderToA3.ts \
      src/methods/fiveN1K/renderToA3.ts \
      src-tauri/src/xlsx/writer.rs \
      src-tauri/src/xlsx/styles.rs
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**. Ayrıca kendi taramamı gerçek koda
karşı bir kez daha doğrula (körü körüne güvenme — D-137'nin dersi, bu fazın kendi kapsam
oturumunda iki kez uygulandı):

```bash
ls -1 src/a3/templates/
  # yalnızca farplas-7step-tr.ts + types.ts bekleniyor — pps-8step-auto.ts HİÇ yok.

grep -n "templateId" src/app/routes/workspace/a3Preview.ts
  # HİÇBİR eşleşme bekleniyor — a3Preview.ts `farplas7StepTr`'i doğrudan import edip sabit
  # kodluyor, `project.templateId`'yi hiç okumuyor (D-223'ün kendi bulgusu, bu dilimin
  # kapatacağı ölü kod).

grep -n "templateId" src/domain/model/createProject.ts
  # `CreateProjectParams`'ta YOK, `project.templateId: "farplas-7step-tr"` sabit kodlanmış
  # bekleniyor — bu dilim `CreateProjectParams`'a bir `templateId` parametresi ekleyecek.

grep -n "D-10: farplas-7step-tr is the default" src/domain/model/createProject.ts
  # bu yorum satırı VAR bekleniyor ve ARTIK YANLIŞ — D-157 (LOCKED) D-10'un varsayılan
  # template'inin Rev00-tabanlı 8-step template'e (bu dilimin inşa ettiği) taşınmasını
  # gerektiriyor, `farplas-7step-tr`'yi legacy-compatibility'e düşürüyor. Bu dilim yeni
  # projelerin varsayılanını `pps-8step-auto`'ya çevirmeli, yorumu güncellemeli.

grep -n "language" src/app/routes/launch/LaunchScreen.tsx src/app/routes/launch/createProjectFlow.ts
  # bugün proje-oluşturma akışında GERÇEK bir dil seçici UI YOK — `language` doğrudan aktif
  # i18next UI dilinden türetiliyor (`LaunchScreen.tsx`'in kendi kodu). Yani bu dilimin
  # template seçici UI'ı, genişletilecek bir "yeni proje ayarları" yüzeyi DEĞİL, sıfırdan
  # bir UI yüzeyi — §2.7'nin kendi AskUserQuestion sorusu bunun için.

grep -n "priority\|targetClosureDate\|generalRag" src/domain/model/projectModel.ts
  # HİÇBİR eşleşme bekleniyor — bu dilim ekleyecek.

grep -n "fn computeBlockBudget\|BlockBudget" src/a3/layout/budget.ts
  # statik mekanizma bekleniyor (template.rows'tan doğrudan toplama) — BU DİLİM BUNU
  # DEĞİŞTİRMEZ (D-223 madde 3: esnek solver L3'e ertelendi). `pps-8step-auto` da bu AYNI
  # statik mekanizmayı kullanacak, yalnızca D-158'in varsayılan satır sayılarını sabit
  # `contentRows.start/end` olarak taşıyacak.

grep -n "\"trajectory-chart\"\|\"kpi-strip\"\|\"why-why-diagram\"" src/a3/methodContract.ts
  # üçü de VAR bekleniyor — bu dilim yeni bir A3ImageKind İCAT ETMEZ, ADIM 1'in gap-analizi
  # grafiği `trajectory-chart`'ı (ya da `trend-chart`'ı — §2.5'in kendi kararı) yeniden kullanır.
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-223** (bu fazın kapsam belirlemesi — dört sorunun tam gerekçesi + bu
   dilime taşınan iki doğrudan-karar), **D-150–D-157** (Rev00 referans format, sayfa
   sözleşmesi, D-10'un varsayılan template değişimi), **D-158/D-159/D-160** (esnek tahsis
   modeli — bu dilim yalnızca varsayılan satır sayılarını STATİK kullanır, LOCKED tasarımın
   kendisini yeniden tartışma), **D-162/D-163/D-164** (ADIM 1'in üç paneli: renk bandı
   `gapStatement`'a render-only ekleniyor, 5N1K ayrı yeni plugin — zaten şipping edildi,
   esnek tahsis otomatik+manuel), **D-165** (genişletilmiş anlamsal palet — Katman A/B, ADIM 1
   ONAYLANDI v2 değerleriyle, Genel RAG'ın rezerve amber'i), **D-169/D-170/D-171** (tier
   sistemi — zaten şipping edildi, drag-handle L3'e ait, Block Visual Verification Loop
   metodolojisi), **D-188** (i18n export etiketleri — bu dilim `entry.language`'ı zaten
   kurulu mekanizmayla kullanır, yeniden icat etmez), **D-189/D-190** (`placeZones.ts`'in iki
   kusuru + düzeltmesi — `pps-8step-auto`'nun temiz 12-kolonlu ızgarasında Kusur 2 yapısal
   olarak oluşamaz, ama Kusur 1'in satır-başına-bir-satır düzeltmesi hâlâ geçerli ve
   `five-n1k`/`smart-target`'ın zone'ları bu şablonda İLK KEZ üretimde kullanılacak).
3. `SPEC.md` §3.0 (templates are data — dört şablon planı, bu artık sadece iki), §2.2
   (workspace — landing view + quick-jump, W1/D-217'nin düzeltmesinden sonra), §6 Faz 11
   satırı (artık D-223 ile daraltılmış okunmalı).
4. `reference/TEMPLATE_ANALYSIS.md` §12 (SAYFA SÖZLEŞMESİ) **TAMAMI** — bu dilimin gerçek
   girdisi budur, özellikle:
   - **§12.1-§12.3** — statik ızgara (margins 0.32in, 24×47.25pt kolon + 9.75pt `KAT` ayraç,
     795.00pt satır bandı). Bunlar DOĞRUDAN transkript edilir.
   - **§12.8** — esnek modelin TAM tablosu (varsayılan+alt sınır çiftleri) — bu dilim yalnızca
     **varsayılan** sütununu (`Varsayılan` kolonu: sol 14/28/8, sağ 20/8/8/8/6) STATİK
     `contentRows.start/end` olarak kullanır, alt sınır sütununu (L3'ün işi) YOK SAYAR.
   - **§14.1** — Katman A (3 renk, ADIM 1 ONAYLANDI v2) + Katman B (6 renk, 5N1K kategorileri)
     hex değerleri, D-47 ile ilişki (çakışma değil, iki ayrı katman).
   - **§14.2** — ADIM 1'in üç zorunlu paneli + iki opsiyonel ek, tam geometri (5N1K 4 satır/6
     eşit zon, Gap analizi 8 satır/sol yarı, Problem statement 8 satır/sağ yarı).
   - **§14.3, §14.4** — ADIM 7/kpi-strip, ADIM 2/3/4/5/6/8'in ONAYLANMIŞ görsel dili — hepsi
     zaten şipping edilmiş plugin'lerin (`kpiStrip`, `pareto`, `smartTarget`, `fishbone`,
     `countermeasure`, vb.) kendi `renderToA3`/`imageKind` çıktısı, **bu dilim onları
     DEĞİŞTİRMEZ** — yalnızca yeni şablonun kendi stil tablosunun bu çıktıları doğru
     renklerle/geometriyle barındırmasını sağlar.
   - **§15/§15.8** — D2b'nin `placeZones.ts` düzeltmesi (D-189/D-190) — kod zaten şipped,
     yalnızca P-43'ün görsel onayı owed. **Bu dilim bu kodu DEĞİŞTİRMEZ**, yalnızca onu
     GERÇEK üretimde ilk kez kullanan bir şablon inşa eder (madde 7).
   - **§16** — G3'ün provisional kenar işareti — template-agnostic, zaten şipped, dokunma.
5. `src/a3/templates/farplas-7step-tr.ts` — Phase 4'ün kendi transkripsiyon deseni: `columns`/
   `rows`/`merges`/`styles`/`titleRange`/`headerFields`/`staticCells`/`footerFields`/`blocks`/
   `printArea`/`marginsIn`/`bodyRowHeightPt`/`zoomPercent`. `pps-8step-auto.ts` bu AYNI
   `A3Template` interface'ini dolduracak (`src/a3/templates/types.ts`) — yeni bir tip yok.
   **Fark**: `farplas-7step-tr`'nin 7 bloğu (Adım 5+6 birleşik) yerine `pps-8step-auto`'nun
   8 bloğu BİREBİR app-step'lere eşlenir (`appSteps: [N]`, hiçbir blok birden fazla step
   taşımaz) — §12.3/§12.8'in kendi ADIM 1-8 tablosu.
6. `src/methods/gapStatement/schema.ts` + `renderToA3.ts` — bugün yalnızca düz `lines` üretiyor
   (madde 5 doğrulandı). Bu dilim `renderToA3`'ü D-102'nin `zones`/`image` mekanizmasını
   kullanacak şekilde GENİŞLETİR (§2.5) — şemaya DOKUNULMAZ (D-162 LOCKED).
7. `src/methods/smartTarget/renderToA3.ts` + `src/methods/fiveN1K/renderToA3.ts` — D-102'nin
   zones mekanizmasının zaten iki kanıtlanmış kullanımı; gapStatement'ın genişlemesi bu ikisinin
   ÜÇÜNCÜ uygulaması olacak, aynı `A3ContentZone`/`placeZonesContent` altyapısı üzerinden.
8. `src-tauri/src/xlsx/styles.rs` + `writer.rs` — D-47/D-165'in statik renklerinin şablonun
   kendi `CellStyle` tablosuna nasıl girdiği (D-101: `charWidth` görünür-karakter birimi,
   D-102: görüntü/zon yerleşimi hücre biçimlendirmesinden bağımsız). Bu dilim yeni bir Rust
   mekanizması İCAT ETMEZ — yalnızca yeni şablonun kendi stil tablosunu, zaten var olan
   `Format` üretme koduna besler.

---

## 2. Kapsam

### 2.1 `pps-8step-auto.ts` — statik sayfa geometrisi (transkripsiyon)

§12.1-§12.3'ten doğrudan: 24 body kolonu (A-L + N-Y, her biri 47.25pt/8.285714 karakter — **asla
OOXML saklanan değeri değil, görünür-karakter değerini kullan**, D-154'ün kendi transkripsiyon
tuzağı), `M` ayraç kolonu (9.75pt/1.142857 karakter), 0.32in margins dört kenar, başlık bandı
32pt, `VAKA BİLGİLERİ` bandı 71pt (madde 2.4'ün genişlediği yer), blok bandı 650pt (13pt×50
satır), onay bandı 42pt, toplam 795.00pt. Sekiz blok, §12.8'in varsayılan satır sayılarıyla
(sol ADIM 1/2/3: 14/28/8 satır = 182/364/104pt; sağ ADIM 4/5/6/7/8: 20/8/8/8/6 satır =
260/104/104/104/78pt), her biri **bir tek** `appSteps: [N]` taşır. `printArea`/`marginsIn`/
`bodyRowHeightPt: 13`/`zoomPercent` §12.3'ün sonucuna göre.

### 2.2 D-47 + D-165'in paletlerinin statik stil tablosuna yazılması

**Yeni bir render mekanizması DEĞİL** — §14.1'in kendi notu zaten çözmüştü: sabit konumlu,
içerikten bağımsız renkler şablonun statik stil tablosunda ÖNCEDEN boyanır, `renderToA3` yalnızca
metni yazar. D-47'nin 4 PDCA rengi blok başlık çubuklarına (kartuş hücreleri), D-165 Katman A'nın
3 rengi + Katman B'nin 6 rengi ilgili sabit-konumlu hücrelere (ADIM 1'in problem-statement
bandı + 5N1K'nın altı hücresinin üst şeridi) — tam hex değerleri §14.1'in tablosundan. G3'ün
provisional kenar işaretinin (§16, D-198) `#20241F` grafit rengiyle ÇAKIŞMADIĞI zaten
doğrulanmış (§16.2), yeniden kontrol gerekmez.

### 2.3 Header identity band — yeni `ProjectMetaSchema` alanları

D-153'ün rows 3-6 alanları: PPS ID · Problem Başlığı · Problem Sahibi · Müşteri/Tesis ·
Hat/Makine · **Öncelik** · Bölüm · Parça/Proses · Açılış Tarihi · Revizyon · **Hedef Kapanış** ·
**Genel RAG**. Çoğu zaten `ProjectMetaSchema`'da karşılığı var (`title`→Problem Başlığı,
`customer`→Müşteri/Tesis, `line`→Hat/Makine, `department`→Bölüm, `partNumber`→Parça/Proses,
`revision`→Revizyon, `openedAt`→Açılış Tarihi, `owner`→Problem Sahibi, `projectCode`→PPS ID).
**Üç YENİ alan** (D-223'ün doğrudan kararı, ek/opsiyonel, D-51'in loose-schema duruşu, migration
gerekmez):
- `priority?: string` (ya da §13.2'nin Critical/High/Medium/Low sözlüğünü paylaşan bir enum —
  tam tip bu dilimin kendi küçük kararı, `implementationIssuesLog`'un `Priority` alanı zaten
  aynı sözlüğü kullanıyor mu kontrol et, DRY).
- `targetClosureDate?: string` (ISO tarih string, `openedAt`'ın kendi konvansiyonuyla aynı).
- `generalRag?: "red" | "amber" | "green"` — **HER ZAMAN manuel**, hiçbir zaman hesaplanmaz
  (`costApproval`/`kpiStrip.status`'ın zaten kurduğu disiplin), D-165'in rezerve amber'i +
  Layer A'nın zaten onaylı kırmızı/yeşiliyle render edilir (§13.4 madde 7 bu alanla KAPANIYOR).

Bu üç alan `pps-8step-auto`'nun header hücrelerine `TemplateField`/`staticCells` olarak
bağlanır — `resolveFooterFieldValue`'nun (D-96) zaten kurduğu "alan varsa değeri yaz, yoksa
boş bırak" desenine benzer bir header karşılığı gerekecek (yeni bir mekanizma değil, mevcut
`headerFields` okuma yolunun genişlemesi).

**Ayrı bir UI sorusu, `AskUserQuestion` gerektirebilir**: bu üç alan nerede DÜZENLENİR?
`SettingsScreen.tsx`'in proje-meta bölümü zaten var mı, yoksa yeni bir "proje bilgileri"
formu mu gerekiyor — kod okunmadan karar verilemez, §0'ın kendi taramasının bir parçası.

### 2.4 Template registry + `a3Preview.ts`'in gerçek okuması

**Bu dilimin TEK gerçek yeni mimari mekanizması** (D-114'ün bütçesi). `src/a3/templates/`'e
yeni bir `registry.ts` (ya da mevcut `types.ts`'e eklenen bir `TEMPLATE_REGISTRY`/
`getTemplateById(id: string): A3Template`) — iki template'i (`farplas-7step-tr`,
`pps-8step-auto`) id'ye göre çözer. `src/app/routes/workspace/a3Preview.ts`'in
`buildProjectA3Layout` fonksiyonu `farplas7StepTr`'i sabit kodlamak yerine
`getTemplateById(project.templateId)` çağırır — bilinmeyen bir `templateId` durumu (eski/bozuk
bir `.ppsx`) için bir fallback/hata davranışı gerekir (muhtemelen `farplas-7step-tr`'ye
düşmek, D-52'nin "opening a `.ppsx` with an unknown methodId" P-05 emsaline benzer bir karar —
bu dilimin kendi tasarım işi).

`domain/model/createProject.ts`'in `CreateProjectParams`'ı bir `templateId` parametresi kazanır.
**D-157'nin (LOCKED) kendi gereği**: varsayılan artık `pps-8step-auto` — `farplas-7step-tr`
yalnızca eski projeler açıldığında/legacy-compatibility için var olmaya devam eder, yeni
projeler onu varsayılan almaz. `createProject.ts`'in satır 54'teki "D-10: farplas-7step-tr is
the default template until the Phase 4 fidelity test passes" yorumu bu dilimde güncellenmelidir
— artık yanlış.

### 2.5 ADIM 1'in üç zorunlu paneli — `gapStatement`'ın genişlemesi (yeni plugin DEĞİL)

D-223'ün doğrudan kararı, D-162 (LOCKED) zaten çözmüştü: `gapStatement`'ın `renderToA3`'ü
`A3BlockContent`'e `zones` döndürecek şekilde genişler — **şemaya dokunulmaz**:
- Sol yarı (283.5pt) — bir `image` zonu, gap-analizi grafiği. Hangi `A3ImageKind`'ın yeniden
  kullanılacağı (`trajectory-chart` mı `trend-chart` mı, `ChartSpec`'in hangi varyantı ideal/
  actual iki-çubuk karşılaştırmasına en uygun) bu dilimin kendi küçük analiz işi —
  `TrajectoryChart.tsx`/`TrendChart` bileşenlerini oku, en az kod değişikliğiyle "Current vs
  Ideal" iki çubuğunu üreteni seç.
- Sağ yarı (283.5pt) — üç yatay renk bandı (Katman A: ideal=yeşil/actual=mavi/gap=kırmızı),
  her biri `gapStatement`'ın zaten var olan `ideal`/`actual`/`gap` string alanlarından metin
  taşır. Renk statik şablon stilinden gelir (§2.2), `renderToA3` yalnızca metni yazar.

5N1K (`fiveN1K`) ve Gap analizi+Problem statement (`gapStatement`) İKİ AYRI entry — ADIM 1'in
bloğunda dikey istiflenir (`place.ts`'in mevcut mekanizması, D-102). 5G (`fiveG5N1K`) ve
`problemImpact` opsiyonel entry'ler, garantili panel yok, esnek tahsis + appendix-overflow
güvencesiyle (D-100) korunur — bu dilim onlara özel bir şey YAPMAZ, zaten genel mekanizma
onları kapsıyor.

### 2.6 Method-to-block eşlemesi

Büyük ölçüde ZATEN ÇÖZÜLDÜ — D-169'un tier sistemi (§14.6, Oturum C6) hangi method'un hangi
adımda "önerilen" olduğunu zaten belirledi, ve her adımın kendi bloğu artık BİREBİR o app-step'e
eşleniyor (madde 5'in aksine, `farplas-7step-tr`'nin Adım 5+6 birleşik bloğu gibi bir özel durum
yok). Bu dilimin kendi işi yalnızca: her blok tuval oranının (§12.6, gerçek `pps-8step-auto`
genişlikleriyle yeniden hesaplanmalı — §15.8'in kendi notu, B3 maketleri zaten bu tuval
oranlarına göre çizildi) zaten şipping edilmiş plugin'lerin görsel çıktısını (grafik/zon/satır)
GERÇEKTEN barındırdığını doğrulamak (madde 7'nin BVVL turu).

### 2.7 Yeni-proje template seçici UI

§0'ın kendi bulgusu: bugün proje-oluşturma akışında (`LaunchScreen.tsx`) GERÇEK bir ayarlar
yüzeyi yok — `language` bile kullanıcı seçimi değil, aktif UI dilinden türetiliyor. Template
seçimi SPEC'in kendi "the user picks one per project" (§3.0) gereği, ama BU dilim sıfırdan bir
UI yüzeyi inşa edecek. **CLAUDE.md'nin kendi kuralı**: "For UI work specifically, show me the
token plan and layout concept before any CSS" + "before writing code for a new area, write a
short plan and let me approve it" — bu yüzden template seçicinin YERİ (yeni bir modal/dialog mu,
`LaunchScreen`'e eklenen bir inline seçim mi, proje adı girildikten hemen sonra mı) `AskUserQuestion`
ile Barış'a sorulmalı, kod yazılmadan önce. En basit/en az riskli seçenek muhtemelen:
`createProjectFlow.ts`'in zaten çağırdığı "yeni proje" akışına bir template seçim adımı eklemek
— ama kesin UI şekli bu dilimin kendi tasarım kararı.

### 2.8 Kapanış — Block Visual Verification Loop onay turu (P-43'ü de kapatır)

D-223'ün 4. AskUserQuestion kararı: P-43'ün görsel onayı bu turda halledilir, AYRI bir tur
değil. Temsili içerikli gerçek bir proje `pps-8step-auto` ile oluşturulur (her 8 adıma en az bir
entry — `five-n1k`+`gapStatement` ADIM 1'de, `pareto`/`stratificationMatrix` ADIM 2'de,
`smartTarget` ADIM 3'te, `fishbone`/`fiveWhy` ADIM 4'te, vb.), gerçek `buildA3Layout`'tan
gerçek `write_a3_workbook`'a export edilir, ve **B2/B3'ün zaten onaylı maketlerine karşı**
(kümülatif artifact URL'i, D-171'in kendi kuralı — aynı URL'e yeni bir "gerçek `pps-8step-auto`"
bölümü eklenir, D-190'ın §15.8'de yaptığı gibi) yan yana konur. **Bu YENİ bir tasarım turu
DEĞİL** — §15.8'in kendi bulgusu B3'ün TÜM maketlerinin zaten bu şablonun idealize (567pt/12-eşit-
kolon) tuvaline göre çizildiğini gösteriyor, yani bu tur GERÇEK kodun zaten onaylı tasarıma uyup
uymadığını doğrulayan bir **uygulama-sadakati** kontrolü. Barış'ın onayı olmadan bu dilim
kapanmış sayılmaz (`CLAUDE.md`'nin kendi Loop kuralı).

### 2.9 Done-koşulu

- `src/a3/templates/pps-8step-auto.ts` gerçek §12.1-12.3/§12.8 geometrisiyle var, sekiz blok
  BİREBİR app-step'lere eşli.
- Template registry gerçek, `a3Preview.ts` `project.templateId`'yi GERÇEKTEN okuyor —
  `farplas-7step-tr` ile de `pps-8step-auto` ile de bir proje açılıp export edilebiliyor.
- Yeni projeler varsayılan olarak `pps-8step-auto` alıyor (D-157).
- Header identity band'ın üç yeni alanı (`priority`/`targetClosureDate`/`generalRag`) şemada
  ve şablonda var, düzenlenebilir.
- `gapStatement`'ın ADIM 1 genişlemesi (grafik + üç renk bandı) çalışıyor, şema değişmedi.
- D-47/D-165'in paletleri şablonun stil tablosunda, hiçbir renk iki anlam taşımıyor
  (D-165'in kendi ilkesi tekrar doğrulanmış).
- Barış'ın kendi Block Visual Verification Loop onayı alındı (§2.8) — P-43 KAPANDI.
- `npm test`/`cargo test` yeşil, exit code ayrı kontrol edilir (D-143'ün dersi), lint/build/
  clippy/fmt hepsi temiz. `scripts/gen-a3-fixture.ts` — yeni template `getA3RendererMap()`
  üzerinden kullanılabilir hale geldiği için fixture'ın kendisi büyük olasılıkla ETKİLENMEZ
  (fixture `farplas-7step-tr`'e karşı üretiliyor), ama gapStatement'ın renderToA3 değişikliği
  fixture'ın Step 1 içeriğini etkileyebilir — kontrol et, gerekirse yeniden üret.

---

## 3. Kapsam dışı

- **L2** — Template switching mekanizması (preserve-every-entry + appendix uyarısı). Bu dilim
  YALNIZCA ikinci şablonu ve onu okuyan registry'yi inşa eder; kullanıcının bir projeyi
  BAŞKA bir şablona GEÇİRMESİ ayrı bir dilim.
- **L3** — Esnek tahsis solver + drag-handle. Bu dilim D-158'in varsayılan satır sayılarını
  STATİK sabit olarak kullanır, `pinned`/solver/drag-handle hiçbiri bu dilimde YOK.
- **`farplas-7step-plus`/`farplas-7step-en`** (P-62) — kendi gelecekteki scope oturumunu
  bekliyor, bu dilimin konusu değil.
- **`BenefitCase`/`Onay formu`** (P-18) — Faz 11'in dışına alındı, dokunulmaz.
- D-158/159/160'ın LOCKED tasarımının kendisinin yeniden tartışılması — bu dilim UYGULAR,
  sorgulamaz.
- Zaten şipping edilmiş method plugin'lerinin (fishbone, kpiStrip, sustainmentAudit, vb.)
  kendi şema/Editor/renderToA3 mantığının DEĞİŞTİRİLMESİ — yalnızca yeni şablonun stil
  tablosu/geometrisi onların ZATEN ürettiği çıktıyı doğru barındırıyor mu doğrulanır.
- P-38 (Days late), P-39 (node-level reference), P-41 (Fishbone/5-Why linking) — bu dilimin
  konusu değil, dokunulmaz.
- Workspace Yüzey Yenilemesi (W1/W2/W3, D-217) — Faz 11'den TAMAMEN bağımsız, kendi track'i.

---

## 4. Bütçe ve kapanış disiplini

Bu dilim planın en büyüğü olarak işaretlendi (D-223) — Faz 4'ün ilk şablon inşasıyla
karşılaştırılabilir büyüklükte (sekiz blok, tam stil tablosu, header/footer alanları), ama
çok daha fazla önceden karara bağlanmış girdiyle (renkler/geometri/içerik-eşleme D-149'un dört
oturumluk çalışmasıyla zaten kilitli). Yine de §2.1-2.8 sekiz alt-bölüm taşıyor — gerçekten tek
oturumda bitmiyorsa, **kendi içinde alt-dilimlere bölünmekten çekinme** (6a-6e/J3-1..J3-7'nin
kendi emsali): örneğin L1a (statik geometri + registry, madde 2.1/2.4/2.7 — "bir proje
`pps-8step-auto` ile açılıp boş export edilebiliyor" done-koşulu) ve L1b (blok görsel dili +
header band + gapStatement genişlemesi + BVVL onayı, madde 2.2/2.3/2.5/2.6/2.8). Bu bölünmenin
kendisi Barış'a AÇIKÇA söylenmeli, sessizce yarım bırakılmamalı — Anayasa Madde 1.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturum başladığında `DECISIONS.md`'yi
okuyarak gerçek bir sonraki numarayı doğrula), `docs/oturumlar/README.md`'nin Faz 11 tablosundaki
L1 satırı güncellenir, `CLAUDE.md`'nin "Current state"ine özet eklenir. L2'nin kendi launch
prompt'u bu oturumun kapanışında veya bağımsız olarak yazılabilir.

---

**Model önerisi:** Template registry'nin mimarisi (§2.4) ve gapStatement'ın zones genişlemesi
(§2.5, hangi `A3ImageKind`'ın yeniden kullanılacağı gerçek bir tasarım kararı) D-28'in routing
mantığına göre Opus değerlendirilebilir. Statik geometri transkripsiyonu (§2.1) ve stil
tablosu doldurma (§2.2) büyük ölçüde mekanik iş, Sonnet için uygun — Phase 4'ün kendi
`farplas-7step-tr.ts` transkripsiyonuyla aynı sınıf.
