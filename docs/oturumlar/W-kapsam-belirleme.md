# Workspace Yüzey Yenilemesi — Kapsam belirleme (kod YAZILMAZ, yalnızca ölçüm + dilim planı)

> **Bu bir Faz numarası DEĞİL.** `SPEC.md` §6'nın kendi faz tablosu 0-12 arası kapalı — bu
> girişim hiçbirine temiz oturmuyor (Faz 3 workspace shell'i zaten kurdu, Faz 12 "polish" genel
> bir cila, bu ise gerçek bir yeniden-tasarım). D-149'un "Oturum A/B1-B3/C1-C6/D1-D2" (template
> geometrisi + görsel dil, birden çok Faz'ı kesen ama kendi Faz numarası olmayan bir girişim)
> emsaliyle aynı statüde: kendi harfi (**W**), kendi dilim dizisi, Faz numaralamasının dışında.
>
> Barış'ın kendi isteğiyle açıldı (2026-09-06, Faz 10/K3'ün kapanışının hemen ardından, K4'ün
> launch prompt'u yazılırken): kullanıcının karşılaştığı ilk arayüzün son derece yalın/modern
> olmasını, her adım için ayrı modern "kart"lar (kısa açıklama + amaç + nasıl giriş yapılacağı)
> olmasını, tıklayınca o adıma özel bir sayfa açılıp orada method seçimi + giriş alanları + o
> adımın kendi A3 bloğunun giriş yapıldıkça güncellenen geniş bir ön izlemesinin + AI'nin aynı
> yerde anlık destek vermesinin görünmesini istiyor.
>
> Bu oturumda **üç gerçek mimari soru zaten `AskUserQuestion` ile Barış'a soruldu ve
> cevaplandı** (§2.1-§2.3) — bu yüzden bu doküman `faz8/9/10-kapsam-belirleme.md`'nin "muhtemel
> açık sorular" listesinden bir adım ileride: bir SONUÇ belgesi, yalnızca bir soru listesi
> değil. Kalan açık noktalar (§2.4) hâlâ gerçek, ilk build oturumunun (W1) kendi işi.
>
> Kanonik konum: `docs/oturumlar/W-kapsam-belirleme.md`. Yazıldı: 2026-09-06.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      src/app/routes/workspace/WorkspaceShell.tsx \
      src/app/routes/workspace/StepStepper.tsx \
      src/app/routes/workspace/StepPage.tsx \
      src/app/routes/workspace/CoachBand.tsx \
      src/app/routes/workspace/MethodBand.tsx \
      src/app/routes/workspace/EntriesBand.tsx \
      src/app/routes/workspace/EntryRow.tsx \
      src/app/routes/workspace/EntryEditorDialog.tsx \
      src/app/routes/workspace/EntryProposalField.tsx \
      src/app/routes/workspace/EntryTranslateField.tsx \
      src/app/routes/workspace/RightPanel.tsx \
      src/app/routes/workspace/AssistantPanel.tsx \
      src/app/routes/workspace/a3Preview.ts \
      src/a3/render/HtmlA3Renderer.tsx \
      src/a3/descriptor.ts \
      src/a3/templates/types.ts \
      src/a3/templates/farplas-7step-tr.ts \
      src/a3/layout/measure.ts \
      src/domain/readiness/evaluateReadiness.ts \
      src/state/index.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — küçük bir yol yanlışlığı durma
sebebi değil, notla devam et.

Kendi taramamı da doğrula:

```bash
grep -n "interface TemplateBlock" -A 10 src/a3/templates/types.ts
  # `appSteps`/`headerRange`/`contentColumns`/`contentRows` bekleniyor — W3'ün (§2.5) kendi
  # kırpma mekanizmasının dayanacağı GERÇEK, statik geometri.
grep -n "PT_TO_PX\|gridTemplateColumns\|gridTemplateRows" src/a3/render/HtmlA3Renderer.tsx
  # CSS Grid tabanlı tam-sayfa render bekleniyor — W3'ün "gerçek renderer'ı kırp" kararının
  # (§2.3) dayanağı.
grep -n "DialogRoot" src/app/routes/workspace/EntryEditorDialog.tsx
  # VAR bekleniyor — W2'nin (§2.2) "modal'dan sayfa-içi'ne" değiştireceği gerçek bileşen.
grep -n "w-60 shrink-0" src/app/routes/workspace/StepStepper.tsx
  # VAR bekleniyor — W1'in (§2.1) değiştireceği gerçek rail.
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md`. `AKIS.md`'ye bu oturumda gerek YOK — kod yazılmıyor, yalnızca
   okuma + `docs/`/`DECISIONS.md` yazımı.
2. `SPEC.md` §2.2 — bugünkü üç-bölgeli düzenin kendi LOCKED lafzı ("left rail / center /
   right panel"). Bu girişim bu lafzı bilerek REVİZE ediyor — §2.2'nin kendi metni bu
   dokümanın kapanışında güncellenmeli (D-27/D-95 gibi "SPEC yanlıştı/eskidi, düzeltildi"
   örnekleriyle aynı disiplin, bu sefer "SPEC yanlış değildi, ürün yönü değişti").
3. `src/app/routes/workspace/WorkspaceShell.tsx` — bugünkü sabit üç-sütun (`StepStepper` |
   `StepPage` | `RightPanel`) düzeni, hepsi HER ZAMAN aynı anda görünür. `StepStepper.tsx` —
   bugünkü rail: dar (`w-60`), her adım için numara+ad+durum-rozeti+entry-sayısı, tıklama
   `onNavigate` ile `activeStepId`'yi değiştiriyor (sayfa değişmiyor, yalnızca merkez içerik).
4. `StepPage.tsx` — bugünkü sabit dört/altı bant sırası: `ReadinessAdvisory` → `CoachBand` →
   `MethodBand` → `EntriesBand` (+ Adım 7'de `RoundsBand`, Adım 8'de `SignOffPanel`).
   `MethodBand.tsx` — D-169'un tier ayrımı (recommended/more, zaten var, DOKUNULMAYACAK).
   `EntriesBand.tsx`/`EntryRow.tsx` — bugünkü entry LİSTESİ (satır satır, her satır bir
   "Aç"/"Düzenle" tetikleyicisi taşıyor).
5. `EntryEditorDialog.tsx` — bugünkü MODAL (`DialogRoot`/`DialogContent`): title input +
   `EntryProposalField` (K1/J1) + `EntryTranslateField` (K3) + plugin'in `Editor`'ı +
   `EntryRoundField`/`EntryImagesField`/`EntryReferenceField`. **Bu dosyanın mantığının
   BÜYÜK kısmı (create/edit ayrımı, coalescing, handler'lar) sayfa-içi bir versiyona
   TAŞINACAK — yeniden yazılmayacak, D-84'ün coalescing deseni, D-125'in generic-shell
   deseni hepsi AYNI kalacak, yalnızca "bir `DialogRoot` içinde mi yoksa sayfanın kendisinde
   mi render ediliyor" değişecek.**
6. `RightPanel.tsx` — bugünkü ALTI sekme (Preview/Traceability/Assistant/Review/Audit/
   Translate). **Bunların HİÇBİRİ bu girişimle kaldırılmıyor** — hepsi zaten proje-geneli
   (whole-project) kapsamlı: Review/Audit/Translate bir tek adıma değil TÜM projeye bakıyor,
   Traceability zincirleri adımlar arası, Preview'ın kendisi tüm A3 sayfası. Bu girişimin
   dokunduğu tek şey Preview'ın YANINA (RightPanel'in İÇİNE değil) yeni bir sayfa-içi, TEK
   adıma kırpılmış önizleme eklemek (§2.3/§2.5).
7. `a3Preview.ts` — `buildProjectA3Layout(project, otherEntries)`: async, D-102'nin rasterize
   geçişini içeriyor (chart/diyagram varsa off-screen render + PNG). `RightPanel.tsx`'in
   kendi `useEffect`'i bunu HER `project`/`otherEntries` değişikliğinde çağırıyor — W3'ün
   kendi "her tuş vuruşunda güncellensin" isteği (§2.5) bu ZATEN ÇALIŞAN mekanizmayı yeniden
   kullanacak, ikinci bir build zinciri İCAT ETMEYECEK.
8. `src/a3/descriptor.ts` — `A3LayoutDescriptor.sheets.a3` (tek `SheetDescriptor`: columns/
   rows/merges/cells/images, W3'ün kırpacağı GERÇEK veri). `src/a3/templates/types.ts` —
   `TemplateBlock` (`appSteps`/`headerRange`/`contentColumns`/`contentRows` — bir adımın
   BLOĞUNUN gerçek, STATİK hücre aralığı, `buildA3Layout`'un tamamlanmasını beklemeden bile
   bilinir). `src/a3/templates/farplas-7step-tr.ts`'in `TR_BLOCKS`'u — gerçek örnek.
9. `src/a3/render/HtmlA3Renderer.tsx` — CSS Grid tabanlı render (`gridTemplateColumns`/
   `gridTemplateRows`, `PT_TO_PX = 96/72` sabiti, `excelColumnWidthToPt`). D-94'ün "dumb
   renderer" ilkesi: bu bileşen HİÇBİR yerleşim kararı vermiyor, yalnızca descriptor'ı
   çiziyor — W3'ün kırpma mekanizması bu ilkeyi BOZMAMALI (§2.3'ün kendi kararı: yeni bir
   renderer değil, MEVCUT renderer'ın bir viewport'u).
10. `src/domain/readiness/evaluateReadiness.ts` — `ReadinessAdvisory`'nin okuduğu S1-S8
    bulguları, adım-bazlı. Bu girişim bunlara dokunmuyor, yalnızca YERLERİNİ (yeni sayfa
    düzeninde nereye taşındıklarını) değiştirebilir.
11. `src/state/index.ts` (ya da `useProjectStore`'un tanımlandığı dosya) — `activeStepId`/
    `setActiveStep` (zaten var, W1'in yeni landing view'ı da muhtemelen aynı state'i
    kullanacak — `activeStepId: StepId | null` gibi bir üçüncü "hiçbir adım seçili değil,
    landing görünümündeyim" durumu gerekip gerekmediği W1'in kendi kararı).

---

## 2. Bu oturumun sonucu

### 2.1 Navigasyon modeli — RAIL DEĞİŞTİRİLİYOR (KARARLAŞTIRILDI)

**Karar**: `StepStepper`'ın bugünkü kalıcı rail'i **kaldırılıyor**. Yerine: (a) yeni bir
"adım genel bakış" iniş görünümü — sekiz modern kart, her biri kısa açıklama + amaç + nasıl
giriş yapılacağı metniyle; (b) bir adımın kendi sayfasına geçince basit bir geri/breadcrumb
kontrolü (o sayfadan iniş görünümüne dönmek için).

**Gerekçe (Barış'ın kendi seçimi, önerilen seçenekle)**: iki paralel navigasyon yüzeyi (büyük
davetkâr bir iniş görünümü + hâlâ yaşayan dar bir rail) kullanıcıya HANGİSİNİ kullanacağını
sormak, aynı işi iki farklı yerde iki farklı şekilde sunmak demek — G2'nin (tekrar) bir UI
versiyonu. Tek, net bir model daha iyi.

**Kapanmamış nokta (W1'in kendi işi)**: hızlı adım-arası atlama (bugün rail'in tek tıkla
sağladığı) yeni modelde NASIL yapılır — her adım sayfasının kendi ÜSTÜNDE küçük bir "1 2 3 4 5
6 7 8" şerit/breadcrumb'ı mı olacak (rail'in küçültülmüş, yatay bir versiyonu, D-41'in
shape-coded durum göstergesiyle), yoksa geri dönüp iniş görünümünden mi her seferinde
seçilecek? SPEC'in kendi "navigation is never linear-locked" ilkesi (StepStepper'ın kendi
yorum satırı) bu yeni modelde de KORUNMALI — W1 bunu somut bir mockup'la çözmeli.

### 2.2 AI desteği — MEVCUT OLANIN TAŞINMASI (KARARLAŞTIRILDI)

**Karar**: Yeni bir AI mekanizması İNŞA EDİLMİYOR. `EntryProposalField` ("AI ile öner") ve
`EntryTranslateField` ("Translate") — bugün `EntryEditorDialog`'un modal'ı içinde yaşayan
ikisi de — sayfa-içi, her zaman görünür bir düzenleme alanına TAŞINIYOR. Title input + method
seçimi + method'un `Editor`'ı + bu iki AI aksiyonu, artık bir modal açmadan doğrudan adım
sayfasında.

**Gerecekçe (Barış'ın kendi seçimi, önerilen seçenekle)**: `AssistantPanel`'in serbest-sohbet
modelini adıma-sabitlenmiş bir ikinci versiyonuyla ÇOĞALTMAK (D-201'in kendi "no step context,
no schema" tasarımını burada TEKRARLAMAK) hem G2'nin hem de D-15/D-16'nın (assistant proposes,
critique-before-draft) zaten çözdüğü bir sorunu yeniden çözmek olurdu. Var olanı taşımak,
D-125'in "declare, don't render" generic-shell mimarisini de DEĞİŞTİRMEDEN korur —
`EntryProposalField`/`EntryTranslateField` zaten `{payload, onChange}` şeklinde jenerik;
onları BİR modal yerine BİR sayfa-içi konteynıra render etmek yapısal bir fark yaratmaz.

**Kapanmamış nokta (W2'nin kendi işi)**: bir adımın BİRDEN FAZLA entry'si olduğunda (örn.
Adım 2'nin Pareto + Trend + Stratification entry'leri) sayfa-içi düzenleme alanı NASIL
davranır — bugünkü `EntriesBand`'in LİSTESİ kalır mı (entry'ler satır satır görünür, bir
satıra tıklamak onun editörünü sayfada AÇAR/genişletir, `DialogRoot`'un yerini bir
accordion/expand-in-place alır) yoksa her entry'nin editörü AYNI ANDA mı gösterilir (uzun
sayfalar riski, D-100'ün "yalnızca gerekeni göster" ilkesiyle çelişebilir)? **Önerilen (bu
oturumda karara bağlanmadı, W1'in kendi mockup'ında somutlaşmalı)**: liste kalır, "aç"
durumundaki TEK entry'nin editörü sayfada genişler — aynı anda en fazla bir entry editörü
açık, modal'ın "bir seferde bir şey düzenle" disiplinini korur.

### 2.3 Canlı önizleme — GERÇEK RENDERER'IN KIRPILMASI (KARARLAŞTIRILDI)

**Karar**: Yeni bir önizleme render yolu İNŞA EDİLMİYOR. `HtmlA3Renderer` ve gerçek
`A3LayoutDescriptor` DEĞİŞMEDEN yeniden kullanılıyor — önizleme, aktif adımın kendi bloğuna
(`TemplateBlock.appSteps`/`headerRange`/`contentColumns`/`contentRows`'tan türetilen bir
piksel dikdörtgeni) CSS'te kaydırılmış/kırpılmış (`overflow: hidden` + bir `transform`/
`margin` ofseti) bir VIEWPORT.

**Gerekçe (Barış'ın kendi seçimi, önerilen seçenekle)**: gördüğün şeyin gerçek dışa aktarımla
AYNI olması garantili, çünkü ikinci bir renderer değil — GERÇEK render'ın kendisi, yalnızca
penceresi dar. D-94'ün "dumb renderer" sözleşmesini bozmuyor. İkinci bir render yolunun
(daha hızlı hissedebilir ama) zamanla gerçek dışa aktarımdan görsel olarak SAPMA riski —
tıpkı D-136/D-105/D-113'ün chart-rasterizasyon hatalarının GERÇEK render yolunda bulunduğu
gibi, ikinci bir yol kendi hata sınıfını biriktirir.

**Kapanmamış nokta (W3'ün kendi işi, gerçek bir performans/UX gerilimi)**: `buildProjectA3Layout`
ASENKRON (D-102'nin rasterize geçişi — bir chart/diyagram varsa off-screen render + PNG
encode). Bugün bu, `RightPanel`'in kendi `useEffect`'inde HER `project` değişikliğinde
tetikleniyor (debounce YOK). Sayfa-içi önizleme "giriş yapıldıkça güncellenen" (SPEC'in kendi
lafzı, hatta bu girişimin kendi açılış talebinin lafzı) olacaksa, HER TUŞ VURUŞUNDA tüm
descriptor'ı yeniden kurmak (chart'ı olmayan bir adım için bile) gereksiz iş olabilir. W1/W2
tamamlanınca W3 şunu somut olarak ölçmeli: gerçek bir projede bir tuş-vuruşu → yeniden-render
gecikmesi ne kadar, debounce (D-84'ün ~600ms coalescing emsaline benzer) gerekiyor mu, yoksa
ölçülemeyecek kadar hızlı mı.

### 2.4 RightPanel'in kaderi — DEĞİŞMİYOR (Anayasa Madde 9, kendim karar verdim)

`RightPanel`'in altı sekmesinin (Preview/Traceability/Assistant/Review/Audit/Translate)
HİÇBİRİ kaldırılmıyor, taşınmıyor. Hepsi doğası gereği proje-geneli: Review/Audit/Translate
tüm projeye bakıyor (tek adıma kırpılamaz — bir "Review" önerisi Adım 2'nin bir entry'sini
Adım 5'in bütçesi yüzünden appendix'e taşıyabilir), Traceability zincirleri adımlar arası,
Assistant'ın serbest sohbeti zaten adıma-bağımsız kalması gerektiği §2.2'de kararlaştırıldı.
Bu girişimin dokunduğu tek şey `StepPage`'in KENDİSİ (merkez sütun) — `RightPanel` (sağ
sütun) `WorkspaceShell`'in düzeninde AYNEN kalıyor, yalnızca artık yeni bir sayfa-içi
önizlemeyle YAN YANA, onun YERİNE değil.

### 2.5 Dilim sayısı ve sırası (önerilen, kesin değil — W1'in kendi açılışında teyit edilebilir)

D-114'ün "dilim başına bir yeni mekanizma" bütçesi burada üç dilim öneriyor, K1-K4'ün
"gerçekten yeni mekanizma" desenine yakın (J1-J3'ün "50 method, sıfır yeni mimari karar"
deseninin TERSİ):

- **W1 — İniş görünümü + navigasyon değişimi.** `StepStepper`'ın kaldırılması, sekiz adım
  kartının yeni bir landing route'ta/görünümde inşası (kısa açıklama/amaç/giriş-rehberi
  metinleri — TR/EN i18n key'leri, muhtemelen `CoachBand`'in bugünkü coaching içeriğinden
  KISALTILMIŞ bir özet, yeni bir içerik kaynağı İCAT EDİLMEDEN), §2.1'in kendi kapanmamış
  hızlı-atlama sorusunun çözümü. En temel, en az riskli — üstüne W2/W3 inşa edilir. **Kendi
  Block Visual Verification Loop turu gerektirir** (CLAUDE.md'nin kendi süreci, D-165 gibi
  ilk taslakların gerçek render'da yanlış çıkma emsali) — kart tasarımının bir mockup'ı
  Barış'a gösterilmeden kodlanmamalı.
- **W2 — Adım sayfasının kendisi: sayfa-içi entry düzenleme + taşınan AI aksiyonları.**
  `EntryEditorDialog`'un modal'dan sayfa-içi bir konteynıra dönüşümü, §2.2'nin kendi
  kapanmamış "birden fazla entry" sorusunun çözümü. En büyük tek değişiklik — mevcut modal
  mantığının (create/edit ayrımı, D-84 coalescing, D-125 generic-shell alanları) BİREBİR
  korunduğunu kanıtlayan testler gerektirir (davranış değişmiyor, yalnızca konteynır
  değişiyor).
- **W3 — Canlı, adıma-kırpılmış A3 önizlemesi.** §2.3'ün kendi performans sorusunun ölçülmesi
  + gerçek kırpma mekanizmasının inşası, W2'nin ürettiği sayfaya eklenir.

Bu sıralama W2/W3'ün BAĞIMSIZ olabileceğini gösterir (W3, W2'den önce bile teknik olarak
inşa edilebilir — kırpma mekanizması hangi sayfaya yerleştirileceğinden bağımsız) ama W3'ün
GERÇEK yeri W2'nin ürettiği sayfa olduğu için doğal sıra budur. Bütçe gerginleşirse W2/W3
BİRLEŞTİRİLEBİLİR (J3-3'ün Adım 3+4 birleşme emsali) — W1 asla ertelenmemeli, çünkü ondan
sonrakiler onun ürettiği sayfaya/route'a bağımlı.

---

## 3. Kapsam dışı

- Faz 11 (kalan template'ler, template switching) ve Faz 10/K4 (maliyet sayacı) — bu girişim
  onlardan TAMAMEN bağımsız, hiçbiri değiştirilmiyor, engellenmiyor.
- `RightPanel`'in altı sekmesinin herhangi birinin davranışı — §2.4'te LOCKED, bu girişim
  boyunca yeniden tartışılmaz.
- `MethodBand`'in tier ayrımı (D-169), `EntriesBand`'in kendi CRUD/reorder mantığı,
  `evaluateReadiness`'in S1-S8 kuralları — hepsi OLDUĞU GİBİ kalır, yalnızca YERLERİ değişir.
- Gerçek bir performans profili/benchmark — W3'ün kendi §2.3 sorusu "ölçülmeli" diyor ama bu
  oturumda ÖLÇÜLMEDİ (kod yok), yalnızca W3'ün kendi launch prompt'unun ilk işi olarak
  işaretlendi.
- `SPEC.md` §2.2'nin metninin gerçek düzeltilmesi — bu dokümanın kapanışında NOT edilir
  (yeni üç-bölgeli düzenin tam lafzı), ama SPEC.md'nin kendisi bu oturumda DEĞİŞTİRİLMEDİ —
  W1'in kendi kapanışında güncellenmeli.

---

## 4. Bütçe ve kapanış disiplini

Bu, `faz8/9/10-kapsam-belirleme.md` ile kıyaslanabilir bir ölçüm oturumu (kod yok) — ama üç
gerçek mimari soru ZATEN cevaplandığı için (§2.1-§2.3), kapanışta W1'in kendi launch prompt'u
da yazılabilir (K1'in kendi launch prompt'unun D-213'ün AYNI oturumunda yazılması emsali).

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu dokümanın kendi bulgu ve dilim planı),
`docs/oturumlar/README.md`'ye yeni bir "Workspace Yüzey Yenilemesi" bölümü (Faz 8/9/10'un
kendi bölümlerine benzer), `CLAUDE.md`'nin "Current state"ine kısa bir özet. `W1-adim-genel-
bakis.md` bu oturumda yazılır — W2/W3'ün kendi launch prompt'ları W1 kapanınca (ya da
bağımsız olarak) yazılabilir.

---

**Model önerisi:** Bu oturumun kendisi (ölçüm + üç sorunun cevaplanması) Sonnet 5 için
yeterliydi. W1/W2/W3'ün gerçek görsel tasarım kararları (kart görünümü, sayfa-içi editör
düzeni, kırpma animasyonu) D-28'in routing ilkesine göre Opus değerlendirilebilir — özellikle
W1'in kendi Block Visual Verification Loop turu, D-165/D-171'in emsaliyle, bağımsız bir
estetik göz gerektirebilir.
