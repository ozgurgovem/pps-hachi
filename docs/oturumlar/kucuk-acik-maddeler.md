# OTURUM — Küçük açık maddeler: P-63 (kpi-strip taşması) + P-64 (son blok tutamacı)

> İki bağımsız, küçük, zaten iyi tanımlanmış bulgu — ikisi de Faz 11'in kapanışında bilerek
> ayrı bırakıldı (D-224/D-225/D-227'nin hepsi bunu teyit etti). Bu ikisi FARKLI dosyalara
> dokunuyor (`src/methods/kpiStrip/` vs `src/a3/render/BlockPinOverlay.tsx`) — aynı oturumda
> art arda yapılabilir, ya da iki ayrı oturuma bölünebilir; ikisi de Faz 12/P-58/P-62'den
> TAMAMEN bağımsız, onlarla paralel çalıştırılabilir.
>
> Üçüncü bir madde (koyu-tema Farplas renklerinin gerçek görsel onayı) bu dosyada listeleniyor
> ama bir KODLAMA görevi DEĞİL — Barış'ın kendi `npm run tauri dev` turunda bakması gereken bir
> madde, bkz. §3.
>
> Kanonik konum: `docs/oturumlar/kucuk-acik-maddeler.md`. Yazıldı: 2026-09-08, W3'ün
> kapanışında, Barış'ın "sıradaki iş" sorusuna cevaben.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
sed -n '1,40p' src/methods/kpiStrip/renderToA3.ts
  # `lines: [{ text: entry.title, bold: true }]` (1 satır) + `image: { rowSpan: CHART_ROW_SPAN
  # (=6) }` bekleniyor — toplam 7 satır talep. pps-8step-auto'nun ADIM 7 tuvali (contentRows
  # end-start+1) tam 6. Farklıysa (CHART_ROW_SPAN başka bir değerse, ya da lines zaten boşsa)
  # DUR, P-63 zaten başka biri tarafından düzeltilmiş olabilir.

grep -n "contentRows" src/a3/templates/pps-8step-auto.ts | sed -n '9p'
  # ADIM 7 bloğunun (appSteps: [7]) contentRows.start/end farkı = 5 (6 satır) doğrula.

grep -n "lines: \[\]" src/methods/smartTarget/renderToA3.ts src/methods/fiveN1K/renderToA3.ts
  # İKİ eşleşme bekleniyor — bu, P-63'ün önerilen düzeltmesinin (başlık satırını kaldır) zaten
  # şipping edilmiş bir örneği/emsali.

grep -n "slice(0, -1)" src/a3/render/BlockPinOverlay.tsx
  # `column.slice(0, -1).map((above) => {...})` bekleniyor — n bloklu bir kolon için n-1
  # tutamaç üretiliyor, son blok atlanıyor. Farklıysa DUR, P-64 zaten düzeltilmiş olabilir.

grep -n "appStep'e göre\|keyed by appStep" src/a3/layout/elasticAllocation.test.ts
  # Solver'ın HERHANGİ bir bloğu (son blok dahil) pinleyebildiğini doğrulayan test — P-64'ün
  # kendi notunun "solver zaten destekliyor, bu yalnızca UI'nin kapsam sınırı" iddiasının kanıtı.
```

`DECISIONS.md`'de **P-63** ve **P-64**'ün tam metnini oku (bu dosyanın önsözü ikisini de
özetliyor ama kaynak otoriter).

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. P-63 — `kpi-strip` ADIM 7'de her zaman appendix'e düşüyor

### 1.1 Kök neden (zaten bulundu, L1'in kendi kapanış turunda — D-224)

`kpiStrip/renderToA3.ts`, `lines: [{ text: entry.title, bold: true }]` (1 satır) +
`image.rowSpan: CHART_ROW_SPAN` (6) talep ediyor — toplam 7. `pps-8step-auto`'nun ADIM 7
tuvali (D-158/§12.8) tam 6 satır. Sonuç: 7 > 6, her `kpi-strip` girişi HER ZAMAN appendix'e
düşüyor — D-100 veri kaybetmiyor (appendix'e taşıyor), ama ADIM 7'nin kendi özel KPI
görselinin A3 sayfasında HİÇ görünmemesi anlamına geliyor.

### 1.2 Önerilen düzeltme (D-223'ün kendi notunda zaten yazılı, bu oturumun kendi kararı
olarak doğrulanmalı, körü körüne uygulanmamalı)

`renderKpiStripToA3`'ün başlık satırını kaldırması — `smartTarget`/`fiveN1K`'ın zaten
`lines: []` kullandığı desenin AYNISI (entry'nin kendi başlığı zaten bloğun içeriğinde/
grafiğin kendi etiketlerinde okunabilir oluyorsa). Bunu uygulamadan ÖNCE kontrol et: grafiğin
kendisi (KpiStripChart.tsx) entry başlığını herhangi bir yerde render EDİYOR mu? Etmiyorsa
başlığı tamamen kaybetmeden `lines: []`'a geçmek güvenli değil — belki başlık grafiğin
kendisine (bir üst köşe etiketi olarak) taşınmalı, yalnızca A3TextLine listesinden
kaldırılmamalı. Bu, kodlamadan önce gerçek `KpiStripChart.tsx`'i okuyarak karar verilecek bir
detay, körü körüne "satırı sil" değil.

### 1.3 Test/doğrulama

- `renderToA3.test.ts`'in kendi mevcut testlerini güncelle (satır sayısı değişecek).
- Yeni bir regresyon testi: `pps-8step-auto`'nun gerçek ADIM 7 tuvelinde (6 satır) bir
  `kpi-strip` girişinin artık `droppedEntryIds`'e DÜŞMEDİĞİNİ doğrulayan bir test — D-97'nin
  kendi yapısal karşılaştırma disipliniyle, gerçek `buildA3Layout` üzerinden (mock değil).
- `scripts/gen-a3-fixture.ts`'i yeniden çalıştır — `kpiStrip` fixture'ın kendi beş gerçek
  metodundan biri DEĞİL (Pareto/Trend/Fishbone/SMART Target dörtlüsü), yani muhtemelen
  fixture'ı etkilemiyor, ama kontrol et.

---

## 2. P-64 — bir kolonun son elastik bloğunun kendi sürükleme tutamacı yok

### 2.1 Kök neden/kapsam sınırı (zaten bulundu, L3b'nin kendi kapanışında — D-227)

`BlockPinOverlay.tsx`, n bloklu bir kolon için `column.slice(0, -1)` ile n-1 tutamaç üretiyor
— altında sürüklenecek bir sınır olmayan SON blok (örn. `pps-8step-auto`'nun ADIM 3/ADIM 8)
kendi tutamacına sahip değil. **Solver'ın kendisi bunu ZATEN destekliyor** —
`elasticAllocation.test.ts`'in "appStep'e göre doğru bloğu anahtarlama" testi bunu doğruluyor
— bu yalnızca UI'nin fare-tutamaç kapsamının bir sınırı, YAGNI ile bilerek bırakıldı.

### 2.2 Önerilen düzeltme (P-64'ün kendi notunda iki aday, kesin değil — bu oturumun kararı)

- **Seçenek A**: son bloğun kendi tutamacı, YUKARIDAKİ komşusunu (kendisini değil) pinleyerek
  simüle edilir. Bunun kendi belirsizliği: iki komşulu bir sınırda (kolonun ortasındaki bir
  blok) "bu tutamaç hangi tarafı pinliyor" sorusu zaten `above` parametresiyle çözülmüş
  durumda (üstteki blok pinleniyor) — son blok için "altında blok yok, o zaman KENDİSİ mi
  pinleniyor" farklı bir semantik olur, tutarsızlık riski var.
- **Seçenek B**: son blok için ayrı bir sayısal giriş kontrolü (drag değil, doğrudan satır
  sayısı yazma) — `PinnedBlockSummary.tsx`'in zaten var olan "reset to automatic" kontrolüne
  benzer bir "manuel gir" kontrolü eklenir.
- Barış'a `AskUserQuestion` ile sorulmalı — küçük ama gerçek bir tasarım kararı, körü körüne
  A ya da B seçilmemeli.

### 2.3 Test/doğrulama

- `BlockPinOverlay.test.tsx`'e yeni bir test: son blok artık pinlenebiliyor (seçilen
  yaklaşıma göre).
- `elasticAllocation.test.ts` DOKUNULMAMALI — solver zaten doğru, yalnızca UI değişiyor.

---

## 3. Koyu-tema Farplas renklerinin görsel onayı (KODLAMA GÖREVİ DEĞİL)

D-220 dark-mode MEKANİZMASINI düzeltti (cascade-layer sorunu), ama yedi `--fp-*` renk
DEĞERİNİN kendisi hâlâ "okunabilirlik-öncelikli, GÖRSEL OLARAK DOĞRULANMAMIŞ yer tutucu" —
Barış bunları hiç görmedi. Bu, bir agent oturumunun kendi başına yapabileceği bir şey DEĞİL
(gerçek bir ekran gerekiyor) — Barış'ın kendi `npm run tauri dev` turunda `StepOverview`'i
koyu temada açıp bakması, ve isterse (P-58'in kendi oturumuyla BİRLİKTE ya da ayrı) bir kısa
geri bildirim vermesi yeterli. Eğer P-58 (görsel dilin yayılması) oturumu açılırsa, bu ikisi
AYNI BVVL turunda birleştirilebilir (§4'ün P-58'in kendi dosyasındaki notu).

---

## 4. Bütçe ve kapanış disiplini

Her ikisi de (P-63, P-64) D-114'ün "bir dilim = bir yeni mimari mekanizma" bütçesinin İÇİNDE
— P-63'ün kendi mekanizması yok (mevcut `lines: []` desenini tekrar kullanıyor), P-64'ün
kendi kararı (§2.2) küçük. Aynı oturumda art arda yapılabilirler, ya da ayrı ayrı — Barış'ın
kendi tercihi.

Kapanışta: `DECISIONS.md`'ye yeni bir/iki D-numarası, P-63/P-64'ün kendi satırlarının KAPANDI
olarak işaretlenmesi, `docs/oturumlar/README.md`'nin ilgili bölümü (Faz 11'in tablosu,
P-63/P-64 ilk orada filed edildiği için).

---

**Model önerisi**: ikisi de küçük, iyi tanımlanmış düzeltme — Sonnet 5 yeterli (D-28).
