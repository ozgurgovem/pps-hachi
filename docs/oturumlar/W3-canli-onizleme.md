# OTURUM W3 — Canlı, adıma-kırpılmış A3 önizlemesi

> Workspace Yüzey Yenilemesi'nin (`docs/oturumlar/W-kapsam-belirleme.md`, D-217) üç
> dilimlik planının SONUNCUSU. W1 (iniş görünümü + navigasyon) ve W2 (adım sayfasının
> kendisi: accordion düzenleme + adım-özel AI sütunu + `RightPanel`'in kaldırılması)
> ikisi de TAM BİTTİ (D-217/D-218/D-219/D-228). Bu dosya, W2'nin kendi kapanışında
> D-228'de yazıldı — **W-kapsam-belirleme.md'nin orijinal §2.3/§2.5 W3 taslağı W2'nin
> gerçek son mimarisiyle kısmen uyuşmuyor, aşağıdaki §1/§2 bunu düzeltiyor.**
>
> Kanonik konum: `docs/oturumlar/W3-canli-onizleme.md`. Yazıldı: 2026-09-08.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/W-kapsam-belirleme.md \
      docs/oturumlar/W2-adim-sayfasi.md \
      src/app/routes/workspace/StepPage.tsx \
      src/app/routes/workspace/A3PreviewReservedBand.tsx \
      src/app/routes/workspace/useA3PreviewSync.ts \
      src/app/routes/workspace/ProjectToolsBar.tsx \
      src/app/routes/workspace/WorkspaceShell.tsx \
      src/app/routes/workspace/a3Preview.ts \
      src/a3/render/HtmlA3Renderer.tsx \
      src/a3/descriptor.ts \
      src/a3/templates/types.ts \
      src/a3/templates/farplas-7step-tr.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**. `A3PreviewReservedBand.tsx` ve
`useA3PreviewSync.ts` W2'de yeni eklendi (D-228) — W-kapsam-belirleme.md'nin kendi §0'ı
bunları hiç bilmiyordu, listede yoklarsa promptun kendisi değil, kod tabanı değişmiş
demektir.

```bash
grep -n "workspace.stepPreview" src/app/routes/workspace/A3PreviewReservedBand.tsx
  # VAR bekleniyor — W3'ün dolduracağı gerçek yer tutucu.
grep -n "RightPanel" src/app/routes/workspace/WorkspaceShell.tsx
  # BULUNMAMALI (yalnızca yorum satırlarında "artık yok" notu olabilir) — D-228
  # RightPanel'i tamamen kaldırdı, W3 onu GERİ GETİRMEMELİ.
grep -n "export function useA3PreviewSync" src/app/routes/workspace/useA3PreviewSync.ts
  # VAR bekleniyor — descriptor zaten `ProjectToolsBar` içinde build ediliyor,
  # W3 bunu YENİDEN İCAT ETMEMELİ, aynı hook'u tüketmeli.
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/W-kapsam-belirleme.md` §2.3 — canlı önizlemenin kendi kararı (yeni bir
   renderer YOK, gerçek `HtmlA3Renderer`/`A3LayoutDescriptor`'ın `TemplateBlock`'tan
   türetilen bir CSS viewport'una KIRPILMASI) hâlâ geçerli — **yalnızca "nerede
   render edileceği" değişti**: o taslak `RightPanel`'in yanına ekleneceğini varsayıyordu,
   gerçekte artık `StepPage`'in en altındaki `A3PreviewReservedBand`'in kendisi (D-228).
3. `docs/oturumlar/W2-adim-sayfasi.md` + `DECISIONS.md` D-228 — W2'nin gerçek son
   mimarisi: `RightPanel` tamamen silindi, `useA3PreviewSync.ts` (`ProjectToolsBar.tsx`
   içinde çağrılıyor) descriptor'ı zaten build edip pop-out pencereye push ediyor.
   **Bu hook'un `descriptorResult`'ı W3'ün de ihtiyaç duyacağı şey** — `ProjectToolsBar`
   ile `A3PreviewReservedBand` kardeş bileşenler (`WorkspaceTopBar` içinde ilki, `StepPage`
   içinde ikincisi), aynı `useA3PreviewSync()` hook'unu HER İKİSİ çağırırsa iki bağımsız
   descriptor build efekti çalışır (gereksiz iş, ama yanlış değil — React Query benzeri bir
   cache yok). W3'ün kendi ilk kararı: descriptor'ı tek bir yerde (muhtemelen
   `WorkspaceShell` seviyesinde) build edip hem `ProjectToolsBar`'a hem
   `A3PreviewReservedBand`'e prop olarak geçirmek mi, yoksa `useA3PreviewSync`'i olduğu
   gibi ikinci kez çağırmak mı — aşağıdaki §2.1'in kendi açık sorusu.
4. `src/app/routes/workspace/A3PreviewReservedBand.tsx` — bugünkü yer tutucu: "Yakında"
   rozeti + "A3 Önizleme" düğmesi (pop-out pencereyi açıyor, D-133). W3 bu düğmeyi
   KALDIRMAMALI (tam sayfa önizleme her zaman bir seçenek kalmalı — SPEC.md §2.2'nin kendi
   "A3 block preview (reserved as of W2 ...)" satırı) — yalnızca rozetin/gövde metninin
   YANINA gerçek kırpılmış önizlemeyi eklemeli.
5. `src/a3/templates/types.ts`'in `TemplateBlock` tipi — `appSteps`/`headerRange`/
   `contentColumns`/`contentRows` (bir adımın bloğunun gerçek, statik hücre aralığı).
   `src/a3/templates/farplas-7step-tr.ts`'in `TR_BLOCKS`'u gerçek örnek. Faz 11/L3b'den beri
   bazı bloklar `elastic` de olabilir (`ElasticBlockGeometry`, `A3LayoutDescriptor.
   elasticBlocks`) — kırpma mantığı statik `TemplateBlock` yerine, varsa
   `elasticBlocks`'daki ÇÖZÜLMÜŞ (resolved) aralığı kullanmalı, yoksa şablonun statik
   aralığını.
6. `src/a3/render/HtmlA3Renderer.tsx` — CSS Grid tabanlı render (`gridTemplateColumns`/
   `gridTemplateRows`, `PT_TO_PX` sabiti). D-94'ün "dumb renderer" ilkesi — bu bileşen
   HİÇBİR yerleşim kararı vermiyor, W3 bunu BOZMAMALI.
7. `src/a3/render/gridGeometry.ts` (Faz 11/L3b) — `columnOffsetPx`/`columnWidthPx`/
   `rowOffsetPx`/`rowHeightPx`, `BlockPinOverlay`'in kırpma için zaten kullandığı AYNI
   piksel matematiği — W3'ün kendi kırpma penceresi (`overflow:hidden` + `transform`/
   `margin` ofseti) muhtemelen bunu DOĞRUDAN kullanmalı, yeniden hesaplamamalı.
8. `src/app/routes/a3PreviewWindow/A3PreviewWindow.tsx` — zaten çalışan zoom/pan/fit
   mantığı (`zoomMath.ts`). W3'ün kırpma penceresi bunun bir ALT KÜMESİ (sabit tek bloğa
   kilitli, kullanıcı zoom/pan YAPMIYOR) — kod paylaşımı mümkünse değerlendirilmeli, ama
   D-114 bütçesi zorlanıyorsa (iki gerçek farklı kullanım: biri tam sayfa+serbest zoom,
   diğeri tek blok+sabit) ayrı kalması da kabul edilebilir.

---

## 2. Kapsam

### 2.1 Descriptor'ın tek build noktası — `AskUserQuestion` GEREKEBİLİR

W2 `useA3PreviewSync()`'i yalnızca `ProjectToolsBar` içinde çağırıyordu (Export + dört araç
için yeterliydi). W3 AYNI descriptor'a `A3PreviewReservedBand`'de de ihtiyaç duyuyor. İki
gerçek seçenek:

- **(a)** `useA3PreviewSync()` `WorkspaceShell` seviyesinde bir kez çağrılır,
  `descriptorResult` hem `ProjectToolsBar`'a hem `StepPage`'e (oradan
  `A3PreviewReservedBand`'e) prop olarak akar. Tek build, ama `WorkspaceShell`/`StepPage`'in
  prop imzası büyür.
- **(b)** `A3PreviewReservedBand` kendi `useA3PreviewSync()` çağrısını yapar — iki bağımsız
  descriptor build efekti çalışır (aynı `buildProjectA3Layout` girdisiyle, muhtemelen aynı
  sonucu üretir ama iki kez CPU/rasterizasyon maliyeti öder). Basit, ama D-102'nin
  rasterizasyon geçişi (chart/diyagram varsa off-screen render) her tuş vuruşunda tekrar
  ediyorsa gerçek bir performans sorunu olabilir — tam olarak §2.3'ün ölçmesi gereken şey.

Barış'a `AskUserQuestion` ile sorulmalı, önerilen (a) — G2'nin "aynı işi iki yerde yapma"
disiplini — ama §2.3'ün performans ölçümü (a)'yı gerçekten gerektirmiyorsa (b) daha az
prop-drilling ile aynı sonucu verebilir; ölçüm önce, karar sonra da makul bir sıra.

### 2.2 Kırpma mekanizması — yeni bir renderer YOK (KARARLAŞTIRILDI, D-217 §2.3)

`A3PreviewReservedBand` içinde, aktif adımın `TemplateBlock`'undan (ya da varsa çözülmüş
`elasticBlocks` girdisinden) türetilen bir piksel dikdörtgeni; `HtmlA3Renderer`'ın TAMAMI
`overflow: hidden` bir konteynır içinde, `transform: translate(-x, -y)` ile o dikdörtgen
sol-üst köşeye gelecek şekilde kaydırılıp render edilir. Konteynırın kendi boyutu blok
dikdörtgeninin boyutuna eşit (taşma yok, kırpma değil ölçekleme — ya da genişlik adım
sayfasının mevcut genişliğine sığacak şekilde bir `scale()` de eklenebilir, kendi tasarım
kararı, gerçek genişlikler ölçülüp karar verilmeli).

### 2.3 Performans ölçümü — ZORUNLU, kod yazılmadan ÖNCE

`buildProjectA3Layout` asenkron (D-102). Bugün `ProjectToolsBar`'ın kendi `useA3PreviewSync`
efekti her `project`/`otherEntries` değişiminde tetikleniyor, debounce YOK. W3 bunu adım
sayfasında da (muhtemelen aynı hook'u paylaşarak) tetikleyecekse, gerçek bir projede bir
tuş-vuruşu → yeniden-render gecikmesi ÖLÇÜLMELİ (chart'lı ve chart'sız bir adım için ayrı
ayrı) — D-84'ün ~600ms coalescing emsaline benzer bir debounce gerekip gerekmediği bu
ölçüme göre karar verilmeli, varsayılmamalı.

### 2.4 Done-koşulu

- `A3PreviewReservedBand`, aktif adımın kendi A3 bloğunu, projede değişiklik yapıldıkça
  güncellenen canlı bir görünüm olarak gösteriyor — statik bir ekran görüntüsü değil.
- Gösterilen şey gerçek dışa aktarımla PIKSEL-EŞDEĞER (aynı `HtmlA3Renderer`, aynı
  descriptor) — ikinci bir çizim yolu YOK.
- "A3 Önizleme" düğmesi (tam sayfa pop-out) hâlâ çalışıyor, kaldırılmadı.
- Ölçülmüş bir gecikme sayısı + (gerekiyorsa) bir debounce mekanizması var, varsayılmadı.
- `npm test` yeşil, exit code `echo $?` ile ayrıca kontrol edilir (D-143). Bu dilim muhtemelen
  Rust'a dokunmuyor (TS/React-only) — yine de `cargo test`/`clippy`/`fmt` doğrulama amaçlı
  yeniden çalıştırılmalı.

---

## 3. Kapsam dışı

- `RightPanel`'in geri getirilmesi — D-228 onu bilerek TAMAMEN kaldırdı, W3 bunu
  YENİDEN AÇMAMALI.
- `ProjectToolsBar`'ın dört aracı (İzlenebilirlik/İnceleme/Denetim/Çeviri) — D-228'de
  LOCKED, dokunulmuyor.
- `BlockPinOverlay`/`PinnedBlockSummary`'nin adım-sayfası içine taşınması — D-228 bunu
  kasıtlı yapmadı (pop-out pencerede zaten var, G2), W3 de tekrarlamamalı; ama W3'ün kendi
  kırpma penceresi `BlockPinOverlay`'i göstermek isterse (bir adımın kendi bloğunu pinlemek
  için) bu YENİ bir karar — Barış'a sorulmalı, kapsam içi VARSAYILMAMALI.
- `AssistantColumn`'ın kendisi — D-228'de LOCKED, dokunulmuyor.

---

## 4. Bütçe ve kapanış disiplini

Bu, W1/W2'den daha küçük bir dilim olabilir (yeni bir renderer yok, yalnızca mevcut
`HtmlA3Renderer`'ı kırpma) — ama §2.3'ün performans ölçümü gerçek bir eşiği bulursa
(debounce gerekiyor) bu kendi küçük mekanizmasını doğurur. §2.1'in kendi sorusu
kodlanmadan ÖNCE cevaplanmalı.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin W3 satırı,
`CLAUDE.md`'nin Current state'ine özet, `SPEC.md` §2.2'nin "A3 block preview (reserved as of
W2 ...)" satırının gerçek duruma göre düzeltilmesi. **Bu dosyanın yazılmasıyla Workspace
Yüzey Yenilemesi'nin (D-217) üç dilimlik planı TAMAMLANMIŞ olacak — W3'ün kendi kapanışı bir
sonraki oturuma launch prompt bırakmıyor, bu girişimin kendisi burada bitiyor.**

---

**Model önerisi**: §2.1/§2.3'ün karar/ölçüm turu D-28'in routing ilkesine göre Sonnet 5
yeterli — W1/W2'nin görsel tasarım turlarının aksine burada yeni bir estetik karar yok,
yalnızca mevcut bir renderer'ın kırpılması + bir performans ölçümü.
