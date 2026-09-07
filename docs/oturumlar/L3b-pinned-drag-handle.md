# OTURUM Faz 11 — L3b: `pinned` domain modeli/komutu + drag-handle arayüzü

> Faz 11'in üç dilimlik planının (D-223) üçüncü dilimi L3, kendi büyüklüğü yüzünden (D-114's own
> budget uyarısı, `L3-esnek-tahsis-solver.md`'nin kendi §4'ü) L3a/L3b'ye bölündü. **L3a
> (`docs/oturumlar/L3-esnek-tahsis-solver.md`, D-226) BİTTİ**: `src/a3/templates/types.ts`'in
> `TemplateBlock` tipi yeni bir opsiyonel `elastic?: {minimumCanvasRows: number}` alanı kazandı;
> `pps-8step-auto.ts`'in sekiz bloğu da bunu bildiriyor (D-158/D-160'ın kendi yayınlanmış toplam
> minimumlarından 2 kartuş satırı çıkarılmış canvas-minimumları: sol 10/18/3, sağ 12/4/4/4/3); yeni
> `src/a3/layout/elasticAllocation.ts` — `estimateBlockRowDemand` (bir bloğun sınırsız bütçedeki
> gerçek satır talebi, `zonesRowSpan`/`image.rowSpan` yoksa `Number.POSITIVE_INFINITY`) ve
> `resolveElasticBlocks` (kolon-seviyeli deterministik dağıtım — `distributeElasticColumn`, D-160'ın
> kendi sayısal örneğiyle doğrulandı: ADIM 2 boş ADIM 1/3'ün floor'a inmesiyle serbest kalan 5
> satırı alıp 33 toplam satıra büyüyor). `buildA3Layout.ts`'in ana döngüsü artık
> `resolveElasticBlocks`'un döndürdüğü RESOLVED blok listesini geziyor; elastik bir bloğun başlık
> birleşmesi (merge) dinamik ekleniyor. `farplas-7step-tr` hiç dokunulmadı (hiçbir bloğu `elastic`
> değil). Bu dilimin işi L3a'nın üzerine **manuel override** (`pinned`) + onun **arayüzü**
> (drag-handle) eklemek — D-170 (LOCKED).
>
> Kanonik konum: `docs/oturumlar/L3b-pinned-drag-handle.md`. Yazıldı: 2026-09-07, L3a'nın kendi
> kapanışında.

---

## 0. İlk iş — gerçek koda karşı doğrula, LOCKED kararları tazele

```bash
grep -n "elastic\?:" src/a3/templates/types.ts
  # `TemplateBlock.elastic?: { readonly minimumCanvasRows: number }` bekleniyor.

grep -n "estimateBlockRowDemand\|resolveElasticBlocks\|distributeElasticColumn" src/a3/layout/elasticAllocation.ts
  # Üçü de bekleniyor — resolveElasticBlocks pinned'i HENÜZ bilmiyor (yalnızca demand/default/
  # minimum'a göre dağıtıyor). Bu dilimin kendi işi bu fonksiyona (ya da onu saran yeni bir
  # katmana) bir `pinned` kısıtı eklemek.

grep -rn "pinned\|blockPin" src/domain/model/*.ts src/domain/commands/*.ts
  # HİÇBİR eşleşme bekleniyor — D-170'in `pinned` kavramı henüz hiçbir yerde yok, bu dilim
  # ekleyecek.

grep -n "onDrag\|draggable\|PointerEvent" src/a3/render/HtmlA3Renderer.tsx
  # HİÇBİR eşleşme bekleniyor — renderer bugün tamamen pasif/salt-okunur (D-94), bu dilim de
  # onu BOZMAMALI (aşağıya bakınız).

grep -n "A3VisibilitySelect" src/app/routes/workspace/EntryRow.tsx
  # Var olmalı — D-170'in kendi "overflow göstergesi zaten var" referansı, yeniden icat
  # edilmemeli.
```

`DECISIONS.md`'de **D-158/D-159/D-160/D-170** (hepsi LOCKED) ve **D-226** (L3a'nın kendi kapanış
kaydı, bu dilimin üzerine inşa ettiği gerçek mekanizmanın tam açıklaması) baştan sona oku. **P-40**'ı
da oku (güncellendi — yalnızca `pinned`+drag-handle kaldığını teyit ediyor).

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: D-158/159/160/170/226 (yukarıda).
3. `src/a3/layout/elasticAllocation.ts` — `distributeElasticColumn`'un kendi mimarisini oku: her
   üye `{defaultRows, minimumRows, demandRows}` alıyor, `natural = clamp(demand, min, default)`
   hesaplıyor, varsayılanın altında dinlenenlerin serbest bıraktığını (`giveable`) varsayılanın
   üstünde talep edenlere (`wanted`) sırayla dağıtıyor. **`pinned` bu üçlüye eklenecek dördüncü bir
   girdi** — bir blok `pinned` ise onun satır sayısı ARTIK `demandRows`'tan hesaplanmıyor, doğrudan
   kullanıcının verdiği sabit sayı; solver geri kalan (pinned OLMAYAN) blokları, kolonun kalan
   payına göre (toplam − pinned bloğun kendi payı) aynı algoritmayla yeniden çözüyor. `resolveElasticBlocks`'un
   kendi imzası da muhtemelen genişlemeli (`pinnedRowsByBlockIndex` gibi bir parametre, ya da
   `ProjectModel`'den okunan bir harita) — bu dilimin kendi tasarım kararı.
4. `src/domain/commands/types.ts`/`builders.ts`/`applyCommand.ts`/`invertCommand.ts`/`index.ts` —
   `TemplateIdSetCommand`'ın (L2, D-225) ve `MetaProjectInfoSetCommand`'ın (L1, D-224) kalıbı:
   ikisi de proje-seviyeli, `before`/`after` tam değer taşıyor, `meta.` öneki `templateId.set`'te
   YOK (`ProjectModel`'in doğrudan alanı) ama `meta.projectInfo.set`'te VAR (`meta` içi alan).
   `pinned` hangi kalıba uyar — `ProjectModel`'e mi (`meta.` yok) yoksa `meta`'ya mı — §3'ün kendi
   açık sorusu.
5. `src/a3/render/HtmlA3Renderer.tsx` ve `src/app/routes/a3PreviewWindow/` — D-94'ün "dumb
   renderer" sözleşmesi: ikisi de TAMAMEN pasif, `descriptor`'ı okuyup çiziyor, hiçbir etkileşim
   yok. İkisi de AYNI bileşeni paylaşıyor (D-133) — bir drag-handle eklemek ikisinde de aynı anda
   çalışmalı. §3'ün kendi tasarım sorusu: renderer'ın DIŞINDA, üzerine bindirilen şeffaf bir
   tutamaç katmanı (önerilen, L3a'nın kendi AskUserQuestion turunda zaten seçildi — D-226) — bu
   dilim bu kararı UYGULUYOR, yeniden sormuyor.
6. `src/app/routes/workspace/EntryRow.tsx`'in `A3VisibilitySelect`'i — D-170'in kendi "overflow
   göstergesi zaten var" referansı, yeniden icat edilmemeli.
7. `src/a3/layout/budget.ts`'in `computeBlockBudget`'ı — resolved bloğun (artık `resolveElasticBlocks`'tan
   gelen) `contentRows`'unu okuyor, hiçbir değişiklik gerektirmiyor; yalnızca referans için oku.

## 2. Kapsam

### 2.1 Gerçek açık tasarım soruları — kodlamadan önce Barış'a sorulmalı

L3a'nın kendi dört sorusu zaten cevaplandı (D-226): kapsam yalnızca `pps-8step-auto`, `pinned`
kalıcı (`.ppsx`'e, appStep anahtarıyla), drag-handle renderer'ın DIŞINDA bir overlay katmanı. Bu
dilimin KENDİ yeni soruları:

1. **`pinned` domain şekli.** `ProjectModel`'e mi (D-170'in "appStep anahtarı" — pps-8step-auto'nun
   her bloğu 1-1 bir app-step'e eşlendiği için, D-224 — kararı zaten sabitledi) yoksa `meta`'ya mı?
   Önerilen: `ProjectModel.blockPins?: Partial<Record<StepId, number>>` (appStep → pinned canvas
   satır sayısı), `templateId`'nin kendi emsali gibi `meta.` öneki OLMADAN (proje-seviyeli, hangi
   şablonla ilişkili olduğu solver'ın kendi sorumluluğunda — `pps-8step-auto` dışındaki bir
   template'e geçildiğinde bu harita anlamsızlaşır ama SİLİNMEZ, tıpkı L2'nin "preserve every
   entry" felsefesiyle aynı — template değişince solver zaten `.elastic` bildirmeyen bloklarda
   `pinned`'i asla okumaz, sessizce devre dışı kalır).
2. **Komut şekli.** Tek bir blok pinlemek/pin kaldırmak için ayrı komutlar mı (`blockPin.set`/
   `blockPin.clear`) yoksa `TemplateIdSetCommand`'ın kalıbında tek bir `blockPins.set` (tüm
   haritayı birden değiştiren, D-224/D-225'in "kısmi yama değil, tüm dilimi birden" emsali) mi?
3. **Solver'a `pinned` nasıl giriyor.** `resolveElasticBlocks`'un kendi imzası genişlesin mi
   (`pinnedRowsByBlockIndex` parametresi — saf kalır, `buildA3Layout.ts` `project.blockPins`'i
   okuyup çevirir) yoksa `ProjectModel`'in tamamı zaten parametre olarak geçiliyor mu (hayır,
   bugün geçmiyor — `resolveElasticBlocks(template, allEntries, rendererMap, language)`, `project`
   değil). D-03/D-04'ün saflık sözleşmesi: `resolveElasticBlocks` dosya sistemine/`Date.now()`'a
   dokunmuyor ama `ProjectModel`'in tamamını mı yoksa yalnızca ihtiyacı olan dilimi mi alması
   gerektiği açık bir tasarım tercihi.
4. **Drag hareketinin piksel→satır dönüşümü.** Bir sürükleme olayı (mouse/pointer delta piksel)
   hangi birimle bir "kaç satır" kararına dönüşüyor? `pps-8step-auto`'nun blok-bandı satırları
   uniform 13pt (L3a'nın kendi bulgusu) — ekran modunda `1pt = 1px` (D-34), print modunda
   `fitScale` uygulanıyor (`measure.ts`). Sürükleme yalnızca ekran modunda mı etkin olacak, yoksa
   her ikisinde de mi? Önerilen: yalnızca ekran modu (print modu zaten yalnızca önizleme, D-34).
5. **Sürükleme sırasında canlı önizleme mi, yoksa bırakınca mı commit.** Her piksel hareketinde
   `buildA3Layout`'u yeniden çağırmak (gerçek zamanlı önizleme) mı, yoksa yalnızca sürükleme
   bitince (`pointerup`) bir kez mi? Önerilen: bırakınca commit — her `pointermove`'da tam
   `buildA3Layout` + olası rasterizasyon çağırmak (D-102'nin iki-geçiş deseni, chart varsa) pahalı
   ve gereksiz; sürükleme sırasında yalnızca CSS/görsel bir "buraya kadar" önizlemesi (gerçek
   veriye dokunmadan) yeterli.

### 2.2 Muhtemel iş kalemleri (kesin bölünme değil, bir taslak)

- **`pinned` domain modeli + komut(lar)**: madde 2.1.1/2.1.2'nin cevabına göre.
- **Solver'ın `pinned` kısıtını kabul etmesi**: `distributeElasticColumn`/`resolveElasticBlocks`'un
  genişlemesi — bir pinned blok kendi sabit satır sayısını alır, kalan bloklar (kolonun kalan
  payına göre) aynı algoritmayla yeniden çözülür. Floor'un altına pinlemek (`minimumCanvasRows`'tan
  az) izin verilmemeli — D-160'ın "ADIM 3 asla sıfıra inemez" kuralı `pinned` için de geçerli.
- **Drag-handle arayüzü**: `HtmlA3Renderer`'ın DIŞINDA bir overlay katmanı (madde 2.1'in zaten
  sabitlediği karar) — blok sınırında bir tutamaç, sürükleme sırasında görsel geri bildirim,
  bırakınca komut dispatch. Floor'dayken rozet/devre-dışı büyütme tutamacı; `pinned` bir blok
  "otomatiğe döndür" kontrolü gösterir (D-170'in tam lafzı).
- **D-100'ün appendix-overflow göstergesi** (`EntryRow`'un zaten var olan `A3VisibilitySelect`'i)
  — pinlenmiş/büyütülmüş bir blok her şeyi sığdıramazsa görünür sinyal olarak KALIR, yeniden icat
  edilmez.
- **`scripts/gen-a3-fixture.ts` yeniden üretimi** — bu dilim `resolveElasticBlocks`'a dokunacağı
  için fixture'ın gerçekten değişip değişmediği kontrol edilmeli (muhtemelen değişmez, çünkü
  fixture yalnızca `farplas-7step-tr`'yi kullanıyor — L3a'da da böyleydi).

## 3. Kapsam dışı

- `farplas-7step-plus`/`farplas-7step-en` (P-62) — dokunma.
- `BenefitCase`/`Onay formu` (P-18) — dokunma.
- **P-63** (kpi-strip'in ADIM 7'de her zaman appendix'e düşmesi) — kendi ayrı dilimi/commit'i,
  bu dilime KARIŞTIRMA.
- AI'nin layout kararı vermesi — D-160 (LOCKED) bunu açıkça yasaklıyor.
- `farplas-7step-tr`'ye esneklik eklemek — L3a'nın kendi kararı (D-226) zaten "hayır" dedi.
- Yazı tipi/satır yüksekliği küçültme — D-224'ün kendi kapanış notu bunu D-40'ın (LOCKED) basılı
  okunabilirlik tabanıyla çeliştiği için zaten reddetti; gerçek fallback her zaman D-100'ün
  appendix mekanizması.

## 4. Bütçe ve kapanış disiplini

Bu dilim muhtemelen L3a'dan daha küçük (solver'ın kendi çekirdek algoritması zaten var, yalnızca
bir kısıt ekleniyor) ama yine de iki gerçek yeni mekanizma taşıyor (domain modeli/komut VE
drag-handle UI) — D-114'ün bütçesine göre bunlar da kendi alt-turlarına bölünebilir (önce
`pinned` domain/komut + solver kısıtı, test edilip commit'lenir; sonra drag-handle UI, ayrı bir
tur) ama bu bir öneri, kesin bir bölünme değil.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturum başladığında gerçek bir sonraki
numarayı doğrula), `docs/oturumlar/README.md`'nin Faz 11 tablosundaki L3b satırı güncellenir,
`CLAUDE.md`'nin "Current state"ine özet eklenir. Bu oturumun kapanışı **Faz 11'in kendi üç
dilimlik planını (D-223) TAMAMEN kapatır** — L1+L2+L3a+L3b hepsi bitmiş olur.
