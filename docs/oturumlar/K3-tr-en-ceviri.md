# OTURUM Faz 10 — K3: TR↔EN çeviri (alan-bazlı + proje geneli)

> Faz 10'un kendi kapsam belirleme oturumu (D-213, 2026-09-05) BİTTİ. K1 (D-214,
> 2026-09-05) ve K2 (D-215, 2026-09-05) BİTTİ. Bu dosya dört dilimlik planın **üçüncü**
> dilimini uygular:
>
> - K1 (BİTTİ, D-214) — A3 yerleşim optimize edici + hücre bütçesine kısaltma, `RightPanel`'in
>   "Review" sekmesi.
> - K2 (BİTTİ, D-215) — mock-auditor review + anlatı kopukluğu tespiti BİRLEŞİK,
>   `RightPanel`'in "Denetim"/"Audit" sekmesi, `evaluateReadiness`'in S1-S8'ini okuyup
>   tamamlıyor.
> - **K3 (bu dosya)** — TR↔EN çeviri: `EntryEditorDialog`'da alan-bazlı bir "Translate"
>   aksiyonu + proje geneli (whole-report) bir çeviri modu, D-213'ün kendi kararı.
> - K4 — maliyet sayacı + `ai-log.jsonl` + Settings spend cap, K1-K3'ten SONRA (ölçecek
>   gerçek `complete_structured` trafiği olmadan anlamsız).
>
> Kanonik konum: `docs/oturumlar/K3-tr-en-ceviri.md`. Yazıldı: 2026-09-05, K2'nin
> kapanışının hemen ardından.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/K1-yerlesim-kisaltma.md \
      docs/oturumlar/K2-mock-auditor-anlati-kopuklugu.md \
      src/domain/model/projectModel.ts \
      src/domain/commands/types.ts \
      src/domain/commands/builders.ts \
      src/domain/commands/applyCommand.ts \
      src/ai/prompts/frontMatter.ts \
      src/ai/prompts/library.ts \
      src/ai/prompts/wholeProjectLibrary.ts \
      src/app/routes/workspace/entryProposal.ts \
      src/app/routes/workspace/EntryProposalField.tsx \
      src/app/routes/workspace/EntryEditorDialog.tsx \
      src/app/routes/workspace/layoutReview.ts \
      src/app/routes/workspace/LayoutReviewPanel.tsx \
      src/app/routes/workspace/mockAudit.ts \
      src/app/routes/workspace/MockAuditPanel.tsx \
      src/app/routes/workspace/RightPanel.tsx \
      src/app/routes/settings/SettingsScreen.tsx
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — ama K1/K2'nin kendi §0'larında
olduğu gibi, küçük bir yol yanlışlığı (launch prompt'un kendi yazım hatası, J3-2/D-207,
K1/D-214 ve K2/D-215'in üçünün de bulduğu tekrarlayan desen) durma sebebi değildir, yalnızca
notla devam et.

Ayrıca kendi taramamı da doğrula:

```bash
grep -n "language: z.enum" src/domain/model/projectModel.ts        # ["tr","en"] bekleniyor —
  # proje TEK bir dille açılır, i18next de yalnızca tr/en destekliyor (üçüncü dil YOK, bu
  # yüzden bir dil SEÇİCİSİ değil, ikili bir SEÇENEK yeterli olmalı).
grep -n "meta.language" src/domain/commands/builders.ts src/domain/commands/types.ts
  # HİÇBİR eşleşme bekleniyor — `project.meta.language` bugün YALNIZCA proje oluşturulurken
  # yazılıyor, onu sonradan değiştiren bir komut YOK. K3 böyle bir komut icat ederse
  # (§2.5), bu `rounds.set`/`signOff.set`/`meta.ai.set` (D-192/D-201) desenine üçüncü
  # bir örnek olur.
grep -n "aiProposal" src/methods/types.ts                          # VAR bekleniyor —
  # `EntryProposalField` yalnızca `plugin.aiProposal` deklare eden method'larda görünüyor;
  # K3'ün "Translate" aksiyonu aynı kapıya mı bağlanacak yoksa HER entry'de (translate bir
  # method'un domain bilgisine ihtiyaç duymaz) koşulsuz mu görünecek, bu dilimin kendi kararı
  # (§2.1).
grep -n "extractProtectedTokens\|findMissingProtectedTokens\|attemptStructuredProposal" \
  src/app/routes/workspace/layoutReview.ts src/app/routes/workspace/entryProposal.ts
  # ikisi de VAR bekleniyor — K1'in korunan-token doğrulaması ve K2'nin de doğrudan
  # kullandığı tek-deneme primitifi. Çeviri de "sayı/tarih/parça-no/isim kaybetmemeli" aynı
  # riski taşıyor (bkz. §1 madde 6, §2.3) — bu ikisini YENİDEN İCAT ETME.
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-213** (Faz 10 kapsam belirleme — K3'ün "ikisi de: alan-bazlı + proje
   geneli, `project.meta.language`'ı sessizce DEĞİŞTİRMEZ" kararının tam gerekçesi),
   **D-214** (K1 — `layoutReview.ts`'in korunan-token doğrulaması, tek-birleşik-retry
   orkestrasyonu, diff-preview UI'ı; K3'ün whole-report modu bunların ÇOĞUNU yeniden
   kullanabilir, bkz. §2.3), **D-215** (K2 — `entryProposal.ts`'in `proposeStructuredEntry`'sinin
   doğrudan yeterli olduğu basit durum; K3'ün alan-bazlı "Translate" aksiyonu muhtemelen
   K2'ninkine değil K1'inkine daha yakın, çünkü çeviri de korunan-token riski taşıyor),
   **D-204** (`complete_structured`'ın gerçek Vorion şekli — Synchronous Prediction üzerine
   kurulu bir istem-mühendisliği katmanı), **D-125** (generic-shell deseni —
   `EntryReferenceField`/`EntryImagesField`/`EntryRoundField`/`EntryProposalField`, K3'ün
   "Translate" aksiyonunun beşinci örneği olup olmayacağı §2.1'in kendi sorusu), **D-15/D-16**
   (assistant proposes/human accepts — LOCKED, çeviri de bu kuralın DIŞINDA değil: bir
   entry'nin metnini SESSİZCE değiştiren bir "otomatik çevir" yolu asla olamaz).
3. `SPEC.md` §8.6'nın cross-cutting satırı ("TR↔EN translation of any field or the whole
   report") — SPEC'in bu konudaki TEK cümlesi, ayrıntı bu dilimin kendi tasarım işi. §8.1
   (Socratic-first, human-accepts, provenance zorunlu — LOCKED). §8.7 (structured output
   contract — Zod şeması zaten var olan mekanizma). §8.10 madde 2 ("numbers, dates, part
   numbers and owners are protected tokens that may never be dropped or rounded" — K1'in
   kısaltma için yazdığı kural, ama METNİ "asla kaybetme" ilkesi TERCÜMEDE de birebir
   geçerli: bir çeviri "4,2%"yi ya da "Ahmet Yılmaz"ı kaybederse ya da yanlış çevirirse bu
   kısaltmanın kaybetmesinden daha az vahim değil).
4. `src/domain/model/projectModel.ts` — `meta.language: z.enum(["tr", "en"])`. Yalnızca
   proje oluşturulurken (`createNewProject`) yazılıyor; sonradan değiştiren bir komut YOK
   (§0'ın kendi grep'i). İkili bir alan — i18next de yalnızca tr/en destekliyor, üçüncü dil
   yok, dolayısıyla bir dil SEÇİCİSİ gerekmez (Anayasa Madde 9 — bu bilgi zaten elde,
   `AskUserQuestion` gerektirmez): kaynak her zaman `project.meta.language`, hedef her
   zaman "diğeri".
5. `src/app/routes/workspace/entryProposal.ts` — `proposeStructuredEntry` (şema-only
   tek-retry) ve `attemptStructuredProposal`/`Attempt` (K1'in üstüne inşa ettiği, K2'nin
   doğrudan kullandığı primitif). `src/app/routes/workspace/layoutReview.ts` —
   `extractProtectedTokens`/`findMissingProtectedTokens` (regex-tabanlı, sayı/tarih/parça-
   no/isim), `proposeLayoutReviewDiff`'in tek-birleşik-retry deseni (şema hatası + korunan-
   token kaybı AYNI başarısızlık sınıfı, TEK retry). **Çeviri muhtemelen K1'in bu ikinci
   katmanına ihtiyaç duyar** (K2'nin değil) — bir çevrilmiş metnin de orijinaldeki tüm
   sayı/tarih/parça-no/isim'i taşıdığı doğrulanmalı.
6. `src/app/routes/workspace/EntryProposalField.tsx` — tek-entry'lik Accept/Edit&Accept/
   Reject akışının somut örneği (`plugin.aiProposal` deklare eden method'larda görünür,
   `EntryEditorDialog`'un içinde). K3'ün alan-bazlı "Translate" aksiyonu BENZER bir UI şekli
   kullanabilir (review → Accept/Edit&Accept/Reject) ama girdisi FARKLI: `EntryProposalField`
   kullanıcının YENİ yazdığı ham veriyi işler, "Translate" ise entry'nin ZATEN VAR OLAN
   title+payload'ını girdi olarak alır — dosya-ekleme/attachment-review adımı YOK.
7. `src/app/routes/workspace/EntryEditorDialog.tsx` — mevcut alan yapısı (title input,
   `EntryProposalField`, `EntryReferenceField`, `EntryImagesField`, `EntryRoundField`).
   "Translate" aksiyonunun tam olarak nereye (title'ın yanına mı, `EntryProposalField`'ın
   yanına mı) ve hangi koşulla (her zaman mı, `plugin.aiProposal` gibi bir deklarasyona mı
   bağlı) göründüğü §2.1'in kendi kararı.
8. `src/app/routes/workspace/LayoutReviewPanel.tsx` — K1'in diff-preview UI'ı: her satırın
   kendi checkbox'ı (varsayılan işaretli) + "Apply selected". K3'ün whole-report modu
   YAPISAL OLARAK neredeyse aynı şeyi istiyor (birçok entry'nin birçok alanı değişiyor, kullanıcı
   satır satır gözden geçiriyor) — bu UI'ı/şemayı YENİDEN İCAT ETMEDEN nasıl paylaşacağı ya da
   yakından taklit edeceği §2.3'ün kendi kararı.
9. `src/app/routes/workspace/mockAudit.ts` + `MockAuditPanel.tsx` — K2'nin "büyük context'i
   paylaşılan bir özetleme yardımcısıyla (`entrySummary.ts`) küçük, bağımsız bir modüle
   ayırma" deseni. Whole-report çevirinin kendi bağlam ihtiyacı (hangi entry'ler, hangi
   alanlar çevrilecek) muhtemelen bu desenin bir tekrarı — `buildLayoutReviewContext`'in
   TAMAMINI değil, yalnızca ihtiyaç duyulan parçayı paylaş.
10. `src/app/routes/workspace/RightPanel.tsx` — beş mevcut sekme (preview/traceability/
    assistant/review/audit). Whole-report çevirinin kendi yeri — altıncı bir sekme mi,
    yoksa D-213'ün kendi lafzı olan "Settings/project header" mı (bir proje ayarları
    ekranından tetiklenen, sonucu ayrı bir yerde gösterilen bir akış) — §2.4'ün kendi
    açık sorusu.
11. `src/app/routes/settings/SettingsScreen.tsx` — D-200/D-201/D-205'in "küçük, açıkça
    geçici, kesik-çizgi-kenarlıklı debug bölümü" emsali (`meta.ai.enabled`, redaction modu
    için kullanılmıştı). Whole-report çeviri tetikleyicisi burada mı yaşamalı, yoksa artık
    "debug" değil gerçek bir ürün özelliği olduğu için kendi kalıcı bir yerin mi hak ediyor —
    §2.4'ün kendi kararı.

---

## 2. Kapsam

### 2.1 Alan-bazlı "Translate" aksiyonu — nerede, hangi koşulla

D-213'ün kararı: `EntryEditorDialog`'da, mevcut "AI ile öner" (`EntryProposalField`)
butonunun yanında bir "Translate" aksiyonu. İki gerçek açık soru:

- **Görünürlük koşulu**: `EntryProposalField` yalnızca `plugin.aiProposal` deklare eden
  method'larda görünüyor (D-125'in generic-shell deseni, bir method'un kendi isteğiyle
  katılması gerekiyor çünkü prompt dosyası o method'a özel). Çeviri ise bir method'un domain
  bilgisine ihtiyaç duymaz — herhangi bir entry'nin title+payload'ındaki string alanları
  çevirmek jenerik bir iş. **Önerilen**: koşulsuz, HER entry'de görünsün (aiEnabled +
  modelId var olduğu sürece) — `plugin.aiProposal`'a bağlamak yalnızca 46 method'un
  hâlâ `aiProposal` deklare etmemiş birkaçını (varsa) veya gelecekteki yeni method'ları
  gereksiz yere dışlar.
- **Kapsam**: title dahil mi, yoksa yalnızca payload alanları mı? **Önerilen**: title dahil —
  bir entry'nin başlığı da rapor içeriğinin parçası, çevrilmeden bırakılırsa bilingual bir
  rapor yarım kalır.

Barış'a `AskUserQuestion` gerekmeyebilir — ikisi de düşük maliyetli, tersi çevrilmesi kolay
kararlar; ama iki seçenek de makul görünüyorsa sor.

### 2.2 Alan-bazlı çevirinin çıktı şeması

Muhtemelen `{ title: string, payload: <plugin.schema'nın kendisi> }` — `complete_structured`
`plugin.schema`'yı DEĞİL, bu SARMALAYICI şemayı hedef alır (title de çevrilmesi gerektiği
için). `EntryProposalField`'ın kendi `promptVersion`/`getPromptFile(step, methodId, version)`
adresleme şeması BURAYA UYMUYOR — çeviri istemi method'a özgü değil (bkz. §2.3), muhtemelen
K1/K2'nin kurduğu `whole-project/{purpose}.{version}.md` şemasına yeni bir dosya (örn.
`translate-entry.v1.md`), ama `outputSchema` alanı sabit değil (her method'un kendi
`plugin.schema`'sını sarmalıyor) — bu, `WholeProjectPromptFrontMatter`'ın `outputSchema`
alanının şimdiye kadarki iki kullanımından (her ikisi de TEK bir sabit şemaya işaret ediyordu)
FARKLI bir kullanım; front-matter şeması bunu taşıyabiliyor mu yoksa küçük bir uzantı mı
gerekiyor, kontrol et.

### 2.3 Korunan-token doğrulaması — çeviri için de mi?

§1 madde 5'in kendi gözlemi: bir çeviri de orijinal metindeki sayı/tarih/parça-no/isim'i
kaybedebilir ya da (daha sinsi bir hata sınıfı) YANLIŞ çevirebilir (örn. "%4,2" bir yerde
"4.2%" olarak doğru kalır ama "10.08.2026" ay/gün sırası karışırsa YANLIŞ bir tarihe
dönüşebilir — İngilizce mm/dd/yyyy ile Türkçe dd/mm/yyyy karışması gerçek bir risk).
**Önerilen**: K1'in `extractProtectedTokens`/`findMissingProtectedTokens`'ını (`layoutReview.ts`,
zaten `export` edilmiş durumda değilse bu dilimde `export` et — K1'in `attemptStructuredProposal`'ı
K2 için `export` ettiği desenin aynısı) doğrudan yeniden kullan; ama "kayıp" kontrolü
(`.includes(token)`) tarih/sayı FORMATI değiştiğinde (örn. "10.08.2026" → "August 10, 2026")
YANLIŞ POZİTİF verir — orijinal formatın aynen korunmasını mı isteyeceğiz (basit ama İngilizce
metinde garip durur) yoksa formatı esnetip yalnızca ANLAMIN korunduğunu mu (regex'le
doğrulanamaz, yalnızca AI'ya güvenilir) kabul edeceğiz — bu dilimin kendi tasarım kararı,
muhtemelen `AskUserQuestion`'a değer (iki yaklaşımın da gerçek bir maliyeti/riski var).

### 2.4 Whole-report çeviri modunun yeri ve tetikleyicisi

D-213: "Settings/project header" — iki somut aday: (a) `SettingsScreen.tsx`'te D-201/D-205'in
debug-bölümü emsaline benzer ama KALICI (artık debug değil) bir "Report language" bölümü,
"Translate whole report to English/Turkish" butonuyla; (b) `WorkspaceTopBar`'da veya
`RightPanel`'de yeni bir altıncı sekme/aksiyon. **Önerilen**: (a) — çeviri proje-geneli bir
işlem, iş akışının günlük bir parçası değil (K1'in yerleşim incelemesi ya da K2'nin denetimi
gibi sık tekrarlanan bir "Review" değil, muhtemelen proje ömründe bir-iki kez yapılan bir şey),
Settings'in kendi "az kullanılan proje-geneli ayar" ruhuna daha yakın. Sonucun GÖSTERİLECEĞİ
yer ayrı bir soru — bir diff-preview (K1'in `LayoutReviewPanel`'ine benzer) muhtemelen
`RightPanel`'e (yeni bir sekme, ya da `LayoutReviewPanel`'inkiyle PAYLAŞILAN bir UI bileşeni,
bkz. §1 madde 8) taşınmalı, Settings kendisi bir diff göstermek için doğru yer değil. Bu
ikisi arası çizgi `AskUserQuestion`'a değer.

### 2.5 Whole-report çeviri kabul edilince `project.meta.language` değişir mi?

D-213'ün kendi lafzı LOCKED: "proje geneli mod `project.meta.language`'ı sessizce
DEĞİŞTİRMEZ, yalnızca gözden geçirilecek yeni bir öneri seti üretir, her zamanki Accept
akışından geçer." Bu, her satırın Accept'i (K1'in `textCondensations`'ı gibi) entry
içeriğini günceller ama `meta.language`'a HİÇ dokunmaz demek — proje "aslında" hangi dilde
olduğunu iddia etmeye devam eder, içeriği başka bir dile çevrilmiş olsa bile. Bunun
`resolveA3Language`/dışa aktarım etiketleri (D-188/D1) gibi `meta.language`'ı OKUYAN her
yeri nasıl etkilediği (bir Türkçe projedeki İngilizceye çevrilmiş entry'ler artık Türkçe
şablon etiketleriyle mi dışa aktarılacak?) düşünülmeli — belgelenmesi gereken bir P-numarası
adayı, bu dilimde ÇÖZÜLMESİ ZORUNLU değil ama bilerek not düşülmeli. `meta.language`'ı
GERÇEKTEN değiştirmek isteyen ayrı, açık bir aksiyon (yeni bir `meta.language.set` komutu,
`rounds.set`/`signOff.set`/`meta.ai.set`'in üçüncü örneği) bu dilimde inşa edilsin mi yoksa
P-numarası olarak ertelensin mi — **önerilen: ertelensin**, D-213'ün kendi lafzı zaten
"sessizce değiştirmez" diyor, "hiç değiştiren bir yol yok" demiyor ama bu dilimin bütçesi
(zaten iki yeni akış + yeni prompt adresleme) yeni bir domain komutu daha eklemeyi
zorlaştırabilir.

### 2.6 Redaction

K1/K2'nin ikisi de mevcut `off`/`customers` redaction politikasını değişmeden kullanıyor
(P-54, bu fazın kapsamı dışı). Çeviri de aynı: `resolveRedactionPolicy(project.meta.ai.redaction)`
doğrudan yeniden kullanılır, yeni bir politika modu İCAT EDİLMEZ.

### 2.7 Done-koşulu

- `EntryEditorDialog`'da bir "Translate" aksiyonu, gerçek bir `complete_structured` çağrısıyla
  bir entry'nin title+payload'ının çevrilmiş bir taslağını üretiyor, Accept/Edit&Accept/Reject
  üçlüsünden geçiyor (D-15 LOCKED — hiçbir sessiz yazma yolu yok).
- Whole-report çeviri modu, projedeki (en azından bir kısım) entry'lerin çevrilmiş halini bir
  diff/liste olarak üretiyor, satır satır (ya da toplu) Accept edilebiliyor, `project.meta.language`
  hiçbir Accept ile SESSİZCE değişmiyor.
- Korunan token'lar (sayı/tarih/parça no/isim) her iki akışta da kaybolmuyor — bir birim testi
  bunu bilerek bir token'ı kaybeden/yanlış çeviren sahte bir AI yanıtıyla kanıtlıyor.
- Her kabul edilen çeviri `Provenance` taşıyor (`origin: "ai-accepted"/"ai-edited"`, D-201/K1'in
  deseni).
- `npm test`/`cargo test` yeşil, exit code ayrı kontrol edilir (D-143'ün dersi), lint/build/
  clippy/fmt hepsi temiz.
- Gerçek Vorion round-trip'i yine "dürüstçe doğrulanmamış, Barış'ın kendi `npm run tauri dev`
  turu owed" kategorisinde kalabilir (bu ortamda ekran/Tauri çalışma zamanı yok — D-105/
  D-113/D-136/D-200/D-201/D-204/D-213/D-214/D-215'in aynı sınıf deseni).

---

## 3. Kapsam dışı

- **K1/K2** — zaten BİTTİ, bu dilim yalnızca §2.3/§1 madde 5-9'un işaret ettiği paylaşılabilir
  mantık için (`extractProtectedTokens`, `attemptStructuredProposal`, context-özetleme
  deseni) dokunur, K1/K2'nin kendi davranışını DEĞİŞTİRMEZ.
- **K4** — maliyet sayacı/`ai-log.jsonl`/spend cap. K3'ün kendi `complete_structured`
  çağrıları da token/cost verisi üretebilir ama bu dilim onu OKUMAZ/KAYDETMEZ.
- `project.meta.language`'ı GERÇEKTEN değiştiren bir komut (§2.5) — bilerek ertelenirse
  kendi P-numarasıyla dosyalanır, sessizce atlanmaz.
- Proje meta-başlık alanları (`meta.title`/`meta.customer`/`meta.partName` vb.) — whole-report
  çevirisi yalnızca ENTRY içeriğini (title+payload) kapsar, header alanlarını KAPSAMAZ (bu da
  kendi P-numarasıyla dosyalanacak bir sınır, §2'nin kendi karar notuna eklenmeli).
- `RedactionPolicySchema`'nın `customers-and-parts`/`custom` modları (P-54) — K3 mevcut
  `off`/`customers` politikasını değişmeden kullanır.
- Vorion'un Agent/RAG/Marketplace/Custom Assistants yüzeyi — D-199'un LOCKED sınırı.

---

## 4. Bütçe ve kapanış disiplini

Bu dilim K1 kadar büyük olabilir — K1'in üç zor parçasından ikisi (korunan-token doğrulaması,
diff-preview UI'ı) muhtemelen DOĞRUDAN yeniden kullanılabilir (§2.3/§1 madde 8), ama K3'ün
kendi gerçek karmaşıklığı YENİ bir yer: **iki ayrı akış** (alan-bazlı + whole-report) tek
dilimde, her birinin kendi UI yeri/tetikleyicisi. Eğer §2.3'ün format-koruma sorusu ya da
§2.4'ün UI-paylaşım kararı beklenenden karmaşık çıkarsa, bu dilim ikiye bölünmeyi düşünmeli
(K3a: alan-bazlı Translate aksiyonu tek başına, K3b: whole-report modu) — K1'in kendi launch
prompt'unun aynı uyarısı burada da geçerli, tek oturumda bitirmeye zorlanmasın.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin K3 satırı
güncellenir, `CLAUDE.md`'nin Current state'ine özet eklenir. K4'ün kendi launch prompt'u bu
oturumun kapanışında veya bağımsız olarak yazılabilir — K4 K1-K3'ün ürettiği gerçek
`complete_structured` trafiğine bağlı olduğu için K3'ten önce anlamlı biçimde yazılamaz.

---

**Model önerisi:** §2.3'ün format-koruma kararı ve §2.4'ün UI-paylaşım kararı gerçek mimari
kararlar — D-28'in routing mantığına göre Opus değerlendirilebilir. Alan-bazlı çeviri
aksiyonunun kendisi (§2.1/§2.2) K1/K2'nin kurduğu desenin devamı, Sonnet 5 yeterli kalır.
