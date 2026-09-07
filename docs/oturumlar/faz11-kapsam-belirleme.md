# FAZ 11 — Kapsam belirleme (kod YAZILMAZ, yalnızca ölçüm + dilim planı)

> Faz 10'un dört dilimlik planı (K1/K2/K3/K4) 2026-09-06'da TAMAMEN kapandı (D-213 üzerinden
> D-221). `SPEC.md` §6'nın kendi faz tablosu sırada **Faz 11**'i gösteriyor: "Remaining
> templates (`farplas-7step-plus`, `farplas-7step-en`, `pps-8step-auto`), template switching,
> `BenefitCase` and the `Onay formu` calculator — Done when: Switching a project between all
> four templates preserves every entry and warns before anything moves to an appendix."
>
> **Bu lafız artık yanıltıcı ölçüde eski.** SPEC bu satırı Phase 4'te (2026-08-02, D-95)
> yazdığında `pps-8step-auto` yalnızca bir isimdi. O tarihten bu yana **D-149'un dört-oturumluk
> kendi kolu** — Oturum A (sayfa sözleşmesi), Oturum B1-B3 (altı çalışma sayfası + blok görsel
> dili + sekiz bloğun TAMAMININ görsel onayı), Oturum C1-C6 (yöntem plugin inşası + tier
> sistemi), Oturum D1-D2b (i18n + blok hizası kök neden keşfi + düzeltmesi) — Rev00-tabanlı
> 8-step template'i **son derece somut bir noktaya** getirdi: gerçek pt-cinsinden geometri
> (§12), sekiz bloğun HEPSİNİN onaylı görsel dili (§14), esnek bir tahsis modeli (D-158/159/160,
> LOCKED), hatta paylaşılan yerleşim motorunda gerçek bir kusur bulup düzeltme (D-189/190). Bu
> oturumun asıl işi SPEC'in beş kelimesini bu birikmiş, çok daha somut kapsama karşı yeniden
> ölçmek — Faz 8/9/10'un kendi kapsam-belirleme oturumlarıyla AYNI emsal (ölçüm + karar, kod
> yok), ama girdi bu sefer "SPEC'in taslak cümlesi" değil, "on küsur oturumun kilitli kararı."
>
> Kanonik konum: `docs/oturumlar/faz11-kapsam-belirleme.md`. Yazıldı: 2026-09-06, Faz 10'un
> (K4 ile) kapanışının hemen ardından, Barış'ın isteğiyle ("yeni fazı ayrı bir oturumda devam
> etmek için prompt paylaşır mısın").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 SPEC.md CLAUDE.md DECISIONS.md reference/TEMPLATE_ANALYSIS.md \
      src/domain/model/projectModel.ts \
      src/domain/model/createProject.ts \
      src/a3/templates/types.ts \
      src/a3/templates/farplas-7step-tr.ts \
      src/a3/buildA3Layout.ts \
      src/a3/layout/budget.ts \
      src/a3/layout/place.ts \
      src/a3/layout/placeZones.ts \
      src/app/routes/workspace/a3Preview.ts \
      src/methods/registry.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**. Ayrıca kendi taramamı gerçek koda
karşı yeniden doğrula (körü körüne güvenme — D-137'nin dersi):

```bash
ls -1 src/a3/templates/
  # yalnızca farplas-7step-tr.ts + types.ts bekleniyor — pps-8step-auto.ts (veya benzeri)
  # HİÇ yok. Varsa bu promptun kendi öncülü zaten yanlış, DECISIONS.md'ye bak.

grep -rn "templateId" src/ src-tauri/ 2>/dev/null | grep -v "\.test\.\|fixtures/"
  # BU OTURUMUN KENDİ BULGUSU (2026-09-06, K4 kapanışı sırasında, önceden hiçbir D-numarasında
  # kayıtlı değil): `ProjectModel.templateId` şemada VAR ve `createProject.ts`'te
  # "farplas-7step-tr" olarak yazılıyor, ama `src/app/routes/workspace/a3Preview.ts` onu HİÇ
  # OKUMUYOR — `farplas7StepTr`'i doğrudan import edip sabit kodluyor. Yani template SEÇİMİ
  # bugün TAMAMEN ölü kod — `templateId` yazılıyor ama hiçbir yerde okunmuyor. Bu, SPEC'in
  # kendi "template switching" done-koşulunun sıfırdan bir mekanizma gerektirdiğini KANITLIYOR,
  # yalnızca yeni bir template dosyası eklemek değil. Doğrula, körü körüne bu satıra güvenme.

grep -n "fn computeBlockBudget\|BlockBudget" src/a3/layout/budget.ts
  # statik, template'in row tablosundan doğrudan toplam alan STATİK bekleniyor — D-158/159/160'ın
  # esnek (elastic) solver'ı henüz İNŞA EDİLMEMİŞ olmalı (P-40'ın kendi bulgusu).

grep -n "priority\|targetClos\|generalRag\|genelRag" src/domain/model/projectModel.ts
  # HİÇBİR eşleşme bekleniyor — D-153'ün "Öncelik"/"Hedef Kapanış"/"Genel RAG" header alanları
  # `ProjectMetaSchema`'da hâlâ YOK.

grep -n "^### D2b\|D-190" reference/TEMPLATE_ANALYSIS.md | head -3
  # §15.8 (D2b'nin placeZones.ts düzeltmesi) hâlâ orada olmalı — P-43'ün kendi görsel
  # sign-off'unun hâlâ owed olup olmadığını CLAUDE.md'nin "Current state"inden doğrula.

grep -rn "BenefitCase" src/domain/ src/app/ 2>/dev/null
  # HİÇBİR eşleşme bekleniyor — D-153/P-18'in kendi notu: "no BenefitCase until SPEC.md
  # §3.0/Phase 11" hâlâ doğru olmalı.
```

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md`. **`AKIS.md`'yi bu oturum okumana gerek YOK** — Faz 8/9/10'un kendi
   kapsam-belirleme oturumlarıyla aynı gerekçe: bu oturum kod yazmıyor, yalnızca okuyor ve
   `docs/`/`DECISIONS.md`'ye yazıyor.
2. `SPEC.md` §6 Phase 11 satırı (yukarıda alıntılandı) + §2.2 (workspace — W1'in kendi
   düzeltmesinden sonra artık iniş görünümü + hızlı-atlama şeridi, D-217/D-219) + §3 (A3 sheet,
   özellikle §3.0'ın "read `reference/TEMPLATE_ANALYSIS.md` first" kendi talimatı).
3. `reference/TEMPLATE_ANALYSIS.md` §11'den §16'ya **TAMAMI** — bu, D-149'un dört oturumluk
   çıktısının tek, biriktirilmiş kaydı:
   - **§11** — Rev00'ın kendisi olduğu gibi ölçülmüş geometrisi (§11.2 kolon, §11.3 satır/blok
     bütçesi ilk hâli, §11.4 A3-oturma boşluğu).
   - **§12** — "SAYFA SÖZLEŞMESİ" (Oturum A, D-154/155/156): §12.1-§12.3 gerçek pt-cinsinden
     ızgara/kolon/satır tablosu — bunlar **statik** ve muhtemelen doğrudan template dosyasına
     transkript edilebilir. §12.4-§12.6 (blok bütçesinin ilk versiyonu) **§12.8 tarafından
     GEÇERSİZ kılınıyor** — asıl matematik orada.
   - **§12.8** — esnek tahsis modeli (D-158/159, LOCKED): her kolon TAM 50 satır = 650.00 pt,
     blok sınırları içerik talebine göre KAYAR, her blok bir varsayılan + bir minimum taşır.
     Bu, `src/a3/layout/budget.ts`'in bugünkü STATİK mekanizmasından yapısal olarak farklı bir
     ikinci mekanizma — §0'ın kendi grep'i bunun henüz inşa edilmediğini doğruluyor.
   - **§13** — altı çalışma sayfası bulgusu (Oturum B1): Rev00'ın form modeli üç PDCA-uzun
     yaşam-döngüsü tablosu tutuyor (KPI-trend/aksiyon/kök-neden zinciri), uygulamanın
     `Entry`+`references[]` mimarisiyle ZATEN uyumlu — yeni bir domain modeli GEREKMİYOR, bu
     doğrulanmış bir rahatlık, yeniden tasarlanacak bir şey değil. §13.4 (Oturum C'nin
     inşa ettiği yeni method'lar — `sustainmentAudit`/`documentUpdatesTracker`/
     `yokotenTracker`/`lessonsLearned` vb.) ZATEN TAMAM, registry'de kayıtlı.
   - **§14** — blok görsel dili (Oturum B2/B3): **SEKİZ bloğun TAMAMI onaylandı** (§14.2 ADIM 1,
     §14.3 ADIM 7/`kpi-strip`, §14.4 ADIM 2/3/4, ve B3'ün kendi CLAUDE.md kaydındaki ADIM 5/6/8)
     — bu fazın kendi Block Visual Verification Loop borcu YOK, yalnızca zaten onaylı değerleri
     koda dökmek. **İstisna**: §14.2'nin problem-statement paneli (dört renk-kodlu bant —
     ultimate goal/ideal/current/problem) D-159'un kendi notuyla "henüz plugin yok" — bu fazın
     kendi tespiti gerekiyor: C2'nin `problem-impact`/`five-n1k`'i bunu kapsıyor mu?
   - **§15/§15.8** — D2/D2b'nin kendi kök-neden keşfi + düzeltmesi (`placeZones.ts`'teki iki
     kusur, D-189/190): kod ZATEN ŞİPPED (mevcut `farplas-7step-tr`'i etkilemedi, çünkü
     `smart-target`'in tek-satırlı zone'ları kusuru hiç tetiklemiyordu) ama **P-43'ün kendi
     görsel sign-off'u hâlâ owed** (CLAUDE.md'nin D-190 kaydı: "Barış has not yet looked at the
     redeployed artifact"). Yeni template'in `five-n1k`/`smart-target` zone'ları bu kod yolunu
     GERÇEKTEN kullanacak İLK üretim template'i olacak.
   - **§16** — G3'ün provisional kenar işareti (Faz 7) — zaten şipped, template-agnostic
     (`evaluateReadiness`'i okuyor, herhangi bir `A3Template`'e uygulanabilir), bu fazın işi
     değil, yalnızca teyit et.
4. `DECISIONS.md`'de bu fazı doğrudan etkileyen kilit kararlar (hepsini aç, özet burada
   yeterli değil): **D-95** (orijinal Faz 11 kapsamı — "-plus"/"-en" "trivial" deniyordu, bu
   hâlâ geçerli mi sorgulanmalı), **D-150–D-157** (Rev00 referans format + sayfa sözleşmesi +
   D-10'un varsayılan template değişimi — `farplas-7step-tr` legacy-compatibility'ye düşüyor),
   **D-158/D-159/D-160** (esnek tahsis modeli, LOCKED — arithmetic solver, AI layout'a hiç
   karışmıyor), **D-169/D-170/D-171** (tier sistemi + drag-handle arayüzü tasarımı + Block
   Visual Verification Loop metodolojisinin kendisi), **D-186** (P-40'ın filed olduğu C6
   oturumu), **D-189/D-190** (placeZones kusuru + düzeltmesi), **P-40** (esnek solver +
   drag-handle'ın Faz 11'e gated olduğunun kendi bulgusu — `pps-8step-auto` template'i
   VAR OLMADAN inşa edilemez), **P-43** (D2b'nin görsel sign-off'u hâlâ owed), **P-18**
   (BenefitCase/Onay formu'nun "Phase 11" diye işaretlendiği orijinal not).
5. `CLAUDE.md`'nin "Decisions already made — do not relitigate" bölümündeki Rev00/template
   paragrafları (satır ~30-45 civarı, "The reference format is..." ile başlayan) + "Current
   state"in en güncel kapanışı (Faz 10/K4, D-221 — bu oturumdan hemen önce).
6. Kendi taramanı yap — §0'daki komutları çalıştır, bu promptun kendi bulgularını (özellikle
   `templateId`'nin ölü kod olduğu iddiası) gerçek koda karşı bir kez daha doğrula.

---

## 2. Bu oturumun işi

**Kod YAZMA.** Üç çıktı: (1) yukarıdaki envanterin gerçek koda karşı bir kez daha doğrulanmış
hale getirilmesi, (2) Faz 11'in kendi dilim tablosu önerisi (`docs/oturumlar/README.md`'ye
benzer bir bölüm — D-114'ün "dilim başına bir yeni mekanizma" bütçesi burada muhtemelen
Faz 10'unkinden de büyük bir plan gerektiriyor, çünkü birikmiş kapsam çok daha somut ve geniş),
(3) gerçek açık tasarım sorularını `AskUserQuestion` ile Barış'a sormak.

### 2.1 Muhtemel gerçek açık sorular (kesin değil — dosyaları okuduktan sonra doğrula)

1. **Kapsamın gerçek sınırı ne?** SPEC'in orijinal lafzı üç template + BenefitCase istiyor,
   ama D-149'un bütün çalışması yalnızca TEK bir yeni template'e (`pps-8step-auto`, Rev00
   tabanlı) odaklandı. D-95'in "`-plus`/`-en` trivial, `-tr`'nin pipeline'ı kanıtlanınca kolay"
   varsayımı hâlâ geçerli mi, yoksa Barış bu ikisini artık istemiyor mu (D-157 zaten
   `farplas-7step-tr`'i "legacy-compatibility"e düşürdü — `-plus`/`-en` onun türevleri, aynı
   soru onlar için de geçerli olabilir)?
2. **Template seçim/switching mekanizması sıfırdan mı inşa ediliyor?** §0'ın kendi bulgusu:
   `templateId` şemada var ama hiçbir yerde okunmuyor — `a3Preview.ts` `farplas7StepTr`'i
   sabit kodluyor. Bu, yeni template'in kendi geometrisinden BAĞIMSIZ, bugün bile (yalnızca
   `farplas-7step-tr` ile, ikinci bir template olmadan) test edilebilir bir mekanizma —
   `getTemplateById`-benzeri bir registry + `a3Preview.ts`'in gerçekten `project.templateId`'yi
   okuması + proje-oluşturma zamanında bir template seçici UI + SPEC'in kendi done-koşulu olan
   "switching preserves every entry, warns before appendix." Bu, kendi erken/bağımsız bir
   dilim mi olmalı (yeni template'in geometrisi bitmeden BİLE başlanabilir)?
3. **Esnek tahsis solver'ı (D-158/159/160) + drag-handle arayüzü (D-170) İLK dilimde mi
   gerekiyor?** P-40 ikisini de "Faz 11'e gated" diye işaretlemiş ama sıra kesin değil — ilk
   sürüm D-158'in STATİK varsayılan satır sayılarıyla (örn. sabit 14/28/8 sol, 20/8/8/8/6 sağ)
   gönderilip esnek kısmı ayrı bir dilime bırakabilir mi, yoksa D-158'in kendi "bu bir
   layout-time allocation, statik bir sabit değil" ilkesi baştan mı uygulanmalı?
4. **ADIM 1'in problem-statement paneli için gerçekten yeni bir plugin mi gerekiyor?**
   D-159'un notu: dört renk-kodlu bant (ultimate goal/ideal/current/problem) "has no plugin
   yet." C2'nin `problem-impact` (Pareto + finansal kayıp formu) ve `five-n1k` bunu kapsamıyor
   gibi görünüyor (farklı veri şekilleri) — gerçekten yeni bir method mu, yoksa var olan
   `gapStatement`'ın renderToA3'ünün bu şekle mi uyarlanacağı?
5. **D-153'ün header identity band alanları (Öncelik, Hedef Kapanış, Genel RAG)
   `ProjectMetaSchema`'ya nasıl ekleniyor?** "Genel RAG"ın kendi Red/Amber/Green vokabüleri
   nereden geliyor — D-41'in zaten LOCKED status-glyph dili mi (■/▲/●) yeniden mi kullanılıyor,
   yoksa yeni, üçüncü bir görsel dil mi? (B2'nin kendi CLAUDE.md notu bu soruyu Oturum C'ye
   bırakmıştı, hâlâ cevapsız.)
6. **BenefitCase/Onay formu nereye bağlanıyor?** D-153 Rev00'ın benefit/cost finansal footer'ı
   TAŞIMADIĞINI kaydediyor (yalnızca `farplas-7step-tr`'de vardı, hâlâ unbound, P-18). Yeni
   template bunu hiç göstermeyecekse, `BenefitCase` nerede yaşıyor — ayrı bir ekran/rapor mu,
   bir ek (appendix) sayfası mı, yoksa bu fazın kapsamı dışına mı (kendi P-numarasıyla)?
7. **P-43'ün (D2b'nin görsel sign-off'u) bu faza dahil edilmesi gerekiyor mu?** Yeni template
   `five-n1k`/`smart-target` zone'larını GERÇEKTEN üretimde kullanacak ilk template olacak —
   D-190'ın kod düzeltmesi test edilmiş ama Barış hiç görmedi. Bu, yeni template'in kendi ilk
   Block Visual Verification Loop turuna mı bağlanmalı (aynı anda doğrulanır), yoksa ayrı,
   önce mi halledilmeli?
8. **Dilim sayısı ve sırası.** Muhtemel aday bölünme (Barış'a önerilecek, kesin değil —
   D-114'ün bütçesi muhtemelen Faz 10'unkinden (K1-K4, dört dilim) daha büyük bir plan
   gerektirir):
   - **L0** — template registry + seçim mekanizması (madde 2'nin cevabına göre, belki en erken/
     en bağımsız dilim — bugün bile tek template'le test edilebilir).
   - **L1** — `pps-8step-auto`'nun statik geometrisi (§12.1-§12.3'ten transkript: kolonlar,
     satırlar, PDCA renkleri, header/footer identity band) + hangi method'un hangi bloğa
     gittiği (§13.4/tier sistemi zaten çoğunu cevaplıyor) + D-158'in varsayılan (henüz statik)
     satır sayıları.
   - **L2** — blok görsel dili wiring (§14'ün TAMAMININ koda dökülmesi) + P-43'ün görsel
     sign-off'u (madde 7'nin cevabına göre).
   - **L3** — esnek tahsis solver (D-158/159/160) + drag-handle arayüzü (D-170) — eğer L1'e
     dahil edilmediyse.
   - **L4** — template switching UI: preserve-every-entry + appendix-öncesi uyarı (SPEC'in
     kendi lafzî done-koşulu) — L0+L1'in ikisi de bittikten sonra anlamlı.
   - **L5** — `farplas-7step-plus`/`farplas-7step-en` (madde 1'in cevabına göre, gerekiyorsa).
   - **L6** — `BenefitCase`/`Onay formu` calculator (madde 6'nın cevabına göre, gerekiyorsa).
   - Bu sıralama ve bölünme kesin değil — Faz 6'nın 6a-6e'si, Faz 9'un J1-J3'ü, Faz 10'un
     K1-K4'ü gibi, bu oturumun kendi işi doğru sınırları bulmak.

### 2.2 Kapsam dışı (bu oturumda kesinlikle karara BAĞLANMAZ)

- Gerçek kod yazımı — bu oturum yalnızca ölçer ve sorar.
- D-149'un LOCKED kararlarının (D-158/159/160/165/169/170/171, sayfa sözleşmesinin kendisi)
  yeniden tartışılması — bu oturum onları UYGULAR, sorgulamaz.
- Workspace Yüzey Yenilemesi (W1/W2/W3, D-217) — Faz 11'den TAMAMEN bağımsız, kendi track'i;
  sıralama Barış'ın kendi tercihi, bu oturumun konusu değil.
- P-58 (Farplas görsel yönünün Faz 1-10'da inşa edilmiş eski bileşenlere yayılması) — ayrı,
  kendi kapsamı.
- Faz 10'un kendi P-numaraları (P-53/P-54/P-56/P-57/P-60/P-61) — bu fazın konusu değil.

---

## 3. Bütçe ve kapanış disiplini

Açılışta kaba bir tahmin ver (Anayasa Madde 1) — bu envanterin kendi boyutu Faz 8/9/10'un
kapsam-belirleme oturumlarından daha büyük olabilir (D-149'un dört oturumluk çıktısını tek
seferde sindirmek gerekiyor), gerekirse §1'in okuma sırasını iki oturuma bölmeyi düşün (önce
TEMPLATE_ANALYSIS.md §11-16, ayrı bir oturumda DECISIONS.md'nin ilgili D-numaraları + Barış'a
sorular) — ama bu bölünmenin kendisi de Barış'a AÇIKÇA söylenmeli, sessizce yarım bırakılmamalı.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bu oturumun kendi bulgu ve dilim planı —
**gerçek bir sonraki numarayı bu oturum başladığında `DECISIONS.md`'yi okuyarak doğrula, körü
körüne bir sayı yazma** — K4'ün kendi kapanışı sırasında eşzamanlı bir oturum D-220'yi almıştı,
aynı çakışma burada da olabilir), `docs/oturumlar/README.md`'ye Faz 11'in kendi dilim tablosu,
`CLAUDE.md`'nin "Current state"ine "Phase: 11 of 12 — kapsam belirlendi, henüz inşa edilmedi"
türü bir güncelleme. Kod yok, ama docs değişikliği yine de commit'lenebilir (yalnızca docs
dokunduğu için düşük riskli — `AKIS.md`'nin kalıcı commit yetkisi burada da geçerli).

---

**Model önerisi:** Bu oturumun KENDİSİ yalnızca ölçüm/soru-çıkarma — Sonnet 5 yeterli. Ama
D-28'in routing ilkesi ("architectural decisions → Opus") gerçek dilimlerin çoğunda (özellikle
L0'ın template-seçim mimarisi ve L3'ün esnek solver implementasyonu, ikisi de D-149'un kendi
tasarımından koda geçerken gerçek mimari kararlar gerektirecek) devreye girebilir — Faz 10'un
K1-K4'ünün her birinin kendi launch prompt'unda yaptığı gibi.
