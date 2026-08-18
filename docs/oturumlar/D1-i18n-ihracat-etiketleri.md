# OTURUM D1 — A3 ihracat etiketlerinin dil farkındalığı (Oturum D'nin ilk dilimi)

> `docs/oturumlar/D-i18n-blok-hizasi.md`'nin önerdiği iki dilimden (§3) ilki — P-26'nın i18n
> yarısı. Blok hizası yarısı (§3.2, D2) bu dilimin işi **değil**; kök nedeni henüz bulunmadı,
> D1'den sonra kendi keşif oturumu olarak kapsamlanacak.
>
> Kanonik konum: `docs/oturumlar/D1-i18n-ihracat-etiketleri.md`. Yazıldı: 2026-08-18, D'nin üst
> seviye kapsam dokümanıyla aynı oturumda, Barış'ın açık isteğiyle ("yeni oturum için prompt
> paylaşır mısın?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      docs/oturumlar/D-i18n-blok-hizasi.md \
      src/a3/methodContract.ts src/a3/buildA3Layout.ts \
      src/methods/shared/fieldForm.ts src/methods/shared/rowTable.ts \
      src/methods/countermeasure/fields.ts src/methods/countermeasure/renderToA3.ts \
      src/methods/categoryBreakdown/renderToA3.ts src/methods/kpiStrip/KpiStripChart.tsx \
      src/methods/actionItem/fields.ts src/methods/costApproval/fields.ts \
      src/methods/documentUpdatesTracker/fields.ts src/methods/documentUpdatesTracker/documentTypes.ts \
      src/methods/icaPcaTransition/fields.ts src/methods/lessonsLearned/fields.ts \
      src/methods/pfmeaLinkage/fields.ts src/methods/pointOfCause/fields.ts \
      src/methods/problemImpact/fields.ts src/methods/sideEffectRiskAssessment/fields.ts \
      src/methods/trialPlan/fields.ts src/methods/errorProofingHierarchy/levels.ts \
      src/methods/hypothesisVerification/columns.ts src/methods/impactEffortMatrix/quadrant.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-18'de doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made" (AI layer, template kararları), "How I want you to
   work"in i18n kuralı, "Current state"in Oturum C6 paragrafı.
3. `docs/oturumlar/D-i18n-blok-hizasi.md` §2.1 tam olarak — bu dilimin **tüm** ön araştırması
   orada: hangi dosyalar dokunuyor, D-43'ün gerçek kapsamı (yalnızca `src/domain`/`src/a3`,
   `src/methods` dışarıda), D-99'un enjeksiyon dikişinin neden ucuz bir çözüm sunduğu,
   `KpiStripChart.tsx`'in Türkçe hardcode örneği (kusurun tek yönlü olmadığının kanıtı).
4. `DECISIONS.md`: **P-26**, **D-43**, **D-99**, **D-10/D-95** (yalnızca `farplas-7step-tr`
   şablonu var, `-en` Faz 11'e kadar yok — §2.2'nin açık sorusunun arka planı).
5. `src/methods/shared/fieldForm.ts` (`FieldFormField.exportLabel`, `fieldFormLines`) ve
   `src/methods/shared/rowTable.ts` (`rowTableLines`) — **kritik fark**: `rowTableLines` hiçbir
   sabit etiket basmıyor, yalnızca kullanıcının girdiği ham değerleri `" · "` ile birleştiriyor.
   Yani `RowTableEditor` tabanlı yöntemler (stratificationMatrix, checkSheet, sustainmentAudit,
   yokotenTracker, trialResultLog, trainingCommunicationRecord, implementationIssuesLog,
   processFlowSipoc, containmentIca, vocComplaint, checkSheet, msaGageRr'ın kendisi hariç —
   fixed-field'dır — vb.) **bu dilimin kapsamı dışında**, çünkü ihraç ettikleri metinde hiç
   hardcoded dil yok. Bunu §0'ın dosya listesine güvenerek varsaymayın — kendi taramanızı
   `grep -rn "exportLabel\|_EXPORT_LABELS" src/methods` ile tekrarlayın, bu prompt yazıldıktan
   sonra yeni bir plugin eklenmiş olabilir.

---

## 2. Kapsam

### 2.1 Bilinen envanter (bu promptun kendi taraması, 2026-08-18 — kesin değil, §2.3'e bakın)

**`FieldFormField.exportLabel` üzerinden (11 dosya, `shared/fieldForm.ts`'in ortak mekanizması):**
`actionItem`, `costApproval`, `countermeasure`, `documentUpdatesTracker`, `icaPcaTransition`,
`lessonsLearned`, `pfmeaLinkage`, `pointOfCause`, `problemImpact`, `sideEffectRiskAssessment`,
`trialPlan` — her birinin `fields.ts`'i.

**Bespoke `*_EXPORT_LABELS`/inline sözlük (paylaşılan mekanizmayı kullanmayan, yöntemin kendi
seçim/kategori değerlerini metne çeviren ayrı bir sabit — 9 dosya, bazıları yukarıdaki 11'le
çakışıyor çünkü aynı yöntem hem alan hem durum sözlüğü taşıyabiliyor):**
`categoryBreakdown/renderToA3.ts`, `costApproval/fields.ts`, `countermeasure/fields.ts`,
`documentUpdatesTracker/documentTypes.ts`, `errorProofingHierarchy/levels.ts`,
`hypothesisVerification/columns.ts`, `icaPcaTransition/fields.ts`, `impactEffortMatrix/
quadrant.ts`, `sideEffectRiskAssessment/fields.ts`.

**Grafik/diyagram bileşenleri içindeki sabit metin (1 bulundu, taranan tüm `*Chart.tsx`/
`*Diagram.tsx` içinde):** `kpiStrip/KpiStripChart.tsx`'in `Tile`'ı — Sürdürme/Sonuç alt-yazısı,
hardcoded **Türkçe**, `meta.language`'a bakmadan her zaman basılıyor.

**Toplam benzersiz yöntem dizini: 15.** Bu, `renderToA3.ts` dosyalarının toplam sayısından
(47) çok daha küçük — çünkü `RowTableEditor` tabanlı yöntemlerin (§1 madde 5) hiç sabit metni
yok.

### 2.2 Açık soru — kodlamadan önce `AskUserQuestion` ile sorulmalı

`D-i18n-blok-hizasi.md` §2.1'in bulduğu gibi, D-99'un enjeksiyon dikişi (`A3EntrySummary`'ye
bir alan eklemek, `buildA3Layout`'un zaten elinde olan `project.meta.language`'ı forward etmek)
gerçek çift-dilli ihracatı ucuzlaştırıyor — ama şablon hâlâ yalnızca Türkçe (D-10/D-95, Faz 11'e
kadar). İki gerçek seçenek, hiçbiri açıkça daha ucuz değil:

- **A — Yalnızca Türkçeye çevir.** Her `exportLabel`/sözlük değeri Türkçeye çevrilir (editördeki
  `labelKey`'in zaten çevrilmiş TR metniyle tutarlı hale getirilir). `KpiStripChart.tsx`'in
  Türkçe satırı zaten doğru kalır, dokunulmaz. Daha küçük değişiklik, ama `meta.language: "en"`
  bir projede ihracat hâlâ yanlış olur (yalnızca artık "hepsi Türkçe" yanlış, "karışık" değil) —
  ve Faz 11'de `-en` şablonu geldiğinde bu iş bir kez daha, gerçek çift-dilli olarak yapılmalı.
- **B — Gerçek çift-dilli ihracat kur.** `A3EntrySummary` bir `language: "tr" | "en"` alanı
  kazanır (`buildA3Layout`, `project.meta.language`'ı zaten pure bir şekilde biliyor — D-43'ü
  ihlal etmez, `src/a3` içine hiç i18next girmez). Her `exportLabel`/sözlük iki dilli olur
  (`{tr: string; en: string}` ya da dil-anahtarlı bir `Record`). `KpiStripChart.tsx`'in
  Sürdürme/Sonuç satırı da düzeltilir (spec zaten `renderImage(spec, size)` üzerinden
  geçiyor — `spec`e bir `language` alanı eklemek aynı desen). Daha büyük değişiklik (her
  sözlük iki değer taşır, ~15 dosyanın hepsi dokunulur), ama Faz 11'in `-en` şablonu geldiğinde
  ikinci bir geçiş gerektirmez — mekanizma o gün zaten hazır olur.

Üçüncü bir seçenek yok — "hiçbir şey yapma" P-26'yı açık bırakır. Barış'a üç seçenek sunulmadan
(yalnızca A/B), hangisinin önerildiği belirtilmeden sorulmalı — ikisi de gerçek, karşılaştırılabilir
maliyetli.

### 2.3 Envanterin kendi doğrulaması — bu dilimin ilk gerçek işi

§2.1'in listesi bu promptu yazan oturumun taramasıdır, **iddia edilen kapsam değil onaylanmış
kapsam değil.** D1'in kendi ilk adımı: `grep -rn "exportLabel\|_EXPORT_LABELS" src/methods` ve
ayrıca `find src/methods -iname "*Chart.tsx" -o -iname "*Diagram.tsx"` her birinin metin çizen
satırlarını (SVG `<text>`, `polygon`/`line` etiketleri değil) elle taramak — §2.1'in 15 dizinlik
listesinin eksiksiz olduğunu doğrulamadan Seçenek A/B'nin kodlanmasına geçmeyin. Eksik bir dosya
bulunursa listeyi genişletin, iş büyürse Madde 1 gereği Barış'a haber verin.

---

## 3. Kapsam dışı

- Blok hizası (P-26'nın ikinci yarısı, D2) — kök nedeni henüz yok, ayrı bir keşif oturumu.
- Yeni şablon (`-en`/`pps-8step-auto`) — D-95, Faz 11, bu dilimin işi değil. Seçenek B bile
  yalnızca mekanizmayı kurar, yeni bir şablon dosyası yazmaz.
- Editör arayüzünün i18n'i — zaten TR/EN, dokunulmuyor.
- `MethodPlugin.tier`/`MethodBand`, esnek tahsis, P-41 — Oturum C'nin/C6'nın kendi işiydi ya da
  P-26 ile ilgisiz.

---

## 4. Bütçe ve kapanış disiplini

TDD: her dokunulan dosyanın kendi `renderToA3.test.ts`'i (ya da `xlsxSurvival.test.ts`) zaten
var — yeni beklenen metni (Seçenek A: Türkçe; Seçenek B: dile göre) doğrulayacak şekilde
güncellenir, yeni test dosyası açmaya gerek yok. Seçenek B seçilirse `A3EntrySummary`/
`buildA3Layout`'a dokunan değişiklik için `buildA3Layout.test.ts`'e (varsa) veya en yakın pure
katman testine bir regresyon eklenir. i18n: bu dilimin kendisi zaten i18n'i düzeltiyor, TR/EN
anahtar eklemek gerekmez (yalnızca sabit sözlükler değişir, `labelKey`'ler dokunulmaz).
`npm test`/`npm run lint`/`npm run build` ve `cargo test`/`cargo clippy`/`cargo fmt` hepsi yeşil
olmadan iş bitmiş sayılmaz — `npm test`'in **exit code**'u ayrı bir logfile + `echo $?` ile
kontrol edilir (`tail`/pipe üzerinden DEĞİL, D-143'ün ve her sonraki oturumun kendi dersi).
`scripts/gen-a3-fixture.ts`'in yeniden çalıştırılması gerekip gerekmediğini kontrol edin —
fixture yalnızca birkaç yöntemi (fishbone, pareto/trend/smartTarget, distributionChart)
kullanıyor; bu dilimin dokunduğu 15 dizinin çakışıp çakışmadığına bakın.

Kapanışta: `docs/oturumlar/D-i18n-blok-hizasi.md`'ye bu dilimin sonucu (hangi seçenek seçildi,
gerçek dosya sayısı §2.1'in tahminiyle uyuştu mu) yazılır, `DECISIONS.md`'ye yeni bir D-numarası
eklenir, `CLAUDE.md` "Current state"e bir "Oturum D — D1" paragrafı eklenir,
`docs/oturumlar/README.md`'nin tablosuna bir satır (ya da mevcut "D" satırı güncellenir).

---

**Model önerisi:** Sonnet — D-28'in "yüksek hacimli ama düşük riskli implementasyon" sınıfı,
C1/C2/C4 ile aynı. §2.2'nin sorusu Sonnet üzerinde `AskUserQuestion` ile rahatça çözülür.
