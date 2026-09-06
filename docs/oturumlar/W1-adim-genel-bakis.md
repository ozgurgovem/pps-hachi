# OTURUM W1 — Adım genel bakış (iniş görünümü + navigasyon değişimi)

> Workspace Yüzey Yenilemesi'nin (bkz. `docs/oturumlar/W-kapsam-belirleme.md`) kendi üç
> dilimlik planının **birincisi**. Kapsam belirleme oturumu BİTTİ — üç mimari soru zaten
> cevaplandı (rail kaldırılıyor, AI mevcut bileşenlerin taşınması, önizleme gerçek renderer'ın
> kırpılması). Bu dosya yalnızca W1'in kendi işini kapsar: `StepStepper`'ın kaldırılması ve
> yerine sekiz adım kartlı bir iniş görünümünün + hızlı-atlama çözümünün inşası.
>
> Kanonik konum: `docs/oturumlar/W1-adim-genel-bakis.md`. Yazıldı: 2026-09-06,
> `W-kapsam-belirleme.md` ile aynı oturumda.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      docs/oturumlar/W-kapsam-belirleme.md \
      src/app/routes/workspace/WorkspaceShell.tsx \
      src/app/routes/workspace/StepStepper.tsx \
      src/app/routes/workspace/StepPage.tsx \
      src/app/routes/workspace/stepStatus.ts \
      src/content/coaching/tr \
      src/content/coaching/en \
      src/domain/readiness/evaluateReadiness.ts \
      src/i18n/locales/tr/common.json \
      src/i18n/locales/en/common.json
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**, küçük bir yol yanlışlığı durma sebebi
değil. Ayrıca `W-kapsam-belirleme.md`'nin §2.1/§2.2/§2.3'ünün hâlâ geçerli olduğunu (kimse
başka bir dilimde bu kararları değiştirmedi) `DECISIONS.md`'nin en son D-numarasına bakarak
doğrula.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `docs/oturumlar/W-kapsam-belirleme.md`'nin TAMAMI — özellikle §2.1 (rail'in kaldırılması,
   kendi kapanmamış hızlı-atlama sorusu), §2.5 (W1'in bu üç dilimin en temeli, en az riskli
   olanı, üstüne W2/W3 inşa edileceği).
3. `SPEC.md` §2.2 — bugünkü LOCKED üç-bölgeli düzen lafzı, bu girişimin bilerek revize ettiği
   metin. Kapanışta buraya yeni lafız yazılacak.
4. `WorkspaceShell.tsx` — bugünkü `activeStepId: StepId` (HER ZAMAN geçerli bir adım, "hiçbir
   adım seçili değil" durumu YOK). Yeni iniş görünümü bu state şeklini genişletiyor mu
   (`activeStepId: StepId | null`, `null` = iniş görünümü) yoksa route-bazlı mı çözülüyor
   (`react-router`'ın kendi bir alt-route'u, örn. `/workspace` = iniş, `/workspace/step/:id`
   = adım sayfası) — §2.1'in kendi kararı, aşağıda.
5. `StepStepper.tsx` — kaldırılacak gerçek bileşen: `w-60` dar rail, her adım için rozet
   (`getStepStatus`) + entry sayısı. Bu bilginin (durum rozeti, entry sayısı) YENİ karta da
   taşınması gerekiyor — kartlar rail'in taşıdığı bilgiyi KAYBETMEMELİ, yalnızca daha büyük/
   davetkâr bir biçimde sunmalı.
6. `stepStatus.ts` — `getStepStatus`/`StepStatus` (empty/inProgress/complete/flagged), yeni
   kartların da okuyacağı AYNI fonksiyon, yeniden yazılmayacak.
7. `src/content/coaching/{tr,en}/step-N.md` — bugünkü, HER adım için zaten var olan coaching
   içeriği (CoachBand'in okuduğu, `parseCoachingMarkdown` ile ayrıştırılan heading/list/
   paragraph blokları). Kartın kendi "kısa açıklama + amaç + nasıl giriş yapılacağı" metni bu
   içerikten mi türetiliyor (örn. ilk paragraf/heading) yoksa YENİ, ayrı, kısa bir içerik mi
   yazılıyor — §2.2'nin kendi açık sorusu.
8. `src/i18n/locales/{tr,en}/common.json`'ın `workspace.steps.{N}.name` key'leri (zaten var,
   `StepStepper`'ın bugün okuduğu) — yeni kart açıklamaları da aynı `workspace.steps.{N}.*`
   ad alanına mı ekleniyor (örn. `.cardDescription`/`.cardPurpose`/`.cardHowTo`) yoksa ayrı
   bir `workspace.stepOverview.*` ad alanı mı — küçük bir isimlendirme kararı, W1'in kendi
   işi.

---

## 2. Kapsam

### 2.1 State şekli — route mu, state mi

**Önerilen**: `react-router`'ın kendi route yapısını KULLANMA — bugünkü workspace zaten tek
bir route (`/workspace` ya da benzeri, proje açıkken), `activeStepId`/`setActiveStep` zaten
`useProjectStore`'da yaşıyor. En küçük değişiklik: `activeStepId`'nin tipini `StepId | null`
yap, `null` = iniş görünümü (ilk açılışın varsayılanı — bugünkü "hep bir adım seçili" davranışı
yerine, D-100'ün "asla otomatik/örtük bir varsayım yapma" ruhuyla, kullanıcı HANGİ adıma
gireceğini kendi seçer). `WorkspaceShell`, `activeStepId === null` iken `StepPage` yerine yeni
`StepOverview` bileşenini render eder. Bu, react-router'a yeni bir alt-route eklemekten (ki
tarayıcı geri/ileri tuşlarının projede zaten anlamlı olup olmadığı ayrı bir soru açar) daha az
riskli — `AskUserQuestion`'a değer, ama önerilen budur.

### 2.2 Kart içeriğinin kaynağı

**Önerilen**: YENİ, kısa, elle yazılmış i18n string'leri (`workspace.steps.{N}.cardPurpose`/
`.cardHowTo` gibi, TR/EN birlikte yazılır — CLAUDE.md'nin kendi "TR ve EN key'leri birlikte
eklenir" kuralı) — coaching içeriğinden MEKANİK olarak türetmeye ÇALIŞMA. Gerekçe: coaching
içeriği (`step-N.md`) derinlemesine, çok bloklu bir öğretim metni; bir kartın ihtiyacı 2-3
cümlelik bir özet. Mekanik bir "ilk paragrafı al" kısayolu, coaching içeriği değiştikçe
(coaching bir yazı, sık güncellenebilir) kartın kendi metniyle SESSİZCE tutarsızlaşabilir —
iki yerin aynı şeyi söylemesi gerektiği bir G2 riski, ama BURADA ikisi FARKLI granülaritede
olduğu için (kart = davet, coach band = öğretim) ayrı içerik olarak kalmaları daha dürüst.
Barış'a `AskUserQuestion` ile sorulmalı — iki seçenek de gerçek bir maliyet taşıyor (elle
yazım: 8 adım × 2 dil × yeni metin; türetme: coaching içeriğiyle sessiz tutarsızlık riski).

### 2.3 Hızlı-atlama çözümü (rail'in kaybettiği tek gerçek işlev)

Bir adım sayfasındayken diğer adımlara tek tıkla geçiş — `W-kapsam-belirleme.md` §2.1'in
kendi kapanmamış sorusu. **Önerilen**: `StepPage`'in ÜSTÜNE, `WorkspaceTopBar`'ın hemen
altına, yatay bir sekiz-nokta şerit (her nokta bir adım numarası + D-41'in shape-coded durum
göstergesi — kare/daire/üçgen, rail'in bugünkü `Badge status`'unun küçültülmüş bir versiyonu)
+ bir "İniş görünümüne dön" düğmesi. Bu şerit rail'in İŞLEVİNİ (hızlı atlama) korur ama rail'in
KENDİSİ (dar, kalıcı, sürekli ekran genişliği kaplayan bir sütun) değildir — §2.1'in "iki
paralel navigasyon yüzeyi olmasın" ilkesini bozmaz, çünkü bu şerit yalnızca bir adım
sayfasındayken görünür, iniş görünümüyle AYNI ANDA değil.

### 2.4 Kart tasarımı — Block Visual Verification Loop ZORUNLU

CLAUDE.md'nin kendi süreci: "Prose kararlar 'bir bloğun neye benzediği' konusunda tek başına
güvenilir değildir." Sekiz kartın gerçek görsel dili (D-165'in Layer A paletiyle çakışmayan
mı, D-49'un token sistemine oturan mı, `Badge`/durum-göstergesinin kartta nasıl göründüğü)
kodlanmadan ÖNCE bir Claude Artifact mockup'ı olarak Barış'a gösterilmeli — gerçek uygulama
token'ları (`--pt`/`--color-*` değil, bu bir uygulama-içi UI, bir A3 sayfası değil; gerçek
Tailwind/`src/index.css` token'ları kullanılmalı) ve gerçek örnek metinlerle (lorem ipsum
DEĞİL — sekiz adımın kendi gerçek `nameKey`/`cardPurpose` metinleriyle). Onaylanınca aynı
mockup'ın component koduna dönüştürülmesi, sıfırdan yeniden yazılması değil.

### 2.5 Done-koşulu

- Rail kaldırıldı, proje açılınca (ya da bir sonraki launch'ta) kullanıcı sekiz adım kartı
  görüyor, her biri durum rozeti + entry sayısı + kısa açıklama taşıyor.
- Bir karta tıklamak o adımın sayfasını açıyor (bugünkü `StepPage` — `CoachBand`/`MethodBand`/
  `EntriesBand` sırası DEĞİŞMEDİ, W2'nin kendi işi).
- Adım sayfasındayken §2.3'ün kendi şeridiyle diğer herhangi bir adıma (veya iniş görünümüne)
  tek tıkla geçilebiliyor — "navigation is never linear-locked" ilkesi korunuyor.
- Boş bir adıma atlamanın bugünkü "reassurance, not a warning" davranışı (advisory banner,
  `WorkspaceShell`'in kendi `handleNavigate`'i) YENİ modelde de çalışıyor.
- Kart tasarımı Barış'ın somut, görsel onayından geçti (§2.4) — prose bir açıklama yeterli
  değil.
- `npm test` yeşil, exit code ayrı kontrol edilir, lint/build temiz. Bu dilim Rust'a
  dokunmuyor (TS/React-only) — `cargo test`'in yeniden çalıştırılması yalnızca doğrulama
  amaçlı, değişiklik beklenmiyor.

---

## 3. Kapsam dışı

- W2 (adım sayfasının kendisi — sayfa-içi entry düzenleme, taşınan AI aksiyonları) ve W3
  (canlı kırpılmış A3 önizlemesi) — bu dilim yalnızca NEREYE gidileceğini (iniş görünümü →
  adım sayfası) inşa eder, adım sayfasının KENDİSİNİ değiştirmez (bugünkü `StepPage`
  DEĞİŞMEDEN kalır).
- `RightPanel`'in altı sekmesi — `W-kapsam-belirleme.md` §2.4'te LOCKED, dokunulmaz.
- Coaching içeriğinin (`step-N.md`) kendisinin yeniden yazılması — §2.2 yalnızca kart
  metninin KAYNAĞINI seçer, coaching içeriğini DEĞİŞTİRMEZ.
- Mobil/dar ekran düzeni — bu masaüstü bir uygulama (Tauri), responsive tasarım bu dilimin
  konusu değil.

---

## 4. Bütçe ve kapanış disiplini

Açılışta kaba bir tahmin ver. §2.4'ün kendi mockup turu (Barış'ın geri bildirimi 1-2 tur
sürebilir, D-165'in kendi emsali) kodlama süresinden BAĞIMSIZ bir bütçe kalemi — mockup onayı
almadan component kodu YAZILMAZ.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, `docs/oturumlar/README.md`'ye "Workspace
Yüzey Yenilemesi" bölümünün W1 satırı, `CLAUDE.md`'nin Current state'ine özet, `SPEC.md` §2.2'nin
metninin yeni düzeni yansıtacak şekilde düzeltilmesi. W2'nin kendi launch prompt'u bu
oturumun kapanışında yazılabilir.

---

**Model önerisi:** §2.4'ün kendi mockup/görsel tasarım turu D-28'in routing ilkesine göre Opus
değerlendirilebilir — bağımsız bir estetik göz, D-165/D-171'in kendi emsali. Mockup onaylandıktan
sonraki component kodu (React/Tailwind, bugünkü `StepStepper`'ın yerini alan mekanik iş) Sonnet
5 yeterli kalır.
