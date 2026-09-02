# OTURUM Faz 9 — J3-4: Prompt kütüphanesi, Adım 5 (7 method)

> J3-1 (Adım 1, 9 method, D-206), J3-2 (Adım 2, 9 method, D-207) ve J3-3 (Adım 3+4 birleşik,
> 10 method, D-208) BİTTİ. Bu dilim, `J3-prompt-kutuphanesi-genelleme.md`'nin §2.2 tablosundaki
> yedi dilimlik plandan dördüncüsü — Adım 5'in 7 method'u. Bu dosya **KISA** — envanteri/deseni
> yeniden üretmiyor, doğrudan `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'ye referans
> veriyor (Madde 1 — aynı işi iki kez yapma). Yeni bir mekanizma YOK; J3-1/J3-2/J3-3'ün yaptığının
> aynısı, bir adım öteye.
>
> Kanonik konum: `docs/oturumlar/J3-4-adim5-prompt-kutuphanesi.md`. Yazıldı: 2026-09-02, J3-3'ün
> kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md \
      docs/oturumlar/J3-3-adim3-4-prompt-kutuphanesi.md \
      src/ai/prompts/4/fishbone.v1.md \
      src/ai/prompts/4/why-why-tree.v1.md \
      src/methods/costApproval/schema.ts \
      src/methods/countermeasure/schema.ts \
      src/methods/errorProofingHierarchy/schema.ts \
      src/methods/impactEffortMatrix/schema.ts \
      src/methods/sideEffectRiskAssessment/schema.ts \
      src/methods/trialPlan/schema.ts \
      src/methods/weightedDecisionMatrix/schema.ts
```

Hepsi var olmalı; eksik/adı değişmiş bir tane varsa **DUR ve Barış'a söyle**.

Ayrıca gerçek koda karşı yeniden doğrula (registry J3-3'ten beri değişmiş olabilir):

```bash
grep -rln "aiProposal:" src/methods/*/index.ts
```

**Beklenen: tam olarak 29 dosya** — `pareto` (J1) + J3-1'in 9'u + J3-2'nin 9'u + J3-3'ün 10'u
(`smart-target`, `cause-effect-matrix`, `comparative-analysis`, `fault-tree`, `fishbone`,
`five-why`, `hypothesis-verification`, `pfmea-linkage`, `three-legged-five-why`,
`why-why-tree`). Farklıysa, J3-3 ile bu oturum arasında registry değişmiş demektir —
`J3-prompt-kutuphanesi-genelleme.md`'nin §2.1 envanterini o zaman yeniden çıkar, körü körüne
aşağıdaki listeye güvenme.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'nin **tamamı** — özellikle §2.0 (neden
   yeni mekanizma yok), §2.1'in Adım 5 satırı ("Doğrulanmış her kök nedene karşı countermeasure
   öner, error-proofing hiyerarşisinde sınıflandır."), §2.3 (J3-1'in kendi üç-adımlık kalıbı),
   §2.4 (test stratejisi — TEK registry-geneli değişmez, zaten yazıldı, bu dilim yalnızca
   genişletiyor).
3. `DECISIONS.md` **D-206** (J3-1), **D-207** (J3-2) ve **D-208** (J3-3, + bu dilimin bir
   önceki kaydı).
4. `src/ai/prompts/2/pareto.v1.md` (kalıp) ve J3-3'ün `src/ai/prompts/4/fishbone.v1.md` +
   `hypothesis-verification.v1.md`'sinden en az biri — referans rolü taşıyan bir method'un
   prompt'unun nasıl yazıldığını görmek için (bu dilimde `hypothesis-verification`,
   `countermeasure`, `error-proofing-hierarchy`, `side-effect-risk-assessment` referans rolü
   taşıyor, bkz. §2.1 aşağıda).
5. Adım 5'in gerçek 7 method'unun `schema.ts`'leri — §0'da listelendi, dosya başına oku.

---

## 2. Kapsam — Adım 5, 7 method

`cost-approval`, `countermeasure`, `error-proofing-hierarchy`, `impact-effort-matrix`,
`side-effect-risk-assessment`, `trial-plan`, `weighted-decision-matrix`. Tam gerekçe/dışlama
kararları için `J3-prompt-kutuphanesi-genelleme.md` §2.1'e bak — burada tekrar edilmiyor.

Her method için, J3-1'in §2.3'ündeki üç adım aynen:

1. `src/ai/prompts/5/{methodId}.v1.md` yaz — front-matter `pareto.v1.md`'nin şeklini izler
   (`mode: draft`, `methodId`, `step: 5`, `version: v1`, `outputSchema: {methodId}`,
   `contextSlices: []`). Şemasının her alanı için somut rehberlik — kopyalama, her method'un
   kendi `schema.ts`'ini gerçekten oku.
2. `src/methods/{methodId}/index.ts`'e `aiProposal: { promptVersion: "v1" }` ekle.
3. i18n'e dokunma (J1'in kendi bulgusu hâlâ geçerli).

### 2.1 Bu dilimin kendi dikkat noktası — dört method referans taşıyor

`hypothesis-verification` (Adım 4'te, `pointOfCause` rolüyle hedef), `countermeasure`
(`rootCause` rolüyle referrer, çoklu), `error-proofing-hierarchy` ve
`side-effect-risk-assessment` (ikisi de aynı adımdaki bir `countermeasure`'a referans veren
istisnai same-step referrer'lar, D-139) — bunların `aiProposal`'ı `referenceRoles`'tan
BAĞIMSIZ (J1'in kendi bulgusu: ikisi ortogonal, `EntryProposalField` ve `EntryReferenceField`
`EntryEditorDialog` içinde yan yana render ediliyor). Prompt metninde referans alanına
dokunma — model yalnızca kendi `payload`'ını dolduruyor, hangi entry'e referans vereceğine
insan `EntryReferenceField`'dan karar veriyor.

`countermeasure`'ın kendi Uygulama Planı önceliklendirme tablosu (D-191, 1-5 favorability
skorları + `priorityDecision`) da bu method'un şemasında — `priorityDecision`
(pending/pursue/abandon) SPEC'in "a human always decides" ilkesine göre **asla modelin
önerisi olmamalı**; ya alan boş bırakılır ya da prompt bunu açıkça modele söyler (öner ama
karar verme).

### Test

`registry.test.ts`'in `describe("MethodPlugin.aiProposal across the registry")` bloğu
**J3-1'de yazıldı, jeneriktir, hiçbir değişiklik gerekmiyor** — 7 yeni method `aiProposal`
kazandığı an mevcut testler onları otomatik kapsar. Tek elle-yapılacak iş (J3-2/J3-3'ün kendi
emsali): `it("has at least the methods J1/J3-1/J3-2/J3-3/... shipped")` testindeki
`arrayContaining` listesine bu dilimden bir-iki method eklemek istiyorsan ekle (zorunlu
değil). **Mutation-check unutma** — bir method'un `promptVersion`'ını bilerek yanlış yap, test
KIRMIZI olduğunu doğrula, geri al, tekrar YEŞİL doğrula.

### Done-koşulu

J3-1/J3-2/J3-3'ün §2.5'iyle birebir aynı şekil: 7 yeni prompt dosyası (Pareto'nun kalite
çıtasında), 7 `index.ts` düzenlemesi, `npm test`/`cargo test` yeşil + exit code ayrı kontrol,
lint/build/clippy/fmt temiz, `gen-a3-fixture.ts` yeniden çalıştırılmaz (bu dilim de
`buildA3Layout`'a dokunmuyor — grep ile doğrula).

---

## 3. Kapsam dışı

J3-5..J3-7 (Adım 6-8'in geri kalan 15 method'u), fotoğraf-taşıyan method'lar, `generic-text`,
Critique/Extract/Review modları, §8.10/§8.12, P-39/P-47/P-48/P-49/P-50/P-51/P-52 — hiçbiri
dokunulmuyor. Tam liste: `J3-prompt-kutuphanesi-genelleme.md` §3.

---

## 4. Kapanış

`DECISIONS.md`'ye bir sonraki D-numarası, `J3-prompt-kutuphanesi-genelleme.md`'nin §2.2
tablosundaki J3-4 satırı "BİTTİ" olarak güncellenir, `docs/oturumlar/README.md`'nin J3 satırı
güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir, **J3-5'in kendi launch prompt'u**
yazılır (Adım 6, 5 method — `action-item`/`ica-pca-transition`/`implementation-issues-log`/
`training-communication-record`/`trial-result-log`).

**Model önerisi:** Mimari karar yok — Sonnet 5 yeterli. Referans taşıyan dört method'un
prompt'unu referans alanına hiç değinmeden, yalnızca kendi payload'ına odaklı yazmaya dikkat
et.
