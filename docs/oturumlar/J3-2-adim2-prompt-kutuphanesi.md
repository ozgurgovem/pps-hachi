# OTURUM Faz 9 — J3-2: Prompt kütüphanesi, Adım 2 (9 method)

> J3-1 (Adım 1, 9 method, D-206) BİTTİ. Bu dosya **KISA** — envanteri/deseni yeniden
> üretmiyor, doğrudan `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'ye referans
> veriyor (Madde 1 — aynı işi iki kez yapma). Yeni bir mekanizma YOK; J3-1'in yaptığının
> aynısı, bir adım öteye.
>
> Kanonik konum: `docs/oturumlar/J3-2-adim2-prompt-kutuphanesi.md`. Yazıldı: 2026-09-01,
> J3-1'in kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md \
      src/ai/prompts/1/gap-statement.v1.md \
      src/methods/pareto/index.ts \
      src/methods/categoryBreakdown/schema.ts \
      src/methods/checkSheet/schema.ts \
      src/methods/distributionChart/schema.ts \
      src/methods/isIsNot/schema.ts \
      src/methods/msaGageRr/schema.ts \
      src/methods/pointOfCause/schema.ts \
      src/methods/processFlowSipoc/schema.ts \
      src/methods/stratificationMatrix/schema.ts \
      src/methods/trend/schema.ts
```

Hepsi var olmalı; eksik/adı değişmiş bir tane varsa **DUR ve Barış'a söyle**.

Ayrıca gerçek koda karşı yeniden doğrula (registry J3-1'den beri değişmiş olabilir):

```bash
grep -rln "aiProposal:" src/methods/*/index.ts
```

**Beklenen: tam olarak 10 dosya** — `pareto` (J1) + J3-1'in 9'u (`gapStatement`,
`fiveG5N1K`, `fiveN1K`, `fiveW2H`, `vocComplaint`, `containmentIca`,
`problemTypeClassifier`, `tpmLossTaxonomy`, `problemImpact`). Farklıysa, J3-1 ile bu
oturum arasında registry değişmiş demektir — `J3-prompt-kutuphanesi-genelleme.md`'nin
§2.1 envanterini o zaman yeniden çıkar, körü körüne aşağıdaki listeye güvenme.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/J3-prompt-kutuphanesi-genelleme.md`'nin **tamamı** — özellikle §2.0
   (neden yeni mekanizma yok), §2.1 (Adım 2'nin kendi SPEC §8.6 satırı: "Read the uploaded
   production/quality data and propose stratification dimensions worth testing. Generate
   Pareto and trend specs from real columns. Name the vital few. Ask the uncomfortable
   question: is this measurement system trustworthy? Challenge a point-of-cause nominated
   without data."), §2.3 (J3-1'in kendi üç-adımlık kalıbı — prompt dosyası yaz / `index.ts`'e
   `aiProposal` ekle / i18n'e dokunma), §2.4 (test stratejisi — TEK registry-geneli
   değişmez, `registry.test.ts`'e zaten J3-1'de eklendi, bu dilim onu SADECE genişletiyor,
   yeni bir test bloğu YAZMIYOR).
3. `DECISIONS.md` **D-206** — J3-1'in tam kaydı, kalite çıtası ve mutation-check disiplini
   dahil.
4. `src/ai/prompts/1/pareto.v1.md`'nin de, J3-1'in dokuz dosyasının da (`src/ai/prompts/1/*.v1.md`)
   herhangi ikisi — kalıbı taklit etmek için (rol çerçevesi paragrafı, "your job" cümlesi,
   şemanın her alanı için somut/halüsinasyon-karşıtı rehberlik, gerekirse sabit-enum/satır-
   tablosu varyasyonları için `problem-type-classifier.v1.md`/`tpm-loss-taxonomy.v1.md`/
   `voc-complaint-record.v1.md`'ye bak).
5. Adım 2'nin gerçek 9 method'unun `schema.ts`'leri — §0'da listelendi, dosya başına oku.

---

## 2. Kapsam — Adım 2, 9 method

`category-breakdown`, `check-sheet`, `distribution-chart`, `is-is-not`, `msa-gage-rr`,
`point-of-cause`, `process-flow-sipoc`, `stratification-matrix`, `trend` (`pareto` J1'de
BİTTİ, bu listede yok). Tam gerekçe/dışlama kararları (fotoğraf-taşıyan method'lar,
`generic-text`) için `J3-prompt-kutuphanesi-genelleme.md` §2.1'e bak — burada tekrar
edilmiyor.

Her method için, J3-1'in §2.3'ündeki üç adım aynen:

1. `src/ai/prompts/2/{methodId}.v1.md` yaz — `pareto.v1.md`'nin **kendisi zaten bu
   dizinde**, o yüzden Adım 2'nin rol çerçevesi paragrafı için doğrudan ondan esinlenebilirsin
   ("Break Down the Problem", localization/stratification). Şemasının her alanı için somut
   rehberlik — `distribution-chart` üç `ChartSpec` varyantı (histogram/scatter/box-plot)
   taşıyor, `msa-gage-rr` fixed-field bir form, `point-of-cause` az alanlı — her birinin
   kendi şemasını oku, kopyalama.
2. `src/methods/{methodId}/index.ts`'e `aiProposal: { promptVersion: "v1" }` ekle.
3. i18n'e dokunma (J1'in kendi bulgusu hâlâ geçerli).

**Dikkat — `pareto` ve `trend` aynı dizinde (`src/ai/prompts/2/`) yaşayacak.** Dosya adı
çakışması yok (`trend.v1.md` ≠ `pareto.v1.md`), ama ikisini yazarken birbirine benzer
Pareto/trend rehberliğini kopyala-yapıştır etme — `trend`'in kendi şeması muhtemelen zaman
serisi alanları taşıyor, `pareto`'nun kategori/count alanlarından farklı; `trend/schema.ts`'i
gerçekten oku.

**`point-of-cause`** referans zincirinin kaynağıdır (D-116/D-124: yalnızca hedef, hiç
referrer değil) — bu onun `aiProposal` almasını ENGELLEMİYOR, ikisi ortogonal (J3-1'in
`hypothesis-verification`/`countermeasure` gibi referrer method'ları da `aiProposal`
alabileceğini zaten gösterdi, bkz. gelecek dilimler).

### Test

`registry.test.ts`'in `describe("MethodPlugin.aiProposal across the registry")` bloğu
**J3-1'de zaten yazıldı ve jeneriktir** — bu dilim ona yeni bir test EKLEMİYOR, yalnızca
`withAiProposal` filtresi otomatik büyüyor (9 yeni method `aiProposal` kazandığı an, mevcut
`it("resolves a real, loadable prompt file...")` testi onları da otomatik kapsar). Tek
elle-yapılacak iş: `it("has at least the methods J1/J3-1 shipped")` testindeki
`expect.arrayContaining([...])` listesini genişletmek isteyip istemediğine karar ver — zaten
`arrayContaining` olduğu için genişletmek ZORUNLU değil, ama bu dilimin kendi 9 method'undan
en az birini eklemek (J3-1'in listesine yaptığı gibi) gelecekte "bu test hâlâ gerçekten bir
şey mi doğruluyor" sorusuna kanıt bırakır.

### Done-koşulu

J3-1'in §2.5'iyle birebir aynı şekil: 9 yeni prompt dosyası (Pareto'nun kalite çıtasında),
9 `index.ts` düzenlemesi, `npm test`/`cargo test` yeşil + exit code ayrı kontrol, lint/build/
clippy/fmt temiz, `gen-a3-fixture.ts` yeniden çalıştırılmaz (bu dilim de `buildA3Layout`'a
dokunmuyor — grep ile doğrula).

---

## 3. Kapsam dışı

J3-3..J3-8 (Adım 3-8'in geri kalan 32 method'u), fotoğraf-taşıyan method'lar, `generic-text`,
Critique/Extract/Review modları, §8.10/§8.12, P-39/P-47/P-48/P-49/P-50/P-51/P-52 — hiçbiri
dokunulmuyor. Tam liste: `J3-prompt-kutuphanesi-genelleme.md` §3.

---

## 4. Kapanış

`DECISIONS.md`'ye bir sonraki D-numarası, bu dosyanın kendi durumu ve
`J3-prompt-kutuphanesi-genelleme.md` §2.2 tablosundaki J3-2 satırı "BİTTİ" olarak
güncellenir, `docs/oturumlar/README.md`'nin J3 satırı güncellenir, `CLAUDE.md`'nin Current
state'ine özet eklenir, **J3-3'ün kendi launch prompt'u** yazılır (J3-3 tek method — bu
oturumun kendi kararı, J3-4 ile birleştirilip birleştirilmeyeceğine karar ver, J3-1'in §2.2
notu zaten bunu öngörmüştü).

**Model önerisi:** J3-1'le aynı — gerçek bir mimari karar yok, Sonnet 5 yeterli. Tek dikkat
noktası yine prompt KALİTESİ.
