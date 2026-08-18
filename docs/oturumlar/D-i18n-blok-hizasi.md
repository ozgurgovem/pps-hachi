# OTURUM D — i18n ihracat etiketleri + blok hizası (D-149'un dört oturumluk planının son parçası)

> D-149'un dört oturumluk arayüz/yapı işinin sonuncusu. A (sayfa sözleşmesi), B1-B3 (çalışma
> sayfaları + görsel dil + doğrulama, kod yazmadı) ve C1-C6 (yöntem plugin inşası + arayüz
> katmanı, D-149's own leg tamamen kapandı, D-187) bitti. Bu oturumun işi **P-26**: "A3 export
> mixes Turkish template labels with English method-content text… content does not always land
> inside its intended block."
>
> Kanonik konum: `docs/oturumlar/D-i18n-blok-hizasi.md`. Yazıldı: 2026-08-18, C6'nın kapanışının
> hemen ardından, Barış'ın açık isteğiyle ("yeni oturum için prompt paylaşır mısın?") — Oturum D
> ile Oturum C arasında `AskUserQuestion` ile netleştirildi (P-41 değil, P-26).

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      src/a3/buildA3Layout.ts src/a3/methodContract.ts src/a3/templates/farplas-7step-tr.ts \
      src/app/routes/workspace/a3Preview.ts \
      src/methods/countermeasure/fields.ts src/methods/categoryBreakdown/renderToA3.ts \
      src/methods/shared/fieldForm.ts src/methods/shared/rowTable.ts \
      src-tauri/src/xlsx/writer.rs
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-18'de doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (i18n kuralı: "All
   user-facing strings go through i18next… TR and EN keys are added together" — bu kural bugüne
   dek yalnızca *editör* arayüzüne uygulandı, A3 ihracatına hiç uygulanmadı, aşağıya bakın), ve
   "Current state"in Oturum C6 paragrafı (D-149'un Oturum C bacağının kapanışı).
3. `DECISIONS.md`: **P-26** (bu oturumun tek girdisi), **D-43** (`src/domain`/`src/a3` saflık
   sınırı — tam kapsamı §2.1'de yeniden okunuyor, çünkü sınırın gerçek kapsamı yaygın inanılandan
   dar), **D-99** (renderToA3'ün dependency-injection deseni — bu oturumun i18n çözümünün muhtemel
   temeli), **D-10/D-95** (yalnızca `farplas-7step-tr` şablonu var, `-en` Faz 11'e kadar yok).
4. Aşağıdaki §2'yi oku — bu oturumun kendi kapsam-belirleme araştırması, tahmin değil.

---

## 2. Bu promptun kendi araştırması — P-26'nın gerçek boyutu

P-26 iki ayrı kusur sınıfı olduğunu söylüyor ve ikisini de "bu oturumda kök nedeni bulunmadı"
diye işaretliyor. Bu prompt yazılırken (2026-08-18) her ikisi de koddan doğrudan doğrulandı —
tahminle değil.

### 2.1 i18n yarısı — ölçüldü

- **Tek şablon Türkçe.** `src/a3/templates/farplas-7step-tr.ts`'nin statik etiketleri (başlık/
  altbilgi alanları, adım kartuş başlıkları — `"Sorumlu"`, `"Kaizen No"`, `"1. PROBLEMİN
  TANIMLANMASI"` vb.) tamamen Türkçe. D-10/D-95 gereği `-en`/`pps-8step-auto` Faz 11'e kadar
  yok — yani bugün **proje `meta.language: "en"` olsa bile** ihraç edilen sayfanın statik
  iskeleti yine Türkçe.
- **Method içeriği hep İngilizce.** 47 `renderToA3.ts` dosyasının çoğu, `src/methods/shared/
  fieldForm.ts`'nin `exportLabel` alanı (24 `fields.ts`/`columns.ts` dosyasında 66 kullanım) ya
  da eşdeğer bir `*_EXPORT_LABELS`/inline sözlük deseni (`categoryBreakdownMethod`'un
  `CATEGORY_EXPORT_LABELS` gibi) üzerinden hardcoded İngilizce üretiyor — hepsi aynı yorumu
  taşıyor: *"A3-side labels — `renderToA3` is i18n-free (D-43)."* Editördeki canlı arayüz zaten
  TR/EN — her alanın kendi `labelKey`'i (i18next) var ve iki dilde de çevrilmiş durumda; ihracat
  tarafı bu çeviriyi hiç kullanmıyor, ayrı ve yalnızca-İngilizce bir kopya tutuyor.
- **D-43'ün gerçek kapsamı sanılandan dar.** `eslint.config.js`'in `no-restricted-imports`
  kuralı yalnızca `src/domain/**` ve `src/a3/**`'i kapsıyor (`src/a3/render/**` D-94 ile muaf).
  `src/methods/*/renderToA3.ts` bu iki ağacın **dışında** — yani "renderToA3 i18n-free olmalı"
  kuralı ESLint tarafından zorlanan bir mimari sınır değil, Faz 4/5'te benimsenmiş **kendi
  kendine konmuş bir kural**. Bunu değiştirmek D-43'ü ihlal etmez.
- **D-99'un enjeksiyon dikişi zaten ucuz bir çözüm sunuyor.** `buildA3Layout(project, template,
  options)` her satırda `project`'in tamamına sahip (`project.meta.language: "tr" | "en"`
  dahil), ama `rendererMap[methodId](payload, entry)`'ye yalnızca `A3EntrySummary` (`{id,
  title}`) geçiyor. `A3EntrySummary`'ye bir `language` alanı eklemek (D-99'un zaten kurduğu
  dependency-injection desenine bir alan eklemek) `src/a3`'e **hiç i18next import ettirmeden**
  her `renderToA3`'e "hangi dilde yazmalıyım" bilgisini taşır — pure fonksiyon, ESLint sınırına
  tamamen uygun, D-94/D-99'un LOCKED kararlarına dokunmuyor.

**Bu, §2.4'ün kendi açık sorusunu değiştiriyor: gerçek çift-dilli ihracat (Seçenek B) ilk
bakışta göründüğünden ucuz** — ama hâlâ Barış'ın kararı, çünkü bugün yalnızca Türkçe şablon
var, yani "İngilizce projede İngilizce ihracat" hedefi Faz 11'e kadar zaten yarım kalacak
(statik iskelet Türkçe kalacak). Aşağıdaki §3.1'e bakın.

**Kusur çift yönlü, yalnızca "İngilizce içerik, Türkçe iskelet" değil.** `src/methods/kpiStrip/
KpiStripChart.tsx`'in `Tile` bileşeni, `item.sustain`/`item.result` alt-yazısını (D-182/P-36'nın
Sürdürme/Sonuç alanları) doğrudan Türkçe hardcode ediyor (`` `Sürdürme: ${…}` ``/`` `Sonuç:
${…}` ``, `meta.language`'a bakmadan, her zaman) — bu, grafik/diyagram bileşenleri arasında
tarandığında (`*Chart.tsx`/`*Diagram.tsx`, 2026-08-18) bulunan tek örnek, ama tek başına
"her şeyi Türkçeye çevir" (Seçenek A) fikrini de zayıflatıyor: bu satır zaten Türkçe, düzeltme
gerektirmeyecek gibi görünür ama `meta.language: "en"` bir projede yanlış dilde kalacak. Gerçek
düzeltme, yön ne olursa olsun, dile duyarlı olmalı — tek yönlü bir toplu çeviri geçişi değil.

### 2.2 Blok hizası yarısı — hâlâ kök nedeni bulunmadı

P-26'nın kendi notu: *"content does not always land inside its intended block — text reads as
offset from where the block's own borders are."* Bu, 2026-08-04'teki gerçek bir uygulama
yürüyüşünden geldi (Barış'ın kendi gözlemi), ama o oturum bilerek kök nedene inmedi — "bir
sonraki faz için bir uyarı" olarak bırakıldı. Bu promptu yazarken kod okunarak **hiçbir yeni
kanıt toplanmadı** — P-25/P-21'in kendi metodolojisi (gerçek bir Tauri penceresinde gerçek bir
export açıp gerçek koordinatlara bakmak) burada da geçerli, ama henüz yürünmedi. İki aday
şüpheli (kanıtlanmamış): `src/a3/layout/place.ts`'in hücre/merge yerleşimi, ya da
`src/a3/templates/farplas-7step-tr.ts`'nin blok sınır tanımlarıyla gerçek içerik satırlarının
uyuşmazlığı. **Bu yarı kendi keşif oturumunu gerektiriyor — aşağıdaki §3.2.**

---

## 3. Önerilen dilim sırası — bir öneri, bir mandat değil

D-114'ün disiplini burada da geçerli: **P-26'nın kendi notu bunun iki ayrı kusur sınıfı
olduğunu söylüyor — aynı oturumda karıştırma.**

### 3.1 D1 — i18n ihracat etiketleri (bu dosyanın kardeşi, `D1-i18n-ihracat-etiketleri.md`)

**BİTTİ 2026-08-18, bkz. D-188.** Mekanik ama geniş bir süpürme: ~24 `fields.ts`/`columns.ts`
dosyası + ek inline sözlükler taşıyan bir avuç `renderToA3.ts` — **tahmin, gerçeğin yaklaşık
yarısıydı.** D1'in kendi mandatlı ilk adımı (§2.3 — envanteri doğrula, körü körüne güvenme),
orijinal 15 dizinlik listenin `exportLabel`/`_EXPORT_LABELS` regex'inin göremediği bir kalıba
(`` `${label}: ${value}` `` gibi `$` ile başlayan template literal'lar, ve "NE?" gibi 2 harfli
büyük-harf kelimeler) kör olduğunu buldu — ikinci, daha derin bir tarama 15 dizin daha ortaya
çıkardı (`causeEffectMatrix`, `comparativeAnalysis`, `weightedDecisionMatrix`, `msaGageRr`,
`problemTypeClassifier`, `isIsNot`, `tpmLossTaxonomy`, `faultTree`, `fiveWhy`, `fiveG5N1K`,
`fiveW2H`, `gapStatement`, `smartTarget`, `threeLeggedFiveWhy`, `fiveN1K`) — gerçek toplam
**29 dizin**, artı `shared/whyChain.ts`, artı iki grafik bileşeni (`kpiStrip/KpiStripChart.tsx`'in
zaten bilinen Türkçe hardcode'u + yeni bulunan `distributionChart/DistributionChart.tsx`'in
box-plot görünümündeki `"Value"` fallback'i). Bu büyüme + §2.2'nin mandatlı Seçenek A/B sorusu
tek bir `AskUserQuestion` turunda birlikte Barış'a soruldu: **Seçenek B** (gerçek çift-dilli
ihracat) seçildi, ve büyümüş kapsamın **tamamı tek oturumda** yapıldı (alt-bölünmedi).
Ayrıca bulunan, yapısal olarak farklı bir üçüncü kusur — Fishbone diyagramının kategori
etiketleri `project.meta.language`'ı değil, editörün o anki aktif i18next dilini kullanıyor —
bilinçli olarak bu dilime alınmadı, **P-42** olarak dosyalandı.

### 3.2 D2 — blok hizası

**BİTTİ 2026-08-18, bir keşif oturumu olarak — kök neden bulundu, düzeltme D2b'ye
bırakıldı.** `docs/oturumlar/D2-blok-hizasi.md`'nin kendi §2.2 yürüyüşü uygulandı (gerçek
8-adım fixture → gerçek iki-çağrılı `buildA3Layout` → gerçek `write_a3_workbook` → gerçek
`xl/worksheets/sheet1.xml` XML kontrolü, `TEMPLATE_ANALYSIS.md` §12.8'e değil
`farplas-7step-tr.ts`'nin kendi `TemplateBlock` aralıklarına karşı — §1.4'ün kendi
düzeltmesiydi). Düz-metin (`lines`) yolu temiz çıktı; kök neden `src/a3/layout/
placeZones.ts`'te iki ilişkili kusur: (1) bir zonun çok satırlı içeriği her zaman tek, sabit
yükseklikli bir satıra sıkıştırılıyor (satır yüksekliği Rust tarafından kilitli,
`customHeight="1"`, otomatik sığdırma yok); (2) açgözlü kolon-eşleme dengesiz kolon
genişliklerini hesaba katmıyor, `five-n1k`'in altı-eşit-zon bölümü altıncı zonu ("NEREDE?")
tamamen 8.25 pt'lik bir eski ayraç koluna ("O") düşürüyor — beş kardeşinin 240–383 pt'ine
karşı. Hem XML'de hem gerçek bir Apple Numbers render'ında görsel olarak doğrulandı (kırpılmış
cevap satırları, komşu bloğa bitişik tek bir başıboş "N" harfi) — Barış'ın 2026-08-04 tarifiyle
birebir eşleşiyor, ama `five-n1k` o tarihte yoktu (2026-08-16'da sevk edildi), bu yüzden
birebir yeniden üretim değil, aynı mekanizma sınıfının aynı belirtisi. Kusurlar
`smart-target`'ta (LOCKED, D-178 onaylı) da yaşıyor ama görünmüyor — onun geniş zon
genişlikleri ve 153.75 pt'lik tek satırı bugüne kadar maskeliyor. Düzeltme bilinçli olarak
**yapılmadı** — `smart-target`'ın onaylı görsel şeklini değiştirir, kendi Block Visual
Verification Loop turunu gerektirir. Tam kayıt: `TEMPLATE_ANALYSIS.md` §15, `DECISIONS.md`
D-189, P-43 (düzeltme, D2b, henüz planlanmadı).

---

## 4. Kapsam dışı

- Şablon dosyasının kendisinin yeniden tasarımı (`src/a3/templates/*`'e yeni bir şablon
  eklemek) — D-95, Faz 11, bu oturumun işi değil. D1/D2 yalnızca **mevcut** `farplas-7step-tr`
  üzerinde çalışır.
- Editör arayüzünün i18n'i (zaten TR/EN, `labelKey` üzerinden) — dokunulmaz, yalnızca ihracat
  tarafı eksik.
- `MethodPlugin.tier`/`MethodBand` (D-169, C6'da BİTTİ), esnek tahsis (P-40, Faz 11) — Oturum
  C'nin işiydi, D-149'un planı kapandı.
- P-41 (Fishbone'un tespit ettiği alt-problemlere kendi 5-Why zincirini bağlama, Fishbone'suz
  saf 5-Why akışı) — C6'da Barış'ın gündeme getirdiği ayrı bir mimari soru, P-26 ile ilgisiz,
  kendi geleceğine bırakıldı.

---

## 5. Bütçe uyarısı (Madde 1 / G1)

D1 tek başına ~24+ dosyaya dokunacak bir süpürme — her dosyadaki değişiklik küçük ve tekrarlı
olsa da, dosya sayısı Oturum C'nin tek bir diliminden (C4'ün 4 plugin'i, C1'in 5 dosyası) daha
büyük. **D1'in kendi açılış bütçe kontrolünde** (Madde 1) adım-bazlı bir alt-bölme gerekip
gerekmediğini Barış'la teyit et — örneğin Adım 1-4 / Adım 5-8 iki yarıya bölünebilir, ya da tek
oturumda bitebilecek kadar mekanik olduğu için bölünmeyebilir; bu, dosyaları gerçekten görmeden
önceden karar verilecek bir şey değil.

D2 henüz kapsamlanmadı — kendi keşif oturumunun büyüklüğü, bulunan kök nedene göre değişir.

---

**Model önerisi:** Sonnet — D1, D-28'in "yüksek hacimli ama düşük riskli implementasyon"
sınıfı, C1/C2/C4 ile aynı. D2 henüz kapsamlanmadığı için model önerisi de erken; kök neden
karmaşık çıkarsa (örn. `buildA3Layout`'un merge/yerleşim mantığında gerçek bir mimari sorun),
o zaman Opus'a geçmek gerekebilir — D2'nin kendi promptu yazılırken karar verilecek.
