# OTURUM C2 — `problem-impact` + 5N1K plugin'leri (Oturum C'nin ikinci dilimi)

> `docs/oturumlar/C-yontem-plugin-insasi.md`'nin önerdiği altı dilimden (§3) ikincisi. **C1
> BİTTİ** — P-37 (4/5 plugin), P-34 (fishbone geometrisi), B1'in 5./6. alan ekleri, D-180.
> Bu dosya C2'nin kapsamıdır: **iki yeni plugin, sıfır yeni mekanizma** — `problem-impact` ve
> 5N1K, ikisi de ADIM 1, ikisi de B2'de zaten tasarlandı (§14.2, D-163). Alan listeleri kesin;
> bu bir tasarım turu değil, bir inşa turu.
>
> Kanonik konum: `docs/oturumlar/C2-problem-impact-5n1k.md`. Yazıldı: 2026-08-16, C1'in
> kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      docs/oturumlar/C-yontem-plugin-insasi.md \
      src/methods/registry.ts src/a3/methodContract.ts \
      src/methods/pareto/index.ts src/methods/pareto/ParetoChart.tsx \
      src/methods/smartTarget/renderToA3.ts \
      src/methods/shared/fieldForm.ts src/methods/shared/FieldFormEditor.tsx \
      src/methods/fiveG5N1K/schema.ts \
      reference/visual/5N-1K.jpeg
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-16'da doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (plan onayı, TDD, i18n),
   ve "Current state"in **Oturum C — C1** paragrafı (bu dilimin hemen öncesi).
3. `docs/oturumlar/C-yontem-plugin-insasi.md` §2.2 madde 1 ve §3 madde C2 — bu dilimin kendi
   tarifi, kısaca.
4. `reference/TEMPLATE_ANALYSIS.md` §14.2 (ADIM 1 — üç zorunlu panel + iki opsiyonel ek) —
   **problem-impact ve 5N1K'nın kendi tam alan/geometri tarifi burada**, baştan sona.
5. `DECISIONS.md`: **D-163** (5N1K yeni plugin, `five-g-5n1k` değiştirilmez — bu kararın
   gerekçesi de önemli: şipping edilmiş `five-g-5n1k`'ın alan seti referans görselle
   uyuşmuyor), **D-127** (fieldForm/FieldFormEditor substratı), **D-102** (zones/image
   mekanizması), **D-114** (dilim disiplini — bu dilim de tek-mekanizma değil sıfır-mekanizma
   bütçesinde).

---

## 2. Kapsam — iki plugin, ikisi de kesin tarifli

### 2.1 5N1K şeridi (yeni plugin, D-163)

- **Adım**: 1. **Geometri**: 4 tuval satırı (52 pt), `zones`: 6 eşit bölge
  (`widthFraction` ≈ 0.1667 her biri, 94.50 pt genişlik) — `smartTarget/renderToA3.ts`'in
  D-38 üç-bölgeli şeridiyle **aynı mekanizma** (`A3BlockContent.zones`), altıya çıkmış hali.
  Yeni bir mekanizma **değil**.
- **Alan seti ve sıra** — `reference/visual/5N-1K.jpeg`'in kendi sırası: `ne` / `neden` /
  `nasil` / `kim` / `neZaman` / `nerede`. **Şipping edilmiş `five-g-5n1k`'ın alan setiyle
  karıştırma** — D-163'ün bulduğu gibi o `ne`/`nerede`/`nasil`/`neZaman`/`neKadar`/`kim`
  taşıyor (neden yerine neKadar) ve ayrıca 5G'nin beş alanını da taşıyor; hiçbiri buraya
  uymuyor. Bu yüzden ayrı, yeni bir plugin — `five-g-5n1k`'a tek satır bile dokunulmaz.
- **Görsel/export şekli**: her `zone.lines`'ın ilk satırı kalın etiket (`"NE?"`,
  `"NEDEN?"`, …), ikinci satırdan itibaren kullanıcının cevabı düz metin. Katman B'nin sabit
  renkli başlık çipi (§14.1) **statik şablon stili** — `renderToA3` yalnızca metni yazar, renk
  şablonda sabitlenir (aynen D-165'in "sabit konum → statik şablon stili" ilkesi, zaten diğer
  panellerde uygulandı).
- Dosya iskeleti: `src/methods/fiveN1K/` (ya da benzeri isim — mevcut `fiveG5N1K` klasör
  adlandırma deseniyle tutarlı bir isim seç), `schema.ts`/`Editor.tsx`/`renderToA3.ts`/
  `index.ts` + üç test dosyası, Faz 5/6'nın kendi şablonu.

### 2.2 `problem-impact` (yeni plugin, §14.2 madde 5)

- **Adım**: 1, **opsiyonel ek** — zorunlu üçlünün (5N1K + Gap Analizi + Problem Statement)
  DIŞINDA, kendi ayrı entry'si. Garantili paneli yok; §14.7'nin esnek tahsis mekanizmasına
  tabi (büyürse yer bulur, büyümezse D-100 gereği ek sayfaya gider — kırpılmaz).
- **İçerik**: (a) Pareto grafiği — **mevcut `pareto-chart` `imageKind`'ı aynen yeniden
  kullanılır** (`src/methods/pareto/index.ts`'in `imageKind: "pareto-chart"` deseni, yeni bir
  `ChartSpec`/`imageKind` **gerekmez**); (b) sabit alanlı bir mali kayıp formu —
  `shared/fieldForm.ts`/`FieldFormEditor.tsx` (D-127) substratı: aylık kayıp, senelik kayıp,
  birim/para cinsi, hesap notu (dört alan, tür `text`/`textarea`, D-127'nin `FieldFormField`
  şekli).
- **Mimari not (D-124 tutarlılığı)**: bu, ADIM 2'deki `pareto` entry'sini ADIM 1'de
  "göstermek" değil — ADIM 1'e ait **kendi bağımsız** Pareto verisini tutan yeni, ayrı bir
  entry. İki farklı entry, iki farklı adım, aynı `pareto-chart` görselleştirme mekanizması.
- Görsel biçim: bir `image` (rowSpan'lı, Pareto'nun `CHART_ROW_SPAN` deseni) + mali kayıp
  formunun `fieldFormLines` çıktısı — `pareto`'nun kendi `renderToA3.ts`'i ile `countermeasure`
  gibi bir `fieldForm` tabanlı plugin'in `renderToA3.ts`'inin **birleşimi**, ikisi de bu
  oturumda zaten tanıdık desenler.

---

## 3. Kapsam dışı

- 5G (`five-g-5n1k`) — zaten şipping edilmiş, bu oturumda dokunulmaz.
- Gap Analizi / Problem Statement — `gapStatement`'ın zaten şipping edilmiş render'ı, D-162
  gereği şemaya dokunulmadı; bu dilimin işi değil.
- P-37/P-34/B1 aday 5-6 — C1'de kapandı, tekrar açılmaz.
- `kpi-strip`, ADIM 8 tasarım turu, `whyWhyTree` diyagramı, tier/sürükle-tutamaç arayüzü —
  C3-C6, ayrı oturumlar.
- Şablon dosyasının kendisi (`src/a3/templates/*`) — D-95, Faz 11.

---

## 4. Bütçe ve kapanış disiplini

C1'in kendi kapanışında uygulanan disiplin aynen geçerli: her plugin TDD (schema/Editor/
renderToA3 + üç test dosyası), TR/EN i18n anahtarları birlikte, `npm test`/`npm run lint`/
`npm run build` ve `cargo test`/`cargo clippy`/`cargo fmt` hepsi yeşil olmadan iş bitmiş
sayılmaz. İki plugin de küçük ve birbirinden bağımsız — aynı oturumda ikisi de bitebilir, ama
biri bitmeden diğerine geçmeden önce ara doğrulama (`npm test`) çalıştır.

Kapanışta: `TEMPLATE_ANALYSIS.md`/`DECISIONS.md`/`CLAUDE.md`'ye C2'nin kendi özeti yazılır,
`docs/oturumlar/README.md`'nin tablosuna bir satır eklenir, ve **C3'ün** (kpi-strip, D-114'ün
tek-mekanizma bütçesi) kendi prompt dosyası mı yazılacak yoksa C-yontem-plugin-insasi.md'nin
kendi §3'ü mü yeniden kullanılacak — o karar C2'nin kapanışında verilir.

---

**Model önerisi:** Sonnet — D-28'in "yüksek hacimli implementasyon" sınıfı, C1'le aynı. Yeni bir
mimari karar yok; ikisi de zaten tasarlanmış, alan listeleri kesin.
