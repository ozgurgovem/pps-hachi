# OTURUM 6e-2 — Açıklama (annotation) mekanizması + 3 görsel-taşıyan yöntem

> D-114'ün beş diliminin sonuncusu olan 6e, Barış'ın 2026-08-19'da bir `AskUserQuestion`
> turuyla onayladığı önerilen seçenekle **6e-1/6e-2**'ye bölündü (D-193). 6e-1 bitti:
> görüntü içe alma mekanizması (Rust `image_import` komutu, EXIF strip, downscale,
> thumbnail, `ImageRef`, jenerik `EntryImagesField` kabuğu) + açıklama **gerektirmeyen**
> iki yöntem (`gemba-observation-log`, `before-after-photos`). Bu oturum — 6e-2 — geri
> kalan üçünü kapatır: **Defect photo board**, **Spaghetti diagram**, **Value Stream Map**
> — üçü de "image upload + annotation" (SPEC.md'nin kendi ifadesiyle). Bu oturumla
> birlikte D-114'ün beş dilimi ve `SPEC.md`'nin kendi Faz 6 planı tamamen kapanır.
>
> Kanonik konum: `docs/oturumlar/6e-2-goruntu-aciklama.md`. Yazıldı: 2026-08-19,
> 6e-1'in kapanışının hemen ardından, Barış'ın açık isteğiyle ("yeni oturum için prompt
> verir misin?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      src/domain/model/entry.ts \
      src/a3/methodContract.ts \
      src/a3/layout/place.ts \
      src/a3/render/rasterize.ts \
      src/a3/render/resolveAssetImages.ts \
      src/methods/registry.ts src/methods/types.ts \
      src/methods/gembaObservationLog/index.ts \
      src/methods/beforeAfterPhotos/index.ts \
      src/methods/fishbone/index.ts src/methods/fishbone/FishboneDiagram.tsx \
      src/app/routes/workspace/EntryImagesField.tsx \
      src/state/projectStore.ts \
      src-tauri/src/images/mod.rs \
      src-tauri/src/ppsx/commands.rs \
      package.json
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-19'da
doğrulandı, 6e-1'in kapanışının hemen ardından.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md`'nin "Current state"inin en üstteki "Phase: 6 of 12" özet satırı ve en
   sondaki **"Oturum 6e-1"** paragrafı — bu dilimin doğrudan önceki bağlamı, 6e-1'in tam
   olarak neyi kurduğunu (Rust ingestion pipeline, `A3ImageRequest`'in `source: "asset"`
   ayırıcısı, `EntryImagesField` jenerik kabuğu, `MethodPlugin.imageSlots`) satır satır
   anlatır. Bu dilim o mekanizmayı **genişletir**, yeniden icat etmez.
3. `SPEC.md` §1.3'ün Adım 1 (satır 87-94) ve Adım 2 (satır 96-111) madde listeleri —
   üç ilgili satır zaten doğrulandı: satır 94 "Defect photo board with annotation
   (arrows, circles, callouts)", satır 106 "Spaghetti diagram (image upload +
   annotation)", satır 107 "Value Stream Map (image upload + annotation)". **Kendi
   taramanı tekrar yap** (D-137'nin kendi dersi) — bu üçü hâlâ `src/methods/*/index.ts`
   içinde `steps:` alanı taşımıyor mu, doğrula.
4. `DECISIONS.md`:
   - **D-193 (6e-1'in tam kaydı) — BU OTURUMUN DOĞRUDAN TEMELİ.** Rust `image_import`
     komutunun `write_ppsx`'i değiştirmeden nasıl kullandığı, `A3ImageRequest`/
     `PendingImageSlot`'un `source`/`assetImageId` ayırıcısı, `A3EntrySummary.images`,
     `EntryImagesField`+`MethodPlugin.imageSlots` jenerik kabuk deseni, `importEntryImage`
     store action'ının "önce byte, sonra referans" sıralama garantisi — hepsi bu dilimde
     **aynen yeniden kullanılacak**, hiçbiri yeniden tasarlanmayacak.
   - **D-119 — BU OTURUMUN MİMARİ TEMELİ, ZATEN KARARLAŞTIRILDI, YENİDEN TARTIŞMA.**
     "Annotation is scoped to images in Phase 6 and stored as structured data, never
     baked into stored pixels." Üç somut karar: (1) `ImageRef` bir `annotations?:
     Annotation[]` alanı kazanır, **normalize edilmiş (0..1) koordinatlarda** — bu alan
     **henüz eklenmedi**, bu oturumun ilk kod işlerinden biri (`src/domain/model/entry.ts`,
     doğrula: `grep -n annotations src/domain/model/entry.ts` boş dönüyor mu). (2) Export
     anında açıklamalı bir görüntü **zaten var olan D-102 rasterize yolundan**
     `spec`-kaynaklı bir slot olarak geçer — fotoğraf + SVG overlay'i birlikte çizen bir
     renderer, `place.ts`'in mevcut `image`/`zones` mekanizmasını **hiç değiştirmeden**
     kullanır (D-118/D-193'ün `asset`-kaynaklı yolu burada **kullanılmaz** — açıklamasız
     bir görüntü `asset` kalır, açıklamalı bir görüntü `spec`'e döner, ikisi arasındaki
     seçim render anında yapılır). (3) Açıklamasız bir görüntü `asset` yolunda kalmaya
     devam eder (D-193, hiç rasterize edilmez) — bu ayrım her üç yeni yöntemde de canlı:
     kullanıcı hiç çizim yapmadıysa entry hâlâ ucuz `asset` yolundan gider. **Flagged for
     6e (D-119'un kendi notu): `rasterize.ts`'in `RASTER_SCALE = 3` sabiti global — zaten
     yüksek çözünürlüklü bir fotoğrafı 3x'te yeniden yakalamak saçma büyüklükte bir PNG
     üretir, muhtemelen slot-başına bir ölçeğe dönüşmesi gerekiyor.** Doğrula:
     `grep -n RASTER_SCALE src/a3/render/rasterize.ts` (2026-08-19 itibariyle satır 51,
     tek global sabit).
   - **D-116/D-125** (referans alanının jenerik kabuk UI deseni — `EntryReferenceField`)
     ve **D-118/D-193**'ün aynı desenin görüntüler için ikinci uygulaması
     (`EntryImagesField`) — bu oturumun UI kararının (§2.2 soru 2) doğrudan emsali.
   - **D-102/D-103** (Fishbone'un kendi diyagram+editör+rasterize deseni — React Flow,
     tek implementasyon hem Editor'de canlı hem rasterize için off-screen).
   - **D-138** ("iki kanıtlanmamış mekanizma tek dilimde asla debug edilmez" —
     6e-1/6e-2 bölünmesinin kendi gerekçesi, burada tekrar geçerli değil çünkü 6e-2'nin
     TEK yeni mekanizması açıklama aracı — ama açıklama aracının KENDİSİ tek bir mekanizma
     olarak kalmalı, üç farklı çizim deneyimine bölünmemeli).
   - **D-64, D-67, D-91, D-92** (zip-entry/path-component güvenlik disiplini — bu dilim
     yeni bir Rust yazma yolu açmıyor, sadece `ImageRef.annotations`'ı JSON içinde
     taşıyor, ama D-193'ün "byte önce, referans sonra" sıralama dersi burada da geçerli).
5. `src/domain/model/entry.ts`'in mevcut `ImageRefSchema` (`role` D-193'te eklendi,
   `annotations` henüz yok) — bu oturum ekleyecek alan.
6. `src/a3/methodContract.ts`'in `A3ImageRequest` (D-193'ün `source`/`assetImageId`
   ayırıcısı), `A3EntrySummary.images`/`resolveA3Images` — açıklamalı bir görüntünün
   `spec`'i ne taşıyacak (fotoğrafın kendi bytes'ı mı, yoksa bir referans mı — §2.2 soru 1).
7. `src/a3/render/rasterize.ts` — mevcut spec→PNG döngüsü, `RASTER_SCALE` sabiti,
   D-105/D-107/D-109/D-111/D-113/D-136/D-136'nın bu dosyada bulduğu her kusur (dosyanın
   kendi yorum bloğu tam listeyi veriyor) — açıklama renderer'ı **aynı** üç tehlikeyi
   miras alacak (off-screen commit gecikmesi, layout-settle, viewport culling), yeni bir
   capture yolu **icat edilmeyecek**.
8. `src/methods/fishbone/` (`FishboneDiagram.tsx`, `layout.ts`, `renderToA3.ts`, `index.ts`)
   — bu depodaki tek "kendi görsel editörü + kendi rasterize edicisi + kendi export'u"
   olan yöntem. Fishbone'un React Flow deseni (bir bileşen, hem Editor'de `interactive`
   hem rasterize modunda `size` ile çağrılıyor) açıklama katmanı için doğrudan taşınabilir
   mi, yoksa çizim aracı (freehand path, ok, daire, callout) yapısal olarak farklı bir
   mekanizma mı gerektiriyor — oku ve karar ver (§2.2 soru 3'ün başlangıç noktası).
9. `src/app/routes/workspace/EntryImagesField.tsx` — D-193'ün jenerik görüntü yükleme
   kabuğu. Açıklama editörü buraya mı eklenir (yükleme + çizim tek bileşende), yoksa ayrı
   bir bileşen mi (`EntryAnnotationEditor.tsx`, yüklenmiş bir `ImageRef` üzerinde çalışan)
   — §2.2 soru 2.
10. `package.json` — hiçbir canvas/çizim kütüphanesinin (konva, fabric, `react-konva`,
    `perfect-freehand`, vb.) henüz bulunmadığını doğrula (2026-08-19'da doğrulandı,
    yeniden kontrol et: `grep -iE "konva|fabric|freehand|annotat" package.json`).

---

## 2. Kapsam

### 2.1 Önce doğrula — üç yöntem gerçekten bunlar mı?

`SPEC.md` §1.3'ün Adım 1/2 madde listesini, satır satır, şu an sevk edilen yöntemlere
karşı kontrol et (2026-08-19'da yapılan ön tarama, **körü körüne güvenme, kendi taramanı
yap**, D-137'nin kendi dersi):

| Adım | SPEC madde (satır) | Karşılığı |
|---|---|---|
| 1 | Defect photo board with annotation (94) | **YOK** — 6e-2'nin |
| 2 | Spaghetti diagram (106) | **YOK** — 6e-2'nin |
| 2 | Value Stream Map (107) | **YOK** — 6e-2'nin |

Adım 1/2'nin geri kalan tüm maddeleri zaten sevk edilmiş durumda (6e-1'in kendi §2.1
taraması bunu doğruladı, bu dilim yeniden taramayacaksa bile bir kez daha `grep -n
"steps:" src/methods/*/index.ts` ile emin ol).

### 2.2 Gerçek açık sorular — kodlamadan önce netleştirilmeli

Dosyaları okuduktan sonra, `AskUserQuestion` ile netleştir (muhtemel adaylar, kesinleşmez):

1. **Çizim aracı — hazır kütüphane mi, el yapımı mı?** İki gerçek seçenek: (a) hazır bir
   canvas/annotation kütüphanesi (`react-konva`, `fabric.js`, vb.) — daha az kod, ama yeni
   bir ağır bağımlılık ve `rasterize.ts`'in üç kez bulduğu webview capture tuzaklarına
   (D-105/D-113/D-136) üçüncü taraf bir DOM/canvas modeliyle bir kez daha maruz kalmak;
   (b) el yapımı SVG overlay (bu depodaki `KpiStripChart.tsx`'in "hazır grafik
   kütüphanesi yerine el yapımı SVG" emsali, D-182 — bullet graph gibi ok/daire/callout
   çizimi de sınırlı bir şekil setiyse tam bir çizim motoru gerektirmeyebilir). SPEC'in
   kendi ifadesi "arrows, circles, callouts" — sınırlı, adı konmuş üç şekil, sonsuz
   freehand çizim değil; bu, el yapımı SVG lehine bir sinyal olabilir ama Spaghetti
   diagram'ın kendi doğası (bir kat planı üzerinde malzeme/insan akışını iz olarak
   çizmek) muhtemelen bir **path/polyline** aracı da ister — SPEC'in "annotation" kelimesi
   üç yöntem için de aynı olsa bile, gerçek kullanım şekli farklı olabilir. Bu ayrım
   kodlamadan önce netleşmeli.
2. **Açıklama editörünün UI'si nerede yaşıyor?** D-125/D-193'ün emsali (jenerik kabuk,
   `EntryReferenceField`/`EntryImagesField`) burada da geçerli mi (tek bir
   `EntryAnnotationEditor.tsx`, üç yöntemin de kullandığı, `EntryImagesField`'ın yanına
   veya içine), yoksa Fishbone'un kendi emsali (`FishboneDiagram.tsx` — yöntem kendi
   diyagramını çiziyor) mu daha doğru — özellikle Spaghetti diagram/VSM'in taban görüntüsü
   (kat planı) her yöntemde farklı bir "tuval" olduğu için, tek bir jenerik bileşenin üç
   farklı görsel bağlamı (defect photo/spaghetti floor plan/VSM diagram) aynı şekilde
   sunması gerekiyor — muhtemelen mümkün (taban her zaman bir fotoğraf + üstte şekil
   katmanı) ama doğrulanmalı.
3. **Şekil seti tüm üç yöntemde aynı mı?** SPEC yalnızca Defect photo board için "arrows,
   circles, callouts" diyor; Spaghetti/VSM için sadece "annotation" (tanımsız). Aynı üç
   şekli mi kullanacaklar, yoksa Spaghetti/VSM'e özel bir path/polyline şekli mi eklenecek
   (soru 1'le bağlantılı)?
4. **`RASTER_SCALE`'in slot-başına hale getirilmesi bu dilimde mi çözülür?** D-119'un
   kendi notu bunu 6e'ye işaretlemiş. Açıklamalı bir fotoğraf muhtemelen zaten
   D-193'ün 2400px tavanında — 3x'te yeniden yakalamak 7200px'e çıkar. Düşük öncelikli bir
   mühendislik kararı (Barış'a sorulmadan çözülebilir, ama flagged).

Barış'ın seçimi ne olursa olsun, TDD zorunlu — özellikle koordinat normalizasyonu
(0..1) matematiği ve `annotations` alanının D-64/D-67 sınıfı güvenlik disiplinini
(JSON içinde taşınan ama yine de boyut/adet tavanı gerektiren bir yapı olabilir —
`write_ppsx`'in D-78 caps'ı zaten `project.json`'ın tamamını kapsıyor, yeni bir tavan
gerekip gerekmediğini değerlendir).

### 2.3 Bütçe gerginliği

D-114'ün kendi kuralı burada da geçerli: **çizim aracının kendisi tek bir yeni
mekanizma** olarak kalmalı — üç yöntemin üçü de aynı mekanizmayı üç farklı bağlamda
kullanmalı, üç ayrı çizim deneyimi icat edilmemeli. Eğer dosyaları gördükten sonra
Spaghetti diagram'ın gerçekten farklı bir etkileşim modeli (freehand path) gerektirdiği
ortaya çıkarsa, bu **ikinci bir mekanizma** olur — D-138'in kendi gerekçesiyle aynı
gerginlik, ve muhtemelen kendi alt-dilimini gerektirir (`AskUserQuestion` ile Barış'a
sun, kod yazmadan önce).

### 2.4 Kapsam dışı

- **`pps-8step-auto` şablonu / §12.8'in elastik tahsis modeli** — D-95/D-186, Faz 11.
- **D-42's "her blokta açıklama" genişletmesi** — D-119 tarafından zaten kapsam dışı
  bırakıldı (yalnızca dört görüntü yöntemi, hepsi zaten kapsamda).
- **AI-yolunun kendi görüntü politikası** (§8.7) — Phase 8+, ayrı.

---

## 3. Bütçe ve kapanış disiplini

Açılışta kaba bir tahmin ver (Anayasa Madde 1); §2.2'nin soruları netleşmeden çizim
mekanizmasının kodlanmasına başlanmaz. Sorular netleşince plan Barış'a kısaca sunulur
(`CLAUDE.md`'nin "write a short plan and let me approve it" kuralı).

Kapanışta: `npm test`/`npm run lint`/`npm run build` ve `cargo test`/`cargo clippy`/
`cargo fmt` hepsi yeşil — `npm test`'in **exit code**'u ayrı bir logfile + `echo $?` ile
kontrol edilir (`tail`/pipe üzerinden DEĞİL, D-143'ün dersi). `scripts/gen-a3-fixture.ts`'in
yeniden çalıştırılması gerekip gerekmediğini kontrol et — muhtemelen gerekmez (bu üç
yöntem fixture'ın kendi beş gerçek yönteminde değil), ama `A3ImageRequest`'in şekli
değişirse (örn. `spec`'in açıklamalı-görüntü varyantı) yine de bir kez dene ve diff'e bak.

Kapanışta belgeler: `DECISIONS.md`'ye yeni D-numarası/numaraları (D-119'un mimari
kararının üstüne inşa eden, ona çelişmeyen), `CLAUDE.md`'nin "Current state"ine bir
"Oturum 6e-2" paragrafı (ve en üstteki "Phase: 6 of 12" özet satırının **"Phase 6
tamamen bitti"** olarak güncellenmesi — D-114'ün beş dilimi ve `SPEC.md`'nin kendi Faz 6
planı bu oturumla tamamlanmış olacak), `docs/oturumlar/README.md`'ye bu dilimin satırı,
P-45'in kapatılması.

---

**Model önerisi:** Opus — D-28'in kendi routing kuralının hedeflediği tam profil: yeni
bir frontend mekanizması (çizim/annotation), muhtemelen yeni bir bağımlılık kararı,
ve §2.2'nin kendisi gerçek bir mimari tasarım kararı. 6e-1'in aksine burada "düşük riskli,
hızlı onaylanan sorular" örüntüsü baştan beklenmiyor — dosyaları görüp karar ver, ama
varsayılan Sonnet değil Opus olsun (6e-1'in kendi D-149 notu gibi, bu da Sonnet 5'te
yürütülebilir eğer Barış öyle tercih ederse — ama routing önerisi Opus'tur).
