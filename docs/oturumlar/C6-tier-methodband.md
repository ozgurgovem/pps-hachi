# OTURUM C6 — MethodPlugin.tier + iki-bölümlü MethodBand (Oturum C'nin altıncı ve son dilimi, daraltılmış kapsam)

> `docs/oturumlar/C-yontem-plugin-insasi.md`'nin önerdiği altı dilimden (§3) altıncısı —
> **C1, C2, C3, C4, C5 BİTTİ.** C1: durum glifi (P-37, 4/5), fishbone geometrisi (P-34), B1'in
> 5./6. alan ekleri (D-180). C2: `five-n1k` + `problem-impact` plugin'leri, sıfır yeni mekanizma
> (D-181). C3: `kpi-strip` mekanizması + ADIM 7'nin ilk gerçek plugin'i, P-31/P-36 kapandı
> (D-182). C4: `sustainment-audit` (ADIM 7) + `document-updates-tracker`/`yokoten-tracker`/
> `lessons-learned` (ADIM 8), B1 §13.4'ün son dört adayı, sıfır yeni mekanizma (D-183). C5:
> whyWhyTree diyagramı + terminal-durum alanı (P-35'in ilk iki boşluğu, D-184); üçüncü boşluk
> (düğüm-seviyesi referans) karara bağlandı (D-185, Seçenek A) ama inşası **P-39**'a ertelendi.
>
> **Bu dosya C6'nın kapsamıdır — ama C-yontem-plugin-insasi.md §3'ün özgün C6 tarifinden
> DARALTILMIŞ.** Özgün tarif iki parçaydı: `MethodPlugin.tier` + iki-bölümlü `MethodBand`
> (D-169) VE esnek tahsisin sürükle-tutamaç UI'ı (D-170). **İkincisi bu dilimden çıkarıldı —
> D-186 (2026-08-18).** C5'in kapanışında, bu promptu yazmadan önce bulundu: D-158/D-160/D-170'in
> tüm esnek-tahsis modeli (varsayılan/taban/çözücü/`pinned`) henüz var olmayan Faz 11 Rev00
> şablonuna göre tasarlanmış — `src/a3/layout/budget.ts` bugün yalnızca `farplas-7step-tr`'nin
> **statik** satır aralığını okuyor, kodda `pinned`/`elastic` hiç geçmiyor, ve `src/a3/templates/`
> yalnızca `farplas-7step-tr.ts`'i barındırıyor. Sürükle-tutamaç için sürüklenecek gerçek bir
> esnek sınır yok. Barış'ın seçimi (`AskUserQuestion`, C5'in kapanışında): **yalnızca tier/
> MethodBand, esnek tahsis Faz 11'e tam ertelensin.** Esnek tahsis artık **P-40** — Faz 11'in
> Rev00 tabanlı `pps-8step-auto` şablonu gerçekten var olup blok başına varsayılan/taban
> bildirene kadar başlamaz.
>
> **Bu dilimin sonucunda D-149'un dört-oturumluk planının Oturum C bacağı tamamen kapanır**
> (Oturum D — P-26, i18n + blok hizası — hâlâ yazılmadı, ayrı bir gelecek iş).
>
> Kanonik konum: `docs/oturumlar/C6-tier-methodband.md`. Yazıldı: 2026-08-18, C5'in kapanışının
> hemen ardından, Barış'ın açık isteğiyle ("yeni oturum için prompt paylaşır mısın?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      docs/oturumlar/C-yontem-plugin-insasi.md \
      src/methods/types.ts src/methods/registry.ts \
      src/app/routes/workspace/MethodBand.tsx \
      src/app/routes/workspace/WorkspaceScreen.test.tsx \
      src/methods/gapStatement/index.ts src/methods/fiveN1K/index.ts src/methods/fiveW2H/index.ts \
      src/methods/stratificationMatrix/index.ts src/methods/categoryBreakdown/index.ts \
      src/methods/pareto/index.ts src/methods/trend/index.ts \
      src/methods/smartTarget/index.ts \
      src/methods/fishbone/index.ts src/methods/fiveWhy/index.ts src/methods/whyWhyTree/index.ts \
      src/methods/countermeasure/index.ts src/methods/weightedDecisionMatrix/index.ts \
      src/methods/actionItem/index.ts \
      src/methods/kpiStrip/index.ts src/methods/sustainmentAudit/index.ts \
      src/methods/documentUpdatesTracker/index.ts src/methods/yokotenTracker/index.ts \
      src/methods/lessonsLearned/index.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-18'de doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made", "How I want you to work" (plan onayı, TDD, i18n),
   ve "Current state"in **Oturum C — C1** … **C5** paragrafları.
3. `docs/oturumlar/C-yontem-plugin-insasi.md` §3 madde 6 — D-186 ile daraltılmış hâliyle, bu
   dilimin özgün planlanan kapsamının neden küçüldüğünü gösteriyor.
4. `DECISIONS.md`: **D-169** (bu dilimin asıl işi — `tier` alanı + iki-bölümlü `MethodBand`,
   başlangıç "önerilen" ataması dahil), **D-186** (bu dilimin neden daraltıldığı, P-40'ın
   nereye ertelendiği), **P-35**'in kendi notu ("whichever future session takes this on should
   also revisit D-169's ADIM 4 'recommended' tier... in light of this real evidence" — §2.4'ün
   açık sorusunun kaynağı).
5. `reference/TEMPLATE_ANALYSIS.md` §14.6 — arayüz tasarımının kendisi (iki bölüm, "Önerilen"/
   "Diğer yöntemler", varsayılan yol). **Kendi kayıt sayım tablosu artık eskimiş** — B2'de
   yazıldığında ADIM 7/8'in ikisi de "boş"tu; C3/C4 onlara gerçek plugin'ler ekledi. Bu oturum
   `src/methods/registry.ts`'i **yeniden sayar**, §14.6'nın tablosuna güvenmez (D-168'in kendi
   "gerçek registry'yi oku, spec taslağına güvenme" disiplini).
6. `src/methods/types.ts` — `MethodPlugin<TPayload>` arayüzü ve `referenceRoles?`'ın nasıl
   eklendiği (D-116): `tier` de aynı desende eklenecek bir opsiyonel, additive alan —
   `ErasedMethodPlugin`'in `Omit` listesine dokunmaya gerek yok, `referenceRoles` gibi payload-
   tipinden bağımsız.
7. `src/app/routes/workspace/MethodBand.tsx` — bugünkü hâliyle (okunmadı, değiştirilmedi) tek,
   eşit ağırlıklı, sarmalanan bir kart grid'i. Bu dilimin dokunacağı asıl dosya.
8. `src/methods/registry.ts` — `getMethodsForStep`'in bugünkü sırası (D-169: "sıra değişmiyor,
   yalnızca render iki gruba bölünüyor" — `tier`'a göre **filtrelenir**, yeniden **sıralanmaz**).
9. `src/app/routes/workspace/WorkspaceScreen.test.tsx` — özellikle `addGenericTextEntry`
   yardımcı fonksiyonu (satır ~43-58): `methodBand` içinde `within(methodBand!).getByText("Free
   text")` arıyor, hiçbir disclosure'ı önce açmadan. `genericText` plugin'i `tier` almıyor
   (unset → `"more"`), yani "Diğer yöntemler" varsayılan olarak **daraltılmışsa** bu yardımcı
   fonksiyon kırılır — dosyada **7 çağrı yeri var**, tek tek değil, yardımcı fonksiyonun
   kendisinde bir kez düzeltilecek (disclosure zaten açıksa no-op, kapalıysa önce aç).

---

## 2. Kapsam

### 2.1 `MethodPlugin.tier` alanı

`src/methods/types.ts`: `MethodPlugin<TPayload>` opsiyonel bir `tier?: "recommended" | "more"`
alanı kazanır. Belirtilmeyen plugin'ler `"more"` sayılır — geriye dönük uyumlu, migration
gerektirmez, D-51'in loose-schema felsefesiyle aynı ruh ama bu kez TS tipinde (D-169'un kendi
kararı). `ErasedMethodPlugin`'e ek bir `Omit` gerekmiyor — `referenceRoles?` zaten aynı şekilde
payload-tipinden bağımsız eklenmişti (D-116), `tier` onun bir kardeşi.

### 2.2 `tier: "recommended"` ataması — plugin başına tek satır

D-169'un kendi tablosu, Adım 1-6 için **değişmeden** uygulanır (bu dilimin işi yeniden
tartışmak değil, kodlamak):

| Adım | `tier: "recommended"` alacaklar |
|---|---|
| 1 | `gapStatement`, `fiveN1K`, `fiveW2H` |
| 2 | `stratificationMatrix`, `categoryBreakdown`, `pareto`, `trend` |
| 3 | `smartTarget` |
| 4 | `fishbone`, `fiveWhy` — **§2.4'ün açık sorusuna bağlı, aşağıya bakın** |
| 5 | `countermeasure`, `weightedDecisionMatrix` |
| 6 | `actionItem` |

Adım 7 ve 8, D-169 yazıldığında (B2, 2026-08-06) her ikisi de **boştu** — bu oturum
`registry.ts`'i yeniden sayarak şunu buldu (§1 madde 5'in kendi disiplini):

| Adım | Bugün kayıtlı (generic hariç) | Önerilen ataması |
|---|---|---|
| 7 | `kpiStrip`, `sustainmentAudit` (yalnızca ikisi) | **İkisi de `recommended`** — "Diğer yöntemler" boş kalır, bölüm hiç render edilmez (§2.3) |
| 8 | `documentUpdatesTracker`, `yokotenTracker`, `lessonsLearned` (yalnızca üçü) | **Üçü de `recommended`** — aynı gerekçe |

`genericText` (Serbest metin) hiçbir adımda `tier` almaz — unset kalır, her zaman `"more"`.

### 2.3 İki-bölümlü `MethodBand.tsx`

- `getMethodsForStep(stepId)`'in döndürdüğü liste **sırası değişmeden** ikiye ayrılır:
  `tier === "recommended"` olanlar bir grup, geri kalanı (`"more"` + unset) diğer grup.
- **Önerilen** — bugünkü kart stiliyle aynı, varsayılan olarak görünür, adım sayfası açılır
  açılmaz orada.
- **Diğer yöntemler** — küçük, **varsayılan olarak daraltılmış** bir liste/açılır menü
  ("+ N diğer format", §14.6'nın kendi tarifi), bir tık uzakta. Yeni bir Radix/disclosure
  bağımlılığı **eklemeye gerek yok** — `src/ui`'de zaten bir Disclosure/Accordion primitive'i
  yok ve bu iş için gerekmiyor de; düz bir `useState<boolean>` + `<button aria-expanded=...>`
  yeterli (bu depoda benzer basit aç/kapa kontrolleri zaten böyle, örn. D-133'ün pop-out
  penceresindeki zoom kontrolleri gibi — büyük bir bağımlılık yerine yerel state).
- **Boş "Diğer yöntemler" kenar durumu**: Adım 3/7/8 gibi bir adımın `tier: "more"` listesi
  boş kalabilir (§2.2) — bu durumda disclosure/toggle **hiç render edilmez**, boş bir "+0 diğer
  format" gösterilmez.
- **Klavye erişilebilirliği** (CLAUDE.md'nin kalite tabanı): toggle düğmesi gerçek bir
  `aria-expanded` durumu taşır, native `<button>` zaten klavye ile çalışır — ekstra iş
  gerektirmiyor ama testte doğrulanmalı.
- **`addGenericTextEntry` yardımcı fonksiyonu düzeltilir** (`WorkspaceScreen.test.tsx`, §1
  madde 9): disclosure kapalıysa önce genişletme kontrolüne tıklar, sonra "Free text" kartını
  arar — tek yerde düzeltme, 7 çağrı yerinin hiçbiri değişmez.

### 2.4 Açık soru — Adım 4'ün önerilen ataması, kodlamadan önce `AskUserQuestion` ile sorulmalı

P-35'in kendi notu (D-176'nın kapanışında yazıldı): *"Whichever future session takes this on
should also revisit D-169's ADIM 4 'recommended' tier (currently `fishbone` + `fiveWhy`) in
light of this real evidence"* — yani C5'in bulduğu gerçek kanıt (Barış'ın kendi imzaladığı
EK-2905 formunun ADIM 4 paneli `fishbone` değil, dallanan bir Why-Why ağacı; D-176/D-184).
Üç seçenek, hiçbiri önerilmiyor:

- **A — Değiştirme.** `fishbone` + `fiveWhy` D-169'un kendi tablosundaki gibi kalır (D-11'in
  kanonik TBP çerçevesi — Fishbone Adım-4-neden-hipotezi-üretici). `whyWhyTree` "Diğer
  yöntemler"de kalır.
- **B — `whyWhyTree`'yi üçüncü önerilen olarak ekle.** `fishbone` + `fiveWhy` + `whyWhyTree`,
  üç kart. En düşük riskli değişiklik — hiçbir şey çıkarılmıyor, yalnızca gerçek kanıtın
  gösterdiği yöntem de öne çıkıyor.
- **C — `fishbone`'u `whyWhyTree` ile değiştir.** `whyWhyTree` + `fiveWhy` önerilen olur,
  `fishbone` "Diğer yöntemler"e düşer. D-176'nın kanıtına en sadık seçenek ama D-11'in LOCKED
  "Fishbone Adım 4'ün kanonik yöntemi" çerçevesiyle gerilir — `tier` yalnızca **arayüz
  görünürlüğü**, D-11'in kendisini değiştirmez, ama pratikte hangi yöntemin "öne çıkan" olduğu
  budur.

Bu, C5'in §2.3'ü kadar ağır bir mimari soru **değil** — `tier` yalnızca bir string alanı,
hangi seçenek seçilirse seçilsin tek satırlık bir değişiklik ve geri alınabilir (C3'ün kendi
düşük riskli `AskUserQuestion` deneyimiyle aynı sınıf). Yine de kodlamadan önce sorulmalı,
çünkü D-169'un kendi tablosu LOCKED bir karar ve P-35 bunu açıkça yeniden gündeme getirdi.

---

## 3. Kapsam dışı

- **Esnek tahsis / sürükle-tutamaç UI'ı (D-170)** — D-186 ile Faz 11'e tam ertelendi, **P-40**.
  Bu dilimde **hiç başlanmaz**, kısmen bile.
- `src/a3/layout/budget.ts` veya `src/a3/templates/*`'e herhangi bir dokunuş — aynı gerekçe,
  hedefleri (Rev00 şablonu) henüz yok.
- Adım 1-3/5-6'nın `tier` atamasının yeniden tartışılması — D-169'un tablosu bu adımlar için
  duruyor, yeniden açılmıyor (yalnızca Adım 4 §2.4'te açık, ve yalnızca çünkü P-35 özellikle
  onu işaret etti).
- **P-39** (düğüm-seviyesi referans adresleme, C5'in kendi ertelediği iş) — bu dilimle ilgisiz,
  ayrı bir gelecek dilim.
- Şablon dosyasının kendisi (`src/a3/templates/*`) — D-95, Faz 11, değişmedi.

---

## 4. Bütçe ve kapanış disiplini

C1-C5'in kendi kapanışında uygulanan disiplin aynen geçerli: TDD (yeni bir `MethodBand.test.tsx`
— bu dosyanın bugüne kadar hiç kendi testi yok, yalnızca `WorkspaceScreen.test.tsx`'in
entegrasyon testlerinden geçiyor; en az şunları doğrulamalı: önerilen kartlar varsayılan
görünür, diğer yöntemler varsayılan daraltılmış, toggle genişletince görünür olur ve
`aria-expanded` doğru değişir, boş "diğer" listesi hiçbir disclosure render etmez, sıra
`getMethodsForStep`'in kendi sırasıyla aynı kalır), `types.ts`/`registry.ts` seviyesinde `tier`
varsayılanını doğrulayan bir test, ve `WorkspaceScreen.test.tsx`'in `addGenericTextEntry`
düzeltmesi. TR/EN i18n anahtarları birlikte (`workspace.methodBand.*` altında "Önerilen"/
"Diğer yöntemler"/"+N diğer format" gibi yeni anahtarlar). `npm test`/`npm run lint`/
`npm run build` ve `cargo test`/`cargo clippy`/`cargo fmt` hepsi yeşil olmadan iş bitmiş
sayılmaz — `npm test`'in **exit code**'u ayrı bir logfile + `echo $?` ile kontrol edilir
(`tail`/pipe üzerinden DEĞİL, D-143'ün ve her C dilimin kendi dersi).

**Bu dilim C1-C4 sınıfında küçük ve düşük risklidir** — tek gerçek soru §2.4, ve o bile C5'in
mimari sorusundan çok daha hafif. §2.4 cevaplandıktan sonra geri kalanı mekanik uygulama.

Kapanışta: `TEMPLATE_ANALYSIS.md` §14.6/§14.8 (kayıt sayım tablosu güncellenir, `tier`
mekanizması "BİTTİ" işaretlenir), `DECISIONS.md` (yeni D-numarası, §2.4'ün cevabı kaydedilir),
`CLAUDE.md` "Current state" (Oturum C — C6 paragrafı — **D-149'un Oturum C bacağının
kapanışı**), `docs/oturumlar/README.md`'nin tablosuna bir satır.

---

**Model önerisi:** Sonnet — D-28'in "düşük risk, hızlı geri bildirim" sınıfı, C1/C2/C4'le aynı.
§2.4'ün sorusu C3'ün kendi deneyiminin gösterdiği gibi Sonnet üzerinde `AskUserQuestion` ile
rahatça çözülür; Opus'a geçmeye gerek yok.
