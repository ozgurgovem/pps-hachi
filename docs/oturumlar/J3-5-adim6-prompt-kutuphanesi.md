# OTURUM Faz 9 — J3-5: Prompt kütüphanesi, Adım 6 (5 method)

> J3-1 (Adım 1, 9 method, D-206), J3-2 (Adım 2, 9 method, D-207), J3-3 (Adım 3+4 birleşik,
> 10 method, D-208) ve J3-4 (Adım 5, 7 method, D-209) BİTTİ. Bu dilim, `J3-prompt-kutuphanesi-
> genelleme.md`'nin §2.2 tablosundaki yedi dilimlik plandan beşincisi — Adım 6'nın 5 method'u.
> Bu dosya **KISA** — envanteri/deseni yeniden üretmiyor, doğrudan `docs/oturumlar/
> J3-prompt-kutuphanesi-genelleme.md`'ye referans veriyor (Madde 1 — aynı işi iki kez yapma).
> Yeni bir mekanizma YOK; J3-1/J3-2/J3-3/J3-4'ün yaptığının aynısı, bir adım öteye.
>
> Kanonik konum: `docs/oturumlar/J3-5-adim6-prompt-kutuphanesi.md`. Yazıldı: 2026-09-02, J3-4'ün
> kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md \
      docs/oturumlar/J3-4-adim5-prompt-kutuphanesi.md \
      src/ai/prompts/5/countermeasure.v1.md \
      src/methods/actionItem/schema.ts \
      src/methods/icaPcaTransition/schema.ts \
      src/methods/implementationIssuesLog/schema.ts \
      src/methods/trainingCommunicationRecord/schema.ts \
      src/methods/trialResultLog/schema.ts
```

Hepsi var olmalı; eksik/adı değişmiş bir tane varsa **DUR ve Barış'a söyle**.

Ayrıca gerçek koda karşı yeniden doğrula (registry J3-4'ten beri değişmiş olabilir):

```bash
grep -rln "aiProposal:" src/methods/*/index.ts
```

**Beklenen: tam olarak 36 dosya** — `pareto` (J1) + J3-1'in 9'u + J3-2'nin 9'u + J3-3'ün 10'u +
J3-4'ün 7'si (`cost-approval`, `countermeasure`, `error-proofing-hierarchy`,
`impact-effort-matrix`, `side-effect-risk-assessment`, `trial-plan`,
`weighted-decision-matrix`). Farklıysa, J3-4 ile bu oturum arasında registry değişmiş demektir —
`J3-prompt-kutuphanesi-genelleme.md`'nin §2.1 envanterini o zaman yeniden çıkar, körü körüne
aşağıdaki listeye güvenme.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'nin **tamamı** — özellikle §2.0 (neden
   yeni mekanizma yok), §2.1'in Adım 6 satırı ("Kabul edilen countermeasure'lardan action plan
   taslağı çıkar. Eksik owner/tarih işaretle."), §2.3 (J3-1'in kendi üç-adımlık kalıbı), §2.4
   (test stratejisi — TEK registry-geneli değişmez, zaten yazıldı, bu dilim yalnızca
   genişletiyor).
3. `DECISIONS.md` **D-206** (J3-1), **D-207** (J3-2), **D-208** (J3-3) ve **D-209** (J3-4, + bu
   dilimin bir önceki kaydı).
4. `src/ai/prompts/2/pareto.v1.md` (kalıp) ve J3-4'ün `src/ai/prompts/5/countermeasure.v1.md`
   (referans rolü taşıyan bir method'un prompt'unun referans alanına hiç değinmeden nasıl
   yazıldığını görmek için — bu dilimde `action-item` ve `ica-pca-transition` referans rolü
   taşıyor, bkz. §2.1 aşağıda).
5. Adım 6'nın gerçek 5 method'unun `schema.ts`'leri — §0'da listelendi, dosya başına oku.

---

## 2. Kapsam — Adım 6, 5 method

`action-item`, `ica-pca-transition`, `implementation-issues-log`,
`training-communication-record`, `trial-result-log`. Tam gerekçe/dışlama kararları için
`J3-prompt-kutuphanesi-genelleme.md` §2.1'e bak — burada tekrar edilmiyor.

Her method için, J3-1'in §2.3'ündeki üç adım aynen:

1. `src/ai/prompts/6/{methodId}.v1.md` yaz — front-matter `pareto.v1.md`'nin şeklini izler
   (`mode: draft`, `methodId`, `step: 6`, `version: v1`, `outputSchema: {methodId}`,
   `contextSlices: []`). Şemasının her alanı için somut rehberlik — kopyalama, her method'un
   kendi `schema.ts`'ini gerçekten oku.
2. `src/methods/{methodId}/index.ts`'e `aiProposal: { promptVersion: "v1" }` ekle.
3. i18n'e dokunma (J1'in kendi bulgusu hâlâ geçerli).

### 2.1 Bu dilimin kendi dikkat noktası — iki method referans taşıyor, biri ÇİFT rol

`action-item` (`countermeasure` rolüyle referrer) ve `ica-pca-transition` (registry'nin TEK
iki-rollü method'u — hem `containment` hem `countermeasure`'a referans verir, D-149'un Oturum
B1 kaydı) — bunların `aiProposal`'ı `referenceRoles`'tan BAĞIMSIZ (J1'in kendi bulgusu, J3-4'te
dördüncü/beşinci kez doğrulandı: ikisi ortogonal, `EntryProposalField` ve `EntryReferenceField`
`EntryEditorDialog` içinde yan yana render ediliyor). Prompt metninde referans alanına dokunma
— model yalnızca kendi `payload`'ını dolduruyor, hangi entry'e referans vereceğine insan
`EntryReferenceField`'dan karar veriyor. `ica-pca-transition` özellikle dikkat ister: iki ayrı
referans rolü taşısa da, bunların ikisi de bu method'un kendi `payload` alanlarının PARÇASI
DEĞİL — prompt yalnızca payload'ın kendi alanlarına odaklanmalı.

`action-item`'ın kendi şeması (`action`/`owner`/`startDate`/`dueDate`/`percentComplete`/
`evidence`/`customerApproval`) ayrı bir discrete `status` alanı taşımıyor (D-180: P-37'nin
şekil-kodlu durum işaretçisi bilinçli olarak `action-item`'a uygulanmadı, "eşlenecek net bir
sözlük yok" gerekçesiyle) — `percentComplete` serbest metin, bir yüzde sayısı VEYA kısa bir
durum ifadesi olabilir; kaynak veri neyi destekliyorsa onu yaz, uydurma bir yüzde icat etme.

### Test

`registry.test.ts`'in `describe("MethodPlugin.aiProposal across the registry")` bloğu
**J3-1'de yazıldı, jeneriktir, hiçbir değişiklik gerekmiyor** — 5 yeni method `aiProposal`
kazandığı an mevcut testler onları otomatik kapsar. Tek elle-yapılacak iş (J3-2/J3-3/J3-4'ün
kendi emsali): `it("has at least the methods ... shipped")` testindeki `arrayContaining`
listesine bu dilimden bir-iki method eklemek istiyorsan ekle (zorunlu değil). **Mutation-check
unutma** — bir method'un `promptVersion`'ını bilerek yanlış yap, test KIRMIZI olduğunu
doğrula, geri al, tekrar YEŞİL doğrula.

### Done-koşulu

J3-1/J3-2/J3-3/J3-4'ün §2.5'iyle birebir aynı şekil: 5 yeni prompt dosyası (Pareto'nun kalite
çıtasında), 5 `index.ts` düzenlemesi, `npm test`/`cargo test` yeşil + exit code ayrı kontrol
edilir, lint/build/clippy/fmt hepsi temiz (bu dilim Rust'a HİÇ dokunmuyor —
`git status src-tauri/` boş dönmeli), `gen-a3-fixture.ts` yeniden çalıştırılmaz (bu dilim de
`buildA3Layout`'a dokunmuyor — grep ile doğrula).

---

## 3. Kapsam dışı

J3-6/J3-7 (Adım 7-8'in geri kalan 10 method'u), fotoğraf-taşıyan method'lar (`before-after-
photos` Adım 6'da ama bu dilimin kapsamı dışında — §2.1'in kendi dışlama kararı,
`J3-prompt-kutuphanesi-genelleme.md`'ye bak), `generic-text`, Critique/Extract/Review modları,
§8.10/§8.12, P-39/P-47/P-48/P-49/P-50/P-51/P-52 — hiçbiri dokunulmuyor. Tam liste:
`J3-prompt-kutuphanesi-genelleme.md` §3.

---

## 4. Kapanış

`DECISIONS.md`'ye bir sonraki D-numarası, `J3-prompt-kutuphanesi-genelleme.md`'nin §2.2
tablosundaki J3-5 satırı "BİTTİ" olarak güncellenir, `docs/oturumlar/README.md`'nin J3 satırı
güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir, **J3-6'nın kendi launch prompt'u**
yazılır (Adım 7, 5 method — `kpi-strip` zaten kendi `aiProposal`'ını taşımıyor, kontrol et;
`realized-cost-benefit`/`result-verdict`/`statistical-confirmation`/`sustainment-audit`).

**Model önerisi:** Mimari karar yok — Sonnet 5 yeterli. Tek dikkat noktası `ica-pca-transition`'ın
çift referans rolünü prompt metnine hiç sızdırmadan yazmak.
