# OTURUM Faz 12 — M4: Polish (CLAUDE.md Quality floor'un ilk sistematik denetimi)

> Faz 12 kapsam belirleme (D-230, 2026-09-08) Barış'a soruldu: "Polish" ne kapsar, P-58 dahil
> mi? **Cevap: P-58 ayrı kalsın** — Faz 12'nin kendi "polish" dilimi P-58'in yüksek
> patlama-yarıçaplı `src/ui/` görsel-dil migrasyonunu kapsamaz. Bunun yerine bu dilim,
> `CLAUDE.md`'nin kendi "Quality floor — never announce it, always meet it" listesini (klavye
> navigasyonu, görünür focus ring, WCAG AA kontrast, reduced motion, layout shift yok, unhandled
> promise rejection yok, console noise yok) proje çapında **ilk kez sistematik olarak** denetler
> — bugüne kadar yalnızca ad hoc, tek tek bileşenlerde uygulandı, hiçbir oturum bunu uçtan uca
> taramadı.
>
> Bu dosyanın kendi önceki bulgusu (Faz 12 kapsam belirleme sırasında yapılan hızlı bir grep):
> temel yapı zaten büyük ölçüde SAĞLAM görünüyor (14 dosya `focus-visible:` kullanıyor,
> `prefers-reduced-motion` bir kez doğru işleniyor, yalnızca 3 dosyada bilinçli/belgelenmiş
> `console.*` çağrısı var) — bu dilim YENİ bir hata avı değil, **gerçek bir doğrulama+kapatma**
> turu, üstünkörü "muhtemelen iyidir" varsayımını mekanik/elle kontrolle kanıta çevirmek.
>
> Kanonik konum: `docs/oturumlar/M4-polish-kalite-tabani.md`. Yazıldı: 2026-09-08, Faz 12
> kapsam belirleme oturumunda (D-230).

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
grep -rln "focus-visible:" src/ui src/app --include="*.tsx" | wc -l
  # 2026-09-08'de 14 dosya. Bu sayı bu dilim başlarken düştüyse (yeni bir bileşen focus ring'i
  # unuttuysa) DUR ve önce onu bul.

grep -n "prefers-reduced-motion" src/index.css
  # `@media (prefers-reduced-motion: no-preference)` bekleniyor — animasyon yalnızca kullanıcı
  # AÇIKÇA "reduce motion" istemediğinde çalışıyor (doğru yön — ters çevrilmiş olsaydı YANLIŞ
  # olurdu).

grep -rln "console\.\(log\|warn\|error\)" src --include="*.ts*" | grep -v test
  # 2026-09-08'de üç dosya: rasterize.ts (D-136, görsel rasterizasyon hatası loglama, bilinçli),
  # resolveAssetImages.ts (D-194, çözülemeyen görsel referansı loglama, bilinçli),
  # a3PreviewWindow/window.ts (D-134, Tauri IPC hatası loglama, bilinçli). ÜÇÜ de belgelenmiş,
  # kasıtlı — "console noise" DEĞİL, hata görünürlüğü. Yeni bir dördüncü dosya çıkarsa incele:
  # bilinçli mi, yoksa unutulmuş bir debug `console.log` mu?

grep -rn "\.catch(\|unhandledrejection" src --include="*.ts*" | grep -v test | wc -l
  # 2026-09-08'de 2 eşleşme — düşük. Her `void someAsyncCall()` / `.then()` zincirinin gerçekten
  # bir hata yolu olup olmadığını (yutulmuş bir promise reddi var mı) elle taramak bu dilimin
  # asıl işi, yalnızca `.catch(` sayısı yeterli KANIT değil.

grep -rn "aria-label\|role=" src/app/routes/workspace --include="*.tsx" | wc -l
  # Klavye/screen-reader erişilebilirliğinin ne kadar yaygın olduğuna dair kaba bir taban
  # çizgisi — bu dilimin kendi elle klavye-navigasyon turu için başlangıç noktası.
```

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Bu dilimin gerçek işi

### 1.1 Klavye navigasyonu — ELLE, ekran gerektiriyor (SÜREÇ ağırlıklı)

Bu ortamda ekran/Tauri runtime yok (bu proje boyunca tekrar eden, dürüstçe kaydedilen boşluk
sınıfı — D-105/D-113/D-136/… ile aynı). Bu dilimin KOD tarafı statik analiz + `aria-*`/`role`
denetimidir; **gerçek Tab/Shift+Tab/Enter/Escape ile uçtan uca gezinme Barış'ın kendi
`npm run tauri dev` turunda yürünmeli** — landing kartlarından (StepOverview) bir adıma girmek,
accordion'u klavyeyle açıp kapatmak, `EntryEditorPanel`'i klavyeyle doldurup kaydetmek/iptal
etmek, `ProjectToolsBar`'ın dialog'larını (Traceability/Review/Audit/Translate) klavyeyle
açıp kapatmak. Odak (focus) her adımda GÖRÜLEBİLİR mi, mantıksal sırada mı ilerliyor mu?

### 1.2 WCAG AA kontrast — mekanik olarak kontrol edilebilir

D-49'un token setinin (Vellum/Graphite/Non-Repro/Steel/Indelible/Kraft/Danger) kendi WCAG
oranları Phase 1'de bir kez hesaplandı (Steel, Non-Repro'nun 1.86:1 başarısız olduğu için
eklendi — D-49'un kendi notu). D-218/D-219'un yeni Farplas token'larının (`--color-fp-*`) AYNI
hesap hiç yapılmadı — bu dilimin kendi işi, her `--color-fp-*` çiftini (metin/arka plan olarak
kullanılan her kombinasyon) hem light hem dark temada 4.5:1 (normal metin) / 3:1 (büyük
metin/UI sınırları) karşısında hesaplamak. Bir kontrast hesaplayıcı script (küçük, saf fonksiyon,
scratchpad'de yazılıp silinebilir, D-136'nın "kullan sonra sil" pratiği) ya da bilinen bir CLI
aracı (`wcag-contrast` gibi bir npm paketi, geçici `npx` ile) kullanılabilir.

### 1.3 Reduced motion — mekanik + elle

`src/index.css`'in kendi `@media` bloğu doğru yönde (§0'da doğrulandı). Bu dilimin kendi işi:
hangi animasyonların bu bloğun İÇİNDE tanımlı olduğunu listelemek ve blok DIŞINDA (yani her
zaman çalışan) bir geçiş/animasyon var mı diye taramak — `transition`/`animation` CSS
özelliklerinin `prefers-reduced-motion` sorgusuna göre koşullu olup olmadığını doğrulamak.

### 1.4 Layout shift — elle, ekran gerektiriyor

CLS'in (Cumulative Layout Shift) gerçek ölçümü bir tarayıcı DevTools Performance paneli/
Lighthouse gerektirir — bu ortamda yok. Bu dilimin kendi kod-tarafı işi: içerik yüklenmeden önce
sabit boyut ayırmayan (yani içerik gelince büyüyüp/küçülen) konteynerları grep ile aramak
(`min-height`/`aspect-ratio` olmadan koşullu render eden bileşenler) — özellikle W3'ün yeni
`A3PreviewReservedBand`'i (kendi "waiting" mesajından gerçek içeriğe geçerken boyut değişiyor mu?)
ve `StepOverview`'in kart grid'i (entry sayısı yüklenmeden önce/sonra kart yüksekliği değişiyor
mu?).

### 1.5 Unhandled promise rejection — elle kod taraması

§0'ın kendi grep'i yalnızca `.catch(` SAYISINI veriyor, KANIT değil. Bu dilimin kendi işi: her
`void someAsync()` çağrısını (D-134'ün kendi deseni — `void`-çağrılan bir async fonksiyonun
reddi görünmez şekilde kaybolabilir) bulup, İÇİNDE gerçek bir try/catch olduğunu doğrulamak.
D-134 bu sınıfı bir kez buldu (`a3PreviewWindow`'da) — bu dilimin işi AYNI sınıfın başka bir
yerde tekrarlanıp tekrarlanmadığını (G2'nin kendi dersi) kontrol etmek.

---

## 2. Kapsam dışı

- P-58 (görsel dil yayılması, `src/ui/`'nin 12 primitifi) — Barış'ın kendi kararıyla AÇIKÇA
  dışarıda.
- Gerçek bir ekran gerektiren maddelerin (§1.1, §1.4) TAM doğrulanması — bu dilim kod-tarafı
  hazırlığı yapar, gerçek yürüyüş Barış'a kalır, dürüstçe "owed" olarak kaydedilir.
- Yeni bir tasarım/görsel değişiklik — bu dilim BULGU + küçük DÜZELTMe yapar, yeni bir görsel
  dil icat etmez.

---

## 3. Bütçe ve kapanış disiplini

Küçük, sistematik bir denetim — yeni bir mimari mekanizma yok, D-114 bütçesine kolayca sığar.
Bulunan her gerçek ihlal küçük, odaklı bir düzeltme olarak ele alınır; büyük bir tane çıkarsa
(örn. çok sayıda kontrast ihlali) ayrı bir P-item olarak filed edilip bu dilimden ayrılabilir.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası (bulunan/düzeltilen her şeyin dökümü), Faz 12
tablosundaki M4 satırının durumu, `CLAUDE.md`'nin Current state'ine özet.

---

**Model önerisi**: sistematik ama küçük bir denetim — Sonnet 5 yeterli (D-28).
