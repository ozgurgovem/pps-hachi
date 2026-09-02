# OTURUM Faz 9 — J3-3: Prompt kütüphanesi, Adım 3+4 (birleşik, 10 method)

> J3-1 (Adım 1, 9 method, D-206) ve J3-2 (Adım 2, 9 method, D-207) BİTTİ. Bu dilim, J3-1'in
> kendi §2.2 notunun öngördüğü gibi, tek başına bir oturuma değmeyen Adım 3'ü (`smart-target`,
> 1 method) Adım 4'ün 9 method'uyla BİRLEŞTİRİYOR — D-207'de kaydedilen karar (bkz.
> `DECISIONS.md` D-207). Bu dosya **KISA** — envanteri/deseni yeniden üretmiyor, doğrudan
> `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'ye referans veriyor (Madde 1 — aynı işi
> iki kez yapma). Yeni bir mekanizma YOK; J3-1/J3-2'nin yaptığının aynısı, iki adım öteye.
>
> Kanonik konum: `docs/oturumlar/J3-3-adim3-4-prompt-kutuphanesi.md`. Yazıldı: 2026-09-02,
> J3-2'nin kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md \
      docs/oturumlar/J3-2-adim2-prompt-kutuphanesi.md \
      src/ai/prompts/2/pareto.v1.md \
      src/ai/prompts/2/trend.v1.md \
      src/methods/smartTarget/schema.ts \
      src/methods/causeEffectMatrix/schema.ts \
      src/methods/comparativeAnalysis/schema.ts \
      src/methods/faultTree/schema.ts \
      src/methods/fishbone/schema.ts \
      src/methods/fiveWhy/schema.ts \
      src/methods/hypothesisVerification/schema.ts \
      src/methods/pfmeaLinkage/schema.ts \
      src/methods/threeLeggedFiveWhy/schema.ts \
      src/methods/whyWhyTree/schema.ts
```

Hepsi var olmalı; eksik/adı değişmiş bir tane varsa **DUR ve Barış'a söyle**.

Ayrıca gerçek koda karşı yeniden doğrula (registry J3-2'den beri değişmiş olabilir):

```bash
grep -rln "aiProposal:" src/methods/*/index.ts
```

**Beklenen: tam olarak 19 dosya** — `pareto` (J1) + J3-1'in 9'u + J3-2'nin 9'u
(`categoryBreakdown`, `checkSheet`, `distributionChart`, `isIsNot`, `msaGageRr`,
`pointOfCause`, `processFlowSipoc`, `stratificationMatrix`, `trend`). Farklıysa, J3-2 ile bu
oturum arasında registry değişmiş demektir — `J3-prompt-kutuphanesi-genelleme.md`'nin §2.1
envanterini o zaman yeniden çıkar, körü körüne aşağıdaki listeye güvenme.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'nin **tamamı** — özellikle §2.0 (neden
   yeni mekanizma yok), §2.1'in Adım 3 ve Adım 4 satırları (Adım 3: "Hedefi SMART'a çevir,
   baseline'a karşı sağlık kontrolü yap." — Adım 4: "4M'ye göre fishbone dalları tohumla. Her
   Why bağını nedensellik için test et. 'Operatör hata yaptı' çıkmazını tespit et."), §2.3
   (J3-1'in kendi üç-adımlık kalıbı), §2.4 (test stratejisi — TEK registry-geneli değişmez,
   zaten yazıldı, bu dilim yalnızca genişletiyor).
3. `DECISIONS.md` **D-206** (J3-1'in tam kaydı) ve **D-207** (J3-2'nin kaydı, + bu birleşme
   kararının kendisi).
4. `src/ai/prompts/2/pareto.v1.md` ve J3-2'nin dokuz dosyasından (`src/ai/prompts/2/*.v1.md`,
   `pareto.v1.md` hariç) en az ikisi — kalıbı taklit etmek için. **Özellikle
   `is-is-not.v1.md`** oku — "çoğu alan çoğu zaman boş kalmalı, halüsinasyon riski buradaki
   gibi keskin" örneği Adım 4'ün `fishbone`/`why-why-tree`/`hypothesis-verification`'ında da
   aynı şiddette geçerli.
5. Adım 3+4'ün gerçek 10 method'unun `schema.ts`'leri — §0'da listelendi, dosya başına oku.
   **Fishbone ve why-why-tree'yi diğerlerinden önce, dikkatlice oku** — aşağıdaki §2.2'ye bak.

---

## 2. Kapsam — Adım 3+4, 10 method

`smart-target` (Adım 3, tek method) artı `cause-effect-matrix`, `comparative-analysis`,
`fault-tree`, `fishbone`, `five-why`, `hypothesis-verification`, `pfmea-linkage`,
`three-legged-five-why`, `why-why-tree` (Adım 4'ün 9'u). Tam gerekçe/dışlama kararları için
`J3-prompt-kutuphanesi-genelleme.md` §2.1'e bak — burada tekrar edilmiyor.

Her method için, J3-1'in §2.3'ündeki üç adım aynen:

1. `src/ai/prompts/{step}/{methodId}.v1.md` yaz (`smart-target` → `src/ai/prompts/3/`, diğer
   9'u → `src/ai/prompts/4/`, yeni dizinler) — front-matter `pareto.v1.md`'nin şeklini izler
   (`mode: draft`, `methodId`, `step: 3` veya `4`, `version: v1`, `outputSchema: {methodId}`,
   `contextSlices: []`). Şemasının her alanı için somut rehberlik — kopyalama, her method'un
   kendi `schema.ts`'ini gerçekten oku.
2. `src/methods/{methodId}/index.ts`'e `aiProposal: { promptVersion: "v1" }` ekle.
3. i18n'e dokunma (J1'in kendi bulgusu hâlâ geçerli).

### 2.1 `smart-target` (Adım 3) — düz alan seti, önceki dilimlerle aynı zorluk

Tek başına bir kapsam sorusu yok — `smartTarget/schema.ts`'i oku, alan bazlı rehberlik yaz.
D-38'in kendi SMART çerçevesi (Specific/Measurable/Achievable/Relevant/Time-bound) + baseline'a
karşı sağlık kontrolü ("Hedefi SMART'a çevir, baseline'a karşı sağlık kontrolü yap" — SPEC'in
kendi cümlesi) prompt'un rol çerçevesine girmeli.

### 2.2 Adım 4'ün asıl zorluğu — ağaç/graf şeması taşıyan üç method

`fishbone`, `why-why-tree` ve (daha hafif ölçüde) `hypothesis-verification` bu J3 serisinin
şimdiye kadar gördüğü en karmaşık şemalar — düz alan/satır-tablosu değil, **kendi id'lerini
üreten ve birbirine referans veren düğüm listeleri**:

- `fishbone/schema.ts`: `causes[]` her biri `{id, categoryId, parentCauseId?, text, position?}`
  — model her cause için kendi `id`'sini üretmeli (kısa, okunabilir bir slug, D-102/D-103'ün
  kendi kuralı: kategori pozisyonları algoritmik, yalnızca `causes` gerçek veri), ve varsa
  `parentCauseId` **listedeki başka bir cause'un gerçek `id`'siyle birebir eşleşmeli** (Trend'in
  `events[].at` ↔ `points[].label` eşleşme kuralının aynısı, burada bir düzey daha derin).
  `categoryId` `categorySet`'in (6M/8P, `categories.ts`'e bak) gerçek bir kategori id'siyle
  eşleşmeli. Yalnızca en üst düzey cause'lar bir sub-cause'a parent olabilir (şemanın kendi
  yorumu: "the parent must be a top-level cause, no `parentCauseId` of its own").
- `why-why-tree/schema.ts`: `nodes[]` her biri `{id, parentId, text, outcome?}` — dallanan bir
  ağaç (D-176/P-35'in kendi motivasyonu: "operatör hata yaptı" çıkmazına düşmeden birden fazla
  kredibl cevabı paralel dallar olarak tutabilmek). Kök düğüm(ler)in `parentId`'si `null`.
  `outcome` yalnızca kaynak veri gerçekten "kontrol altında" veya "kök neden doğrulandı" diyorsa
  doldurulmalı (`"controlled"`/`"confirmedRootCause"`, ikisi de opsiyonel — SPEC'in "Her Why
  bağını nedensellik için test et" cümlesi burada işliyor: bir düğümün nedensellik testinden
  GEÇMEDİĞİ, kaynak veri bunu açıkça göstermiyorsa `outcome`'u boş bırakmak demektir).
- `hypothesis-verification/schema.ts`'i de oku — ağaç değil ama D-116'nın `pointOfCause` rolünü
  taşıyan bir referrer method, kendi alan seti var (bkz. C1/D-180'in confidence/uncertainty
  alanları).

**Bu üç method için "boş liste/düğüm listesi döndür, icat etme" ilkesi (Pareto'nun kendi
ilkesi) burada daha da kritik** — bir fishbone/why-why-tree önerisi kaynak veride hiç
bahsedilmeyen bir sebep zinciri uydurursa, SPEC §8.1'in "the root cause it invents will be
plausible and wrong" uyarısı harfiyen gerçekleşir. Prompt metninde bunu açıkça yaz: id/parentId
tutarlılığı + "yalnızca kaynak verinin gerçekten işaret ettiği düğümleri ekle" ikisi birden.

### Test

`registry.test.ts`'in `describe("MethodPlugin.aiProposal across the registry")` bloğu
**J3-1'de yazıldı, jeneriktir, hiçbir değişiklik gerekmiyor** — 10 yeni method `aiProposal`
kazandığı an mevcut testler onları otomatik kapsar. Tek elle-yapılacak iş (J3-2'nin kendi
emsali): `it("has at least the methods J1/J3-1/J3-2/... shipped")` testindeki
`arrayContaining` listesine bu dilimden bir-iki method eklemek istiyorsan ekle (zorunlu değil).
**Mutation-check unutma** — J3-1/J3-2'nin ikisi de bunu yaptı: bir method'un `promptVersion`'ını
bilerek yanlış yap, test KIRMIZI olduğunu doğrula, geri al, tekrar YEŞİL doğrula.

### Done-koşulu

J3-1/J3-2'nin §2.5'iyle birebir aynı şekil: 10 yeni prompt dosyası (Pareto'nun kalite
çıtasında — fishbone/why-why-tree için §2.2'nin ek disiplini dahil), 10 `index.ts` düzenlemesi,
`npm test`/`cargo test` yeşil + exit code ayrı kontrol, lint/build/clippy/fmt temiz,
`gen-a3-fixture.ts` yeniden çalıştırılmaz (bu dilim de `buildA3Layout`'a dokunmuyor — grep ile
doğrula; `fishbone` fixture'da zaten yer alıyor ama yalnızca opak `spec`/metin üzerinden,
`aiProposal` alanı fixture'ı etkilemez, D-180'in kendi emsali).

---

## 3. Kapsam dışı

J3-4..J3-7 (Adım 5-8'in geri kalan 22 method'u — yeni numaralandırma, bkz.
`J3-prompt-kutuphanesi-genelleme.md`'nin 2026-09-02 güncellemesi), fotoğraf-taşıyan method'lar,
`generic-text`, Critique/Extract/Review modları, §8.10/§8.12, P-39/P-47/P-48/P-49/P-50/P-51/P-52
— hiçbiri dokunulmuyor. Tam liste: `J3-prompt-kutuphanesi-genelleme.md` §3.

**P-39'a özellikle dikkat**: `why-why-tree`'nin node-seviyeli referans mimarisi (D-185, bir
`EntryReference`'ın `targetNodeId?` ile tek bir düğüme işaret edebilmesi) hâlâ P-39 olarak açık
— bu dilim `why-why-tree`'ye `aiProposal` eklemekle P-39'u **açmıyor da kapatmıyor da**, ikisi
ortogonal (J1'in kendi bulgusu, referans taşıyan method'ların `aiProposal` almasını
engellemediği).

---

## 4. Kapanış

`DECISIONS.md`'ye bir sonraki D-numarası, `J3-prompt-kutuphanesi-genelleme.md`'nin §2.2
tablosundaki J3-3 satırı "BİTTİ" olarak güncellenir, `docs/oturumlar/README.md`'nin J3 satırı
güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir, **J3-4'ün kendi launch prompt'u**
yazılır (Adım 5, 7 method — `cost-approval`/`countermeasure`/`error-proofing-hierarchy`/
`impact-effort-matrix`/`side-effect-risk-assessment`/`trial-plan`/`weighted-decision-matrix`).

**Model önerisi:** Mimari karar yok — Sonnet 5 yeterli. Ama bu dilimin prompt KALİTESİ diğer
ikisinden daha zor: fishbone/why-why-tree'nin id/parentId tutarlılığı ve "sebep zinciri icat
etme" disiplini gerçek dikkat ister, kısaltılmamalı.
