# OTURUM C — Yöntem plugin'i budama + ekleme (D-149'un dördüncü ve son parçası)

> D-149'un dört oturumluk arayüz/yapı işinin sonuncusu. A (sayfa sözleşmesi), B1 (altı çalışma
> sayfası), B2 (blok görsel dili + arayüz + esnek tahsis kararları) ve B3 (blok blok görsel
> doğrulama, sekiz adımın hepsi onaylandı) bitti. Oturum C'nin işi farklı: öncekiler tasarım/
> doğrulama oturumlarıydı, **kod yazılmadı**. Bu oturum ilk kez kod yazacak — B1/B2/B3'ün üç
> ayrı turda biriktirdiği plugin/mekanizma borcunu kapatacak.
>
> Kanonik konum: `docs/oturumlar/C-yontem-plugin-insasi.md`. Yazıldı: 2026-08-16, B3'ün son
> bloğu (ADIM 5/6/8, D-179) onaylandıktan hemen sonra, Barış'ın açık isteğiyle ("bunu farklı
> bir oturumda yapalım, prompt paylaşır mısın?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      src/methods/registry.ts src/a3/methodContract.ts src/methods/chartSpec.ts \
      src/methods/countermeasure/renderToA3.ts src/methods/fishbone/layout.ts \
      src/methods/whyWhyTree/schema.ts src/methods/smartTarget/renderToA3.ts \
      docs/oturumlar/B3-blok-blok-gorsel-dogrulama.md
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-16'da doğrulandı,
ama D-149'un kendi geçmişi (bir referans dosyası 20 dakikada adı değişebiliyor) bu adımı
atlamamayı öğretti.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — bu oturum kod yazacak, **istisnasız**.
2. `CLAUDE.md` — özellikle "Decisions already made", "How I want you to work" (plan onayı,
   TDD, i18n, coaching content kuralları hâlâ geçerli — B1-B3 kod yazmadığı için bu kurallar
   uzun süredir uygulanmadı, tekrar hatırla) ve "Current state"in Oturum B3 paragrafı.
3. `reference/TEMPLATE_ANALYSIS.md` §13.4 (Oturum C adayları, B1'in bulduğu 7 kalem),
   §14.2/§14.3/§14.6/§14.7/§14.8 (B2'nin bıraktığı kod işi), §14.3'ün ADIM 5/6/8 onay notu
   (P-37'nin kaynağı).
4. `DECISIONS.md`: **P-34, P-35, P-36, P-37** (bu oturumun doğrudan girdisi — hepsi B3'ün
   kaydedip düzeltmediği bulgular) ve D-102/D-114/D-127 (mevcut mekanizmalar — zones,
   fieldForm, rowTable, imageKind — yeni plugin'ler bunları yeniden icat etmez, kullanır).
5. Aşağıdaki §2'nin tam envanterini oku — bu oturumun kapsamı tek oturumda bitecek kadar küçük
   **değil**; §3 bir bölme önerisi sunuyor, B'nin B1/B2/B3'e bölünmesiyle aynı disiplin.

---

## 2. Tam envanter — nereden geldiği, ne istiyor

### 2.1 B3'ün üç bulgusu (P-34, P-35, P-36, P-37)

| # | Ne | Yeni mekanizma? | Nerede |
|---|---|---|---|
| P-34 | Fishbone'un onaylanan görsel dili (D-175: diyagonal dal, kategoriye-yakın neden, effect düğümü) `layout.ts`'in gerçek ürettiğinden 3 noktada ayrılıyor | ❌ Hayır — mevcut `FishboneDiagram.tsx`/`layout.ts`'te mekanik düzeltme | `src/methods/fishbone/layout.ts` |
| P-36 | `KpiStripChartSpec`'in taslak şekli (`{label,baseline,target,actual,unit}`) Sürdürme/Sonuç taşımıyor | Kısmen — `kpi-strip`'in kendisi yeni mekanizma (aşağıya bkz.), bu onun şemasına bir düzeltme | `src/methods/chartSpec.ts` + Adım 7'nin gerçek plugin'i |
| P-37 | D-41'in kare/üçgen/daire glifinin durum sözlüğüne (proposed/approved/rejected · open/resolved · vs.) eşlemesi hiçbir yerde yazılı değil | ❌ Hayır — mevcut `renderToA3.ts`'lere satır-içi ekleme | `countermeasure`/`icaPcaTransition`/`costApproval`/`implementationIssuesLog`/`actionItem`'ın `renderToA3.ts`'leri |
| P-35 | `whyWhyTree` hiç diyagram render'ı yok (yalnızca düz `lines`), terminal-durum alanı (✓/❌+KN) yok, düğüm-seviyesi referans mimarisi D-124 ile çakışıyor | ✅ **Evet** — yeni diyagram bileşeni + yeni/paylaşılan `A3ImageKind`; üçüncü bulgu (referans mimarisi) D-124'ü yeniden açan bir mimari soru | `src/methods/whyWhyTree/*` (yeni), muhtemelen `src/domain/model/reference.ts` |

### 2.2 B2'nin bıraktığı kod işi (§14)

| # | Ne | Yeni mekanizma? | Kaynak |
|---|---|---|---|
| 1 | `problem-impact` plugin'i (ADIM 1, Pareto + mali kayıp formu) | ❌ Hayır — mevcut `pareto-chart` imageKind + `fieldForm`/`FieldFormEditor` (D-127) | §14.2 |
| 2 | 5N1K plugin'i (ADIM 1, D-163 — `five-g-5n1k`'tan bağımsız) | ❌ Hayır — mevcut `zones` mekanizması (D-102) | §14.2, D-163 |
| 3 | `kpi-strip` `A3ImageKind`'ı + ADIM 7'nin gerçek plugin'i/plugin'leri | ✅ **Evet** — bu dilimin tek-mekanizma bütçesi (D-114 disiplini) | §14.3, D-167, P-31 |
| 4 | ADIM 8'in belge/Yokoten/Lessons-Learned plugin'leri | ❌ Hayır (muhtemelen mevcut `rowTable`/`fieldForm`) — ama **alan listeleri henüz kesinleşmedi**, kodlamadan önce küçük bir tasarım turu gerekiyor (§13.4, aşağıya bkz.) | §13.4, §14.6 |
| 5 | `MethodPlugin.tier` alanı + iki-bölümlü `MethodBand` arayüzü (D-169) | ✅ Evet — yeni bir UI mekanizması (önerilen/diğer ayrımı) | §14.6 |
| 6 | Esnek tahsisin sürükle-tutamaç UI'ı (D-170) | ✅ Evet — yeni bir etkileşimli UI mekanizması, muhtemelen bu listenin en riskli/en az emsali olanı | §14.7 |

### 2.3 B1'in yedi adayı (§13.4, P-30 kapandı ama adaylar açık)

1. **Sustainment Audits** (ADIM 7) — periyodik denetim izleme, tek-seferlik `checkSheet`'ten
   farklı bir kavram (yinelenen kayıt).
2. **7-belge-türü tracker** (ADIM 8) — şipping edilmiş `pfmeaLinkage`'den daha zengin.
3. **Yokoten yatay-yayılım tracker** (ADIM 8).
4. **8-soruluk yapılandırılmış Lessons Learned checklist** (ADIM 8).
5. Kök-neden doğrulamasına `Confidence %`/`Residual uncertainty`/`Customer relevance` alanları
   — muhtemelen `hypothesisVerification`'a ek (küçük, düşük riskli).
6. `actionItem`'a `Days late`/`Customer approval` alanları — küçük, düşük riskli.
7. D-153'ün başlık bandındaki **"Genel RAG"** alanı için Red/Amber/Green sözlüğü — bu bir
   method plugin'i değil, proje başlık/manifest modelinin bir parçası; tam yeri bu oturumda
   araştırılmalı (D-153'ün kendi bant tanımına bakarak).

Not: 1–4, 2.2'nin 4. maddesiyle aynı — ADIM 8'in tasarım turu bu yedi adayın 1., 2., 3., 4.
maddelerini birlikte cevaplamalı.

---

## 3. Önerilen dilim sırası — bir öneri, bir mandat değil

D-114'ün Faz 6 disiplini burada da geçerli: **dilim başına en fazla bir yeni mekanizma**, hiçbir
dilim iki kanıtlanmamış mekanizmayı aynı anda hata ayıklamaz (D-105/D-113'ün öğrettiği ders).
Aşağıdaki sıra riske ve bağımlılığa göre — **bu oturumun kendi açılış bütçe kontrolünde
Barış'la birlikte teyit/yeniden sırala**, B'nin B1/B2'ye bölünmesiyle aynı disiplin (D-161).

1. **C1 — yeni mekanizma yok, mevcut kodun genişletilmesi.** P-37 (durum glifi beş
   `renderToA3.ts`'e satır-içi eklenir — önce her plugin'in durum sözlüğü için bir
   `status → {shape, colour}` eşleme tablosu tasarlanır, `COUNTERMEASURE_STATUS_EXPORT_LABELS`
   deseniyle aynı ruhta), P-34 (fishbone `layout.ts`'in 3 küçük geometri düzeltmesi), B1'in
   5./6./7. adayları (küçük alan ekleri). En düşük risk, en hızlı geri bildirim döngüsü —
   Faz 6a'nın kendi "önce mekanizmasız olanlar" tercihiyle aynı mantık.
2. **C2 — iki yeni plugin, sıfır yeni mekanizma.** `problem-impact` + 5N1K (ikisi de ADIM 1,
   ikisi de B2'de zaten tasarlandı — §14.2 — alan listeleri kesin). Faz 5/6a'nın kendi
   plugin-inşa desenini (schema/Editor/renderToA3 + üç test dosyası) birebir tekrarlar.
3. **C3 — bu dilimin tek yeni mekanizması: `kpi-strip`.** `A3ImageKind` + `KpiStripChartSpec`
   (P-36'nın Sürdürme/Sonuç düzeltmesini şema ilk kez yazılırken içine göm) + ADIM 7'nin gerçek
   plugin'i/plugin'leri. D-177'nin onaylanan görsel dili (üç durum-kodlu bullet-graph karo)
   doğrudan uygulanacak hedef.
4. **C4 — ADIM 8'in tasarım turu + inşası.** Önce küçük bir `AskUserQuestion`/karar turu
   (§13.4'ün 4 adayının alan listelerini kesinleştir — D-103/D-104'ün Fishbone'dan önce
   yaptığı gibi), sonra mevcut `rowTable`/`fieldForm` substratlarıyla inşa. Yeni mekanizma
   gerektirmez ama tasarım borcu var, bu yüzden ayrı bir dilim.
5. **C5 — whyWhyTree, muhtemelen bu listenin en büyüğü.** Yeni diyagram bileşeni + yeni/
   paylaşılan `A3ImageKind` + terminal-durum alanı (şema değişikliği) — üçü mekanik. Ama
   üçüncü gerçek soru (düğüm-seviyesi referans mimarisi, D-124'ü yeniden açıyor) bir mimari
   karar, kodlamadan önce Barış'a **açık soru olarak** sorulmalı: node-level reference'ı
   D-124'ü genişleterek mi çözüyoruz, yoksa whyWhyTree'nin "onaylanmış kök neden" düğümünü
   kendi entry'sine mi çıkarıyoruz (D-124'ün bugünkü modeliyle tutarlı ama whyWhyTree'nin
   kendi ağaç yapısını bölüyor)? Bu, D-28'in "mimari" sınıfına giren tek alt-iş — gerekirse
   yalnızca bu karar için Opus'a geçilebilir, gerisi Sonnet.
6. **C6 — arayüz katmanı, plugin içeriğinden bağımsız, paralel yapılabilir.**
   `MethodPlugin.tier` + iki-bölümlü `MethodBand` (D-169) ve esnek tahsisin sürükle-tutamaç
   UI'ı (D-170). İkisi de yeni mekanizma ama ikisi de saf frontend/etkileşim işi — plugin
   içeriğine bağımlı değil, C1-C5'ten herhangi biriyle aynı anda başka bir oturumda
   yürütülebilir.

---

## 4. Kapsam dışı

- Şablon dosyasının kendisi (`src/a3/templates/*`) — D-95, Faz 11, bu oturumun işi değil.
- P-26 (i18n + blok hizası) — Oturum D'nin işi, dört oturumluk planın son parçası.
- Sayfa sözleşmesi (§12, D-154/D-159) — LOCKED, dokunulmaz.
- B3'ün onayladığı görsel kararlar (D-165/D-174/D-175/D-177/D-178/D-179) — bunlar hedef, tekrar
  tartışılmaz; bu oturumun işi onları kodlamak.

---

## 5. Bütçe uyarısı (Madde 1 / G1)

Bu, B'nin üç oturuma bölündüğü hacmin en az katı büyüklüğünde bir iş — altı dilim, en az ikisi
(kpi-strip, whyWhyTree) yeni mekanizma, biri (ADIM 8) kendi tasarım turunu gerektiriyor. **Tek
oturumda C1-C6'nın hepsini bitirmeye çalışma.** İşe başlamadan önce Barış'la hangi dilim(ler)i
bu oturumda yapacağını netleştir (yukarıdaki §3 bir başlangıç noktası, kesin sıra değil), ve
`CLAUDE.md`'nin "her yeni alan için kısa bir plan yaz ve onay al" kuralını hatırla — B1-B3 kod
yazmadığı için bu kural uzun süredir fiilen uygulanmadı.

Her dilim kapanışında: TDD (`CLAUDE.md`'nin "Every new module gets tests in the same change"),
i18n (TR/EN anahtarları birlikte), ve mevcut plugin'lerin test şablonunun (schema/Editor/
renderToA3, üç test dosyası) tekrarı — Faz 5/6'nın kendi disiplini, yeniden icat edilmez.

---

**Model önerisi:** Sonnet — bu, D-28'in "yüksek hacimli implementasyon" sınıfı, Faz 5/6'yla
aynı (B1/B2/B3'ün "mimari/tasarım" sınıfının aksine). İstisna: §3'ün C5 maddesindeki tek mimari
karar (whyWhyTree'nin referans mimarisi) — yalnızca o karar için Opus düşünülebilir.
