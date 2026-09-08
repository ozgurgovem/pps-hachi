# OTURUM P-62 — `farplas-7step-plus`/`farplas-7step-en` kapsam belirleme

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

1. **`-en` gerçekten yeni bir GEOMETRİ mi, yoksa yalnızca bir ÇEVİRİ mi?** D-188 zaten
   `farplas-7step-tr`'nin dışa aktarım metinlerini `project.meta.language`'e göre TR/EN
   arasında değiştirebiliyor (Oturum D1). Eğer `-en`'in tek farkı "printed template labels
   İngilizce" ise, bu YENİ bir şablon dosyası gerektirmeyebilir — `farplas-7step-tr.ts`'in
   kendisi zaten iki dilli render edebilir hâle getirilebilir (şablonun statik `label`/
   `TemplateField.label` alanları da `language`'e göre seçilsin), ki bu P-62'yi neredeyse
   kapatır. Bu, `-plus`'tan TAMAMEN bağımsız, kendi başına küçük bir soru.
2. **`-plus`'ın "sekiz disiplini yedi bloğa sığdırma" tasarımı hâlâ doğru mu?** `pps-8step-auto`
   artık gerçek, 8-blok bir alternatif olarak var — `-plus`'ın orijinal gerekçesi (Farplas'ın
   kendi 7-adım .xls formuna sadık kalmak, ama Toyota'nın 8 adımını da öğretmek) hâlâ geçerli
   mi, yoksa `pps-8step-auto`'nun kendisi (Rev00, Farplas'ın onayladığı form, D-157/P-29) bu
   ihtiyacı zaten karşılıyor mu? Eğer öyleyse `-plus` tamamen gereksiz kalabilir.
3. **Gerçek bir kullanım senaryosu var mı, yoksa bu tamamen spekülatif mi?** Anayasa Madde 1'in
   "iş kabaca ne yakar" sorusu — Barış'ın şu an gerçek bir proje/müşteri için `-plus` ya da
   `-en`'e ihtiyacı var mı, yoksa bu SPEC'in orijinal (Faz 4 zamanındaki, D-01 öncesi)
   spekülasyonunun bir kalıntısı mı? Cevap "hayır, gerçek ihtiyaç yok" ise, bu oturumun kendi
   sonucu P-62'yi KAPATMADAN "kasıtlı olarak YAGNI, gerçek talep gelene kadar ertelendi" diye
   güncellemek olabilir — Faz 12'ye ya da hiçbir yere hiç kod yazmadan.

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
