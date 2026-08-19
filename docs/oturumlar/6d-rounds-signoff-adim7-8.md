# OTURUM 6d — Adım 7/8'in kalan yöntemleri + rounds/signOff bağlamaları

> **Bu, D-149'un dört oturumluk arayüz/yapı planının (A, B1–B3, C1–C6, D1–D2b) parçası
> DEĞİL — o plan tamamen kapandı.** Bu, `SPEC.md`'nin kendi Faz 6 planının (D-114, beş
> dilim: 6a–6e) dördüncü dilimi. D-114 6a/6b/6c'yi adlandırıp onayladı; 6d ve 6e hiç
> başlanmadı. D2b'nin kapanışında yapılan bir tarama bunu doğruladı: `rounds`/`signOff`
> hâlâ sadece `src/domain/model/{round,entry,projectModel}.ts`'te tanımlı, hiçbir arayüz
> onları okumuyor/yazmıyor; Adım 7'de `kpiStrip`+`sustainmentAudit`, Adım 8'de
> `documentUpdatesTracker`+`yokotenTracker`+`lessonsLearned` var ama `SPEC.md` §1.3'ün
> kendi madde listesiyle satır satır karşılaştırılınca en az beş madde hiç karşılığı
> bulunamadı (aşağıda §2.2/§2.3).
>
> Kanonik konum: `docs/oturumlar/6d-rounds-signoff-adim7-8.md`. Yazıldı: 2026-08-18,
> D2b'nin kapanışının hemen ardından, Barış'ın açık isteğiyle ("yeni oturum için prompt
> verir misin?") ve kendi seçimiyle (`AskUserQuestion`: 6d mi, 6e mi, başka mı — 6d
> seçildi).

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      src/domain/model/round.ts src/domain/model/entry.ts src/domain/model/projectModel.ts \
      src/domain/model/createProject.ts \
      src/methods/kpiStrip/index.ts src/methods/kpiStrip/schema.ts \
      src/methods/sustainmentAudit/index.ts src/methods/sustainmentAudit/columns.ts \
      src/methods/documentUpdatesTracker/index.ts src/methods/yokotenTracker/index.ts \
      src/methods/lessonsLearned/index.ts \
      src/methods/registry.ts src/methods/shared/rowTable.ts src/methods/shared/fieldForm.ts \
      src/app/routes/workspace/WorkspaceShell.tsx
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-18'de doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `CLAUDE.md` — "Decisions already made" (method plugin sözleşmesi, D-07/D-99/D-102),
   "Current state"in en üstteki "Phase: 6 of 12" satırı (eski, bu oturumun kapanışında
   güncellenmeli) ve en sondaki "Oturum D — D2b" paragrafı (bu dilimin hemen önceki
   bağlamı — D2b hâlâ Barış'ın görsel onayını bekliyor, **bu oturumla ilgisiz, dokunma**).
3. `SPEC.md` §1.3'ün Adım 7 (satır 151-158) ve Adım 8 (satır 160-169) madde listeleri —
   **bu dilimin tek doğru kapsam kaynağı, slice özetinden değil satır satır türet**
   (D-137'nin kendi dersi: özetten kod yazmak Adım 2'nin Gemba fotoğraf alanını 6c'ye
   kaçırmıştı — burada da aynı hataya açık, çünkü `sustainmentAudit` Adım 7'de sevk edildi
   ama Adım 8'in kendi "Sustain plan" maddesiyle de örtüşüyor gibi okunabilir, §2.1'de
   doğrulanmalı).
4. `DECISIONS.md`: **D-114** (Faz 6'nın beş diliminin tanımı — 6d: "Steps 7–8 plain,
   including the rounds (D-58) and signOff bindings"), **D-58** (`Round` şekli — metadata-
   only, `roundId` `Entry`'de yaşıyor, `rounds` boşken no-op), **D-137** (6c'nin "özetten
   değil satır satır türet" dersi — bu oturumun kendi metodolojisi), **D-183** (Oturum C4'ün
   Adım 7/8'e zaten eklediği dört yöntem — bunları yeniden yapma, üstüne inşa et).
5. `src/domain/model/round.ts` (`RoundSchema`: id/openedAt/reason/closedAt),
   `src/domain/model/entry.ts`'in `roundId` alanı, `src/domain/model/projectModel.ts`'in
   `signOff`/`rounds` alanları (`SignOffEntrySchema`: name/signedAt,
   preparedBy/reviewedBy/approvedBy hepsi opsiyonel) — **hiçbiri şu an hiçbir arayüzden
   okunmuyor/yazılmıyor**, doğrula.
6. `src/methods/kpiStrip/schema.ts` (baseline/target/actual/sustain/result/status — Adım
   7'nin "Result KPI chart" VE "Before-Target-After comparison card" maddelerini muhtemelen
   ikisini birden karşılıyor, doğrula) ve `src/methods/sustainmentAudit/columns.ts` (12
   kolon, §13.1'in Effectiveness Check sayfasından).
7. `src/methods/shared/rowTable.ts` + `shared/fieldForm.ts` — yeni düz yöntemler bu
   substratelardan biriyle inşa edilecek, yeni bir substrate gerekmiyor.

---

## 2. Kapsam

### 2.1 Önce doğrula — zaten yapılmış olanı yeniden yapma

`SPEC.md` §1.3'ün Adım 7/8 madde listesini, satır satır, şu an sevk edilen yöntemlere karşı
kontrol et:

| Madde | Aday karşılık | Doğrulanacak |
|---|---|---|
| Adım 7: Result KPI chart | `kpiStrip` | Muhtemelen tam karşılıyor |
| Adım 7: Before-Target-After comparison card | `kpiStrip` (baseline/target/actual) | Ayrı bir kart mı gerekiyor, yoksa kpiStrip'in kendisi mi bu kartın ta kendisi — oku, karar ver |
| Adım 7: Process confirmation audit | `sustainmentAudit`? | `sustainmentAudit` D-183'te Adım 7'ye sevk edildi ama Adım 8'in "Sustain plan" maddesiyle de örtüşüyor okunabilir — hangisi, ikisi mi, doğrula |
| Adım 8: Document update checklist | `documentUpdatesTracker` | Karşılıyor |
| Adım 8: Sustain plan | ? | `sustainmentAudit` bunu da mı karşılıyor yoksa Adım 8'in kendi ayrı bir yöntemi mi gerekiyor — §2.1'in kendi belirsizliği |
| Adım 8: Yokoten/read-across matrix | `yokotenTracker` | Karşılıyor |
| Adım 8: Lessons learned entry | `lessonsLearned` | Karşılıyor |

### 2.2 Muhtemelen eksik — düz yöntemler, yeni mekanizma yok

Bu oturumun ön taraması şunların hiçbir karşılığını bulamadı (doğrula, körü körüne
güvenme):

- **Adım 7 — Statistical confirmation** (Cp/Cpk, p-chart, defect rate).
- **Adım 7 — Realized cost-benefit**.
- **Adım 8 — Open items / next problem**.

Bunlar `rowTable`/`fieldForm` substratelarından biriyle, C1-C6'nın deseniyle (yeni mekanizma
yok, sadece alan) inşa edilebilir görünüyor — ama gerçek şekillerini (kaç alan, hangi
tipte) yine SPEC.md'nin kendi cümlesinden türet, tahmin etme.

### 2.3 Bu dilimin tek yeni mekanizması — rounds + sign-off yaşam döngüsü

D-114'ün kendi kuralı ("bir dilimde en fazla bir yeni alt-sistem") burada geçerli: bu
dilimin mekanizması **rounds/signOff'un arayüze bağlanması**. Kodlamadan önce
`AskUserQuestion` ile sorulması gereken gerçek tasarım soruları (dosyaları görmeden
kesinleşmez, ama muhtemel adaylar):

1. **"Hedefe ulaşılmadı" kararı (verdict) tam olarak ne tetikliyor?** `SPEC.md`'nin kendi
   cümlesi: "Verdict: target met / partially met / not met → if not met, 'Return to Step 4'
   loop." Bu, yalnızca bir alan (kpiStrip'e ya da yeni bir küçük yönteme eklenen bir
   `verdict` select'i) mi, yoksa gerçekten kullanıcıyı Adım 4'e geri navigasyon mu
   yapıyor? İkincisiyse bu bir gezinme/state-machine özelliği, tek bir "alan eklemek"ten
   daha büyük bir karar.
2. **Yeni bir `Round` ne zaman açılır?** Otomatik (verdict "not met" olduğunda) mı, yoksa
   kullanıcının elle tetiklediği bir eylem mi ("Yeni tur başlat" düğmesi)? Açık bir round
   varken Adım 4-6'nın entry'leri nasıl görünür — hepsi mi, yoksa aktif round'a ait olanlar
   mı? D-58'in kendi yorumuna göre bu bir filtre sorunu, yeni bir veri şekli değil.
3. **signOff arayüzü nerede yaşıyor?** Adım 8'in kendi bir paneli mi (yeni bir "kapanış"
   bölümü), yoksa `WorkspaceShell`'in genel bir parçası mı (proje her zaman kapatılabilir)?
   `SignOffEntrySchema` (name/signedAt) üç ayrı kişi için üç ayrı alan istiyor
   (preparedBy/reviewedBy/approvedBy) — bunun UI'da nasıl toplanacağı (isim girişi mi,
   oturumdaki kullanıcının adı mı) ayrı bir küçük karar.

### 2.4 Kapsam dışı

- **Faz 6e** (görüntü içe alma + açıklama + 5 görsel-taşıyan yöntem) — ayrı, daha riskli
  dilim, D-114'ün kendi sıralaması. Bu oturum dokunmaz.
- **D2b'nin kendisi** — kod/test bitti, yalnızca Barış'ın görsel onayı bekleniyor
  (`TEMPLATE_ANALYSIS.md` §15.8, `DECISIONS.md` D-190). Bu oturumla ilgisiz.
- **`pps-8step-auto` şablonu / §12.8'in elastik tahsis modeli** — D-95/D-186, Faz 11.
- **`MethodPlugin.tier`/`MethodBand`** — Oturum C6'da bitti, dokunulmaz.

---

## 3. Bütçe ve kapanış disiplini

Bu dilim en az iki farklı iş taşıyor (birkaç düz yöntem + bir gerçek yeni mekanizma) —
Anayasa Madde 1 gereği açılışta kaba bir tahmin ver; §2.3'ün üç sorusu netleşmeden
mekanizmanın kodlanmasına başlanmaz. Sorular netleşince plan Barış'a kısaca sunulur
(`CLAUDE.md`'nin "write a short plan and let me approve it" kuralı).

TDD zorunlu: her yeni yöntem/mekanizma için önce test, KIRMIZI kanıtlanır, sonra düzeltilir.

Kapanışta: `npm test`/`npm run lint`/`npm run build` ve `cargo test`/`cargo clippy`/
`cargo fmt` hepsi yeşil — `npm test`'in **exit code**'u ayrı bir logfile + `echo $?` ile
kontrol edilir (`tail`/pipe üzerinden DEĞİL, D-143'ün dersi). `scripts/gen-a3-fixture.ts`'in
yeniden çalıştırılması gerekip gerekmediğini kontrol et (muhtemelen gerekmez — bu dilimin
beş gerçek fixture yönteminden hiçbiri Adım 7/8'de değil, ama `rounds`/`signOff` proje
şemasına dokunuyorsa fixture projesinin kendisi de etkilenebilir, doğrula).

Kapanışta belgeler: `DECISIONS.md`'ye yeni D-numarası/numaraları, `SPEC.md` §1.3'ün ilgili
maddeleri "yapıldı" olarak işaretlenmez (SPEC.md bir gereksinim belgesi, durum takibi
`CLAUDE.md`/`DECISIONS.md`'de yaşar), `CLAUDE.md`'nin "Current state"ine bir "Faz 6d"
paragrafı (ve en üstteki eski "Phase: 6 of 12" özet satırının güncellenmesi — bu satır
Faz 6a başlarken yazıldı ve o zamandan beri güncellenmedi, kendi başına küçük bir bulgu),
`docs/oturumlar/README.md`'ye bu dilimin satırı.

---

**Model önerisi:** Opus — §2.3'ün üç sorusu gerçek bir gezinme/state-machine mimarisi
kararı içeriyor (D-28'in kendi routing'i, mimari karar = derin akıl yürütme). Düz
yöntemler (§2.2) tek başına Sonnet'e düşürülebilirdi ama mekanizma sorusu netleşmeden
ayrım yapmak zor — dosyaları görüp karar ver, önceden varsayma.
