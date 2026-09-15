# OTURUM — Export/UI sadakat gedikleri: P-17 + P-18 + P-22 + P-23 + P-27 + P-42

> Altı bağımsız, çoğu küçük-orta boy, farklı export/UI sadakat gediği — hepsi
> `docs/oturumlar/P-yigini-durum-taramasi.md`'nin kendi taramasında (2026-09-15) doğrulandı,
> Barış'ın kendi seçimiyle "sıradaki dilim" kümelerinden biri olarak işaretlendi. Altısı da
> FARKLI dosyalara dokunuyor — bağımsız worktree'lerde paralelleştirilebilir (Anayasa Madde 3),
> ama **P-42 en ucuz ve en net olan, muhtemelen tek başına bir "kısa dilim" olarak ele
> alınmalı.**
>
> Kanonik konum: `docs/oturumlar/export-ui-sadakat-gedikleri.md`. Yazıldı: 2026-09-15.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
grep -n "P-17\|P-18\|P-22\|P-23\|P-27\|P-42" DECISIONS.md | grep "^[0-9]*:| P-"
  # Hepsinin hâlâ OPEN olduğunu teyit et.

grep -n "changeLanguage\|meta.language" src/a3/render/rasterize.ts src/methods/fishbone/FishboneDiagram.tsx
  # P-42: hiç eşleşme YOK bekleniyor — düzeltme hâlâ yapılmadı.

grep -n "useTranslation" src/methods/fishbone/FishboneDiagram.tsx
  # P-42: mevcut, yanlış kaynak — editörün aktif UI dilini kullanıyor.

grep -rn "FieldFormEditor" src/methods/gapStatement/Editor.tsx src/methods/fiveW2H/Editor.tsx src/methods/problemTypeClassifier/Editor.tsx src/methods/msaGageRr/Editor.tsx
  # P-23: hiç eşleşme YOK bekleniyor — dördü hâlâ elle-yazılmış JSX.

grep -n "dnd-kit\|DndContext" src/methods/impactEffortMatrix/Editor.tsx
  # P-27: hiç eşleşme YOK bekleniyor.

grep -n "Gantt\|gantt" src/methods/actionItem/schema.ts
  # P-22: yalnızca yorum satırında "deliberately excluded" bekleniyor, gerçek kod yok.
```

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. P-42 — Fishbone kategori etiketleri yanlış dile bağlı (GERÇEK BİR BUG, en ucuz düzeltme)

### 1.1 Sorun

`src/methods/fishbone/FishboneDiagram.tsx` kategori etiketlerini `react-i18next`'in
`useTranslation()`'ıyla editörün AKTİF UI DİLİNE göre çözüyor, `project.meta.language`'a
(export/içerik dili, D-43) DEĞİL. UI Türkçe, proje EN ise, export edilen diyagramın kategori
metni geri kalan raporla uyuşmaz.

### 1.2 Öneri (P-42'nin kendi notunda zaten yazılı)

`src/a3/render/rasterize.ts`'in off-screen `FishboneDiagram` yakalaması sırasında
`i18n.changeLanguage(project.meta.language)` (ya da eşdeğer bir override — belki
`FishboneDiagram`'a doğrudan bir `language` prop'u eklemek ve `t()` yerine kendi statik
sözlüğünü kullanması, D-188'in diğer methodlarının zaten yaptığı gibi) — bir etiket-sözlüğü
değişikliği DEĞİL, rasterizer/diyagram-bileşeni sınırında bir düzeltme. **En temiz yol
muhtemelen ikincisi**: `FishboneDiagram`'ı `resolveA3Language`'ı zaten kullanan diğer
methodlar (D-188) gibi statik bir bilingual sözlükle donatmak — `i18n.changeLanguage`'ı
rasterize sırasında çağırmak yan etkili (global i18n state'i geçici değiştirir, editörün
kendisi o an render ediliyorsa görsel bir titreşim riski).

### 1.3 Test/doğrulama

Regresyon testi: `project.meta.language: "en"` olan bir projede, editörün UI dili `"tr"`
olsa bile, rasterize edilen/export edilen Fishbone diyagramının kategori metninin İngilizce
olduğunu doğrula (P-42'nin kendi tarifiyle aynı dynamic-mis-source sınıfı — D-193'ün
`kpiStripChart`/`distributionChart` içinde P-42'yi tekrarlamaktan bilerek kaçınmış olması
bir emsal).

---

## 2. P-27 — `impact-effort-matrix`'in serbest-pozisyon 2×2 drag-drop'u yok

D-142 bunu 1-5 skorlu bir liste + hesaplı kadran olarak inşa etti (`causeEffectMatrix`/6b'nin
aynı "matrix as ranked list" basitleştirmesi). `SPEC.md` §1.3 açıkça "2×2, drag-and-drop"
diyor. `@dnd-kit` zaten bir bağımlılık (Fishbone'dan beri). Gerçek UI-alt-yapı boyutunda iş —
tek satırlık bir ekleme değil. Barış'a `AskUserQuestion` ile sor: gerçekten serbest-pozisyon
mu isteniyor, yoksa mevcut skorlu-liste+hesaplı-kadran zaten yeterli mi (SPEC'in lafzını
değiştirmek gerekebilir)?

---

## 3. P-23 — 6a'nın 4 elle-yazılmış editörü `FieldFormEditor`'e taşınmadı

`gapStatement`, `fiveW2H`, `problemTypeClassifier`, `msaGageRr` — dördü de D-127'nin
substrate'inden önce yazıldı, aynı label/input/select JSX'i tekrarlıyor. Mekanik dönüşüm,
davranış değişmiyor — saf temizlik. `FieldFormEditor`'ün gerçek arayüzünü (`shared/fieldForm.ts`)
oku, dört editörün kendi alan listesini (`fields.ts`) `RowFieldType`'a eşle, JSX'i
`FieldFormEditor` çağrısıyla değiştir. Her dördü için mevcut Editor testleri DEĞİŞMEMELİ
(davranış aynı kalmalı) — yalnızca render implementasyonu değişiyor.

---

## 4. P-22 — action plan'ın Gantt yarısı

`actionItem`'ın şeması zaten `startDate`/`dueDate` taşıyor — yeni bir `ChartSpec` varyantı
(bar-per-action) + yeni bir `A3ImageKind` gerekiyor, D-102'nin zaten kurulu mekanizmasının
üstüne. `kpiStrip`'in (D-182) kendi hand-rolled SVG deseni (Recharts'ın bullet-graph
primitifi olmadığı gibi, Gantt bar-chart'ın da doğrudan bir Recharts primitifi yok) emsal
alınabilir. Barış'a `AskUserQuestion` ile sor: gerçekten ayrı bir Gantt görseli mi isteniyor,
yoksa `actionItem`'ın zaten var olan tarih alanları (RowTableEditor'de görünür) yeterli mi?

---

## 5. P-17 — cell-edge border fidelity yaklaşık

`TEMPLATE_ANALYSIS.md` §3'ün edge-specific/position-dependent border tarifi (dış çerçeve
orta, P kolonunun sol kenarı kalın, loss-type/team gridleri içi ince) `farplas-7step-tr.ts`'de
per-style (her `blockHeaderPlan` hücresi aynı border) uygulanıyor, per-physical-edge değil.
**Düşük öncelik** — yalnızca gerçek basılı bir sayfada görsel olarak fark edilirse
(`farplas-7step-tr` zaten legacy-compatibility template'e demoted, D-157) düzeltmeye değer.
Barış'a önce basılı/PDF çıktıyı görmüş mü diye sor — görmediyse bu maddeyi bu oturumdan
tamamen çıkar.

---

## 6. P-18 — header/footer alanları veri modeline bağlı değil (dar kapsam)

D-223 (Faz 11 kapsam belirleme) `BenefitCase`/`Onay formu`'nu Faz 11'den TAMAMEN çıkardı —
`pps-8step-auto` zaten benefit/cost footer taşımıyor (D-153, bilinçli). Kalan gerçek kapsam
yalnızca `farplas-7step-tr`'nin (legacy-compatibility) kendi team-roster/work-plan-Gantt/
loss-taxonomy alanları — bunlar **düşen bir template** için veri modeli genişletmesi, gerçek
değeri sorgulanabilir. Barış'a `AskUserQuestion` ile sor: `farplas-7step-tr` için bu alanları
gerçekten bağlamaya değer mi (legacy template, yeni projeler artık `pps-8step-auto`'da
başlıyor, D-157), yoksa bu satır tamamen kapatılıp "asla" diye mi işaretlensin?

---

## 7. Bütçe ve kapanış disiplini

**Öneri: P-42 tek başına, en ucuz, en net dilim (~1 saat sınıfı iş). P-23 ikinci, saf
temizlik, düşük risk. P-27/P-22/P-17/P-18'in DÖRDÜ de kod yazmadan önce Barış'ın kendi
kararını gerektiriyor** — bu dördü için önce bir `AskUserQuestion` turu (belki tek bir
oturumda, bu dosyanın §2/§4/§5/§6'sındaki dört soru birlikte sorulabilir), sonra hangileri
gerçekten isteniyorsa onlar için ayrı kod dilimleri.

Her biri kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, ilgili P-maddesinin kendi satırının
KAPANDI olarak işaretlenmesi.

---

**Model önerisi**: P-42/P-23 için Sonnet 5 yeterli (mekanik/küçük). P-27/P-22 gerçek yeni UI
mekanizması gerektiriyorsa (drag-drop, Gantt chart) planlama için Opus düşünülebilir, ama
D-102'nin zaten kurulu desenleri (zones, ChartSpec) üzerine inşa edildiği için muhtemelen
Sonnet 5 de yeterli (D-28).
