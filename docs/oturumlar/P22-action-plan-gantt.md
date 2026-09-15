# OTURUM — P-22: action plan'ın Gantt yarısı

> `export-ui-sadakat-gedikleri.md`'nin §4'ünde Barış'a `AskUserQuestion` ile soruldu
> (2026-09-15) — **Barış önerilen seçeneği DEĞİL, gerçek bir Gantt görseli inşa edilmesini
> seçti.** Bu oturumun kendi §1'i, kodlamaya başlamadan önce Barış'ın önceden görmediği,
> gerçek ve ciddi bir mimari çatallanma buluyor — **kendi `AskUserQuestion` turu bu bulguyla
> birlikte YENİDEN yapılmalı**, önceki turun cevabı bu yeni bilgiyle geçersiz olabilir.
>
> Kanonik konum: `docs/oturumlar/P22-action-plan-gantt.md`. Yazıldı: 2026-09-15.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
cat src/methods/actionItem/schema.ts
  # "One action per entry" bekleniyor — action/owner/startDate/dueDate/percentComplete/
  # evidence/customerApproval, TEK bir action kaydı. Bir action LİSTESİ (row table) DEĞİL.

grep -n "One traceable node" src/methods/countermeasure/schema.ts
  # D-116'nın references[] tasarımının D-124'ü NASIL zorladığını doğrula: bir entry N
  # countermeasure/action tutsaydı, yalnızca UNION referansları taşıyabilirdi — S5/S6'nın
  # per-action kuralları (§1.2) bunu cevaplayamaz.

grep -n "readonly image?: A3ImageRequest" src/a3/methodContract.ts
  # A3BlockContent başına EN FAZLA BİR image — her ENTRY kendi renderToA3'ü üzerinden kendi
  # görselini üretir, bloktaki DİĞER entry'lerin verisine erişimi YOK (place.ts, D-102).

grep -n "items: z.array" src/methods/kpiStrip/schema.ts src/methods/pareto/schema.ts
  # Çok-noktalı grafiklerin (kpiStrip/pareto/trend/distributionChart) hepsi TEK bir entry'nin
  # KENDİ payload'ı İÇİNDE bir dizi taşıyor — çapraz-entry agregasyon YOK, hiçbir yerde.
```

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Gerçek mimari çatallanma — kod yazmadan önce Barış'a MUTLAKA sorulmalı

P-22'nin kendi orijinal notu ("yeni bir `ChartSpec` varyantı + yeni bir `A3ImageKind`
gerekiyor, D-102'nin zaten kurulu mekanizmasının üstüne") **eksik bir varsayım taşıyordu**: bu
projede HER görsel (Pareto/Trend/distribution/kpi-strip/fishbone/why-why-tree) tek bir
`Entry`'nin KENDİ `renderToA3`'ünden üretiliyor, ve o entry'nin payload'ı içindeki veriyle
sınırlı (`place.ts`'in per-block image-row-span mekanizması, D-102 — bir blok en fazla dört-
beş entry'nin HERBİRİNE ayrı ayrı görsel alanı ayırabilir, ama TEK bir entry'nin görseli
DİĞER entry'lerin verisine hiç erişemez).

`actionItem` ise D-124'ün ("bir traceable node = bir entry") zorladığı granülaritede — **bir
entry TEK BİR action kaydı**, bir action LİSTESİ değil. Bu, D-116'nın `references[]`
tasarımının doğrudan sonucu: bir entry N action tutsaydı yalnızca union referansları
taşıyabilirdi, §1.2 S5/S6'nın per-action kuralları bunu cevaplayamazdı (6b'nin kendi kararı,
D-124, LOCKED).

**Sonuç: gerçek bir "Gantt chart" (birden çok action'ın PARALEL çubuklar halinde, ortak bir
zaman eksenine göre gösterildiği görsel) bu mimaride bugün YOK OLAN bir mekanizma gerektiriyor
— tek bir `renderToA3` çağrısının erişebildiği veri her zaman TEK BİR entry'nin kendi
payload'ıyla sınırlı.** Üç gerçek seçenek var, hiçbiri "D-102'nin üstüne küçük bir ekleme"
değil:

### Seçenek A — Tek-action mini-şerit (D-102'ye tam uyumlu, ama "Gantt" değil)

Her `actionItem` entry'si kendi tek çubuğunu (`startDate`→`dueDate`) kendi bloğunda çizer —
`kpiStrip`'in kendi hand-rolled SVG desenine benzer, ama HER entry kendi ayrı görselini alır
(muhtemelen çok küçük, tek çubuklu). Adım 6'da 5 action varsa, 5 AYRI küçük görsel olur, ortak
bir zaman ekseni PAYLAŞMAZLAR (her biri kendi start/due aralığına göre ölçeklenir). Bu, D-102'nin
"her entry kendi görselini üretir" kuralını hiç bozmaz — en ucuz, ama muhtemelen SPEC'in "Gantt"
kastettiği şeyden görsel olarak UZAK (paralel çubuklar yerine bir yığın küçük tekil çubuk).

### Seçenek B — Blok-seviyesi agregasyon (gerçek Gantt, ama YENİ bir mimari mekanizma)

Adım 6'nın TÜM `action-item` entry'lerini TEK bir ortak zaman eksenine göre çizen BİR görsel —
`place.ts`/`buildA3Layout.ts`'in bugünkü "her entry kendi görselini üretir" varsayımını kırıyor.
Bu, K1'in `layoutReview.ts`'inin ya da K2'nin `buildMockAuditContext`'inin kendi "adımın TÜM
entry'lerini oku" desenine benzer bir mekanizma gerektirir, ama GÖRSEL üretim tarafında hiç
emsali yok — `resolveElasticBlocks`/`elasticAllocation.ts` bile yalnızca GEOMETRİ hesaplıyor,
görsel İÇERİK üretmiyor. Muhtemelen: (i) blok-seviyesinde özel bir "sentetik entry" ya da
step-level bir görsel slotu icat etmek, ya da (ii) `buildA3Layout`'un pipeline'ına üçüncü bir
geçiş eklemek (bugün iki geçiş var: images'sız → images'lı, D-102). **Gerçek, orta-büyük bir
mimari değişiklik — kendi tasarım oturumunu hak ediyor, tek bir "dilim" değil.**

### Seçenek C — Gantt'i tamamen bırak, mevcut tablo alanları yeterli sayılsın

P-22'nin kendi notundaki üçüncü, en ucuz seçenek — `startDate`/`dueDate` zaten
`RowTableEditor`'de/entry listesinde görünür durumda, SPEC'in lafzı buna göre düzeltilir.

**Barış'a bu üç seçenek AÇIKÇA sunulmalı** — önceki `AskUserQuestion` turunda ("gerçek Gantt
görseli inşa et") bu ayrım hiç yoktu, cevap muhtemelen Seçenek A'yı mı B'yi mi kastettiğini
netleştirmiyor. Seçenek B seçilirse, bu kendi başına bir kapsam-belirleme oturumu gerektirir
(Faz 8-12'nin kapsam-belirleme oturumlarının emsaliyle aynı — kod yazılmadan önce).

---

## 2. Test/doğrulama (seçilen seçeneğe göre değişir)

- **Seçenek A**: `renderActionItemToA3.test.ts`, yeni `xlsxSurvival.test.ts` (D-102'nin iki-
  geçişli `buildA3Layout` deseni, `pareto`/`trend`'in kendi testleriyle aynı şekil).
- **Seçenek B**: yeni bir permanent PROBE test (D-136'nın metodolojisi) — adımda birden çok
  `action-item` entry'si varken TEK bir Gantt görselinin doğru anchor'landığını, D-100'ün
  never-truncate garantisinin hâlâ geçerli olduğunu (5+ action olduğunda appendix'e düşme
  davranışı ne olacak?) doğrulayan gerçek bir uçtan uca test.
- Her iki seçenekte de `scripts/gen-a3-fixture.ts` yeniden çalıştırılmalı — `actionItem` bugün
  fixture'ın beş gerçek metodundan biri değil, etkilenmeyebilir ama kontrol et.

---

## 3. Bütçe ve kapanış disiplini

Seçenek A: D-114'ün "bir dilim bir mekanizma" bütçesi İÇİNDE (yeni bir `A3ImageKind` +
`ChartSpec` varyantı, `kpiStrip`'in emsali). Seçenek B: bütçenin AÇIKÇA DIŞINDA — kendi
kapsam-belirleme oturumu + muhtemelen çok-dilimli bir plan gerektirir (L3a/L3b'nin ya da
Faz 9/J1-J3'ün emsali). Seçenek C: kod yok, yalnızca dokümantasyon kapanışı.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, P-22'nin kendi satırının KAPANDI (ya da
Seçenek B ise kendi yeni bir kapsam-belirleme kaydı) olarak işaretlenmesi,
`docs/oturumlar/README.md`'nin ilgili tablosu güncellenmesi.

---

**Model önerisi**: §1'in kendi mimari çatallanması nedeniyle bu oturumun İLK işi bir
`AskUserQuestion` turu, kod değil — Sonnet 5 yeterli (D-28), ama Seçenek B seçilirse kendi
kapsam-belirleme oturumu Opus'la da yapılabilir Barış tercih ederse.
