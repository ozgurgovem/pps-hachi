# OTURUM P-62 — `farplas-7step-plus`/`farplas-7step-en` kapsam belirleme

> **DURUM (2026-09-08, D-232): §0'ın gerçek-koda-karşı doğrulaması yapıldı, gerçek kanıt
> toplandı, §2.1 aşağıda kanıtla keskinleştirildi — ama bu oturumun ortamında (izole git
> worktree, arka-plan/paralel ajan) `AskUserQuestion` aracı HİÇ mevcut değildi, `ToolSearch`
> ile arandı ve bulunamadı. Barış'a gerçek zamanlı soru sorulamadı — kapsam kararı PENDING,
> fabrik edilmiş bir "Barış'ın seçimi" YOK.** Aşağıdaki §2.1, bir sonraki interaktif oturumda
> (ya da Barış'ın kendisiyle doğrudan) çalıştırılmaya hazır, kanıtla desteklenmiş iki soru
> hâline getirildi — üçüncü madde (BenefitCase/gerçek-ihtiyaç sorusu) zaten bu iki sorunun
> içine gömülü. Tam kayıt: `DECISIONS.md` D-232, P-62'nin kendi satırındaki "Update
> 2026-09-08" notu.

> Faz 11'in orijinal `SPEC.md` §6 lafzı üç yeni şablon sayıyordu: `farplas-7step-plus`,
> `farplas-7step-en`, `pps-8step-auto`. D-223'ün kendi kapsam-belirleme oturumunda (2026-09-06)
> Barış'ın kendi seçimiyle (`AskUserQuestion`) Faz 11'in gerçek dilim planı yalnızca
> `pps-8step-auto` + template switching'e daraltıldı — `farplas-7step-plus`/`-en` **P-62**'ye
> filed edildi, D-149'un dört oturumluk (Oturum A/B1-B3/C1-C6/D1-D2b) derinliğinin HİÇBİRİNİ
> hiç almadı. Bu dosya P-62'nin kendi kapsam-belirleme oturumu — `faz11-kapsam-belirleme.md`'nin
> AYNI yöntemi.
>
> Kanonik konum: `docs/oturumlar/P62-kalan-sablonlar-kapsam.md`. Yazıldı: 2026-09-08, W3'ün
> kapanışında, Barış'ın "sıradaki iş" sorusuna cevaben.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
grep -n "farplas-7step-plus\|farplas-7step-en" src/a3/templates/*.ts src/a3/templates/registry.ts
  # HİÇBİR üretim dosyası bekleniyor — TEMPLATE_REGISTRY yalnızca farplas7StepTr ve
  # pps8StepAuto'yu tanıyor (D-223/L1'in kendi kaydı). Farklıysa DUR, bu dosya eski.

grep -n "farplas-7step-plus\|Template B\|§3.0\|§3.1" SPEC.md reference/TEMPLATE_ANALYSIS.md | head -30
  # SPEC.md'nin orijinal metni bu iki şablonun geometrisini/felsefesini nasıl tarif ediyordu
  # (D-27'nin kendi kaydı: "Template B geometry stays blocked") — bu hâlâ geçerli mi, yoksa
  # pps-8step-auto'nun L1'de gerçekten inşa edilmesi bu varsayımların bir kısmını geçersiz mi
  # kıldı, bu oturumun kendi sorusu.

grep -n "D-95\b" DECISIONS.md
  # D-95'in kendi tam metnini oku — "-plus"/"-en"'in Phase 4'ten Phase 11'e ertelenme gerekçesi
  # ve "trivial once -tr's pipeline is proven" varsayımı, hiç test edilmedi.

ls reference/*.xls reference/Examples/ 2>/dev/null
  # D-149'un dört oturumu (Oturum A/B1-B3/C1-C6/D1-D2b) pps-8step-auto (Rev00 tabanlı) için
  # kullandığı gerçek kaynak dosyalar hangileriydi — farplas-7step-plus/-en için KARŞILIK GELEN
  # bir kaynak dosya var mı, yoksa bunlar yalnızca farplas-7step-tr'nin kendi türevleri
  # (ek disiplinler eklenmiş / İngilizce çevrilmiş) mi olacak?
```

`DECISIONS.md`'de **P-62**'nin (bu ertelemenin kaydı) ve **D-95**'in (orijinal Phase 4 kararı)
tam metnini oku. `SPEC.md` §3.0/§3.1'i (Farplas'ın .xls formlarının kendi analizi, artık "the
record of the existing company form, not the design target" olarak CLAUDE.md'de yeniden
çerçevelenmiş) baştan sona oku — `farplas-7step-plus`'ın "seven printed blocks, eight
disciplines via sub-bands inside the STEP 5 box" tarifi hâlâ P-62'nin kendi notunun sorduğu gibi
doğru şekil mi, `pps-8step-auto` gerçek bir 8-blok alternatif olarak var olduğuna göre?

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacaksa. Bu oturum muhtemelen büyük
   ölçüde kapsam-belirleme + şablon geometrisi transkripsiyonu (D-149'un Oturum A'sının kendi
   emsali) — gerçek `.ts` şablon dosyası yazımı bu dosyanın kendi kapsamına GİREBİLİR de,
   girmeyebilir de (bkz. §2.1 madde 1).
2. `DECISIONS.md`: **D-95** (orijinal erteleme kararı), **P-62** (bu dosyanın kendi konusu),
   **D-149** (dört-oturumluk kapsam-belirleme+görsel-dil+plugin-inşası yönteminin TAM özeti —
   `pps-8step-auto` için nasıl yürüdüğü), **D-157** (`pps-8step-auto`'nun varsayılan şablon
   olması, `-tr`'nin legacy-compatibility'e düşmesi — bu, `-plus`/`-en`'in artık HİÇ öncelik
   taşımadığı anlamına mı geliyor, yoksa hâlâ gerçek bir kullanım senaryosu (İngilizce konuşan
   bir müşteri, ya da `-tr`'nin 7-adım biçimini tercih eden ama ek disiplinler isteyen bir
   ekip) mi var?).
3. `SPEC.md` §3.0/§3.1/§3.3 (orijinal Farplas .xls analizi, D-01'in kendi düzeltmeleri dahil).
4. `reference/TEMPLATE_ANALYSIS.md` — özellikle §3 (gerçek .xls geometrisi, hâlâ otoriter) ve
   D-149'un dört oturumunun kendi bölümleri (§9 sonrası, §11, §12, §13, §14, §15) — bunlar
   `pps-8step-auto` için yazıldı, ama `-plus`/`-en`'in ne kadarının bu ÇALIŞMAYI yeniden
   kullanabileceği (örn. §14'ün blok görsel dili, D-165'in palet kararı) bu oturumun kendi
   sorusu.
5. `src/a3/templates/farplas-7step-tr.ts` — `-plus`'ın muhtemel başlangıç noktası (aynı 7-blok
   iskelet, ek disiplinler eklenmiş), `-en`'in muhtemel başlangıç noktası (aynı geometri, TR
   metinleri EN'e çevrilmiş — D-188'in kendi zaten inşa edilmiş i18n mekanizması, `A3EntrySummary.
   language`, doğrudan kullanılabilir mi?).
6. `src/a3/templates/registry.ts` — yeni şablonların nereye ekleneceği, `getTemplateById`'nin
   bilinmeyen id fallback davranışı (D-157'nin kendi notu, değişmemeli).

---

## 2. Kapsam

### 2.1 Gerçek açık sorular — Barış'a `AskUserQuestion` ile sorulmalı

> **2026-09-08 güncellemesi (D-232): §0 çalıştırıldı, aşağıdaki iki soru artık gerçek kanıtla
> keskinleştirildi — orijinal üç madde (spekülatif) yerine.** Kanıt: `reference/
> TEMPLATE_ANALYSIS.md` §9.5/§9.6 (2026-08-01'de, Faz 4'ten önce, `PPS_A3_Format_ENG.xls`/
> `PPS_A3_Format_TR.xls`'in kendi BIFF8 kayıtlarından yazıldı, hiç bu soruya bağlanmamıştı).

1. **`-en` gerçekten yeni bir GEOMETRİ mi, yoksa yalnızca bir ÇEVİRİ mi? — CEVAP: gerçek bir
   geometri, kanıtlandı, D-188'in i18n mekanizması TEK BAŞINA yetmez.** §9.5: TR'de spacer
   satırı yok (ENG'de var, 7.2 pt), başlık satırları 20.15 pt (ENG 20.10 pt), footer farklı —
   §9.5'in kendi sözü: "TR needs its own row table in the template definition — reusing
   ENG's with an offset will drift by ~0.8 pt over the sheet." §9.6: kayıp taksonomisi
   kategori SAYISI farklı — ENG 7 (Work Safety/Costing/Productivity/Quality/**Maintenance**/
   Human Resources/Environment), TR 8 (aynı liste, Maintenance ikiye bölünmüş: **Bağı.
   Bakım**/**Prof. Bakım**) — §9.6'nın kendi sözü: "the loss taxonomy is a per-template
   list, not a shared constant... a single hardcoded taxonomy will silently corrupt one of
   the two." **Rastlantısal bulunan, ilgili bir gap (P-66, D-232)**: şu an ZATEN ŞEVK EDİLMİŞ
   `tpmLossTaxonomy` (D-122) ENG'in 7-kategorili listesini kullanıyor — `farplas-7step-tr`'nin
   kendi "byte-faithful to the approved form" iddiasına rağmen, gerçek TR formunun 8
   kategorisi DEĞİL. **Sorulacak soru artık bu değil ("geometri mi çeviri mi"), şu**:
   geometri gerçekten farklı olduğuna göre (analiz ~%95 hazır, §9.8'in üç küçük maddesi
   dışında) — (a) `-en`'in kendi küçük ama gerçek bir template dosyası (kendi satır tablosu +
   kendi 7-kategorili kayıp listesi) inşa edilsin mi (kendi küçük bir oturum, D-149'un Oturum
   A'sının çok daha küçük bir versiyonu — geometri zaten analiz edilmiş, iş çoğunlukla
   transkripsiyon), (b) `pps-8step-auto`'nun zaten sunduğu gerçek TR/EN çift-dilli export
   (D-188/L1, D-224) yeterli sayılıp `-en` kapansın (YAGNI), yoksa (c) emin değilim,
   ertelensin?
2. **`-plus`'ın "sekiz disiplini yedi bloğa sığdırma" tasarımı hâlâ doğru mu? — CEVAP: gerçek
   bir gerilim var, kod okumakla çözülemez.** `pps-8step-auto` artık gerçek, Farplas'ın
   onayladığı (D-157/P-29) 8-blok bir alternatif olarak var — `-plus`'ın orijinal gerekçesi
   (SPEC §3.0: "re-approval gerektirmeden 8 disiplin, mevcut basılı 7-blok forma sadık
   kalarak") kısmen zayıflamış olabilir, çünkü Rev00 da zaten onaylı. Ama `pps-8step-auto`
   Farplas'ın şu an gerçekten basılı/kullanılan 7-blok formunun YERİNE geçmiyor — yeni bir
   seçenek olarak duruyor (D-157: "`farplas-7step-tr` is demoted... it stays in the registry
   so existing 7-step A3s open and export"). Mevcut basılı forma sadık kalmak ZORUNDA olan
   bir ekip için `-plus`'ın değer önerisi teorik olarak hâlâ ayakta olabilir. **Sorulacak
   soru**: (a) `-plus` gerçek bir kullanım senaryosuna hizmet ediyor, kendi küçük bir
   scope-definition oturumu (D-149'un Oturum A/B1-B3'ünün küçültülmüş versiyonu, gerçek yeni
   geometri gerektirir) açılsın mı, (b) `pps-8step-auto` onu zaten gereksiz kılıyor, `-plus`
   P-62'den YAGNI olarak kapansın mı, yoksa (c) emin değilim, ertelensin?

Her iki soruda da (c) seçilirse P-62 aynen kalır, yalnızca bu oturumun kanıtıyla
zenginleşmiş olarak.

### 2.2 Muhtemel dilim adayları (madde 2.1'in cevaplarına göre büyük ölçüde değişir)

- Eğer `-en` yalnızca çeviri ise: `farplas-7step-tr.ts`'in kendi statik metinlerini
  `language`'e göre seçen küçük bir genişleme — muhtemelen tek bir dilim, D-114'ün bütçesi
  içinde.
- Eğer `-plus` gerçek yeni bir geometri gerektiriyorsa: D-149'un kendi dört-oturumluk
  yönteminin (sayfa sözleşmesi → blok anatomisi/plugin eşlemesi → görsel dil → plugin inşası)
  bir türevi — muhtemelen kendi çok-dilimlik planı, tek oturumda YAPILMAMALI (D-114/Anayasa
  Madde 1).
- Eğer madde 2.1.3'ün cevabı "gerçek ihtiyaç yok" ise: kod YAZILMAZ, yalnızca P-62 güncellenir.

---

## 3. Kapsam dışı

- `pps-8step-auto`'ya dokunmak — zaten TAM BİTTİ (L1/L2/L3a/L3b), bu oturum onu yeniden
  AÇMIYOR.
- `farplas-7step-tr`'ye dokunmak (madde 2.1.1'in cevabı "yeni dosya" ise hariç) — legacy-
  compatibility template, D-157.
- `BenefitCase`/`Onay formu` (P-18) — ayrı, kendi gelecekteki kapsam oturumunu bekliyor.
- Faz 12'nin kendi kapsamı (`docs/oturumlar/faz12-kapsam-belirleme.md`) — bağımsız.

---

## 4. Bütçe ve kapanış disiplini

Bu oturum muhtemelen KENDİ İÇİNDE iki aşamalı: önce §2.1'in gerçek sorularına cevap (kod yok),
sonra — yalnızca gerçek bir ihtiyaç doğrulanırsa — bir dilim planı. Anayasa Madde 1'in "işi
böl" ilkesi burada özellikle geçerli: `-plus` gerçek yeni geometri gerektiriyorsa, bu oturum
KENDİSİ kod yazmamalı, D-149'un kendi emsaline uygun ayrı bir "Oturum A" (sayfa sözleşmesi)
launch prompt'u yazıp kapanmalı.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, P-62'nin kendi satırının güncellenmesi
(kapandı/daraltıldı/yeni bir plana bağlandı), `docs/oturumlar/README.md`'ye yeni bir bölüm.

---

**Model önerisi**: kapsam belirleme turu Sonnet 5 yeterli (D-28) — eğer madde 2.1.2'nin cevabı
gerçek yeni bir görsel/geometri tasarımı gerektiriyorsa, D-149'un kendi Oturum B2/B3'ünün
(Block Visual Verification Loop) izlediği yol tekrarlanmalı, o da Sonnet 5 ile yapıldı.
