# OTURUM C3 — `kpi-strip` mekanizması + ADIM 7'nin gerçek plugin'i (Oturum C'nin üçüncü dilimi)

> `docs/oturumlar/C-yontem-plugin-insasi.md`'nin önerdiği altı dilimden (§3) üçüncüsü. **C1 ve
> C2 BİTTİ** — C1: durum glifi (P-37, 4/5), fishbone geometrisi (P-34), B1'in 5./6. alan ekleri
> (D-180). C2: `five-n1k` + `problem-impact` plugin'leri, sıfır yeni mekanizma (D-181).
> Bu dosya C3'ün kapsamıdır: **D-114 disiplinine göre bu dilime işaretlenmiş TEK yeni
> mekanizma** — `kpi-strip` `A3ImageKind`'ı + `KpiStripChartSpec` + ADIM 7'nin bugün hiç
> sahip olmadığı ilk gerçek plugin'i. D-167/D-177 görsel tasarımı zaten onayladı (§14.3) — bu
> bir inşa turu, Faz 6c'nin `distribution-chart`'ı aldığı rolün aynısı. **Tek açık soru** (§2.2)
> kodlamadan önce Barış'a sorulmalı; C2'den farkı budur — C2'nin ikisi de tamamen kesin
> tarifliydi, C3'ün mekanizması bir tasarım boşluğu (durum rengi nasıl üretilir?) içeriyor.
>
> Kanonik konum: `docs/oturumlar/C3-kpi-strip.md`. Yazıldı: 2026-08-16, C2'nin kapanışının
> hemen ardından, Barış'ın açık isteğiyle ("yeni promptu paylaşır mısın?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      docs/oturumlar/C-yontem-plugin-insasi.md \
      src/a3/methodContract.ts src/a3/render/rasterize.ts \
      src/methods/registry.ts src/methods/chartSpec.ts src/methods/types.ts \
      src/methods/distributionChart/index.ts src/methods/distributionChart/DistributionChart.tsx \
      src/methods/distributionChart/Editor.tsx src/methods/distributionChart/renderToA3.ts \
      src/methods/pareto/Editor.tsx src/methods/pareto/ParetoChart.tsx \
      src/methods/costApproval/fields.ts src/methods/shared/statusGlyph.ts \
      src/a3/templates/farplas-7step-tr.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-16'da doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (plan onayı, TDD, i18n),
   ve "Current state"in **Oturum C — C1** ve **Oturum C — C2** paragrafları.
3. `docs/oturumlar/C-yontem-plugin-insasi.md` §2.2 madde 3 ve §3 madde C3 — bu dilimin kendi
   tarifi.
4. `reference/TEMPLATE_ANALYSIS.md` §14.3 — P-31'in ADIM 7 yarısı, D-167'nin mekanizma kararı,
   **D-177'nin onaylanan görsel dili** (üç durum-kodlu bullet-graph karo), baştan sona.
5. `DECISIONS.md`: **D-167** (mekanizma kararı — `A3ImageKind = "kpi-strip"`,
   `KpiStripChartSpec` taslağı), **D-177** (onaylanan görsel + kaydettiği gerçek şema boşluğu),
   **P-36** (Sürdürme/Sonuç alanları taslakta yok, gerçek referanslarda var — şema **ilk kez
   yazılırken** içine gömülecek, sonradan yama değil), **D-102/D-141** (ChartSpec'in "tek
   kind, `spec.kind`'a göre çoğullaşan varyant" deseni — `distribution-chart` en yeni emsal),
   **D-114** (dilim disiplini — bu dilimin bütçesi tam olarak bir yeni mekanizma).
6. `src/methods/distributionChart/*` — bu oturumun **birebir izleyeceği** en yakın emsal: yeni
   bir `A3ImageKind` + yeni bir `ChartSpec` ailesi + yeni bir plugin'in aynı slice'ta nasıl
   birlikte inşa edildiği (6c, D-141).

---

## 2. Kapsam

### 2.1 Mekanizma: `kpi-strip` `A3ImageKind` + `KpiStripChartSpec` (D-167 — bu dilimin tek yeni mekanizması)

- `src/a3/methodContract.ts`: `A3ImageKind` union'una `"kpi-strip"` eklenir.
- `src/methods/chartSpec.ts`: `KpiStripChartSpec` eklenir — D-167'nin taslağı artı **P-36'nın
  düzeltmesi baştan gömülü** (yama değil, ilk yazımda):
  ```ts
  export interface KpiStripItem {
    readonly label: string;
    readonly unit?: string;
    readonly baseline: number;
    readonly target: number;
    readonly actual: number;
    /** P-36: Rev00/EK-2905'in gerçek "Sürdürme" sütunu — taslakta yoktu, ikisinde de var. */
    readonly sustain?: number;
    /** P-36: Rev00/EK-2905'in gerçek "Sonuç" sütunu — aynı gerekçe. */
    readonly result?: number;
    readonly status: "onTarget" | "inProgress" | "behind"; // bkz. §2.2
  }
  export interface KpiStripChartSpec {
    readonly kind: "kpi-strip";
    readonly items: readonly KpiStripItem[];
  }
  ```
  (`status`'un neden hesaplanmış değil, veri modelinin kendisinde olduğu §2.2'de açıklanıyor —
  orada kararlaştırılmadan bu alan kesinleşmez.)
- Yeni React bileşeni (`pareto/ParetoChart.tsx`, `smartTarget/TrajectoryChart.tsx`,
  `distributionChart/DistributionChart.tsx`'ın izlediği desen — `size: A3ImageSize` alır,
  `ResponsiveContainer` KULLANMAZ, D-105/D-113'ün dersi): D-177'nin onayladığı bullet-graph
  karo — her metrik için kesikli gri Önce/baseline çentiği, düz siyah Hedef/target
  çentiği+üçgeni, Katman A renkli (`status`'a göre) Sonra/actual dolgusu. Sürdürme/Sonuç
  (`sustain`/`result`) D-177'nin maketindeki gibi küçük alt-satır metni olarak gösterilebilir —
  bu, mockup'ın zaten onaylanmış çözümü, yeniden tasarlanmıyor.
- Kayıt: `MethodPlugin.imageKind = "kpi-strip"` + `renderImage`. `src/a3/render/rasterize.ts`'e
  **hiçbir dokunuş gerekmiyor** — `rendererMap[slot.kind]` üzerinden zaten jenerik dispatch
  ediyor (`distribution-chart`'ın kendi eklenişinde de dokunulmadı; kaynak koddan doğrulandı,
  bu oturum başında tekrar doğrulanmalı).

### 2.2 Açık soru — KODLAMADAN ÖNCE `AskUserQuestion` ile Barış'a sorulmalı

D-177'nin maketi üç karonun rengini (mavi/yeşil/kırmızı) elle seçti — algoritmik bir kural
yazmadı ("Katman A rengi, hedefe ulaşıldıysa yeşil, devam ediyorsa mavi, hedefin gerisindeyse
kırmızı" cümlesi bir *sonucu* tarif ediyor, *nasıl hesaplanacağını* değil). Gerçek plugin'in bu
üç durumdan hangisini seçeceğine karar veren şey ne olacak?

- **Seçenek A (önerilen):** her KPI kaleminin kendi ayrık `status` alanı olur, kullanıcı
  Editor'de elle seçer — `countermeasure`/`costApproval`/`icaPcaTransition`/
  `implementationIssuesLog`'un **hepsinin** zaten kullandığı desen (P-37/D-180'in dört
  plugin'i), hiçbiri hesaplanmış değil. `baseline`/`target`/`actual` yalnızca karonun kendi
  sayısal görselini çizer, tonu belirlemez.
- **Seçenek B:** `baseline`/`target`/`actual` karşılaştırmasından hesaplanır — ama "yüksek mi
  iyi, düşük mü iyi" sorusu şemada hiçbir yerde yok (Fire Oranı ve Kalıp Duruş Süresi ikisi de
  "düşük iyi" ama başka bir KPI "yüksek iyi" olabilir, örn. bir üretkenlik metriği); bu yön
  bilgisini de (`direction: "lowerIsBetter" | "higherIsBetter"`) eklemek gerekir, ki bu
  D-167/D-177'nin hiçbirinde konuşulmadı.

Seçenek A önerilir — mevcut kod tabanının **hiçbir yerinde** hesaplanmış bir durum yok, D-180'in
kendi kapanışı bunu açıkça bir ilke olarak kaydetti (P-37). Ama bu C3'ün kendi kararı, C2'ninki
gibi devralınmış değil — kodlamadan önce sorulmalı.

### 2.3 ADIM 7'nin gerçek plugin'i

- Yeni plugin — öneri: `id`/`imageKind` ikisi de `"kpi-strip"` (`distribution-chart`'ın
  `id === imageKind` deseniyle tutarlı), `steps: [7]`. Bugün Adım 7'ye kayıtlı tek şey
  `genericText` (`STEP_IDS` üzerinden, tüm adımlara kayıtlı) — registry'de Adım 7'ye özel
  **hiçbir plugin yok**, bu oturum başında `grep`la yeniden doğrulanmalı.
- Şema: bir KPI kalemi listesi. `RowTableEditor`'ün alanları hep `string` (D-115) — burada
  `baseline`/`target`/`actual`/`sustain`/`result` sayısal, o yüzden `RowTableEditor` doğrudan
  uymuyor. En yakın emsal `pareto/Editor.tsx`'in kendi inline liste editörü (`count: number`
  taşıyan kategori listesi) — aynı desen, `problem-impact/Editor.tsx`'in C2'de zaten bir kez
  tekrarladığı.
- `renderToA3`: `image: { kind: "kpi-strip", rowSpan: N, spec: {...} }`. `N`'nin gerçek değeri
  bu oturumda kararlaştırılır — gelecekteki 8-adım şablonunun ADIM 7 tuvali yalnızca 78 pt/6
  satır (§14.3, D-156) iken şimdiki şablonun (`farplas-7step-tr`) Adım 7 bloğu çok daha geniş
  (P37:AB54, 18 satır) — `CHART_ROW_SPAN` sabitleri şimdiye dek modül sabiti olarak seçildi
  (Pareto/Trend `10`); burada muhafazakâr bir değer (gelecekteki dar tuvale de sığacak, örn.
  `6`) tercih edilmeli, `place.ts`'in D-100 taşma güvencesi zaten şimdiki şablonda sığmasa bile
  entry'yi ek sayfaya taşıyor — kırılma yok, yalnızca bir tercih.

---

## 3. Kapsam dışı

- **Sustainment Audits** (B1 §13.4 aday 1, ADIM 7) — `kpi-strip`'ten farklı bir kavram
  (periyodik/yinelenen denetim kaydı, tek-seferlik KPI karosu değil), tasarlanmadı, bu dilimin
  işi değil.
- ADIM 8'in belge/Yokoten/Lessons-Learned plugin'leri — **C4**.
- `whyWhyTree` diyagramı + terminal-durum alanı + referans mimarisi (P-35) — **C5**.
- `MethodPlugin.tier` + iki-bölümlü `MethodBand` + sürükle-tutamaç esnek tahsis arayüzü
  (D-169/D-170) — **C6**.
- D-153'ün başlık bandındaki "Genel RAG" alanı (B1 §13.4 aday 7) — bir method plugin'i değil,
  proje başlık/manifest modelinin parçası; ayrı iş.
- Şablon dosyasının kendisi (`src/a3/templates/*`) — D-95, Faz 11.

---

## 4. Bütçe ve kapanış disiplini

C1/C2'nin kendi kapanışında uygulanan disiplin aynen geçerli: TDD (schema/Editor/renderToA3 +
üç test dosyası, artı `distribution-chart`'ın kendi `xlsxSurvival.test.ts` emsaline uyan bir
survival testi — yeni bir `A3ImageKind`'ın gerçek registry üzerinden uçtan uca çalıştığını
kanıtlamalı, C2'nin `problem-impact/xlsxSurvival.test.ts`'i zaten bu deseni gösteriyor), TR/EN
i18n anahtarları birlikte, `npm test`/`npm run lint`/`npm run build` ve
`cargo test`/`cargo clippy`/`cargo fmt` hepsi yeşil olmadan iş bitmiş sayılmaz.

**§2.2'nin açık sorusu kodlamadan önce cevaplanmalı** — bu, C2'den farklı olarak C3'ün gerçek
bir tasarım kararı içermesinin sebebi, `CLAUDE.md`'nin kendi "plan onayı" kuralına tabi.

**Bu dilim D-114'ün "dilim başına en fazla bir yeni mekanizma" bütçesinin tam kendisi** —
`kpi-strip` dışında başka bir yeni mekanizma (örn. ADIM 8'in tasarımı, `whyWhyTree`'nin
diyagramı) aynı oturumda **başlatılmaz**, zaman kalsa bile.

Kapanışta: `TEMPLATE_ANALYSIS.md` §14.3/§14.8, `DECISIONS.md`, `CLAUDE.md` güncellenir,
`docs/oturumlar/README.md`'nin tablosuna bir satır eklenir, ve **C4**'ün (ADIM 8'in kendi
tasarım turu + inşası) kendi prompt dosyası mı yazılacağı kararlaştırılır — C4 önce küçük bir
`AskUserQuestion` turu içerdiği için (§13.4'ün 4 adayının alan listelerini kesinleştirmek), C2/
C3'ün "önce tasarla, sonra kodla" ayrımını kendi içinde tek dosyada mı taşıyacağı yoksa D-103/
D-104'ün Fishbone'da yaptığı gibi ayrı bir tasarım notu mu üreteceği o kapanışta netleşir.

---

**Model önerisi:** Sonnet — D-28'in "yüksek hacimli implementasyon" sınıfı, C1/C2'yle aynı.
**İstisna:** §2.2'nin açık sorusu, D-28'in kendi "mimari karar" eşiğine değmiyor (üç seçenekten
biri zaten mevcut kod tabanının ezici çoğunluk deseni) — Sonnet üzerinde `AskUserQuestion` ile
çözülebilir, Opus'a geçiş gerekmez.
