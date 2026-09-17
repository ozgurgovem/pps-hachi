# OTURUM — ADIM 1: gapStatement/fiveN1K için yan yana (genişlik-paylaşımlı) yerleşim

> D-272'nin (2026-09-17) kendi bulgusu: Barış'ın gerçek uygulamada (`npm run tauri dev`)
> yaptığı deneme, ADIM 1'deki Gap Analizi grafiği ile 5N1K diyagramının ikisinin de "çok
> küçük" göründüğünü gösterdi. Kök neden bulundu ve doğrulandı — bu bir hata DEĞİL, mevcut
> tasarımın (`fiveN1K`/`gapStatement`'ın kendi blok yüksekliğini DİKEY olarak, 4+8=12 satır
> bölüşmesi) matematiksel, kaçınılmaz bir sonucu. Barış bu oturumda küçük-ama-güvenilir
> durumu kabul etti (`AskUserQuestion`, önerilenin — "şimdi inşa et" — AKSİNE, "ayrı bir
> oturuma ertele" seçildi). Bu dosya o ertelenen işin launch prompt'u.
>
> Kanonik konum: `docs/oturumlar/adim1-yan-yana-yerlesim.md`. Yazıldı: 2026-09-17, D-272'nin
> kendi kapanışının hemen ardından.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
grep -n "DIAGRAM_ROW_SPAN" src/methods/fiveN1K/renderToA3.ts
  # BEKLENEN: 4, D-272'nin kendi notu (gerçek-uygulama regresyonu, satır bütçesi ADIM 1'in
  # kendi varsayılan 12 satırına tam eşit olacak şekilde küçültüldü).

grep -n "CHART_ROW_SPAN" src/methods/gapStatement/renderToA3.ts
  # BEKLENEN: 8. 4+8=12 — ADIM 1'in `pps-8step-auto`'daki kendi contentRows varsayılanı
  # (bkz. src/a3/templates/pps-8step-auto.ts, appStep 1'in bloğu).

grep -n "zones\?:" src/a3/methodContract.ts
grep -n "image\?:" src/a3/methodContract.ts
  # A3BlockContent'in üç karşılıklı-dışlayıcı şekli: lines (varsayılan), image (D-102, tek
  # rowSpan'lık dikey slot), zones (D-102, bir rowSpan'ı YATAY olarak bölen mekanizma —
  # smartTarget zaten bunu kullanıyor, D-38).

grep -n "function placeBlockContent" src/a3/layout/place.ts
  # Bu fonksiyon HER ZAMAN girdileri DİKEY olarak istifler — bir blok içindeki entry'ler,
  # sırayla, kendi rowSpan'larını TÜKETEREK yerleşir. Bloğun GENİŞLİĞİNİ birden fazla
  # entry arasında paylaştıran bir mekanizma HİÇ YOK — bu oturumun inşa edeceği şey bu.
```

Beklenenle uyuşmayan bir şey bulursan DUR ve Barış'a söyle.

---

## 1. Neden gerekli — gerçek ölçüm, tahmin değil

`FiveN1KDiagram.tsx`'in orantılı boyutlandırma formülü (`availableRadius = size.heightPx / 2
- DIAGRAM_PADDING_PX`) kendisine verilen yüksekliğe göre ölçekleniyor. D-272'nin satır bütçesi
düzeltmesinden sonra bu bileşen yalnızca ~69px yükseklik alıyor (kendi 4 satırlık görsel
alanı, `pps-8step-auto`'nun ADIM 1 satır yüksekliği × 4). Bu, diyagramı okunabilir olmaktan
çıkarıyor — Barış'ın kendi ekran görüntüsü bunu doğruladı.

Gerçek düzeltme: `gapStatement` ile `fiveN1K` bloğun 12 satırlık yüksekliğini DİKEY olarak
bölüşmek yerine, bloğun GENİŞLİĞİNİ paylaşarak YAN YANA yerleşmeli — ikisi de o zaman TAM
12 satırlık yüksekliğin tamamını kullanabilir (şu an paylaştıkları 4+8 yerine).

---

## 2. Gerçek açık sorular (kod yazmadan önce `AskUserQuestion` ile sorulmalı)

### 2.1 Mekanizma nerede yaşıyor — `place.ts`'e yeni bir üçüncü yerleşim modu mu?

Üç aday:
- **(a) Yeni bir `A3BlockContent` alanı, `widthFraction?: number`** — `zones`'un D-102'de
  zaten kanıtlanmış "genişliği kesirlere böl, tam sütuna yuvarla" mantığını (`placeZones.ts`'in
  `splitColumnsIntoZones`'u) tek bir entry yerine BİRDEN FAZLA entry arasında paylaşacak
  şekilde genelleştirmek. `gapStatement`/`fiveN1K` her biri `widthFraction: 0.5` bildirir,
  `place.ts` aynı bloktaki ardışık `widthFraction`'lı entry'leri yan yana (kendi sütun
  aralığında) yerleştirir, HER İKİSİ de kendi TAM `rowSpan`'ini (12) kullanır.
- **(b) Blok şablonunun kendisine statik bir "bu blok iki yarıya bölünür" bayrağı** —
  `TemplateBlock`'a `splitColumns?: {left: ColumnRange, right: ColumnRange}` gibi bir alan,
  yalnızca ADIM 1 için kullanılır. Daha basit ama genel değil — gelecekte başka bir blok
  aynı ihtiyacı duyarsa tekrar icat edilir (G2 riski).
- **(c) `place.ts`'e hiç dokunma, ADIM 1'i template seviyesinde İKİ ayrı alt-blok olarak
  tanımla** (`pps-8step-auto.ts`'in appStep 1 bloğunu ikiye böl). Bu, elastic allocation
  (D-158/D-160/L3a) ile çakışır — Faz 11'in "bir appStep = bir blok" varsayımını kırar,
  muhtemelen daha büyük bir mimari değişiklik.

Önerilen: (a) — genel, D-102'nin zaten kanıtlanmış zon-genişlik-müzakere mantığını yeniden
kullanıyor, `place.ts`'in dikey-istif çekirdeğine dokunmuyor (yalnızca "bu iki entry'yi yan
yana yerleştir" için yeni bir dal ekliyor), gelecekte başka bir blok da kullanabilir.

### 2.2 Genişlik oranı sabit mi, içerik-duyarlı mı?

`gapStatement`'ın grafiği (bar chart + 3 bant) ile `fiveN1K`'nin dairesi büyük olasılıkla
farklı doğal en-boy oranları istiyor. Sabit 50/50 mi, yoksa her ikisinin de kendi
`renderImage`'ının `size` parametresinden önerdiği bir minimum genişlik mi okunmalı?
Önerilen: BVVL turunda (bkz. §4) gerçek pt ölçeğinde denenip karara bağlanmalı — önceden
tahmin etmeye gerek yok, CLAUDE.md'nin kendi süreci bunun için var.

### 2.3 Bu mekanizma yalnızca ADIM 1'e mi özel, yoksa genel bir yetenek mi?

`widthFraction` genel bir `A3BlockContent` alanı olarak eklenirse, gelecekte başka bir blokta
da (örn. iki grafiğin yan yana durması gereken bir senaryo) kullanılabilir hale gelir — ama
bu oturumun somut hedefi yalnızca ADIM 1. Önerilen: mekanizmayı genel yaz (YAGNI'yi ihlal
etmeden — zaten `zones`'un genelleştirilmiş hali), ama yalnızca `gapStatement`/`fiveN1K`'ye
uygula, başka hiçbir plugin'e dokunma.

---

## 3. Beklenen iş sırası

1. §2.1/§2.2/§2.3'ü Barış'a `AskUserQuestion` ile sor (tek tur, hepsi birlikte).
2. CLAUDE.md'nin kendi Block Visual Verification Loop'unu işlet — gerçek pt→px ölçekte,
   `pps-8step-auto`'nun ADIM 1 gerçek genişliği (bkz. `TEMPLATE_ANALYSIS.md` §12) ile, EK-2905
   referans dosyasının gerçek kırpımlarıyla yan yana — kod yazmadan ÖNCE, mekanizma seçilse
   bile somut genişlik oranı/görsel sonucu Barış onaylamadan production koda geçme.
3. `place.ts`'e seçilen mekanizmayı ekle (muhtemelen `placeZones.ts`'in bir varyasyonu/
   genellemesi — G2, mevcut zon-genişlik-müzakere mantığını kopyalama, yeniden kullan).
4. `gapStatement`/`fiveN1K`'nin `renderToA3.ts`'lerini yeni alanı bildirecek şekilde güncelle;
   `DIAGRAM_ROW_SPAN`/`CHART_ROW_SPAN`'i 12'ye (TAM blok yüksekliği) çıkar, artık ikiye
   bölünmüyorlar.
5. D-272'nin kendi regresyon testlerini (saturated-neighbour testi, appendix-düşmeme testi)
   YENİ geometriye göre güncelle — hâlâ komşuların durumundan bağımsız, koşulsuz sığmalılar
   (bu garanti KAYBOLMAMALI, yalnızca dikeyden yataya taşınmalı).
6. `FiveN1KDiagram`/`GapAnalysisChart`'ın artık aldığı GERÇEK (daha büyük) `size`'a göre
   render kalitesini gözden geçir — orantılı boyutlandırma formülleri değişmeyebilir, ama
   gerçek pt ölçeğinde tekrar doğrulanmalı.

---

## 4. Test/doğrulama

- `xlsxSurvival.test.ts` (her iki plugin) — yeni geometriyle güncellenmeli, iki görselin de
  artık YATAY olarak komşu anchor hücrelere yerleştiğini doğrulamalı.
- D-272'nin saturated-neighbour testi (ADIM 2/3 tam doygunken bile ikisi de düşmüyor) —
  yeni mekanizmaya taşınmalı, mutasyon-doğrulanmalı (regresyon reddedilirse test gerçekten
  KIRMIZI çıkmalı).
- `scripts/gen-a3-fixture.ts` yeniden çalıştırılmalı, diff gözden geçirilmeli (fixture
  `smartTarget`/`fishbone`/`pareto`/`trend` kullanıyor, `gapStatement`/`fiveN1K` kullanmıyor —
  muhtemelen fixture etkilenmez, ama doğrula).
- Gerçek uygulama turu (`npm run tauri dev`) Barış tarafından — bu ortamda ekran yok, canlı
  WKWebView doğrulaması her zamanki gibi Barış'a düşüyor.

---

## 5. Bütçe ve model önerisi

D-114'ün "bir dilim = bir yeni mekanizma" bütçesine tam oturuyor — `place.ts`'e tek bir yeni
yerleşim modu (D-102/`zones`'un genellemesi). Mimari bir karar (§2.1) içeriyor, bu yüzden
**Opus** tercih edilir (D-28'in kendi routing kuralı — mimari tasarım Opus, mekanik inşa
Sonnet); BVVL turu kaçınılmaz olarak birden fazla görsel iterasyon gerektirebilir, tek
oturumda bitmeyebilir (CLAUDE.md'nin kendi "bir blok, bir temiz oturum" tavsiyesi).
