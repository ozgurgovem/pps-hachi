# OTURUM W2 — Adım sayfasının kendisi: sayfa-içi düzenleme + adım-özel AI destek

> Workspace Yüzey Yenilemesi'nin (`docs/oturumlar/W-kapsam-belirleme.md`, D-217) üç dilimlik
> planının ikincisi. W1 (iniş görünümü + navigasyon) tasarım+kod ikisiyle de TAM BİTTİ
> (D-218/D-219, 2026-09-06) — bu dosya W2'nin kendi launch prompt'u, D-217'nin kapanışında
> vaat edildiği gibi W1-insa.md'nin kendi kapanışında yazıldı.
>
> Kanonik konum: `docs/oturumlar/W2-adim-sayfasi.md`. Yazıldı: 2026-09-06.
>
> **W2, W1'den farklı bir bütçe sınıfındadır: burada tasarım kararları ZATEN VERİLMEDİ.**
> W1'in kendi launch prompt'u (`W1-insa.md`) saf mekanik bir uygulama oturumuydu çünkü D-218
> zaten dört turluk bir Block Visual Verification Loop'tan geçmişti. W2'nin ikisi de henüz
> yok: (1) modal→sayfa-içi dönüşümünün somut yerleşimi, (2) adım-özel AI chatbox'ının (P-59)
> somut arayüzü. Bu oturum önce bunları **`AskUserQuestion` ile netleştirmeli**, sonra —
> Anayasa Madde 3 G6'nın kendi uyarısı — gerçek bir görsel tur (Block Visual Verification
> Loop, D-165/D-171/W1'in kendi emsali) olmadan component kodu YAZMAMALI. "Görsel token
> fazı" (D-218'in zaten onayladığı `--color-fp-*`) bunu KARŞILAMAZ — G6'nın kendi metni bunu
> açıkça söylüyor.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/W-kapsam-belirleme.md \
      docs/oturumlar/W1-insa.md \
      src/app/routes/workspace/StepPage.tsx \
      src/app/routes/workspace/StepOverview.tsx \
      src/app/routes/workspace/StepQuickJump.tsx \
      src/app/routes/workspace/EntryEditorDialog.tsx \
      src/app/routes/workspace/MethodBand.tsx \
      src/app/routes/workspace/EntriesBand.tsx \
      src/app/routes/workspace/CoachBand.tsx \
      src/app/routes/workspace/AssistantPanel.tsx \
      src/app/routes/workspace/RightPanel.tsx \
      src/methods/types.ts \
      src/content/coaching/tr \
      src/content/coaching/en \
      src/i18n/locales/tr/common.json \
      src/i18n/locales/en/common.json
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — küçük bir yol yanlışlığı (W1-insa.md
kendi §0'ında ikisini buldu: `StepStepper.test.tsx` hiç var olmamıştı,
`a3PreviewWindow/window.ts`'in gerçek yolu `workspace/` altında değildi) durma sebebi değil,
ama isim tamamen değişmiş bir mekanizma durma sebebidir.

```bash
grep -n "^| D-219" DECISIONS.md          # VAR olmalı — W1-insa'nın kendi kaydı
grep -n "activeStepId: StepId | null" src/state/projectStore.ts   # VAR bekleniyor
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/W-kapsam-belirleme.md`'nin TAMAMI — özellikle §2.2'nin kendi kararı ("AI
   desteği yeni bir mekanizma değil — mevcut `EntryProposalField`/`EntryTranslateField`
   sayfa-içi, her zaman görünür bir düzenleme alanına TAŞINIYOR").
3. `DECISIONS.md` D-217/D-218/D-219 — D-218'in kendi P-59 kaydı (adım-özel AI chatbox'ının
   dört cevaplanmış sorusu: mevcut Assistant'ın uzantısı, reaktif, coaching+şema kaynaklı
   içerik, asla AI-üretimi görsel) bu dilimin bağlayıcı çerçevesi.
4. `src/app/routes/workspace/EntryEditorDialog.tsx` — bugünkü modal, 324 satır: create/edit
   iki modu tek component'te taşıyor, `handleTitleChange`/`handlePayloadChange`/
   `handleReferencesChange`/`handleRoundChange`/`handleImagesChange`/`handleAcceptProposal`/
   `handleAcceptTranslation` her biri edit modunda ANINDA `dispatch`/`dispatchCoalescedUpdate`
   ediyor, create modunda yerel state'te tutup tek bir `handleSave`'de topluca yazıyor. Bu
   ayrım (D-84) sayfa-içi tasarımda da AYNEN korunmalı — W2 yeni bir persistence modeli
   İCAT ETMEMELİ, yalnızca bu component'in DialogRoot/DialogContent kabuğunu değiştirmeli.
5. `src/app/routes/workspace/MethodBand.tsx` — bugün bir method kartına tıklamak
   `EntryEditorDialog`'u `mode: "create"` ile açıyor (`activePlugin` state'i, satır ~44).
6. `src/app/routes/workspace/EntriesBand.tsx` — bir girişin "Düzenle" düğmesi aynı dialog'u
   `mode: "edit"` ile açıyor (`editingEntryId` state'i).
7. `src/app/routes/workspace/CoachBand.tsx` + `src/content/coaching/{tr,en}/step-N.md` —
   P-59'un "kılavuz içeriği mevcut coaching içeriğinden türetilecek" kararının kaynağı.
8. `src/app/routes/workspace/AssistantPanel.tsx` — P-59'un "mevcut Assistant sohbetinin
   adım-bağlamlı uzantısı" dediği gerçek kod: bugün zaten `activeStepId`'i okuyor
   (`handleAccept`, W1-insa'nın §2.8 null-safety düzeltmesinden sonra), zaten
   `RightPanel`'in "Asistan" sekmesinde yaşıyor. P-59'un sorduğu şey bunu SİLİP yeniden
   yazmak değil, muhtemelen bu panelin adım sayfasının içine (RightPanel'in dışına)
   taşınması ya da adım bağlamının (coaching içeriği, o adımın giriş şeması) prompt'a
   otomatik eklenmesi — hangisi, aşağıdaki §2.2'nin kendi açık sorusu.
9. `src/methods/types.ts` — `MethodPlugin.aiProposal?`/`imageSlots?`/`referenceRoles?` gibi
   "declare, don't render" alanlarının hepsi (D-125) — sayfa-içi tasarım bu deseni BOZMAMALI,
   `EntryProposalField`/`EntryTranslateField`/`EntryReferenceField`/`EntryRoundField`/
   `EntryImagesField`'in hiçbiri kendi iç mantığını değiştirmemeli, yalnızca NEREDE
   render edildikleri değişmeli.
10. `src/i18n/locales/{tr,en}/common.json`'ın `workspace.entryDialog.*` ad alanı — sayfa-içi
    tasarım yeni key'ler gerektirecek (örn. "Yeni giriş" başlığı artık bir dialog başlığı
    değil, bir bant başlığı olabilir) — W1'in `workspace.stepOverview.*`/`workspace.quickJump.*`
    emsaliyle aynı, YENİ bir ad alanı açın, mevcutları SİLMEYİN (D-52/D-116'nın additive
    disiplini, eski bir `.ppsx` etkilenmez zaten çünkü bunlar UI string'leri, model değil).

---

## 2. Kapsam

### 2.1 Modal → sayfa-içi dönüşüm — somut yerleşim, `AskUserQuestion` GEREKLİ

D-217 yalnızca YÖNÜ sabitledi ("modal'dan sayfa-içine"), somut yerleşimi sabitlemedi. En az
şu üç seçenek gerçek, birbirinden farklı maliyetler taşıyor:

- **(a) Genişleyen satır (accordion)**: `EntriesBand`'in her girişi, "Düzenle"ye tıklanınca
  kendi satırının hemen altına açılan bir düzenleme alanına dönüşür — `EntryEditorDialog`'un
  içeriği (title input, AI alanları, `Editor`, reference/round/image alanları) olduğu gibi
  oraya taşınır. Yeni giriş oluşturma da benzer şekilde `MethodBand`'daki kartın altında açılır.
  Aynı anda yalnızca bir satır açık olabilir mi, yoksa birden fazla mı — kendi alt-sorusu.
- **(b) Sabit, her zaman görünür bir "aktif düzenleyici" alanı**: `StepPage`'e yeni bir bant
  eklenir (`CoachBand`/`MethodBand`/`EntriesBand`'in arasına ya da üstüne) — bir giriş
  seçildiğinde ya da yeni giriş başlatıldığında İÇERİĞİ orada değişir, hiçbir şey
  genişlemez/daralmaz. Boşken ne gösterir (boş durum) kendi tasarım sorusu.
- **(c) Adım sayfasının kendi ikinci sütunu**: `StepPage`'in genişliği CoachBand/MethodBand/
  EntriesBand solda, aktif düzenleyici sağda olacak şekilde ikiye bölünür — W3'ün planladığı
  "canlı A3 önizlemesi" ile aynı yatay alanı paylaşacağı için W3 ile bir yerleşim çakışması
  olup olmadığı kontrol edilmeli (`W-kapsam-belirleme.md`'nin kendi resmi: önizleme "aynı
  yerde" AI desteğiyle birlikte oturuyor — W2/W3 arasında bu ayrımın netleşmesi gerekiyor).

Barış'a `AskUserQuestion` ile sorulmalı, önerilen yok — üçü de gerçek, farklı maliyet
taşıyor. Hangisi seçilirse seçilsin, §1 madde 4'ün kendi uyarısı geçerli: create/edit'in
D-84 persistence ayrımı (anında dispatch vs. topluca Save) DEĞİŞMEMELİ.

### 2.2 Adım-özel AI destek chatbox'ı (P-59) — somut arayüz, `AskUserQuestion` GEREKLİ

D-218'in dört cevaplanmış sorusu ÇERÇEVEYİ sabitledi, ARAYÜZÜ sabitlemedi:

- Bugünkü `AssistantPanel` `RightPanel`'in "Asistan" sekmesinde yaşıyor ve proje geneli bir
  sohbet. P-59 "adım-bağlamlı bir uzantı" istiyor — bu, (a) AYNI panelin adım sayfasına
  TAŞINMASI mı (RightPanel'den kaldırılıp `StepPage`'e eklenmesi), (b) adım sayfasında YENİ,
  İKİNCİ bir panel açılması (RightPanel'deki proje-geneli sohbet aynı yerde KALIR) mı, yoksa
  (c) aynı panel kalır ama artık `activeStepId`'e göre otomatik bir sistem-prompt'u/bağlamı
  (o adımın coaching içeriği + şeması) enjekte eder mi — üçü de D-218'in "(1) yeni bir AI
  mekanizması YOK" kararıyla tutarlı, hangisi Barış'ın gerçekte istediği ayrı bir soru.
- "Otomatik giriş rehberi" (D-218'in kendi listesindeki ilk madde) — adım sayfası açılır
  açılmaz mı gösterilir, yoksa bir düğmeyle mi tetiklenir? Sürekli görünür bir metin mi,
  chatbox'ın kendi ilk mesajı mı?
- Kılavuz içeriğinin coaching+şema kaynaklı olması (D-218'in 3. maddesi) — pratikte bu, AI'ye
  gönderilen prompt'un `src/content/coaching/{lang}/step-N.md`'nin içeriğini VE ilgili
  `MethodPlugin.schema`'sının alan adlarını bağlam olarak taşıması demek. Bu, K1/K2/K3'ün
  prompt-kütüphanesi mekanizmasına (`src/ai/prompts/`) yeni bir "coaching-context" prompt'u
  eklemek mi, yoksa `AssistantPanel`'in kendi `handleSend`'inin `promptText`'e bunu client-side
  ÖNCEDEN eklemesi mi — küçük ama gerçek bir mimari seçim.

### 2.3 Block Visual Verification Loop — ZORUNLU, §2.1 kararından SONRA

§2.1'in yerleşim kararı netleşince, gerçek örnek içerikle (lorem ipsum DEĞİL — Adım 4'ün
gerçek Fishbone/5-Why kartları gibi) bir Claude Artifact mockup'ı, D-218'in onayladığı
Farplas token'larıyla (`--color-fp-*`, `--font-fp-display`) mock'lanmalı ve Barış'ın somut
onayından geçmeli — CLAUDE.md'nin kendi süreci, W1'in D-165/D-171 emsali. Component kodu
yalnızca onaydan SONRA yazılır.

### 2.4 Done-koşulu

- Bir method kartına tıklamak ya da bir girişi "Düzenle"lemek artık bir modal AÇMIYOR —
  §2.1'de seçilen yerleşimde, sayfanın kendi içinde bir düzenleme alanı beliriyor/güncelleniyor.
- `EntryEditorDialog.tsx`'in bugünkü create/edit persistence mantığı (D-84) davranışça
  DEĞİŞMEDİ — yalnızca `DialogRoot`/`DialogContent` kabuğu kalktı.
- `EntryProposalField`/`EntryTranslateField`/`EntryReferenceField`/`EntryRoundField`/
  `EntryImagesField`'in hiçbiri kendi iç mantığını değiştirmedi (D-125'in "declare, don't
  render" sözleşmesi korundu).
- Adım sayfasında §2.2'de seçilen arayüzle bir AI destek yüzeyi var; D-218'in kilitlediği dört
  ilke (yeni mekanizma yok, reaktif, coaching+şema kaynaklı içerik, asla AI-üretimi görsel)
  hepsi tutuyor.
- Kart/panel tasarımı Barış'ın somut, görsel onayından geçti (§2.3) — prose bir açıklama
  yeterli değil.
- `npm test` yeşil, exit code ayrıca `echo $?` ile kontrol edilir (D-143), lint/build temiz.
  Bu dilim muhtemelen Rust'a dokunmuyor (TS/React-only, W1'in kendi emsali) — yine de
  `cargo test`/`clippy`/`fmt` doğrulama amaçlı yeniden çalıştırılmalı.

---

## 3. Kapsam dışı

- W3 (canlı, adıma-kırpılmış A3 önizlemesi) — kendi launch prompt'u, W2'den SONRA yazılacak;
  ama §2.1(c) seçilirse W2/W3'ün yerleşimi birbirini etkileyebilir, o zaman W3'ün launch
  prompt'u bu oturumun kapanışında (W1-insa'nın kendi emsali) yazılmalı.
- `RightPanel`'in Preview/Traceability/Review/Audit/Translate sekmeleri — `W-kapsam-belirleme.md`
  §2.4'te LOCKED, dokunulmaz. Yalnızca "Asistan" sekmesi §2.2'nin kararına göre etkilenebilir.
  `RightPanel`'in ALTI sekmesinin varlığı hiçbir şekilde azalmaz.
- P-58 (Farplas görsel yönünün Button/Badge/Input/Select/Dialog/StepTick/ThemeToggle'a
  yayılması) — kendi ayrı, büyük dilim, bugün değil. `DialogRoot`/`DialogContent`'in kendisi
  kalkıyor olsa da (modal artık kullanılmıyor), diğer paylaşılan primitive'ler DEĞİŞMİYOR.
- Karanlık temanın Farplas token'larının görsel onayı — W1-insa.md'nin kendi açık notu,
  ayrı bir kısa tur, bu dilimin konusu değil (ama §2.3'ün kendi mockup'ı zaten iki temada da
  gösterilebilir, ucuzsa aynı turda kapatılabilir).

---

## 4. Bütçe ve kapanış disiplini

Bu, W1'den DAHA BÜYÜK bir dilim — iki gerçek, birbirinden bağımsız `AskUserQuestion` turu
(§2.1, §2.2) + bir Block Visual Verification Loop turu (§2.3, 1-2 geri bildirim turu sürebilir,
D-165'in kendi emsali) + component kodu. Anayasa Madde 1/G1: bu üçü tek oturumda sıkışırsa
bölün — en azından "tasarım (§2.1+§2.2+§2.3)" ile "kod" iki ayrı temiz oturum olabilir,
W1-adim-genel-bakis.md/W1-insa.md'nin kendi ayrımı gibi.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'nin W2 satırı,
`CLAUDE.md`'nin Current state'ine özet, `SPEC.md`'nin ilgili paragrafının (§2.2'nin "Method
band"/"Entries band" tarifi, artık modal açmadıklarını yansıtacak şekilde) düzeltilmesi. W3'ün
kendi launch prompt'u bu kapanışta yazılabilir (K1/W1'in kendi emsali).

---

**Model önerisi**: §2.1/§2.2'nin tasarım turu + §2.3'ün görsel onay turu D-28'in routing
ilkesine göre Opus değerlendirilebilir (W1-adim-genel-bakis.md'nin kendi önerisiyle aynı
gerekçe — bağımsız bir estetik/mimari göz). Onaydan sonraki component kodu Sonnet 5 yeterli.
