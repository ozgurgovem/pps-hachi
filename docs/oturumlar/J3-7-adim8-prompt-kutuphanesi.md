# OTURUM Faz 9 — J3-7: Prompt kütüphanesi, Adım 8 (5 method) — J3'ün SON dilimi

> J3-1 (Adım 1, 9 method, D-206), J3-2 (Adım 2, 9 method, D-207), J3-3 (Adım 3+4 birleşik,
> 10 method, D-208), J3-4 (Adım 5, 7 method, D-209), J3-5 (Adım 6, 5 method, D-210) ve J3-6
> (Adım 7, 5 method, D-211) BİTTİ. Bu dilim, `J3-prompt-kutuphanesi-genelleme.md`'nin §2.2
> tablosundaki yedi dilimlik planın **sonuncusu** — Adım 8'in 5 method'u. **J3-7 bitince J3'ün
> tam yedi dilimlik planı TAMAMEN kapanmış olur** — J3'ün kendisi de Faz 9'un üç dilimlik
> planının (J1/J2/J3) son parçasıdır. Bu dosya **KISA** — envanteri/deseni yeniden üretmiyor,
> doğrudan `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'ye referans veriyor (Madde 1 —
> aynı işi iki kez yapma). Yeni bir mekanizma YOK; J3-1..J3-6'nın yaptığının aynısı, bir adım
> öteye.
>
> Kanonik konum: `docs/oturumlar/J3-7-adim8-prompt-kutuphanesi.md`. Yazıldı: 2026-09-05, J3-6'nın
> kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md \
      docs/oturumlar/J3-6-adim7-prompt-kutuphanesi.md \
      src/ai/prompts/7/kpi-strip.v1.md \
      src/methods/documentUpdatesTracker/schema.ts \
      src/methods/lessonsLearned/schema.ts \
      src/methods/openItemsNextProblem/schema.ts \
      src/methods/sustainPlan/schema.ts \
      src/methods/yokotenTracker/schema.ts
```

Hepsi var olmalı; eksik/adı değişmiş bir tane varsa **DUR ve Barış'a söyle**.

Ayrıca gerçek koda karşı yeniden doğrula (registry J3-6'dan beri değişmiş olabilir):

```bash
grep -rln "aiProposal:" src/methods/*/index.ts
```

**Beklenen: tam olarak 46 dosya** — `pareto` (J1) + J3-1'in 9'u + J3-2'nin 9'u + J3-3'ün 10'u +
J3-4'ün 7'si + J3-5'in 5'i + J3-6'nın 5'i (`kpi-strip`, `realized-cost-benefit`,
`result-verdict`, `statistical-confirmation`, `sustainment-audit`). Farklıysa, J3-6 ile bu
oturum arasında registry değişmiş demektir — `J3-prompt-kutuphanesi-genelleme.md`'nin §2.1
envanterini o zaman yeniden çıkar, körü körüne aşağıdaki listeye güvenme.

Ayrıca şunu da doğrula — bu dilimin beş method'unun HİÇBİRİ henüz `aiProposal` taşımamalı:

```bash
for m in documentUpdatesTracker lessonsLearned openItemsNextProblem sustainPlan yokotenTracker; do
  grep -n "aiProposal" "src/methods/$m/index.ts" && echo "UYARI: $m zaten aiProposal taşıyor";
done
```

Hiçbir satır dönmemeli (grep'in kendisi eşleşme yoksa sessizce başarısız döner, bu beklenen).

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'nin **tamamı** — özellikle §2.0 (neden
   yeni mekanizma yok), §2.1'in Adım 8 satırı ("Hangi dokümanların güncellenmesi gerektiğini
   öner. Read-across adayları öner. Lessons-learned taslağı çıkar."), §2.3 (J3-1'in kendi
   üç-adımlık kalıbı), §2.4 (test stratejisi — TEK registry-geneli değişmez, zaten yazıldı, bu
   dilim yalnızca genişletiyor).
3. `DECISIONS.md` **D-206** (J3-1), **D-207** (J3-2), **D-208** (J3-3), **D-209** (J3-4),
   **D-210** (J3-5) ve **D-211** (J3-6, bu dilimin bir önceki kaydı).
4. `src/ai/prompts/2/pareto.v1.md` (kalıp) ve `src/ai/prompts/6/implementation-issues-log.v1.md`
   (satır-tabanlı bir şemanın nasıl yazıldığını görmek için — bu dilimin dört method'u
   `RowTableEditor`/`FieldFormEditor` tabanlı, `document-updates-tracker` hariç, o kendi sabit-
   kategori formuyla `tpm-loss-taxonomy`'ye (J3-1) daha yakın).
5. Adım 8'in gerçek 5 method'unun `schema.ts`'leri (ve `documentUpdatesTracker`'ın kendi
   sabit-kategori alan yapısını görmek için ilgili sabit-liste dosyası) — §0'da listelendi,
   dosya başına oku.

---

## 2. Kapsam — Adım 8, 5 method

`document-updates-tracker`, `lessons-learned`, `open-items-next-problem`, `sustain-plan`,
`yokoten-tracker`. Tam gerekçe/dışlama kararları için `J3-prompt-kutuphanesi-genelleme.md`
§2.1'e bak — burada tekrar edilmiyor.

Her method için, J3-1'in §2.3'ündeki üç adım aynen:

1. `src/ai/prompts/8/{methodId}.v1.md` yaz — front-matter `pareto.v1.md`'nin şeklini izler
   (`mode: draft`, `methodId`, `step: 8`, `version: v1`, `outputSchema: {methodId}`,
   `contextSlices: []`). Şemasının her alanı için somut rehberlik — kopyalama, her method'un
   kendi `schema.ts`'ini gerçekten oku.
2. `src/methods/{methodId}/index.ts`'e `aiProposal: { promptVersion: "v1" }` ekle.
3. i18n'e dokunma (J1'in kendi bulgusu hâlâ geçerli).

### 2.1 Bu dilimin kendi dikkat noktası — `document-updates-tracker`'ın sabit-kategori şekli

`document-updates-tracker` (D-183, Oturum C4) `documentUpdatesTracker`'ın kendi şemasını oku —
D-122'nin (`tpmLossTaxonomy`) sabit-kategori desenini bir katman daha zengin uyguluyor: yedi
sabit doküman tipinin her biri kendi dokuz-alanlı `FieldFormValues` kaydını taşıyor. Prompt bu
yedi tipin HER birini ayrı ayrı ele almalı — kaynak veri hangi doküman tiplerinden bahsediyorsa
yalnızca onların alanlarını doldur, bahsetmeyeni tamamen boş bırak (bir alt-bölümü hiç doldurma,
D-183'ün kendi "her alan boşsa o doküman tipinin alt-bölümünü tamamen atla" ilkesi burada da
geçerli). `lessons-learned` (`FieldFormEditor`, sekiz sabit alan) ve `open-items-next-problem`
(`RowTableEditor`, satır listesi) J3-1/J3-5'in kendi fieldForm/rowTable emsaliyle aynı desende.
`sustain-plan` ve `yokoten-tracker`'ın kendi `Status`/`Approval`/Yes-No alan setlerini
`shared/documentStatusOptions.ts`'ten (D-183) miras aldığını unutma — bu ortak sözlüğün gerçek
değerlerini (`planned`/`inProgress`/`done` vb., dosyayı aç ve gerçek değerlerle yaz) kullan,
uydurma.

Hiçbiri referans rolü taşımıyor (`registry.test.ts`'in "reference roles" bloğuna bak — bu
beşinin hiçbiri o listede değil), o yüzden J3-4/J3-5'in referans-alanına-değinmeme dikkat
noktası bu dilimde YOK.

### Test

`registry.test.ts`'in `describe("MethodPlugin.aiProposal across the registry")` bloğu
**J3-1'de yazıldı, jeneriktir, hiçbir değişiklik gerekmiyor** — 5 yeni method `aiProposal`
kazandığı an mevcut testler onları otomatik kapsar. Tek elle-yapılacak iş (J3-2..J3-6'nın kendi
emsali): `it("has at least the methods ... shipped")` testinin adını "...J3-7" olarak
güncellemek ve `arrayContaining` listesine bu dilimden bir-iki method eklemek istiyorsan eklemek
(zorunlu değil). **Mutation-check unutma** — bir method'un `promptVersion`'ını bilerek yanlış
yap, test KIRMIZI olduğunu doğrula, geri al, tekrar YEŞİL doğrula.

### Done-koşulu

J3-1..J3-6'nın §2.5'iyle birebir aynı şekil: 5 yeni prompt dosyası (Pareto'nun kalite
çıtasında), 5 `index.ts` düzenlemesi, `npm test`/`cargo test` yeşil + exit code ayrı kontrol
edilir (D-143'ün kendi dersi — `tail`'e pipe'lamadan), lint/build/clippy/fmt hepsi temiz (bu
dilim Rust'a HİÇ dokunmuyor — `git status src-tauri/` boş dönmeli), `gen-a3-fixture.ts`
yeniden çalıştırılmaz (bu dilim de `buildA3Layout`'a/template stiline/`A3ImageKind`'a
dokunmuyor — grep ile doğrula).

**Ek kapanış işi (yalnızca bu dilimde, çünkü J3'ün SONUNCUSU):**
`docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'nin §2.2 tablosundaki J3-7 satırı "BİTTİ"
olarak güncellenince, **J3'ün yedi dilimlik planının TAMAMI kapanmış olur** — bu açıkça not
edilmeli. Ayrıca Faz 9'un kendisinin üç dilimlik planı (J1/J2/J3) da bu noktada TAMAMEN
kapanmış olur — `CLAUDE.md`'nin Current state'ine bu üst-seviye kapanış da yazılmalı, yalnızca
J3-7'nin kendi özeti değil. Faz 9'dan sonra hangi fazın (Faz 10, SPEC.md §6) sırada olduğunu
`SPEC.md`'den doğrula ve bir sonraki oturumun ne olacağına dair kısa bir not bırak — ama Faz
10'un kendi kapsamını bu dilimde TASARLAMA, yalnızca ismini/konumunu doğrula.

---

## 3. Kapsam dışı

Fotoğraf-taşıyan method'lar, `generic-text`, Critique/Extract/Review modları, §8.10/§8.12,
P-39/P-47/P-48/P-49/P-50/P-51/P-52 — hiçbiri dokunulmuyor. Tam liste:
`J3-prompt-kutuphanesi-genelleme.md` §3.

---

## 4. Kapanış

`DECISIONS.md`'ye bir sonraki D-numarası, `J3-prompt-kutuphanesi-genelleme.md`'nin §2.2
tablosundaki J3-7 satırı "BİTTİ" olarak güncellenir (ve J3'ün TAMAMININ bittiği açıkça not
edilir), `docs/oturumlar/README.md`'nin J3 satırı güncellenir, `CLAUDE.md`'nin Current
state'ine hem J3-7'nin hem Faz 9'un TAMAMININ kapandığı özetlenir. Faz 10'un kendi launch
prompt'u bu dilimde yazılmaz — Faz 10 kendi kapsam-belirleme oturumunu hak eder (J3'ün kendisi
gibi, ya da Faz 8/9'un `faz8-kapsam-belirleme.md`/`faz9-kapsam-belirleme.md` emsali gibi).

**Model önerisi:** Mimari karar yok — Sonnet 5 yeterli. Tek dikkat noktası
`document-updates-tracker`'ın yedi sabit doküman tipinin her birini ayrı ayrı, yalnızca
kaynağın gerçekten bahsettiği kadarını doldurarak yazmak.
