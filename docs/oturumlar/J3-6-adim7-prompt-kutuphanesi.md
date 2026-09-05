# OTURUM Faz 9 — J3-6: Prompt kütüphanesi, Adım 7 (5 method)

> J3-1 (Adım 1, 9 method, D-206), J3-2 (Adım 2, 9 method, D-207), J3-3 (Adım 3+4 birleşik,
> 10 method, D-208), J3-4 (Adım 5, 7 method, D-209) ve J3-5 (Adım 6, 5 method, D-210) BİTTİ. Bu
> dilim, `J3-prompt-kutuphanesi-genelleme.md`'nin §2.2 tablosundaki yedi dilimlik plandan
> altıncısı — Adım 7'nin 5 method'u. Bu dosya **KISA** — envanteri/deseni yeniden üretmiyor,
> doğrudan `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'ye referans veriyor (Madde 1 —
> aynı işi iki kez yapma). Yeni bir mekanizma YOK; J3-1..J3-5'in yaptığının aynısı, bir adım
> öteye.
>
> Kanonik konum: `docs/oturumlar/J3-6-adim7-prompt-kutuphanesi.md`. Yazıldı: 2026-09-05, J3-5'in
> kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md \
      docs/oturumlar/J3-5-adim6-prompt-kutuphanesi.md \
      src/ai/prompts/6/action-item.v1.md \
      src/methods/kpiStrip/schema.ts \
      src/methods/realizedCostBenefit/schema.ts \
      src/methods/resultVerdict/schema.ts \
      src/methods/statisticalConfirmation/schema.ts \
      src/methods/sustainmentAudit/schema.ts
```

Hepsi var olmalı; eksik/adı değişmiş bir tane varsa **DUR ve Barış'a söyle**.

Ayrıca gerçek koda karşı yeniden doğrula (registry J3-5'ten beri değişmiş olabilir):

```bash
grep -rln "aiProposal:" src/methods/*/index.ts
```

**Beklenen: tam olarak 41 dosya** — `pareto` (J1) + J3-1'in 9'u + J3-2'nin 9'u + J3-3'ün 10'u +
J3-4'ün 7'si + J3-5'in 5'i (`action-item`, `ica-pca-transition`, `implementation-issues-log`,
`training-communication-record`, `trial-result-log`). Farklıysa, J3-5 ile bu oturum arasında
registry değişmiş demektir — `J3-prompt-kutuphanesi-genelleme.md`'nin §2.1 envanterini o zaman
yeniden çıkar, körü körüne aşağıdaki listeye güvenme.

Ayrıca şunu da doğrula — bu dilimin beş method'unun HİÇBİRİ henüz `aiProposal` taşımamalı:

```bash
for m in kpiStrip realizedCostBenefit resultVerdict statisticalConfirmation sustainmentAudit; do
  grep -n "aiProposal" "src/methods/$m/index.ts" && echo "UYARI: $m zaten aiProposal taşıyor";
done
```

Hiçbir satır dönmemeli (grep'in kendisi eşleşme yoksa sessizce başarısız döner, bu beklenen).

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'nin **tamamı** — özellikle §2.0 (neden
   yeni mekanizma yok), §2.1'in Adım 7 satırı ("Öncesi/sonrası veriyi analiz et, doğru kontrolü
   çalıştır, dürüst bir verdict ver."), §2.3 (J3-1'in kendi üç-adımlık kalıbı), §2.4 (test
   stratejisi — TEK registry-geneli değişmez, zaten yazıldı, bu dilim yalnızca genişletiyor).
3. `DECISIONS.md` **D-206** (J3-1), **D-207** (J3-2), **D-208** (J3-3), **D-209** (J3-4) ve
   **D-210** (J3-5, + bu dilimin bir önceki kaydı).
4. `src/ai/prompts/2/pareto.v1.md` (kalıp — sayısal/chart-üreten bir şema için) ve
   `src/ai/prompts/6/ica-pca-transition.v1.md` (3-değerli bir lifecycle enum'unun kararsızlıkta
   hangi değere düştüğünün nasıl gerekçelendirildiğini görmek için — bu dilimde `result-verdict`
   de benzer bir "dürüst, aşırı-güvenli olmayan verdict" alanı taşıyor).
5. Adım 7'nin gerçek 5 method'unun `schema.ts`'leri — §0'da listelendi, dosya başına oku.

---

## 2. Kapsam — Adım 7, 5 method

`kpi-strip`, `realized-cost-benefit`, `result-verdict`, `statistical-confirmation`,
`sustainment-audit`. Tam gerekçe/dışlama kararları için `J3-prompt-kutuphanesi-genelleme.md`
§2.1'e bak — burada tekrar edilmiyor.

Her method için, J3-1'in §2.3'ündeki üç adım aynen:

1. `src/ai/prompts/7/{methodId}.v1.md` yaz — front-matter `pareto.v1.md`'nin şeklini izler
   (`mode: draft`, `methodId`, `step: 7`, `version: v1`, `outputSchema: {methodId}`,
   `contextSlices: []`). Şemasının her alanı için somut rehberlik — kopyalama, her method'un
   kendi `schema.ts`'ini gerçekten oku.
2. `src/methods/{methodId}/index.ts`'e `aiProposal: { promptVersion: "v1" }` ekle.
3. i18n'e dokunma (J1'in kendi bulgusu hâlâ geçerli).

### 2.1 Bu dilimin kendi dikkat noktası — `kpi-strip` bir chart-üreten method, diğer dördü değil

`kpi-strip` (D-177/D-182) `KpiStripChartSpec`'in `items[]` listesini (her biri
`label`/`baseline`/`target`/`actual`/`status`/`sustain?`/`result?`) üretiyor — Pareto'nun
kendi "sayısal kategori listesi öner" desenine yakın, ama `status` alanı (3-değerli, D-193'ün
manuel-durum ilkesi: `onTarget`/`inProgress`/`behind`, hiçbiri hesaplanmıyor) prompt'ta açıkça
ele alınmalı. Diğer dört method (`realized-cost-benefit`, `result-verdict`,
`statistical-confirmation`, `sustainment-audit`) fieldForm/rowTable şekilli, J3-5'in
`cost-approval`/`action-item` emsaliyle aynı desende yazılabilir. `result-verdict`'in kendi
`verdict` alanı (pending/met/partiallyMet/notMet, D-192) SPEC §8.6'nın "dürüst bir verdict ver"
cümlesinin doğrudan karşılığı — Pareto'nun "boş liste, uydurulmuş veriden iyidir" ilkesi burada
"belirsiz verdict, aşırı-iyimser bir verdict'ten iyidir" olarak uygulanmalı: kaynak veri açıkça
"karşılandı" demiyorsa `"met"` yazma.

Hiçbiri referans rolü taşımıyor (`registry.test.ts`'in "reference roles" bloğuna bak — bu
beşinin hiçbiri o listede değil), o yüzden J3-4/J3-5'in referans-alanına-değinmeme dikkat
noktası bu dilimde YOK.

### Test

`registry.test.ts`'in `describe("MethodPlugin.aiProposal across the registry")` bloğu
**J3-1'de yazıldı, jeneriktir, hiçbir değişiklik gerekmiyor** — 5 yeni method `aiProposal`
kazandığı an mevcut testler onları otomatik kapsar. Tek elle-yapılacak iş (J3-2..J3-5'in kendi
emsali): `it("has at least the methods ... shipped")` testinin adını "...J3-6" olarak
güncellemek ve `arrayContaining` listesine bu dilimden bir-iki method eklemek istiyorsan eklemek
(zorunlu değil). **Mutation-check unutma** — bir method'un `promptVersion`'ını bilerek yanlış
yap, test KIRMIZI olduğunu doğrula, geri al, tekrar YEŞİL doğrula.

### Done-koşulu

J3-1..J3-5'in §2.5'iyle birebir aynı şekil: 5 yeni prompt dosyası (Pareto'nun kalite
çıtasında), 5 `index.ts` düzenlemesi, `npm test`/`cargo test` yeşil + exit code ayrı kontrol
edilir (D-143'ün kendi dersi — `tail`'e pipe'lamadan), lint/build/clippy/fmt hepsi temiz (bu
dilim Rust'a HİÇ dokunmuyor — `git status src-tauri/` boş dönmeli), `gen-a3-fixture.ts`
yeniden çalıştırılmaz (bu dilim de `buildA3Layout`'a dokunmuyor — grep ile doğrula; **istisna
kontrolü**: `kpi-strip` zaten bir `A3ImageKind`/renderer taşıyor, bu dilim yalnızca onun
`aiProposal`'ını ekliyor, kendi renderer'ına dokunmuyor — yine de grep ile doğrula).

---

## 3. Kapsam dışı

J3-7 (Adım 8'in geri kalan 5 method'u), fotoğraf-taşıyan method'lar, `generic-text`,
Critique/Extract/Review modları, §8.10/§8.12, P-39/P-47/P-48/P-49/P-50/P-51/P-52 — hiçbiri
dokunulmuyor. Tam liste: `J3-prompt-kutuphanesi-genelleme.md` §3.

---

## 4. Kapanış

`DECISIONS.md`'ye bir sonraki D-numarası, `J3-prompt-kutuphanesi-genelleme.md`'nin §2.2
tablosundaki J3-6 satırı "BİTTİ" olarak güncellenir, `docs/oturumlar/README.md`'nin J3 satırı
güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir, **J3-7'nin kendi launch prompt'u**
yazılır (Adım 8, 5 method — `document-updates-tracker`/`lessons-learned`/
`open-items-next-problem`/`sustain-plan`/`yokoten-tracker`). J3-7 BİTİNCE **J3'ün yedi dilimlik
planının TAMAMI kapanmış olur** — bu, `J3-prompt-kutuphanesi-genelleme.md`'de açıkça not
edilmeli.

**Model önerisi:** Mimari karar yok — Sonnet 5 yeterli. Tek dikkat noktası `kpi-strip`'in
chart-üreten `items[]` listesini Pareto'nun sayısal-liste desenine doğru şekilde uyarlamak ve
`result-verdict`'in "dürüst verdict" ilkesini aşırı-iyimser bir tahminle karıştırmadan yazmak.
