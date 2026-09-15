# OTURUM — P-27: impact-effort-matrix'in serbest-pozisyon 2×2 drag-drop'u

> `export-ui-sadakat-gedikleri.md`'nin §2'sinde Barış'a `AskUserQuestion` ile soruldu
> (2026-09-15) — **Barış önerilen seçeneği DEĞİL, gerçek serbest-pozisyon drag-drop'u seçti.**
> Bu, D-114'ün "bir dilim = bir yeni mimari mekanizma" bütçesini aşan gerçek bir UI-altyapı
> işi (yeni bir sürüklenebilir 2×2 canvas bileşeni) — bu yüzden aynı oturumda (P-42/P-23'ün
> yanında) yapılmadı, kendi temiz oturumuna bırakıldı.
>
> Kanonik konum: `docs/oturumlar/P27-impact-effort-drag-drop.md`. Yazıldı: 2026-09-15.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
cat src/methods/impactEffortMatrix/schema.ts
  # ImpactEffortItemSchema: { id, description, impact: string, effort: string } bekleniyor.
  # impact/effort string-typed (D-120), render zamanında quadrant.ts'te parse ediliyor.

cat src/methods/impactEffortMatrix/quadrant.ts
  # quadrantOf(item): impact>=3 && effort<=2 → "quick-win", vb. dört kadran, 1-5 skala,
  # orta noktada (3) bölünüyor. Skorsuz alan quadrant döndürmüyor (undefined).

grep -n "AutoScoreForm\|scoreValue" src/methods/impactEffortMatrix/Editor.tsx
  # Mevcut Editor bir RowTableEditor/AutoScoreForm türevi bekleniyor — mevcut editörü oku,
  # tam şeklini gör.

grep -rn "@dnd-kit" src/app/routes/workspace/EntriesBand.tsx src/app/routes/workspace/SortableEntryRow.tsx
  # @dnd-kit/core + @dnd-kit/sortable, LİSTE sıralaması için kullanılıyor — sortable strategy,
  # serbest 2D pozisyon için DOĞRUDAN uygun değil (bu farklı bir @dnd-kit kullanım şekli
  # gerektirir: useDraggable + kendi delta/pozisyon mantığın).

grep -n "normalizedPosition\|x0\|y0" src/domain/model/entry.ts src/app/routes/workspace/EntryAnnotationEditor.tsx
  # D-119'un annotation mekanizması (normalized 0..1 x/y koordinatları, hand-rolled pointer
  # events, @dnd-kit KULLANMIYOR) — serbest-pozisyon 2D yerleştirmenin en yakın gerçek emsali
  # bu proje içinde. Referans olarak oku, kopyalama değil.

grep -n "role=\"separator\"\|ArrowUp\|ArrowDown" src/a3/render/BlockPinOverlay.tsx
  # D-170/L3b'nin klavye-erişilebilir sürükleme-tutamacı deseni — "canvas mouse-only, her
  # etki ayrı ayrı erişilebilir olmalı" (D-86) ilkesinin başka bir uygulaması. Serbest 2D
  # sürüklemenin kendi klavye alternatifi bu deseni takip etmeli.
```

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Kapsam

SPEC.md §1.3 (Step 5): "Impact / Effort matrix (**2×2, drag-and-drop**)." D-142 bunu bir
skorlu liste + hesaplı kadran olarak inşa etti (6b'nin `causeEffectMatrix`'inin aynı
basitleştirmesi). Barış'ın 2026-09-15 kararı: gerçek, serbest-pozisyon bir 2×2 canvas —
kullanıcı her `ImpactEffortItem`'ı doğrudan sürükleyip kadranlar arası (ya da kadran içinde
ince ayar) taşıyabilmeli.

**Gerçek açık tasarım soruları (kodlamadan önce Barış'a sorulmalı, körü körüne seçilmemeli):**

1. **Skor mu, pozisyon mu birincil kaynak?** Bugün `impact`/`effort` iki ayrı 1-5 skor alanı
   ve kadran bunlardan HESAPLANIYOR (D-142). Serbest sürükleme eklenince iki olası model var:
   - **(a) Pozisyon birincil**: sürükleme normalized x/y (0..1, D-119'un annotation deseni
     gibi) yazıyor, `impact`/`effort` sayısal alanları TAMAMEN kaldırılıyor ya da pozisyondan
     TÜRETİLİYOR (geri dönüştürülüyor) — ama bu payload'ın şemasını gerçekten değiştirir
     (`z.looseObject`'e yeni `x`/`y` alanları, muhtemelen `impact`/`effort`'un kendisi
     kaldırılır ya da ikisi paralel tutulur).
   - **(b) Skor birincil, sürükleme sadece bir GİRİŞ YÖNTEMİ**: kullanıcı canvas'ta sürükler,
     sürükleme bitince x/y konumundan `impact`/`effort` sayısal değerleri HESAPLANIP geri
     yazılır (mevcut şema hiç değişmez, yalnızca Editor'ün giriş mekanizması değişir — bir
     input yerine bir sürüklenebilir nokta). **Muhtemelen daha güvenli** — mevcut
     `quadrant.ts`/renderToA3.ts/testleri dokunulmaz kalır, yalnızca `Editor.tsx` değişir.
2. **Kadranlar arası ince konumlandırma nasıl davranır?** Örn. "quick-win" kadranı içinde
   sol-üst köşeye mi sağ-alt köşeye mi bırakıldığı önemli mi (göreceli önceliklendirme sinyali)
   yoksa yalnızca HANGİ kadranda olduğu mu önemli (kaba, dört-kutulu bir gruplama)? Bu,
   modelin (a) mı (b) mi olduğunu doğrudan etkiler.
3. **Klavye erişilebilirliği** — D-86'nın "canvas mouse-only, her etki ayrı erişilebilir"
   ilkesi burada da geçerli olmalı. BlockPinOverlay'in (D-170) `role="separator"` +
   ArrowUp/ArrowDown deseni bir emsal, ama o TEK EKSENLİ (satır sayısı); bu 2D — muhtemelen
   her item için ayrı bir "impact/effort'u sayısal olarak düzenle" alternatif kontrolü
   (mevcut sayısal input'lar zaten bu işi görüyor olabilir — Seçenek (b) doğal olarak bunu
   bedava verir).
4. **A3 export'a ne yansır?** Bugün `renderToA3.ts` her item'ı kadranına göre gruplanmış metin
   satırları olarak yazıyor (muhtemelen — oku, doğrula). Gerçek bir 2×2 GÖRSEL (Recharts
   scatter/quadrant chart, D-102'nin `A3ImageKind` mekanizması üstüne) mi isteniyor, yoksa
   sürükleme yalnızca EDİTÖR deneyimini mi iyileştiriyor, export hâlâ metin listesi mi kalıyor?
   Bu da ayrı bir soru — "drag-drop" SPEC'in kendi lafzında editör deneyimi gibi okunuyor, ama
   kesinleştirilmeli.

**Önerilen yaklaşım (bu oturumun kendi önerisi, Barış'ın kendi seçimi değil)**: (1) Seçenek
(b) — skor birincil kalır, sürükleme yalnızca bir giriş yöntemi, şema/renderToA3/testler
dokunulmaz; (4) export değişmez, yalnızca Editor'ün kendi deneyimi. Bu, D-114'ün "bir dilim
bir mekanizma" bütçesini gerçekten TEK bir yeni mekanizmaya (sürüklenebilir 2×2 canvas
bileşeni) indirger. Ama bu ÖNERİ — ilk `AskUserQuestion` turunda Barış'a sorulmalı, kod
yazmadan önce.

---

## 2. Mekanizma taslağı (yalnızca Seçenek (b) onaylanırsa)

Yeni bir `ImpactEffortCanvas.tsx` bileşeni (muhtemelen `src/methods/impactEffortMatrix/`
altında, D-102/D-119 emsalinin aksine bu tamamen İNTERAKTİF-EDİTÖR-ONLY, export'a bir görsel
olarak GİTMEZ önerilen (b) modelinde — yani `renderImage`/`A3ImageKind` gerektirmiyor,
sadece bir Editor bileşeni):

- Dört kadran arka planı (sabit, D-165'in mevcut renk katmanlarından BAĞIMSIZ yeni bir
  görsel dil — ya da nötr gri/açık tonlar, kendi küçük bir Block Visual Verification Loop
  turu gerektirebilir, bu bir UI bileşeni, A3 export değil, ama yine de "görsel bir karar" ise
  CLAUDE.md'nin kendi BVVL disiplini burada da uygulanabilir).
- Her `ImpactEffortItem` bir nokta/kart, `impact`/`effort`'tan hesaplanan x/y konumunda.
- Sürükleme bitince (`onPointerUp`/dnd-kit's `useDraggable` + `onDragEnd`) yeni x/y →
  `impact`/`effort` sayısal değerlerine GERİ ÇEVRİLİR (1-5 skalaya yuvarlanarak), `onChange`
  çağrılır — payload şekli DEĞİŞMEZ.
- Mevcut sayısal input'lar (varsa) YANINDA kalabilir (sürükleme + sayısal giriş, ikisi de aynı
  alanı düzenleyen iki temsil — D-71'in "iki temsil, öncelik netleşmeli" dersi burada da
  geçerli: hangisi "gerçek kaynak" mı, yoksa ikisi de canlı iki-yönlü mü senkron olacak?).

Bu taslak KESİN DEĞİL — kodlamadan önce kendi `AskUserQuestion` turunuzda netleştirin.

---

## 3. Test/doğrulama

- Yeni `ImpactEffortCanvas.test.tsx` (ya da `Editor.test.tsx`'e eklenen testler) — pointer
  sürüklemesinin doğru `impact`/`effort` değerlerini ürettiğini doğrula (jsdom'da
  `PointerEvent` polyfill'i zaten `src/test/setup.ts`'te var, D-194'ün kurduğu).
- Mevcut `quadrant.test.ts`/`renderToA3.test.ts` DEĞİŞMEMELİ (Seçenek (b) ise).
- Klavye erişilebilirlik testi — §1 soru 3'ün kendi cevabına göre.

---

## 4. Bütçe ve kapanış disiplini

D-114'ün "bir dilim bir mekanizma" bütçesi: bu TEK bir yeni mekanizma (sürüklenebilir canvas),
ama gerçek UI-tasarım riski taşıyor — kendi Block Visual Verification Loop turu gerekebilir
(CLAUDE.md'nin kendi kuralı: "her yeni görsel karar bir BVVL turu ister"). Tek oturumda
bitmezse, tasarım turu + inşa turu olarak ikiye bölünebilir (W1/W-kapsam-belirleme'nin
emsali).

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, P-27'nin kendi satırının KAPANDI olarak
işaretlenmesi, `docs/oturumlar/README.md`'nin ilgili tablosu güncellenmesi.

---

**Model önerisi**: gerçek bir yeni UI mekanizması + tasarım riski taşıyor — Sonnet 5 yeterli
olmalı (D-102/D-119 emsalleri üstüne inşa, D-28), ama tasarım turu Opus'la da yapılabilir
Barış tercih ederse.
