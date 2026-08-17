# OTURUM C5 — whyWhyTree diyagramı + terminal-durum alanı + referans mimarisi (Oturum C'nin beşinci dilimi)

> `docs/oturumlar/C-yontem-plugin-insasi.md`'nin önerdiği altı dilimden (§3) beşincisi.
> **C1, C2, C3, C4 BİTTİ** — C1: durum glifi (P-37, 4/5), fishbone geometrisi (P-34), B1'in 5./6.
> alan ekleri (D-180). C2: `five-n1k` + `problem-impact` plugin'leri, sıfır yeni mekanizma
> (D-181). C3: `kpi-strip` mekanizması + ADIM 7'nin ilk gerçek plugin'i, P-31/P-36 kapandı
> (D-182). C4: `sustainment-audit` (ADIM 7) + `document-updates-tracker`/`yokoten-tracker`/
> `lessons-learned` (ADIM 8), B1 §13.4'ün son dört adayı, sıfır yeni mekanizma (D-183). Bu dosya
> C5'in kapsamıdır: **P-35'in kaydettiği üç gerçek boşluk** — `whyWhyTree`'nin hiç diyagram
> render'ı yok, ✓/❌+KN{N} terminal-durum ayrımının şemada yeri yok, ve bir kök nedenin
> düğüm-seviyesi referansı bugünkü `references[]` mimarisinde (D-124/D-116) ifade edilemiyor.
> **Bu dilimin tek yeni mekanizması** (D-114) — yeni bir React Flow diyagram bileşeni + yeni bir
> `A3ImageKind`. **Tek gerçek mimari soru** (§2.3) kodlamadan önce Barış'a sorulmalı; bu, C3'ün
> açık sorusundan bir kademe daha ağır — D-124'ü (LOCKED) yeniden açıp açmamak sorusu, C-yontem-
> plugin-insasi.md §3'ün kendi notuna göre "D-28'in mimari karar eşiğine giren tek alt-iş."
>
> Kanonik konum: `docs/oturumlar/C5-whywhytree-diyagram.md`. Yazıldı: 2026-08-17, C4'ün
> kapanışının hemen ardından, Barış'ın açık isteğiyle ("temiz oturum için prompt paylaşır
> mısın?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      docs/oturumlar/C-yontem-plugin-insasi.md \
      "reference/Examples/PPS_A3_EK-2905_Yüksek_Fire_Problemi_10.08.2026.pdf" \
      src/a3/methodContract.ts src/a3/render/rasterize.ts \
      src/methods/registry.ts src/methods/types.ts \
      src/domain/model/reference.ts src/domain/selectors/findOrphanedReferences.ts \
      src/app/routes/workspace/EntryReferenceField.tsx \
      src/methods/whyWhyTree/index.ts src/methods/whyWhyTree/schema.ts \
      src/methods/whyWhyTree/Editor.tsx src/methods/whyWhyTree/renderToA3.ts \
      src/methods/shared/nodeTree.ts src/methods/shared/NodeTreeEditor.tsx \
      src/methods/fishbone/index.ts src/methods/fishbone/FishboneDiagram.tsx \
      src/methods/fishbone/layout.ts src/methods/fishbone/renderToA3.ts \
      src/methods/countermeasure/index.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-17'de doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (plan onayı, TDD, i18n),
   ve "Current state"in **Oturum C — C1** … **C4** paragrafları.
3. `docs/oturumlar/C-yontem-plugin-insasi.md` §3 madde C5 — bu dilimin kendi tarifi, üç
   mekanik parça + tek mimari soru ayrımı zaten orada çizili.
4. `DECISIONS.md`: **D-176** (B3'te bulundu — `whyWhyTree` gerçek, imzalı bir ADIM 4 panelinin
   yapısıyla birebir eşleşiyor: dört alt-probleme dallanan Why zincirleri, bazıları zincir
   ortasında tekrar dallanıyor, her yaprak ✓ "zaten kontrol altında" veya ❌+KN{N} "doğrulanmış
   kök neden" ile bitiyor, KN'ler ADIM 5'in aksiyon tablosunu besliyor), **P-35** (üç boşluğun
   kendisi — diyagram yok, terminal-durum alanı yok, düğüm-seviyesi referans mimarisi bugünkü
   modelle uyuşmuyor), **D-124** (LOCKED — "bir izlenebilir düğüm = bir `Entry`", §2.3'ün
   yeniden açtığı karar, gerekçesiyle birlikte oku), **D-116** (`EntryReference` şeklinin kendisi
   — `{role, targetEntryId}`, `payload`'ın neden opak tutulduğu), **D-71** (bir ilişkinin iki
   temsili, öncelik kuralı yoksa tuzak — `nodeTree.ts`'in zaten uyguladığı ders), **D-102/D-94**
   (görüntü/rasterize mekanizmasının genel şekli — `fishbone-diagram` en yakın emsal).
5. **`reference/Examples/PPS_A3_EK-2905_Yüksek_Fire_Problemi_10.08.2026.pdf`'in ADIM 4 panelini
   doğrudan aç ve oku** — P-35'in kendi notu bunu açıkça istiyor ("should read … directly rather
   than only this summary — it also shows mid-chain branching"). D-176'nın özeti yeterli değil;
   gerçek dallanma şeklini (bir zincirin ortada ikiye ayrılması) ve ✓/❌+KN{N} işaretlemesinin
   gerçek görsel biçimini görmeden diyagram tasarlanmamalı.
6. `src/methods/fishbone/{index.ts,FishboneDiagram.tsx,layout.ts,renderToA3.ts}` — bu oturumun
   **birebir izleyeceği** en yakın emsal: React Flow tabanlı, saf bir `computeXLayout` fonksiyonu
   + `interactive`/`size` prop'lu bir diyagram bileşeni + `imageKind`/`renderImage` kaydı + boş
   `rowSpan` (bloğun kalan tüm alanını doldurma) deseni. `layout.ts`'in P-34 yorumları
   (`BRANCH_OFFSET_X` vb.) diyagonal/köşeli bir ağaç yerleşiminin nasıl elle ayarlandığını
   gösteriyor — whyWhyTree'nin kendi yerleşimi muhtemelen farklı bir geometri ister (kutu+ok
   zincirleri, D-175'in 5-Why paneli için onayladığı yatay-ok grameriyle akraba, ama burada
   dallanan).
7. `src/methods/shared/nodeTree.ts` + `NodeTreeEditor.tsx` — zaten var olan düz `parentId`
   listesi + `flattenTree`/`childrenOf`/`removeSubtree` yardımcıları; diyagramın node/edge
   üretimi muhtemelen bunların üzerine inşa edilir, tekrar yazılmaz.
8. `src/domain/model/reference.ts` + `src/domain/selectors/findOrphanedReferences.ts` +
   `src/app/routes/workspace/EntryReferenceField.tsx` + `src/methods/countermeasure/index.ts` —
   §2.3'ün mimari sorusunun **somut çarpma yüzeyi**: `countermeasure`'ın bugünkü `rootCause`
   rolü `fromSteps: [4]` ile *bütün* bir Adım 4 entry'sini hedefliyor (bir `whyWhyTree`
   entry'sinin içindeki tek bir yaprağı değil); `findOrphanedReferences`/`findReferencesTo`/
   `listReferenceableEntries`'in üçü de yalnızca entry-seviyesinde çalışıyor; `EntryReferenceField`
   seçici de yalnızca entry listeliyor. Düğüm-seviyesi bir değişikliğin gerçek dokunacağı yerler
   bunlar — okumadan §2.3'ün seçenekleri arasında karar verilemez.

---

## 2. Kapsam

### 2.1 Yeni mekanizma: whyWhyTree diyagramı + yeni `A3ImageKind` (D-114'ün bu dilime bütçelediği TEK yeni mekanizma)

- `src/a3/methodContract.ts`: `A3ImageKind` union'ına yeni bir değer eklenir — örn.
  `"why-why-diagram"` (**`"fishbone-diagram"`'ı yeniden kullanma**: D-176'nın kendi bulgusu,
  fishbone'un mevcut kind'ı yalnızca fishbone'un kendi node/edge şeklini biliyor — 6M spine +
  kategori + neden + etki düğümleri; whyWhyTree'nin kutu+ok zincir dallanması yapısal olarak
  farklı, aynı kind'ı paylaşmak D-102'nin "spec kind'a göre çoğullaşır" desenini gereksiz yere
  zorlar).
- Yeni saf yerleşim fonksiyonu (`src/methods/whyWhyTree/layout.ts`, `computeFishboneLayout`'un
  izlediği şekil) — `shared/nodeTree.ts`'in `flattenTree`/`childrenOf`'unu kullanarak
  `WhyWhyNode[]`'dan React Flow `nodes`/`edges` üretir. Dallanan bir ağacın 2 boyutlu yerleşimi
  fishbone'un tek-spine geometrisinden farklı bir problem — basit bir seçenek: derinliğe göre
  yatay (veya dikey) katmanlar, her katmanda kardeşler eşit aralıklı; kesin sabitler bu oturumda
  ADIM 4 PDF'inin gerçek dallanma şekline bakılarak kararlaştırılır (§1 madde 5).
- Yeni React bileşeni (`WhyWhyTreeDiagram.tsx`, `FishboneDiagram.tsx`'in izlediği desen —
  `size: A3ImageSize` alır, `ResponsiveContainer` KULLANMAZ, D-105/D-113'ün dersi;
  `interactive`/`size` prop ayrımı editör-modu/rasterize-modu için).
- Terminal (yaprak) düğümler §2.2'nin outcome işaretini taşır — ✓ zaten kontrol altında / ❌+KN{N}
  doğrulanmış kök neden; KN numarası **saklanmaz, derivedir** (aşağıda §2.2).
- Kayıt: `MethodPlugin.imageKind` + `renderImage`, fishbone'un `index.ts`'indeki desenin aynısı.
  `src/a3/render/rasterize.ts`'e **hiçbir dokunuş gerekmiyor olmalı** — `rendererMap[slot.kind]`
  zaten jenerik dispatch ediyor (`kpi-strip`/`distribution-chart`'ın kendi eklenişlerinde de
  dokunulmadı; bu oturum başında yeniden doğrulanmalı, körü körüne güvenilmemeli).
- `renderToA3.ts`: `rowSpan` verilmeyebilir (fishbone'un deseni — ADIM 4'ün olağan tek/birincil
  entry'si, bloktaki kalan bütçeyi doldurur) **veya** whyWhyTree Adım 4'te fishbone'la birlikte
  ikinci bir görüntü taşıyan entry olabileceğinden (D-174/D-175'in ADIM 2/4'te zaten gösterdiği
  "iki görüntü-taşıyan entry aynı blokta" deseni — bkz. P-25/D-136, `place.ts`'in gerçek çok-
  görüntü mekanizması) sabit bir `rowSpan` de düşünülebilir; karar bu oturumda verilir.

### 2.2 Terminal-durum alanı (şema değişikliği, mekanik)

- `WhyWhyNodeSchema` (`{id, parentId, text}`) bir opsiyonel `outcome` alanı kazanır — örn.
  `outcome?: "controlled" | "confirmedRootCause"`, D-51'in loose-by-default deseniyle tutarlı
  (boş/tanımsız = henüz işaretlenmemiş, ne ✓ ne ❌).
- **KN numarası saklanmaz.** Gerçek formda KN{N} yalnızca "bu ağaçtaki N'inci doğrulanmış kök
  neden" sırasını gösteriyor — bunu bir alan olarak saklamak D-71'in tam uyardığı tuzak (iki
  temsil, öncelik kuralı yok: kullanıcı bir düğümü silerse veya sırasını değiştirirse saklanan
  numara gerçek sırayla uyuşmaz hale gelir). Bunun yerine KN{N} **görüntüleme zamanında
  türetilir** — `outcome === "confirmedRootCause"` olan yaprakların `flattenTree`/derinlik-ilk
  sırasındaki konumundan (`treeLines`'ın zaten kullandığı sıralamanın aynısı) hem Editor'de hem
  `renderToA3`'te hesaplanır, tıpkı Fishbone'un `effectLabel`'ı render zamanında hesaplaması
  gibi (P-34/D-180) — asla iki farklı yerde iki farklı sayı üretmeyecek şekilde, tek bir saf
  fonksiyondan.
- Editor: outcome seçici hangi düğümlerde görünür? Öneri — yalnızca o an **yaprak olan**
  düğümlerde (bir düğüme çocuk eklendiği an outcome seçicisi kaybolur/anlamsızlaşır, çünkü
  gerçek formda bir ara-neden ✓/❌ almaz, yalnızca zincirin ucu alır). Şemada `outcome` yine de
  her düğümde permissive kalabilir (D-51) — UI bunu yalnızca yapraklarda gösterir, geçmişte
  yaprakken işaretlenmiş bir düğüm sonradan çocuk kazanırsa `outcome` alanı silinmez, sadece
  görünmez olur (veri kaybı yok, D-100'ün ruhuyla tutarlı).

### 2.3 Mimari soru — KODLAMADAN ÖNCE `AskUserQuestion` ile Barış'a sorulmalı

P-35'in üçüncü bulgusu: gerçek formda doğrulanmış bir kök neden, tek bir ağaç-şekilli entry'nin
içindeki **bir yaprak düğüm**. Ama D-124 (LOCKED) "bir izlenebilir düğüm = bir `Entry`" der ve
bugünkü `references[]` mekanizması (D-116) yalnızca `targetEntryId` taşır — `countermeasure`'ın
`rootCause` referansı bir `whyWhyTree` entry'sini *bütün olarak* hedefleyebilir, içindeki hangi
KN'yi kastettiğini ifade edemez. Üç somut seçenek (§1 madde 8'in okuduğu dosyalar bunların her
birinin gerçek çarpma yüzeyi):

- **Seçenek A — D-116'yı genişlet, düğüm-seviyesi adresleme ekle.** `EntryReference` opsiyonel
  bir `targetNodeId?: string` kazanır. En hassas çözüm, ama en geniş kapsamlı: `EntryReference`
  D-116'da LOCKED; `findOrphanedReferences`/`findReferencesTo`/`listReferenceableEntries`
  (hepsi bugün yalnızca entry-seviyesinde) düğüm varlığını da bilmesi gerekir — bir entry'nin
  kendisi silinmeden, içindeki tek bir düğüm silindiğinde de artık bir referansın "sarkması"
  yeni bir bütünlük durumu; `EntryReferenceField`'in seçici UI'ı da entry değil düğüm listelemeyi
  öğrenmeli. D-28'in "mimari karar" eşiğine giren asıl seçenek bu.
- **Seçenek B — doğrulanmış kök nedeni kendi entry'sine çıkar.** Bir yaprak ❌+KN{N}
  işaretlendiğinde (elle veya otomatik) o düğümün metni kendi (yeni veya mevcut hafif bir
  plugin'e ait) `Entry`'sine kopyalanır/taşınır, `countermeasure` bugünkü mekanizmayla
  (değişmeden) ona referans verir. `EntryReference`'a dokunmaz, D-124'ün bugünkü modeliyle
  tam tutarlı kalır — ama whyWhyTree'nin kendi ağaç bütünlüğünü böler (çıkarılan düğüm artık
  ağaçtan ayrı yaşar) ve D-71'in tam uyardığı "iki temsil" riskini taşır (ağaçtaki metin ile
  çıkarılan entry'nin metni senkron kalmalı, aksi halde hangisi doğru sorusu doğar).
- **Seçenek C — şimdilik değiştirme, imprecision'ı kabul et.** `countermeasure`'ın `rootCause`
  referansı bugünkü gibi bütün whyWhyTree entry'sini hedeflemeye devam eder; hangi KN'nin
  kastedildiği yalnızca diyagrama/insan okumasına kalır. Hiçbir şemaya dokunmaz, en ucuz —
  D-124'ün kendi metninin zaten kabul ettiği maliyetin ("on iki aksiyon planı on iki entry
  demektir") aynı ailesinden bir kabul. Zayıf yanı: aynı ağaçta birden fazla doğrulanmış kök
  neden varsa (gerçek ADIM 4 panelinde olduğu gibi), bir countermeasure'ın hangisini
  adreslediği referans verisinden hiç okunamaz — yalnızca diyagramdan.

Bu prompt bir öneri **yapmıyor** — üçü de gerçek, farklı boyutta bedelleri olan seçenekler ve
C-yontem-plugin-insasi.md §3'ün kendi notu bunun "D-28'in mimari karar eşiğine giren tek alt-iş"
olduğunu zaten işaretliyor. Karar Barış'a `AskUserQuestion` ile sorulmalı; gerekirse yalnızca bu
karar için Opus'a geçilebilir (aşağıdaki Model Önerisi).

---

## 3. Kapsam dışı

- `faultTree` — `whyWhyTree` ile aynı `shared/nodeTree.ts` substratını paylaşıyor ama P-35 onu
  adlandırmıyor; bu dilimin işi değil. §2.1'in yeni `A3ImageKind`'ı/diyagram bileşeni
  `faultTree`'ye **otomatik olarak taşınmaz** — AND/OR gate'leri (`faultTree/gates.ts`) farklı
  bir görsel dil ister, ayrı bir karar/dilim.
- `MethodPlugin.tier` + iki-bölümlü `MethodBand` + sürükle-tutamaç esnek tahsis arayüzü
  (D-169/D-170) — **C6**.
- D-153'ün başlık bandındaki "Genel RAG" alanı (B1 §13.4 aday 7) — bir method plugin'i değil.
- P-26 (i18n + blok hizası) — **Oturum D**.
- Şablon dosyasının kendisi (`src/a3/templates/*`) — D-95, Faz 11.
- D-169'un ADIM 4 "recommended" tier'ının (bugün `fishbone` + `fiveWhy`) bu bulgu ışığında
  yeniden gözden geçirilmesi — P-35'in kendi notu bunu ayrıca işaretliyor, C6'nın (tier
  mekanizmasının kendisini kodlayacak dilim) işi, bu dilimin değil.

---

## 4. Bütçe ve kapanış disiplini

C1-C4'ün kendi kapanışında uygulanan disiplin aynen geçerli: TDD (schema/Editor/renderToA3 +
layout + diyagram bileşeni testleri — fishbone'un `layout.test.ts` emsaline uyan bir yerleşim
testi de eklenir), TR/EN i18n anahtarları birlikte, `npm test`/`npm run lint`/`npm run build` ve
`cargo test`/`cargo clippy`/`cargo fmt` hepsi yeşil olmadan iş bitmiş sayılmaz — `npm test`'in
**exit code**'u ayrı bir logfile + `echo $?` ile kontrol edilir (`tail`/pipe üzerinden DEĞİL,
D-143'ün ve C4'ün kendi dersi).

**§2.3'ün mimari sorusu kodlamadan önce cevaplanmalı** — bu, C4'ün üç küçük sorusundan farklı
olarak gerçek bir LOCKED kararı (D-124) yeniden açıp açmama sorusu, `CLAUDE.md`'nin kendi "plan
onayı" kuralına ekstra ağırlıkla tabi.

**Bu dilim D-114'ün "dilim başına en fazla bir yeni mekanizma" bütçesinin tam kendisi** —
whyWhyTree diyagramı dışında başka bir yeni mekanizma (örn. C6'nın tier/sürükle-tutamaç işi)
aynı oturumda **başlatılmaz**, zaman kalsa bile.

Kapanışta: `TEMPLATE_ANALYSIS.md` (ilgili bölüm), `DECISIONS.md` (P-35 kapanışı + yeni D-numarası),
`CLAUDE.md` güncellenir, `docs/oturumlar/README.md`'nin tablosuna bir satır eklenir.

---

**Model önerisi:** Sonnet — D-28'in "yüksek hacimli implementasyon" sınıfı, C1-C4'le aynı.
**İstisna:** §2.3'ün mimari sorusu — C-yontem-plugin-insasi.md §3'ün kendi notuna göre "yalnızca
bu karar için Opus düşünülebilir." Karar `AskUserQuestion` ile Sonnet üzerinde de çözülebilir
(C3'ün kendi deneyimi — gerçek bir tasarım sorusu Opus'a geçmeden de çözüldü); yalnızca Barış
üç seçenek arasında derinlemesine ek analiz isterse Opus'a geçilir.
