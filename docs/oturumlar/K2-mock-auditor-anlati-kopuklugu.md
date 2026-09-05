# OTURUM Faz 10 — K2: Mock-auditor review + anlatı kopukluğu tespiti

> Faz 10'un kendi kapsam belirleme oturumu (D-213, 2026-09-05) ve K1 (D-214, 2026-09-05) BİTTİ.
> Bu dosya Faz 10'un dört dilimlik planının **ikinci** dilimini uygular:
>
> - K1 (BİTTİ, D-214) — A3 yerleşim optimize edici + hücre bütçesine kısaltma, `RightPanel`'in
>   yeni "Review" sekmesi.
> - **K2 (bu dosya)** — mock-auditor review (§8.6 Review modu) + anlatı kopukluğu tespiti
>   (§8.10 madde 4) BİRLEŞİK — `evaluateReadiness`'in (D-196) S1-S8'ini okuyup tamamlar,
>   yeniden hesaplamaz.
> - K3 — TR↔EN çeviri, alan-bazlı + proje geneli.
> - K4 — maliyet sayacı + `ai-log.jsonl` + Settings spend cap, K1-K3'ten SONRA.
>
> Kanonik konum: `docs/oturumlar/K2-mock-auditor-anlati-kopuklugu.md`. Yazıldı: 2026-09-05,
> K1'in kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/K1-yerlesim-kisaltma.md \
      src/domain/readiness/evaluateReadiness.ts \
      src/domain/readiness/types.ts \
      src/app/routes/workspace/ReadinessAdvisory.tsx \
      src/app/routes/workspace/TraceabilityView.tsx \
      src/app/routes/workspace/layoutReview.ts \
      src/app/routes/workspace/LayoutReviewPanel.tsx \
      src/app/routes/workspace/entryProposal.ts \
      src/ai/prompts/wholeProjectLibrary.ts \
      src/ai/prompts/whole-project/layout-review.v1.md \
      src/app/routes/workspace/RightPanel.tsx
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — ama K1'in kendi §0'ında olduğu gibi,
küçük bir yol yanlışlığı (launch prompt'un kendi yazım hatası, J3-2/D-207 ve K1/D-214'ün ikisinin
de bulduğu desen) durma sebebi değildir, yalnızca notla devam et.

Ayrıca kendi taramamı da doğrula:

```bash
grep -n "export function evaluateReadiness" src/domain/readiness/evaluateReadiness.ts  # VAR bekleniyor
grep -n "export type ReadinessRule\|export interface ReadinessWarning\|export interface ReadinessResult" \
  src/domain/readiness/types.ts                                                        # üçü de VAR bekleniyor
grep -n "TabsTrigger value=" src/app/routes/workspace/RightPanel.tsx                    # DÖRT sekme
  # bekleniyor (preview/traceability/assistant/review) — K1 dördüncüsünü ekledi, K2 BEŞİNCİYİ
  # mi ekliyor yoksa DÖRDÜNCÜNÜN İÇİNE mi giriyor, bu dilimin kendi kararı (bkz. §2.2).
grep -n "getWholeProjectPromptFile" src/ai/prompts/wholeProjectLibrary.ts               # VAR
  # bekleniyor — K1'in kurduğu whole-project prompt adresleme şeması, K2 bunu YENİDEN İCAT
  # ETMEZ, aynı `{purpose}.{version}.md` şemasına yeni bir dosya ekler (örn.
  # `mock-audit.v1.md`).
grep -n "buildLayoutReviewContext\|buildEntryLookup" src/app/routes/workspace/layoutReview.ts
  # VAR bekleniyor — K1'in "her adımın her entry'sinin özetini çıkar" mantığı K2'nin de
  # ihtiyacı olan şey; §1 madde 6 bunun nasıl paylaşılacağını (aynı fonksiyon mu, yoksa ortak
  # bir alt-fonksiyona mı ayrılacak) bu dilimin kendi kararı olarak bırakıyor.
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-213** (Faz 10 kapsam belirleme — K2'nin tam gerekçesi, `evaluateReadiness`
   ile çakışma bulgusu), **D-214** (K1'in kendisi — hangi mekanizmaların zaten kurulduğunu, hangi
   deseni tekrar etmemen gerektiğini anlamak için), **D-196** (G1 — `evaluateReadiness`'in S1-S8
   kuralları, bu dilimin **doğrudan konusu**: her kuralın ne okuduğunu, ne zaman flag bastığını
   birebir bilmeden "S1-S8'in kapsamadığı gerçekten yeni bulgu" ayrımı yapılamaz), **P-46** (S4'ün
   ikinci cümlesi — "5-Why zinciri bir kişide mi bitiyor" — G1'in bütçesi dışında bırakılmıştı;
   K2'nin kendi AI-mekanizması bunu kapatmaya aday, bkz. §2.4), **D-204** (`complete_structured`'ın
   gerçek Vorion şekli), **D-15/D-16** (assistant proposes/human accepts — K2'nin bu kuralla
   ilişkisi K1'den FARKLI, bkz. §2.1: bulgular hiçbir şey YAZMIYOR, yalnızca gösteriyor).
3. `SPEC.md` §8.6 ("Review (mock auditor)" modu + cross-cutting "final review — a pass over the
   finished A3 in the voice of a customer quality auditor, listing what would be questioned"),
   §8.10 madde 4 (üç somut örnek: kök nedensiz karşı önlem, hiçbir sonucun hitap etmediği bir
   hedef, adım 6'da hiç uygulanmamış bir şeyi standartlaştıran adım 8), §1.2 (S1-S8'in kendi
   SPEC metni, `evaluateReadiness.ts`'in koduyla karşılaştırmak için), §8.14 (context window —
   K1'in aynı riski, aynı çözüm sınıfı gerekebilir).
4. `src/domain/readiness/evaluateReadiness.ts` + `types.ts` — sekiz kuralın hepsini oku. Her
   birinin **tam olarak** neyi kontrol ettiğini not et: K2'nin promptu, S1-S8'in zaten flagle
   diği şeyleri AI'ya yeniden buldurmamalı (G2 ihlali). Örnek çakışma zaten bilinen: S5
   (`s5NoVerifiedRootCause`) tam olarak §8.10 madde 4'ün ilk örneğiyle aynı şey.
5. `src/app/routes/workspace/ReadinessAdvisory.tsx` — S1-S8'in kendi read-only, hiçbir şey
   yazmayan gösterim deseni. K2'nin bulgu listesi muhtemelen AYNI ruhta: bilgilendirici, bir
   Accept/Reject akışı YOK (bulgu ProjectModel'e hiçbir şey yazmıyor) — K1'in diff-preview'ından
   yapısal olarak FARKLI bir UI şekli.
6. `src/app/routes/workspace/layoutReview.ts` — K1'in `buildLayoutReviewContext`'i "her adımın
   her entry'sinin özeti + görünürlüğü" bilgisini zaten üretiyor. K2'nin promptu da projenin
   genel içeriğine ihtiyaç duyacak — bu context-kurma mantığının K1/K2 arasında NASIL
   paylaşılacağı (aynı fonksiyonu birebir çağırmak mı, yoksa entry-özetleme kısmını ortak bir
   yardımcıya ayırıp K1'in kendine özgü "condensable fields" kısmını ayrı tutmak mı) bu dilimin
   kendi kararı — ama bir şekilde PAYLAŞILMALI, ikinci kez yazılmamalı (G2).
7. `src/ai/prompts/wholeProjectLibrary.ts` + `whole-project/layout-review.v1.md` — K1'in kurduğu
   adresleme şeması ve örnek prompt dosyası. K2 aynı şemaya yeni bir `{purpose}.{version}.md`
   dosyası ekler (örn. `mock-audit.v1.md`), yeni bir adresleme mekanizması İCAT ETMEZ.
8. `src/app/routes/workspace/entryProposal.ts` — `attemptStructuredProposal`'ın (K1'de
   `export` edildi) tek-deneme birincil mekanizması. K2'nin kendi retry ihtiyacı muhtemelen
   K1'inkinden BASİT — bulgular bir "korunan token" doğrulamasından geçmiyor, yalnızca şema
   doğrulaması var, yani muhtemelen `proposeStructuredEntry`'nin kendisi (K1'in yeniden
   sardığı `attemptStructuredProposal` değil) doğrudan yeterli olabilir. Bu da bu dilimin
   kendi kararı.
9. `src/app/routes/workspace/TraceabilityView.tsx` — `onJump={setActiveStep}` deseni. Bir
   bulguya tıklamak ilgili adıma atlıyor mu (muhtemelen evet, ucuz ve zaten var olan bir
   etkileşim, `AskUserQuestion` gerektirmez).
10. `src/app/routes/workspace/RightPanel.tsx` — K1'in eklediği dördüncü ("review") sekme. K2'nin
    kendi yeri (§2.2) burada karar verilecek.

---

## 2. Kapsam

### 2.1 Bulgu listesi bir proposal DEĞİL — hiçbir şey yazmıyor

K1'in diff'inin aksine, K2'nin ürettiği "bulgu" (finding) `ProjectModel`'e hiçbir zaman
yazılmıyor — SPEC'in kendi lafzı "flags... lists what would be questioned" diyor, "writes" ya da
"proposes" demiyor. Bu, D-15'in "insan onaylar" kuralını TRIVIAL olarak karşılıyor: yazma yolu
hiç yok, dolayısıyla Accept/Reject/Edit&Accept üçlüsüne de gerek yok. K2'nin UI'ı
`ReadinessAdvisory`'nin ruhuna daha yakın: bir "Analiz et" tetikleyicisi → bulgu listesi →
her bulgu tıklanınca ilgili adıma atlıyor (§1 madde 9) — ama hiçbir "kabul et" butonu yok.
Bir bulgunun kalıcı bir durumu (çözüldü/reddedildi) olup olmayacağı **açık bir soru** (§2.5).

### 2.2 Panelin yeri — K1'in "Review" sekmesinin içinde mi, yoksa yeni bir sekme mi?

D-213 K1'in diff-preview'ının "RightPanel'e kalıcı 4. sekme" olacağını kararlaştırdı, ama K2'nin
YERİNİ hiç belirlemedi — yalnızca "bir AI-bulgu listesi paneli" dedi. İki gerçek seçenek:

- **Seçenek A**: K2 kendi 5. sekmesini alır (örn. "Audit"/"Denetim"), K1'in "Review" sekmesi
  yalnızca yerleşim diff'ine ait kalır. İki farklı UI şekli (diff vs. bulgu listesi) iki farklı
  sekmede daha temiz okunur.
- **Seçenek B**: K2, K1'in "Review" sekmesinin İÇİNE ikinci bir bölüm olarak eklenir (yerleşim
  diff'inin altına/yanına) — "Review" sekmesi "AI'nin A3 hakkındaki tüm görüşleri" anlamına
  gelir, sekme sayısı şişmez.

Barış'a `AskUserQuestion` ile sorulmalı — SPEC'in kendi metni ikisini de destekliyor, maliyeti
eşit değil (B, K1'in zaten yazdığı `LayoutReviewPanel.tsx`'i büyütür; A, `RightPanel.tsx`'e beşinci
bir `aiEnabled`-koşullu sekme daha ekler). Önerilen seçenek: **A** — K1'in diff'i "kabul
edilebilir bir öneri", K2'nin bulguları "yalnızca okunan bir liste"; ikisini aynı sekmede
karıştırmak D-15'in "proposal" ile "advisory" arasındaki çizgiyi UI'da bulanıklaştırabilir.

### 2.3 Prompt kütüphanesi — yeni bir `mock-audit.v1.md`

K1'in kurduğu `src/ai/prompts/whole-project/{purpose}.{version}.md` şemasına yeni bir dosya:
muhtemelen `mock-audit.v1.md`, `purpose: "mock-audit"`. İçeriği SPEC §8.6 + §8.10 madde 4'ün
birleşimi: "sen bir müşteri kalite denetçisisin, bu A3'ü sorgula" çerçevesi + "şu üç kategoriye
özellikle dikkat et: (a) sonucu hiçbir verinin desteklemediği bir hedef, (b) adım 6'da hiç
uygulanmamış bir şeyi standartlaştıran adım 8, (c) [S1-S8'in ZATEN kapsadığı liste — AI'ya
BUNLARI TEKRAR SÖYLEME talimatı]". Üçüncü kısım kritik: prompt, S1-S8'in her birinin ne
kontrol ettiğini AÇIKÇA sayan bir bölüm içermeli (K1'in `overflowWarnings`'i context'e
gömmesiyle aynı ilke — zaten hesaplanmış veriyi prompta yaz, AI'ya yeniden buldurma).

### 2.4 P-46'yı kapatma fırsatı

G1 (D-196), S4'ün SPEC'teki ikinci cümlesini ("5-Why zinciri bir kişide mi bitiyor, bu bir
semptomdur kök neden değil") **bilerek** uygulamadı — "yeni bir sezgisel/NLP mekanizması"
gerektirdiği için G1'in tek-mekanizma bütçesini aşıyordu (P-46). K2'nin kendisi TAM OLARAK böyle
bir mekanizma (serbest-metin okuyup yargı veren bir AI çağrısı) — bu yüzden P-46'nın K2'nin
promptuna dördüncü bir kategori olarak eklenip eklenmeyeceği **Barış'a sorulmalı**
(`AskUserQuestion`, önerilen: evet, eklensin — mekanizma zaten var, P-46'yı ayrı bir dilime
ertelemek G2'nin kendi "aynı işi iki kez yapma" ilkesine aykırı düşer). Eklenirse P-46 CLOSED
yazılır; eklenmezse P-46 açık kalır ve neden K2'nin kapsamına alınmadığı belgelenir.

### 2.5 Bulgunun bir durumu var mı?

S1-S8'in advisory'si her `evaluateReadiness()` çağrısında taze hesaplanıyor, hiç saklanmıyor
(D-53). K2'nin AI-bulguları da aynı şekilde her "Analiz et" tıklamasında taze mi üretilecek
(hiçbir kalıcılık yok — bir önceki bulgu listesi bir sonraki analizle tamamen değişebilir), yoksa
bir bulgu "reddedildi/görmezden gelindi" olarak işaretlenip bir daha gösterilmeyecek mi (bu,
`ProjectModel`'e küçük bir yazma gerektirir — meta düzeyinde bir "dismissedFindingIds" listesi
gibi — ki bu YENİ bir mimari parça olurdu, §2.1'in "hiçbir şey yazmıyor" ilkesini bozar).
**Önerilen**: taze/kalıcısız (S1-S8 ile aynı felsefe) — bir bulgu kalıcı olarak reddedilemez,
yalnızca ilgili adımı düzelttiğinde bir sonraki analizde kendiliğinden kaybolur (ya da AI aynı
şeyi bir daha söylemez). Bu, §2.1'in "hiçbir şey yazmıyor" ilkesiyle tutarlı ve yeni bir mekanizma
gerektirmiyor — ama Barış'a `AskUserQuestion` ile sorulabilir, "dismiss" gerçek bir kullanıcı
ihtiyacıysa bu dilim genişleyebilir.

### 2.6 Bağlam kurma — K1'le paylaşım

`buildLayoutReviewContext`'in "her adımın her entry'sinin özeti + görünürlüğü" kısmı K2'nin de
ihtiyacı olan şey (kim ne yazmış, hangi adımda). K1'e özgü kısım (bütçe aşımı, condensable
field'lar) K2'ye YOK. İki makul yapı: (a) `buildLayoutReviewContext`'i böl — genel "proje
özeti" üreten bir çekirdek + K1'in kendine özgü bütçe/condensable eklentisi, K2 yalnızca
çekirdeği çağırır; (b) K2 kendi, daha küçük bir context-kurucu yazar, entry-özetleme
mantığının küçük bir kısmı (metodun `renderToA3`'ünü çağırıp satırları birleştirmek) iki
yerde neredeyse aynı kalır ama K1'in bütçe-özel kod yoluna hiç dokunmaz. (a) G2'ye daha sadık,
(b) daha az riskli (K1'in zaten test edilmiş/kapanmış kodunu yeniden düzenlemez). Bu dilimin
kendi kararı — küçük bir iş, `AskUserQuestion` gerekmeyebilir.

### 2.7 Çıktı şeması

Muhtemelen `{ findings: { stepId, severity, message, category }[] }` şeklinde bir taslak —
`severity` üç değerli olabilir (S1-S8'in ikili `ok`/`flagged`'inden farklı olarak, bir mock
denetçinin "küçük not" ile "ciddi sorun" ayrımı yapması daha gerçekçi). Kesin alan
adları/şekil bu dilimin kararı.

### 2.8 Done-koşulu

- Yeni prompt dosyası (`mock-audit.v1.md`) `getWholeProjectPromptFile` üzerinden bulunuyor.
- Panelin yeri (§2.2) karara bağlandı ve inşa edildi — gerçek bir `complete_structured`
  çağrısıyla bir bulgu listesi üretiyor, elle test edilebilir bir projede.
- Prompt, S1-S8'in zaten kapsadığı kategorileri AÇIKÇA listeleyip AI'dan bunları TEKRARLAMAMASINI
  istiyor — bu, bir birim testiyle dolaylı olarak kanıtlanabilir (S1-S8'in tüm mesaj
  anahtarlarının/kategori adlarının prompt gövdesinde göründüğünü doğrulayan bir test).
- P-46'nın kaderi (kapsandı mı, hâlâ açık mı) `DECISIONS.md`'ye açıkça yazıldı.
- Bir bulguya tıklamak ilgili adıma atlıyor (`setActiveStep`).
- `npm test`/`cargo test` yeşil, exit code ayrı kontrol edilir (D-143'ün dersi), lint/build/
  clippy/fmt hepsi temiz.
- Faz 10'un kendi acceptance senaryosunun ikinci yarısı ("flags a weak root cause on a
  deliberately-bad project") D-213'ün kararlaştırdığı gibi bir fixture `.ppsx` + sahte
  `LlmProvider` yanıtına karşı bir PROBE testiyle kanıtlanır hale gelir — gerçek Vorion
  round-trip'i yine "dürüstçe doğrulanmamış" kategorisinde kalır.

---

## 3. Kapsam dışı

- **K1** — A3 yerleşim optimize edici, zaten BİTTİ (D-214). Bu dilim K1'in koduna yalnızca
  paylaşılabilir mantık için (§2.6) dokunur, diff/visibility/condensation davranışını
  DEĞİŞTİRMEZ.
- **K3** — TR↔EN çeviri.
- **K4** — maliyet sayacı/`ai-log.jsonl`/spend cap. K2'nin kendi `complete_structured` çağrıları
  da K1'inki gibi token/cost verisi üretebilir ama bu dilim onu OKUMAZ/KAYDETMEZ.
- `evaluateReadiness.ts`'in kendi S1-S8 kuralları — okunur, hiç değiştirilmez. Yeni bir S-kuralı
  eklemek bu dilimin işi DEĞİL (K2'nin bulguları S1-S8'in YANINA gider, S1-S8'in bir parçası
  olmaz).
- `RedactionPolicySchema`'nın `customers-and-parts`/`custom` modları (P-54) — K2 mevcut
  `off`/`customers` politikasını değişmeden kullanır.
- Vorion'un Agent/RAG/Marketplace/Custom Assistants yüzeyi — D-199'un LOCKED sınırı.

---

## 4. Bütçe ve kapanış disiplini

Bu dilim K1'den daha KÜÇÜK olmalı — K1'in üç zor parçası (yeni Zod diff şeması, korunan-token
doğrulaması, çok-parçalı retry orkestrasyonu) K2'de YOK (bulgular yazılmıyor, korunacak bir
"orijinal metin" kavramı yok). K2'nin kendi gerçek karmaşıklığı §2.2'nin UI yerleşimi ve §2.6'nın
context-paylaşım kararı — ikisi de tasarım kararı, kod hacmi değil. Eğer §2.6'nın context
paylaşımı beklenenden karmaşık çıkarsa (örn. `buildLayoutReviewContext`'i bölmek K1'in mevcut
testlerini kırıyor), bu dilim K1'in context-kurucusunu OLDUĞU GİBİ bırakıp K2'nin kendi küçük,
bağımsız bir context-kurucusunu yazmasını tercih etsin (Seçenek b, §2.6) — bir öncekini bozma
riski, bir miktar kod tekrarından daha pahalı.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin K2 satırı
güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir. K3'ün kendi launch prompt'u bu
oturumun kapanışında veya bağımsız olarak yazılabilir.

---

**Model önerisi:** §2.2'nin UI-yerleşim kararı ve §2.6'nın context-paylaşım kararı gerçek mimari
kararlar — D-28'in routing mantığına göre Opus değerlendirilebilir. Prompt yazımı (§2.3) ve
mevcut `proposeStructuredEntry`/`getWholeProjectPromptFile`'ı yeniden kullanma kısmı K1'in
kurduğu desenin devamı, Sonnet 5 yeterli kalır.
