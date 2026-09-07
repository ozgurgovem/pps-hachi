# OTURUM Faz 11 — L3: Esnek tahsis solver + drag-handle arayüzü

> Faz 11'in üç dilimlik planının (D-223) üçüncü ve son dilimi. L1 (`docs/oturumlar/
> L1-pps-8step-auto.md`, D-224) `pps-8step-auto`'yu STATİK D-158 varsayılan satır sayılarıyla
> inşa etti — sol kolon (ADIM 1/2/3) 14/28/8 satır, sağ kolon (ADIM 4/5/6/7/8) 20/8/8/8/6 satır,
> her ikisi de tam 50 satır/650pt topluyor, her blok kendi varsayılanından 2 satır (kartuş bandı)
> düşerek gerçek tuval satırına ulaşıyor (D-224'ün kendi bulgusu; gerçek koddaki tuval satırları:
> sol 12/26/6, sağ 18/6/6/6/4 — aşağıdaki §0 bunu yeniden doğrular). L2 (D-225) template
> switching mekanizmasını ekledi, `budget.ts`'e DOKUNMADI. L3'ün işi bu statik sayıları D-158/
> D-159/D-160'ın (hepsi LOCKED) tasarladığı GERÇEK esnek modele yükseltmek, artı D-170'in
> (LOCKED) drag-handle arayüzü.
>
> Kanonik konum: `docs/oturumlar/L3-esnek-tahsis-solver.md`. Yazıldı: 2026-09-07, L2'nin kendi
> kapanışında, Barış'ın açık isteğiyle.

---

## 0. İlk iş — gerçek koda karşı doğrula, LOCKED kararları tazele

Bu dosya L1/L2'nin kendi kodunu okuyarak yazıldı, ama D-137'nin kendi dersi (bu proje boyunca
defalarca doğrulandı) geçerliliğini koruyor — kendi taramanı bir kez daha çalıştır:

```bash
grep -n "appSteps:\|contentRows:" src/a3/templates/pps-8step-auto.ts
  # Sol kolon (ADIM 1/2/3): 6-17 (12 satır), 20-45 (26 satır), 48-53 (6 satır) bekleniyor.
  # Sağ kolon (ADIM 4/5/6/7/8): 6-23 (18), 26-31 (6), 34-39 (6), 42-47 (6), 50-53 (4) bekleniyor.
  # Bu numaralar D-158'in kendi 14/28/8 ve 20/8/8/8/6 varsayılanlarından ikişer satır (kartuş
  # bandı) düşülmüş hali — D-224'ün kendi bulgusu. Farklıysa DUR, bu dosyanın sayıları eski.

grep -n "contentRows\b" src/a3/templates/types.ts src/a3/layout/budget.ts
  # TemplateBlock.contentRows hâlâ `{start, end}` sabit bir aralık olmalı — "varsayılan +
  # minimum" ayrı bir alan olarak henüz YOK, bu dilim ekleyecek. computeBlockBudget hâlâ
  # `template.rows`'tan doğrudan toplama yapan STATİK bir fonksiyon olmalı.

grep -rn "pinned\|blockPin" src/domain/model/*.ts src/domain/commands/*.ts
  # HİÇBİR eşleşme bekleniyor — D-170'in `pinned` kavramı henüz hiçbir yerde yok.

grep -n "onDrag\|draggable\|PointerEvent" src/a3/render/HtmlA3Renderer.tsx
  # HİÇBİR eşleşme bekleniyor — renderer bugün tamamen pasif/salt-okunur (D-94).
```

`DECISIONS.md`'de **D-158/D-159/D-160/D-170**'i (hepsi LOCKED) baştan sona oku — bu dosya onları
özetliyor ama özet, kaynağın yerini tutmaz. **P-40**'ı da oku (bu ertelemenin kendi kaydı).

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-158** (esnek blok bölünmesi, sabit 50 satır/650pt kolon toplamı, varsayılan
   + minimum ayrımı), **D-159** (ADIM 1'in üç zorunlu paneli — bu ZATEN L1'de `fiveN1K`+
   `gapStatement` olarak inşa edildi, L3'ün konusu DEĞİL, yalnızca bu iki entry'nin bloktan
   istediği 12 satırın D-158'in kendi 14-satır varsayılanına nasıl oturduğunu anlamak için
   arka plan), **D-160** (ADIM 2 ADIM 3'ün payından büyüyebilir, ADIM 3 asla sıfıra inemez,
   tahsis deterministik — **AI asla layout kararı vermez**), **D-170** (drag-handle arayüzü:
   `pinned` bir blok satır sayısını sabit bir kısıt yapar, solver kalanları o kısıt etrafında
   yeniden çözer; bir blok floor'undayken rozet/devre-dışı büyütme tutamacı; `pinned` bir blok
   "otomatiğe döndür" kontrolü gösterir; D-100'ün appendix-overflow göstergesi — `EntryRow`'un
   zaten var olan `A3VisibilitySelect`'i — bile büyümüş/pinned bir blok her şeyi sığdıramazsa
   görünür sinyal olarak kalır), **D-224** (L1'in kapanışında Barış'ın kendi sorusu L3'ün bu
   tasarımını bağımsız doğruladı — komşudan ödünç alma evet, yazı küçültme HAYIR, gerçek
   fallback zaten D-100'ün appendix mekanizması), **D-100** (LOCKED — asla kırpma, appendix'e
   taşı — L3 bunu BOZMAMALI: bir blok floor'da bile sığdıramazsa entry appendix'e düşmeye devam
   etmeli), **D-97** (yapısal karşılaştırma yöntemi, bu dilimin de test/doğrulama emsali),
   **D-114** (bir dilim = bir yeni mimari mekanizma bütçesi — bu dilim muhtemelen BUNU AŞIYOR,
   §5'e bakınız), **P-40** (bu ertelemenin kaydı, "L1 kapandığında gerçek per-block
   default/minimum'a bağlanacak").
3. `src/a3/templates/types.ts` — `TemplateBlock.contentRows: {start, end}` bugün MUTLAK bir
   aralık, template tanımının kendisine gömülü. Esnek model için bu muhtemelen iki parçaya
   ayrılmalı: statik olarak KALAN şeyler (kolonun toplam satır sayısı, blokların kolon içindeki
   SIRASI) ve dinamik olarak HER PROJE İÇİN yeniden hesaplanan şey (her bloğun gerçek başlangıç/
   bitiş satırı). Bu dilimin kendi tasarım kararı — bu dosya bunu ÇÖZMÜYOR, yalnızca gerginliği
   işaret ediyor.
4. `src/a3/layout/budget.ts` — `computeBlockBudget(template, block)`, bugün `template.rows`'tan
   doğrudan toplama yapan saf ve TAMAMEN statik bir fonksiyon. `buildA3Layout.ts`'in kendi
   döngüsü içinde her blok için bir kez çağrılıyor (bkz. `buildA3Layout.ts:129`) — solver bu
   çağrıdan ÖNCE mi çalışmalı (tüm blokların satır taleplerini önceden bilip tek seferde
   dağıtan bir ön-geçiş), yoksa `computeBlockBudget`'ın kendisi mi akıllanmalı? İlkinin daha
   temiz olduğu düşünülüyor ama bu dilimin kendi kararı.
5. `src/a3/layout/place.ts`'in `placeBlockContent`'i — bir bloğun GERÇEKTE kaç satıra ihtiyaç
   duyduğunu (talebini) hesaplamak, bir bloğu SIĞDIRMAKtan farklı bir soru. Bugün `placeBlockContent`
   yalnızca ikincisini yapıyor (sabit bir bütçe verilince hangi entry'ler sığar, hangileri
   appendix'e düşer). Solver'ın ihtiyacı olan "talep" — bir bloğun içeriği KISITLANMASAYDI kaç
   satır isterdi — hiçbir yerde hesaplanmıyor. Bu, **bu dilimin en can alıcı mimari sorusu**:
   yeni bir saf `estimateBlockRowDemand` fonksiyonu mu (mevcut satır-sayma mantığının bir
   kopyası/çıkarımı, `placeBlockContent`'i BOZMADAN), yoksa `placeBlockContent`'in kendisi
   "sınırsız bütçeyle bir deneme çalıştır" moduyla mı genişletilmeli? D-102'nin "iki-çağrı
   deseni" (önce geometri, sonra piksel) burada üçüncü bir çağrı katmanı olarak akla gelebilir
   ama bu YENİ bir desen, mevcut olanın basit bir tekrarı değil — dikkatli tasarlanmalı.
6. `src/domain/commands/types.ts`/`builders.ts`/`applyCommand.ts`/`invertCommand.ts` —
   `TemplateIdSetCommand`'ın (L2, D-225) ve `MetaProjectInfoSetCommand`'ın (L1, D-224) kalıbı:
   `pinned` durumu için de muhtemelen benzer bir proje-seviyeli (ya da blok-seviyeli) komut
   gerekecek. Şeklin kendisi (`ProjectModel`'e mi, `meta`'ya mı, başka bir yere mi) §3'ün kendi
   açık sorusu.
7. `src/a3/render/HtmlA3Renderer.tsx` ve `src/app/routes/a3PreviewWindow/` — D-94'ün "dumb
   renderer" sözleşmesi: bugün ikisi de TAMAMEN pasif, `descriptor`'ı okuyup çiziyor, hiçbir
   etkileşim yok. Bir drag-handle eklemek bu sözleşmeyi genişletiyor (yeni callback prop'ları,
   pointer event'leri) — D-94'ü BOZMADAN nasıl yapılır (renderer hâlâ "ne çizileceğine karar
   vermiyor," yalnızca "kullanıcı sürüklüyor" olayını yukarı iletiyor) §3'ün kendi tasarım
   sorusu.
8. `src/app/routes/workspace/EntryRow.tsx`'in `A3VisibilitySelect`'i — D-170'in kendi "overflow
   göstergesi zaten var" referansı, yeniden icat edilmemeli.

## 2. Kapsam

### 2.1 Gerçek açık tasarım soruları — kodlamadan önce Barış'a sorulmalı

Bu dilim L1/L2'den daha büyük ve daha az önceden karara bağlanmış girdiyle geliyor (D-158/159/
160/170 LOCKED ama HANGİ mekanizmanın bunu uygulayacağı hiç tasarlanmadı) — aşağıdaki sorular
kodlamadan önce `AskUserQuestion` ile sorulmalı, tek tek değil muhtemelen birkaç turda:

1. **Kapsam sınırı — yalnızca `pps-8step-auto` mu?** D-158/159/160 açıkça Rev00'ın sayfa
   sözleşmesine (iki 50-satırlık kolon, 650pt sabit) karşı tasarlandı. `farplas-7step-tr`'nin
   B:O geometrisi bambaşka (eşit olmayan kolonlar, D-189/D2b'nin kendi düzeltmesi) ve hiçbir
   LOCKED karar onun için esnek tahsis öngörmüyor. Önerilen: L3 yalnızca `pps-8step-auto`'ya
   uygulanır, `farplas-7step-tr` statik kalır (zaten "legacy-compatibility" template, D-157).
2. **`pinned` nerede yaşasın?** Kalıcı mı (kullanıcının A3 sayfasını nasıl düzenlediğinin gerçek
   bir tercihi, `.ppsx`'e kaydedilir) yoksa oturum-içi geçici mi? D-170'in kendi lafzı ("reset to
   automatic" kontrolü) kalıcı bir tercihi ima ediyor. Kalıcıysa: `ProjectModel`'e mi (D-51'in
   loose/opsiyonel duruşuyla, migration gerekmez), hangi anahtarla (`appStep` mi, blok id'si mi
   — `farplas-7step-tr`'nin adım 5+6 birleşik bloğu App-step'e 1-1 eşlenmiyor, bu yüzden anahtar
   seçimi kapsam sınırı sorusuyla (madde 1) doğrudan bağlantılı).
3. **Solver mimarisi — talep nasıl hesaplanıyor?** §1 madde 5'in kendi sorusu: yeni bir saf
   `estimateBlockRowDemand` mi, yoksa `placeBlockContent`'in genişletilmiş bir modu mu. Hangi
   seçilirse seçilsin, iki kez aynı satır-sayma mantığının YAZILMAMASI (G2) bu dilimin kendi
   testinde doğrulanmalı.
4. **Drag-handle UI nerede yaşasın?** `HtmlA3Renderer`'ın kendisi mi (hem in-panel Preview hem
   pop-out `A3PreviewWindow` aynı bileşeni paylaşıyor, D-133/D-94), yoksa onu saran yeni bir
   etkileşimli katman mı? D-94'ün "renderer asla layout kararı vermez" sözleşmesi korunmalı —
   sürükleme olayının kendisi mi renderer'dan çıkıyor (yukarı, gerçek karar mekanizmasına),
   yoksa renderer'ın DIŞINDA, üzerine bindirilmiş şeffaf bir tutamaç katmanı mı (muhtemelen daha
   temiz, `HtmlA3Renderer`'ı hiç değiştirmeden).
5. **AI'nin rolü, D-160'ın kendi LOCKED lafzıyla teyit** — solver'a asla bir model girmiyor,
   yalnızca "hangi entry'ler birleştirilebilir/kısaltılabilir" önerisi (K1'in zaten var olan
   Review mekanizması, D-214) ayrı kalıyor. Bu dilim K1'e DOKUNMUYOR, yalnızca teyit ediyor.

### 2.2 Muhtemel iş kalemleri (kesin bölünme değil, bir taslak)

- **Solver çekirdeği**: her bloğun talebini hesapla, D-158'in varsayılan+minimum çiftine göre
  50 satırı deterministik dağıt (ADIM 2 büyüyebilir/ADIM 3 asla sıfıra inmez, D-160), `pinned`
  varsa onu sabit kısıt say. Saf, test edilebilir, `Date.now()`/rastgelelik yok (D-03/D-04).
- **`TemplateBlock`/`budget.ts`'in genişlemesi**: varsayılan+minimum verisinin nereye
  yazılacağı (yeni bir alan `pps-8step-auto.ts`'e mi, ayrı bir elastik-konfigürasyon dosyasına
  mı) — `farplas-7step-tr` dokunulmadan kalmalı (madde 1'in cevabına göre).
- **`pinned` komutu + domain modeli**: madde 2'nin cevabına göre yeni bir alan + komut
  (`MetaProjectInfoSetCommand`/`TemplateIdSetCommand`'ın kalıbı).
- **Drag-handle arayüzü**: madde 4'ün cevabına göre, floor'da rozet/devre-dışı tutamaç,
  pinned blok için "otomatiğe döndür" kontrolü (D-170'in tam lafzı).
- **`scripts/gen-a3-fixture.ts` yeniden üretimi** — bu dilim `src/a3/layout/budget.ts`'e
  dokunacağı için (L1/L2'nin aksine) fixture'ın gerçekten değişip değişmediği kontrol edilmeli,
  değiştiyse regenerate edilip diff'i incelenmeli (D-97'nin kendi disiplini).

## 3. Kapsam dışı

- `farplas-7step-plus`/`farplas-7step-en` (P-62) — dokunma.
- `BenefitCase`/`Onay formu` (P-18) — dokunma.
- **P-63** (kpi-strip'in ADIM 7'de her zaman appendix'e düşmesi) — kendi ayrı dilimi/commit'i,
  bu dilime KARIŞTIRMA (D-224/D-225'in ikisi de bunu bilerek ayrı tuttu).
- AI'nin layout kararı vermesi — D-160 (LOCKED) bunu açıkça yasaklıyor, madde 2.1.5'e bakınız.
- `farplas-7step-tr`'ye esneklik eklemek — madde 2.1.1'in cevabı "hayır" ise kapsam dışı kalır.

## 4. Bütçe ve kapanış disiplini

**Bu dilim muhtemelen D-114'ün "bir dilim = bir yeni mimari mekanizma" bütçesini aşıyor** —
solver çekirdeği, domain modeli/komut genişlemesi, VE drag-handle UI'ı üç ayrı gerçek yeni
mekanizma. 6a-6e/J3-1..7'nin kendi emsali: bu oturum kendi kapsamını okurken (§2.1'in
`AskUserQuestion` turları tamamlandıktan sonra) kendi alt-dilimlerine bölünmeyi ciddi şekilde
düşünmeli — örneğin **L3a** (solver çekirdeği + varsayılan/minimum'a göre otomatik dağıtım,
`pinned` YOK) ve **L3b** (pinned override + drag-handle arayüzü, L3a'nın üzerine). Bu bir öneri,
kesin bir bölünme değil — kararı bu oturumun kendisi, kapsamı netleştirdikten sonra versin.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturum başladığında gerçek bir sonraki
numarayı doğrula), `docs/oturumlar/README.md`'nin Faz 11 tablosundaki L3 satırı güncellenir,
`CLAUDE.md`'nin "Current state"ine özet eklenir. Bu oturumun kapanışı, Barış'ın kararına göre,
**Faz 11'in kendi üç dilimlik planını (D-223) TAMAMEN kapatabilir.**
