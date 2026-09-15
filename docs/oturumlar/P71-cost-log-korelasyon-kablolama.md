# OTURUM — P-71: cost-log accept/reject korelasyonunun kalan kablolaması

> P-60'ın (D-260, 2026-09-15) kendi mekanizması gerçekten inşa edildi ve BİR referans çağrı
> yerinde (`EntryProposalField`) uçtan uca kanıtlandı. Bu oturumun işi mekanizma icat etmek
> DEĞİL — zaten var olan, test edilmiş mekanizmayı üç kalan yüzeye (K1/K3-field/K3-whole/D-247,
> dördü de tek bir alt katmanı paylaşıyor) aynı desenle uygulamak.
>
> Kanonik konum: `docs/oturumlar/P71-cost-log-korelasyon-kablolama.md`. Yazıldı: 2026-09-15,
> D-260'ın kendi kapanışının hemen ardından, `ai-katmani-temizligi.md`'nin dördüncü maddesinin
> (P-60) doğal devamı olarak.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
grep -n "^| P-71 " DECISIONS.md
  # Hâlâ OPEN olduğunu teyit et.

grep -n "requestId" src/app/routes/workspace/entryProposal.ts
  # BEKLENEN: var — proposeStructuredEntry'nin başarı dalı zaten requestId taşıyor.
  # Bu, bu oturumun ELİNDEKİ referans deseni.

grep -n "requestId" src/app/routes/workspace/layoutReview.ts src/app/routes/workspace/entryTranslation.ts src/app/routes/workspace/chatEntryEdit.ts
  # BEKLENEN: HİÇ eşleşme yok — bu satırın kendi ana bulgusu budur, aşağıya bkz §1.

grep -n "markAccepted" src/ai/settingsIpc.ts src/app/routes/workspace/EntryProposalField.tsx
  # BEKLENEN: settingsIpc.ts'de export edilmiş, EntryProposalField.tsx'de reportAccepted
  # sarmalayıcısı üzerinden çağrılıyor — bu oturumun kopyalayacağı gerçek referans.
```

Beklenenle uyuşmayan bir şey bulursan DUR ve Barış'a söyle — bu dosya D-260'ın kendi kapanış
anındaki koda göre yazıldı, aradan geçen zamanda değişmiş olabilir.

---

## 1. Gerçek bulgu — D-260'ın kendi kapanış notu yanlıştı, aynı gün düzeltildi

D-260'ın ilk yazılan kapanış cümlesi "K1/K3/D-247 zaten `Attempt.requestId`'yi alıyor, yalnızca
`markAccepted`'ı çağırmıyorlar" diyordu. Bu **YANLIŞ** bulundu ve `DECISIONS.md`/`CLAUDE.md`'de
düzeltildi (bkz. P-71'in kendi satırı). Gerçek durum:

- `attemptStructuredProposal` (`entryProposal.ts`) her fiziksel `completeStructured` çağrısı
  için kendi içinde `crypto.randomUUID()` üretir ve BAŞARILI `Attempt`'in dönüş değerine
  (`Attempt.requestId`) ekler. Bu katman zaten hazır, dokunulmayacak.
- Ama bu `requestId`'yi kendi dönüş tipine taşıyan TEK üst-katman fonksiyonu
  `proposeStructuredEntry`'dir (`entryProposal.ts`, `ProposalResult`'ın `success` dalı).
  `EntryProposalField.tsx` bu sayede `result.requestId`'yi okuyup `Phase["review"]`'e
  koyabiliyor, Accept/Reject'te `markAccepted`'a geçirebiliyor.
- Aşağıdaki ALTI fonksiyon da `attemptStructuredProposal`'ı (bazıları dolaylı olarak
  `proposeStructuredEntry` üzerinden) çağırıyor ama kendi `requestId`'sini OKUMUYOR/
  DÖNDÜRMÜYOR:
  - `layoutReview.ts::proposeLayoutReviewDiff` (K1)
  - `entryTranslation.ts::proposeEntryTranslation` (K3, field-level)
  - `entryTranslation.ts::proposeWholeReportTranslation` (K3, whole-report, rapor girişleri)
  - `entryTranslation.ts::proposeMetaHeaderTranslation` (K3, whole-report, proje başlığı — D-258)
  - `chatEntryEdit.ts::proposeEntryEditFromSuggestion` (D-247 — bu `proposeStructuredEntry`'yi
    çağırıyor, yani `result.requestId` zaten elinde, sadece kendi `EntryEditFromSuggestionOutcome`
    tipine EKLEMİYOR)

**Bu oturumun ilk işi, HER BİRİNİN kendi dönüş tipine `requestId` eklemesi** —
`proposeStructuredEntry`'nin `ProposalResult` deseninin BİREBİR tekrarı (bkz. D-258/D-260'ın
kendi diff'i, `git show <D-260 commit> -- src/app/routes/workspace/entryProposal.ts`). Yalnızca
ANCAK bundan sonra ilgili UI katmanları `markAccepted`'ı çağırabilir.

---

## 2. Dört yüzey — her biri kendi gerçek tasarım sorusunu taşıyor

### 2.1 K1 — `LayoutReviewPanel.tsx` (en karmaşık yüzey)

`proposeLayoutReviewDiff` TEK bir `requestId` üretir (bir "Analyze" tıklaması = bir fiziksel
çağrı, artı olası bir retry — aynı `requestId` paylaşılır, `attemptStructuredProposal`'ın kendi
retry deseni), ama bu TEK çağrının döndürdüğü `diff` İKİ bağımsız satır listesi taşıyor
(`visibilityChanges[]`, `textCondensations[]`), her satırın KENDİ checkbox'ı var —
`handleApply`'da kullanıcı bazı satırları seçip bazılarını seçmeyebilir.

**Gerçek açık soru**: bir `requestId`'ye karşılık gelen tek bir "accepted: true/false" ne
anlama gelir, satırların yalnızca BİR KISMI uygulandığında? Olası cevaplar:
- (a) en az bir satır uygulandıysa `true`, hiçbiri uygulanmadıysa (Reddet'e basıldıysa) `false`.
- (b) her satır için AYRI bir `markAccepted` çağrısı (ama hepsi AYNI `requestId`'yi paylaşıyor —
  Rust tarafı bunu engellemiyor, birden fazla `AiAcceptanceEntry` aynı `request_id`'yle
  append edilebilir, ama bunun anlamı belirsiz).
- (c) yalnızca "en az bir satır seçiliyken Apply'a basıldı mı" sorusuna cevap ver, satır bazlı
  ayrım YAPMA.

Barış'a `AskUserQuestion` ile sorulmalı — kod yazmadan önce. Önerilen: (a), K4'ün kendi
"bu bir denetim güzelliği, kritik bir mekanizma değil" duruşuyla tutarlı en basit seçenek.

### 2.2 K3 field-level — `EntryTranslateField.tsx`

`proposeEntryTranslation` TEK sonuç döndürür (`{title, payload}`), `EntryTranslateField.tsx`'in
kendi Accept/Reject'i `EntryProposalField.tsx`'in AYNI şekli (tek çağrı, tek accept/reject) —
bu en kolay dördü, doğrudan `EntryProposalField`'ın deseni kopyalanabilir, açık soru yok.

### 2.3 K3 whole-report — `TranslateReportPanel.tsx`

K1'le AYNI şekil: `proposeWholeReportTranslation` (rapor girişleri) VE `proposeMetaHeaderTranslation`
(D-258'in meta-header mini-panel'i) AYRI AYRI birer `requestId` üretir, her ikisinin de kendi
satır listeleri var (`diff.lines[]`, `metaHeaderLines[]`), her satırın kendi checkbox'ı,
`handleApply` her ikisinden de seçilenleri tek bir çağrıda uyguluyor. §2.1'in AYNI açık sorusu
burada İKİ KERE geçerli (rapor girişleri için bir `requestId`, meta-header için başka bir
`requestId`) — §2.1'de verilen cevap burada da aynen uygulanmalı, ayrıca sorulmasına gerek yok.

### 2.4 D-247 — `AssistantPanel.tsx`'in "Apply the suggestion" akışı

İki ardışık çağrı: `identifySuggestionTargetEntry` (hangi girişin hedeflendiğini bulur, kendi
`requestId`'si var ama gerçek bir accept/reject NOKTASI yok — kullanıcı bunu asla görmüyor) ve
`proposeEntryEditFromSuggestion` (asıl öneri, `ApplyState["review"]`'de gösterilen, gerçek
Accept/Reject burada). `AssistantPanel.tsx`'in `handleAcceptEntryEdit`/`handleRejectEntryEdit`'i
(satır ~334/~377) mevcut kod.

**Gerçek açık soru**: yalnızca İKİNCİ çağrının (`proposeEntryEditFromSuggestion`) `requestId`'si
mi korelasyona giriyor, yoksa BİRİNCİ çağrının (`identifySuggestionTargetEntry`, ki bu da gerçek
bir maliyetli AI çağrısı — cost-log'a zaten yazılıyor) da bir şekilde işaretlenmesi mi gerekiyor?
Önerilen: yalnızca ikinci çağrı — birincisi kullanıcının hiç görmediği bir yönlendirme adımı,
"kabul/red" kavramı ona anlamlı şekilde uygulanamaz; cost-log'da kendi `request_id`'siyle zaten
duruyor, yalnızca hiçbir zaman bir `accepted` olayı almayacak (bu, K2'nin mock-audit
bulgularının hiç accept/reject almamasıyla aynı sınıf, sorun değil).

---

## 3. Uygulama şekli — her yüzey için aynı üç adım

1. İlgili `propose*` fonksiyonunun kendi dönüş tipine `requestId: string` ekle (yalnızca
   `success`/`matched` dalında — `failed` dalının korelasyon edecek bir şeyi yok, aynı
   `EntryProposalField`'ın "failed fazından çıkış raporlanmıyor" kararı).
2. UI'ın kendi `Phase`/state tipine `requestId` (veya K1/K3-whole için gerekiyorsa birden fazla
   `requestId`) ekle.
3. Accept/Reject (ya da §2.1'in kararına göre "Apply"/"Reject all") noktasında
   `settingsIpc.ts::markAccepted(projectId, requestId, accepted)` çağır — `EntryProposalField.tsx`'in
   `reportAccepted` sarmalayıcısının (best-effort, `.catch` + `console.error`) BİREBİR aynısı,
   dört yerde de aynı küçük yardımcıyı tekrar yazmak yerine `entryProposal.ts`'e (ya da yeni bir
   paylaşılan küçük dosyaya) taşımak G2'nin (Anayasa Madde 2) gerektirdiği şey — üçüncü tekrardan
   önce soyutla.

---

## 4. Test/doğrulama

Her yüzey için `EntryProposalField.test.tsx`'in P-60 testlerinin AYNI şekli:
- Accept'in `markAccepted`'ı doğru `projectId`/`requestId`/`true` ile çağırdığını doğrulayan
  regresyon testi.
- Reject'in `false` ile çağırdığını doğrulayan test.
- "failed" fazından çıkışın HİÇ çağırmadığını doğrulayan test.
- Her biri mutasyon-doğrulanmalı (çağrı geçici olarak yorum satırına alınıp testin GERÇEKTEN
  KIRMIZI çıktığı, sonra geri yüklenip GREEN doğrulandığı kanıtlanmalı — D-260'ın kendi
  disiplini).

K1/K3-whole için ek olarak: §2.1'in kararına göre (a) seçilirse, "bazı satırlar seçili bazıları
değilken hâlâ `accepted: true` raporlanıyor" testi; (c) seçilirse, "hiç satır seçili değilken
`accepted: false`" testi.

---

## 5. Bütçe ve bölünme

Dört yüzey bağımsız (farklı dosyalara dokunuyor) — aynı oturumda art arda yapılabilir (D-114'ün
"bir dilim = bir yeni mekanizma" bütçesi burada geçerli DEĞİL, çünkü mekanizmanın kendisi zaten
inşa edildi, bu yalnızca aynı deseni dört kez tekrarlamak) ya da bağımsız worktree'lerde
paralelleştirilebilir (Anayasa Madde 3). Önerilen sıra: §2.2 (en kolay, referans deseni ayarlamak
için) → §2.4 (D-247, tek accept noktası) → §2.1/§2.3 (K1/K3-whole, aynı açık soruyu paylaşıyor,
birlikte çözülmeli).

Her biri kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, P-71'in kendi satırının parça parça
(ya da hepsi bitince tek seferde) KAPANDI olarak güncellenmesi.

---

**Model önerisi**: Sonnet 5 yeterli — mekanizma zaten var, bu saf tekrar + iki küçük gerçek
tasarım kararı (§2.1, §2.4), derin mimari araştırma gerekmiyor.
