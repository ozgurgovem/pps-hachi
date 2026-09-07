# OTURUM Faz 11 — L2: Template switching mekanizması

> Faz 11'in üç dilimlik planının (D-223) ikincisi. L1 (`docs/oturumlar/L1-pps-8step-auto.md`)
> `pps-8step-auto`'yu gerçek koda döktü, gerçek bir `.xlsx` üretip doğruladı, ve bir Claude
> Artifact'te (`https://claude.ai/code/artifact/5eb75eb2-2e0c-45ca-94f2-eee0d3e21a03`) Barış'ın
> görsel onayına sundu — kod L1'in kendi oturumunda BİTTİ (D-224), yalnızca Barış'ın o artifact'i
> incelemesi (P-43'ü kapatır) ve yeni bulunan **P-63**'ün (kpi-strip ADIM 7'de her zaman
> appendix'e düşüyor) bu dilimde mi yoksa ayrı bir dilimde mi çözüleceği kararı bekleniyordu.
>
> Kanonik konum: `docs/oturumlar/L2-template-switching.md`. Yazıldı: 2026-09-07, L1'in kendi
> kapanışında (D-224'ün hemen ardından, Barış'ın açık isteğiyle).
>
> ✅ **Güncelleme, aynı gün**: Barış artifact'i inceleyip onayladı — **P-43 KAPANDI.** Bu sırada
> kendi kolon-içi elastik tahsis önerisini (komşudan boş satır ödünç alma) sordu; bu zaten
> D-158/159/160'ın (LOCKED) L3'e ertelenmiş tasarımıyla birebir aynı çıktı, doğrulandı. Yazı
> tipi/satır yüksekliği küçültme önerisinin kısmı ise D-40'ın (LOCKED) basılı okunabilirlik
> tabanıyla çeliştiği için reddedildi — gerçek cevap D-100'ün (LOCKED) appendix mekanizması.
> Tam kayıt: `DECISIONS.md` D-224'ün kapanış notu. **P-63 hâlâ açık** — aşağıdaki §0 hâlâ geçerli.

---

## 0. İlk iş — P-63'ün durumunu kontrol et

P-43 kapandı (yukarıya bakınız) — bu adım artık yalnızca **P-63**'ü kontrol ediyor:

```bash
grep -n "^| P-63" DECISIONS.md
```

- **P-63 (kpi-strip'in ADIM 7'de her zaman overflow etmesi) hâlâ açıksa**: Barış'a bu dilimde mi
  çözülsün yoksa ayrı bir dilime mi bıraksın diye sor (L1'in kendi artifact'inin §05'i bu soruyu
  zaten sormuştu — cevap gelmişse burada tekrar sorma, `DECISIONS.md`'den oku). Düzeltme küçük
  (muhtemelen `kpiStrip/renderToA3.ts`'in başlık satırını kaldırması, `smartTarget`/`fiveN1K`'ın
  zaten yaptığı gibi `lines: []` kullanması) ama L2'nin kendi konusu DEĞİL — kendi commit'i,
  kendi kararı olmalı, L2'nin template-switching işiyle karıştırılmamalı.

Bu madde netleşmeden L2'nin kendi §2'sine geçme.

## 1. Sonra — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md \
      src/a3/templates/registry.ts \
      src/a3/templates/farplas-7step-tr.ts \
      src/a3/templates/pps-8step-auto.ts \
      src/a3/buildA3Layout.ts \
      src/a3/layout/budget.ts \
      src/a3/layout/place.ts \
      src/a3/descriptor.ts \
      src/domain/model/projectModel.ts \
      src/domain/commands/types.ts \
      src/domain/commands/builders.ts \
      src/domain/commands/applyCommand.ts \
      src/app/routes/workspace/a3Preview.ts \
      src/app/routes/settings/SettingsScreen.tsx

grep -n "templateId" src/domain/commands/types.ts
  # HİÇBİR eşleşme bekleniyor — templateId'yi değiştiren bir komut henüz yok, bu dilim
  # ekleyecek.

grep -n "getTemplateById\|listTemplates\|DEFAULT_TEMPLATE_ID" src/a3/templates/registry.ts
  # üçü de VAR bekleniyor — L1'in kendi mekanizması, bu dilim SADECE kullanır, değiştirmez.
```

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle. Kendi taramanı gerçek koda karşı bir kez
daha doğrula (D-137'nin dersi — bu proje boyunca defalarca doğrulandı, hâlâ geçerli).

## 2. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md`: **D-223** (Faz 11'in kapsam belirlemesi — L2'nin kendi tanımı: "hedef
   şablonun blok bütçesi altında hangi `primary` entry'lerin appendix'e taşacağını hesaplayıp
   commit'ten önce bir onay/uyarı gösterir"), **D-224** (L1'in kendi kapanışı, `zonesRowSpan`
   bulgusu — L2'nin BUNU BOZMAMASI gerekiyor: `pps-8step-auto`'nun ADIM 1 bloğu iki zoned
   entry'yi barındırıyor, bir switch işlemi bunu hesaba katmalı), **D-100** (LOCKED — "asla
   sessizce kırpma, appendix'e taşı" — L2'nin kendi "preserve every entry" gereksinimi bunun
   DOĞRUDAN bir uygulaması, yeniden icat etme), **D-97** (yapısal karşılaştırma yöntemi, L2'nin
   kendi test stratejisi için emsal).
3. `SPEC.md` §6 Faz 11 satırı: "Switching a project between all four templates preserves every
   entry and warns before anything moves to an appendix" — D-223 bunu ikişer şablona daralttı
   (`farplas-7step-tr` ↔ `pps-8step-auto`), "dört" değil "iki".
4. `src/a3/layout/budget.ts` — `computeBlockBudget(template, block)`, tamamen statik (L3'ün işi
   olan esnek solver YOK, bu dilim de eklemez). Bir switch, HEDEF şablonun blokları için bu
   fonksiyonu her blokta bir kez çağırıp mevcut entry'lerin toplam satır talebini bütçeyle
   karşılaştırmalı.
5. `src/a3/layout/place.ts`'in `placeBlockContent`'i — GERÇEK yerleştirme mantığı (zones,
   image, lines, hepsi). L2'nin kendi "bu entry hedef şablonda sığar mı" sorusu, aslında
   `buildA3Layout`'u HEDEF şablonla gerçekten çalıştırıp `droppedEntryIds`'i okumaktan başka bir
   şey değil — bu mantığı YENİDEN YAZMA, zaten var olan `buildA3Layout`'u bir "kuru çalıştırma"
   (dry run) modunda çağır.
6. `src/domain/commands/types.ts`/`builders.ts`/`applyCommand.ts` — `MetaProjectInfoSetCommand`
   (L1'in kendi emsali, D-224) tam olarak bu dilimin `templateId`'yi değiştiren komutunun
   izleyeceği kalıp: proje-seviyeli, `stepId`'siz, `before`/`after` tam değer.
7. `src/app/routes/settings/SettingsScreen.tsx` — L1'in "Proje Bilgileri" bölümünün nereye
   oturduğu (kalıcı bölüm deseni). Template switching kontrolü muhtemelen BURAYA ya da ayrı bir
   yere eklenecek — §2.3'ün kendi `AskUserQuestion`'ı.

## 3. Kapsam

### 3.1 Switch-önizleme mekanizması — bu dilimin tek gerçek yeni mimari parçası

Kullanıcı bir projeyi `farplas-7step-tr` ↔ `pps-8step-auto` arasında değiştirmek istediğinde:

1. **Önizleme (saf, yan etkisiz)**: hedef şablonla `buildA3Layout(project, hedefTemplate,
   {rendererMap})` çağrılır (görsel rasterizasyon OLMADAN — yalnızca ilk, saf çağrı, D-102'nin
   iki-çağrı deseninin yalnızca birincisi yeterli, çünkü burada gerçek bir export değil bir
   *tahmin* isteniyor). Dönen `overflowWarnings`/`droppedEntryIds` okunur — bunlar HANGİ
   entry'lerin hedef şablonda `primary` kalamayıp appendix'e düşeceğini SÖYLÜYOR, tahmin etmeye
   gerek yok.
2. **Onay/uyarı UI**: en az bir entry düşecekse, kullanıcıya "N entry ek sayfaya taşınacak"
   diye somut bir liste (hangi entry'ler, hangi adımlar) gösterilip onay istenir — SPEC'in kendi
   "warns before anything moves to an appendix" lafzı. Hiçbir entry düşmüyorsa onay gerekmeden
   doğrudan geçilebilir (tasarım kararı, `AskUserQuestion` ile sorulabilir — sessiz geçiş UX'i
   daha iyi mi, yoksa her zaman bir onay adımı mı istensin).
3. **Commit**: kullanıcı onaylarsa `templateId` değişir. **Hiçbir entry SİLİNMEZ veya
   `a3Visibility` DEĞİŞTİRİLMEZ** — SPEC'in "preserves every entry" lafzı LOCKED okunmalı: bir
   entry'nin hedef şablonda `primary`den `appendix`e düşmesi zaten `buildA3Layout`'un kendi
   `droppedEntryIds` mekanizmasıyla OTOMATİK oluyor (D-100), `a3Visibility` alanına dokunmaya
   gerek yok — kullanıcı geri `farplas-7step-tr`'ye dönerse aynı entry yeniden sığabilir.

### 3.2 Yeni komut — `meta.templateId.set` (ya da benzer bir isim)

`MetaProjectInfoSetCommand`'ın (D-224) tam kalıbı: proje-seviyeli, `stepId`'siz, `before`/`after`
tam `templateId` string'i. `applyCommand.ts`'in `ProjectScopedCommand` union'ına eklenir.
Undo/redo zaten çalışır (her komut `undoable: true`).

### 3.3 UI yüzeyi — `AskUserQuestion` gerektiren gerçek bir tasarım sorusu

Bugün `SettingsScreen.tsx`'te template'i DEĞİŞTİRECEK hiçbir kontrol yok (yalnızca L1'in
"Proje Bilgileri" bölümü var). Kodlamadan önce Barış'a sor:
- Switch kontrolü nerede yaşasın — `SettingsScreen`'e yeni bir bölüm mü, yoksa ayrı bir
  "Template" sekmesi/diyaloğu mu?
- Önizleme/uyarı hangi bileşenle gösterilsin — mevcut `DialogRoot`/`DialogContent` (L1'in
  kendi dil-seçici dialogu, `LaunchScreen.tsx`) aynı düzende mi, yoksa `RightPanel`'in
  "Review" sekmesinin (K1, D-214) diff-önizleme desenine mi benzesin (o da zaten "değişiklikleri
  göster, seçici onaya sun" işi yapıyor — muhtemelen en yakın emsal).

### 3.4 Done-koşulu

- Gerçek bir proje `farplas-7step-tr`'den `pps-8step-auto`'ya (ve geri) değiştirilebiliyor,
  hiçbir entry kaybolmuyor.
- En az bir entry'nin appendix'e düşeceği bir senaryoda, commit'ten ÖNCE somut bir uyarı
  gösteriliyor (hangi entry'ler).
- `npm test`/`cargo test` yeşil, exit code ayrı kontrol edilir (D-143), lint/build/clippy/fmt
  temiz.

## 4. Kapsam dışı

- **L3** — esnek tahsis solver + drag-handle (D-158/159/160/170), bu dilimin konusu değil.
- `farplas-7step-plus`/`farplas-7step-en` (P-62) — hâlâ yalnızca iki şablon var.
- `BenefitCase`/`Onay formu` (P-18) — dokunma.
- **P-63** (kpi-strip overflow) — bu dilime KARIŞTIRMA, §0'ın kendi notuna bak, ayrı bir
  konu/commit.
- `budget.ts`'in kendisini esnek hale getirmek — L2 hâlâ STATİK bütçeyi kullanır, yalnızca
  hedef şablonun KENDİ statik bütçesine karşı bir "sığar mı" testi yapar.

## 5. Bütçe ve kapanış disiplini

Bu dilim L1'den küçük — tek gerçek yeni mekanizma (switch-önizleme + tek yeni komut) ve bir UI
yüzeyi. Yine de §0'ın kendi kontrol adımını atlama; L1'in kendi açık uçları (P-43/P-63) bu
dilimin temiz başlamasının ön koşulu.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturum başladığında gerçek bir sonraki
numarayı doğrula), `docs/oturumlar/README.md`'nin Faz 11 tablosundaki L2 satırı güncellenir,
`CLAUDE.md`'nin "Current state"ine özet eklenir. L3'ün kendi launch prompt'u bu oturumun
kapanışında veya bağımsız olarak yazılabilir.
