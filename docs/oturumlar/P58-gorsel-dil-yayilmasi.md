# OTURUM P-58 — Farplas görsel dilinin uygulamanın geri kalanına yayılması

> W1 (D-218/D-219) Farplas'ın gerçek kurumsal marka kılavuzundan (teal/kırmızı/antrasit +
> Source Sans 3) yeni bir görsel yön inşa etti, ama **kasıtlı olarak yalnızca İKİ yeni yüzeye**
> uyguladı — iniş görünümü (`StepOverview`) ve adım sayfası çerçevesi. Faz 1-10'da zaten inşa
> edilmiş düzinelerce bileşen (`Button`/`Badge`/`Checkbox`/`Dialog`/`Input`/`Label`/`Select`/
> `StepTick`/`Tabs`/`Textarea`/`ThemeToggle`/`Tooltip`, hepsi `src/ui/`) D-48'in ESKİ token
> setinde (`--surface`/`--ink`/`--accent` vb., D-49) kaldı — bilerek, W1-insa.md'nin kendi
> "yüksek patlama-yarıçapı" uyarısıyla. Bu, W1 sonrası uygulamada GEÇİCİ bir görsel tutarsızlık
> yarattı: yeni sayfalar Farplas markalı, eski sayfalar D-48'in orijinal (marka-tarafsız)
> paletinde.
>
> Kanonik konum: `docs/oturumlar/P58-gorsel-dil-yayilmasi.md`. Yazıldı: 2026-09-08, W3'ün
> kapanışında, Barış'ın "sıradaki iş" sorusuna cevaben.

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
grep -n "fp-teal\|fp-red\|fp-charcoal\|fp-gray\|font-fp-display" src/index.css
  # D-218/D-219/D-220'nin yedi --color-fp-* token'ı + --font-fp-display, iki katmanlı desende
  # (primitif :root/[data-theme="dark"]'ta, @theme yalnızca var() ile işaret ediyor — D-220'nin
  # kendi cascade-layer düzeltmesi) bekleniyor. Farklıysa DUR, bu dosya eski.

grep -rln "color-fp-\|font-fp-display" src/ui/ src/app/routes/workspace/StepOverview.tsx \
  src/app/routes/workspace/StepQuickJump.tsx src/app/routes/workspace/StepPage.tsx
  # Yalnızca StepOverview/StepQuickJump/StepPage (ve muhtemelen A3PreviewReservedBand,
  # AssistantColumn gibi W2/W3'te eklenen dosyalar) bekleniyor — src/ui/ altında HİÇBİR
  # eşleşme bekleniyor. Eşleşme varsa, W2/W3 kapsamı bu dosyanın düşündüğünden daha geniş
  # yayılmış demektir, DUR ve kontrol et.

grep -c "surface\|--ink\b\|--accent\b" src/ui/*.tsx | grep -v ":0"
  # src/ui/'daki her bileşenin D-48'in ESKİ token'larına (Tailwind sınıfları: bg-surface,
  # text-ink, bg-accent vb.) hâlâ bağımlı olduğunu doğrula — bu oturumun değiştireceği asıl
  # yüzey.

grep -rln "bg-surface\|text-ink\b\|bg-accent\b" src/app --include="*.tsx" | wc -l
  # Kaç DOSYA D-48'in eski token sınıflarını DOĞRUDAN kullanıyor (yalnızca src/ui/ primitiflerinin
  # ARKASINDAN değil) — bu sayı, "yalnızca src/ui/'yi değiştirmek yeterli mi, yoksa tüketen
  # sayfalar da mı dokunulmalı" sorusunun (§2.1 madde 1) somut kanıtı.
```

`DECISIONS.md`'de **D-49** (orijinal D-48 token/tipografi/primitif listesi, LOCKED muhtemelen),
**D-218** (Farplas token'larının kendi onay kaydı, iki round revizyon), **D-219**'un kendi
"P-58 ile karıştırılmamalı" notu, **D-220** (dark-mode mekanizma düzeltmesi — renk DEĞERLERİ
hâlâ Barış'a görsel olarak hiç gösterilmedi, bu oturumun kendi ilk BVVL turunda birlikte
onaylatılabilir), **P-58**'in tam metnini oku.

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacak, istisnasız.
2. `DECISIONS.md` D-48/D-49 (orijinal tasarım sistemi — bu oturumun DEĞİŞTİRECEĞİ zemin),
   D-218/D-219/D-220 (Farplas tokenlerinin kendi kaydı ve gerçek dark-mode düzeltmesi).
3. `src/index.css` — hem eski D-49 token'ları (`--surface`/`--ink`/`--accent` vb.) hem yeni
   D-218 Farplas token'ları (`--fp-*`) AYNI dosyada, iki ayrı katman olarak yaşıyor. Bu
   oturumun kendi tasarım kararı: iki set BİRLEŞTİRİLİYOR mu (eski token'lar Farplas
   değerlerine mi yönlendiriliyor), yoksa src/ui/ bileşenleri YENİ `--fp-*` sınıflarını mı
   kullanmaya başlıyor (iki set paralel kalıyor, yalnızca kullanım noktası değişiyor)?
4. `src/ui/` — her bileşen (`Button.tsx`, `Badge.tsx`, `Dialog.tsx`, vb.) + kendi `.test.tsx`'i.
   Bu bileşenlerin PROP API'si (variant/size/vb.) DEĞİŞMEMELİ — yalnızca görsel token
   kullanımları. Bir bileşenin testi görünür metne/role'e göre sorgulama yapıyorsa (React
   testing rules'un kendi "test behavior not implementation" ilkesi), token değişimi testleri
   BOZMAMALI; bir test spesifik bir Tailwind sınıf adını/hex değerini doğruluyorsa, o test bu
   oturumda GÜNCELLENMELİ (D-49'un kendi eski renk kararının doğrulanması artık geçersiz).
5. `src/ui/theme/ThemeProvider.tsx` — dark/light mod geçişinin kendi mekanizması, D-220'nin
   kendi düzeltmesinin (cascade-layer, `--surface`/`--ink` deseni) ZATEN çalıştığı yer —
   `--fp-*` token'ları bu deseni BİREBİR takip ediyor, referans olarak kullan.
6. `StepOverview.tsx`/`StepQuickJump.tsx`/`StepPage.tsx`/`A3PreviewReservedBand.tsx`/
   `AssistantColumn.tsx` — W1/W2/W3'ün kendi Farplas-markalı yüzeyleri, "hedef görsel dil
   NEREDE zaten doğru" referansı.
7. `docs/oturumlar/W1-adim-genel-bakis.md` — D-218'in kendi Block Visual Verification Loop
   turunun tam kaydı (dört round, her birinin gerekçesi) — bu oturum aynı disiplini (gerçek
   mockup, gerçek geri bildirim, aynı artifact URL'sine yeniden yayınlama) tekrarlamalı,
   yeniden icat etmemeli.

---

## 2. Kapsam

### 2.1 Gerçek açık sorular — kodlamadan/mockup'tan ÖNCE Barış'a `AskUserQuestion` ile sorulmalı

Bu, P-58'in kendi filed notunun "yüksek patlama-yarıçapı" uyarısını taşıyan bir oturum —
`src/ui/`'nin HERHANGİ bir bileşeni uygulamanın HER sayfasında kullanılıyor, bu yüzden burada
yapılacak bir hata (kontrast kırılması, bir varyantın gözden kaçması) tek bir sayfayı değil
TÜM uygulamayı etkiler. Kodlamadan önce:

1. **Kapsam: yalnızca token'lar mı, yoksa D-218'in kendi tam görsel dili (radius/gölge/tipografi
   ölçeği) mi?** D-218'in onayladığı şey yalnızca 7 renk + 1 font değil — "radius/shadow
   language" da vardı (P-58'in kendi filed metninin lafzı). `src/ui/`'nin bugünkü `rounded-*`/
   `shadow-*` sınıfları D-49'un kendi kararı — bunlar da mı değişiyor, yoksa yalnızca renk/font
   mu?
2. **Birleştirme stratejisi: eski token'lar Farplas'a yönlendirilsin mi (bir satırlık geçiş),
   yoksa her bileşen elle mi Farplas sınıflarına taşınsın?** Birincisi çok daha düşük riskli
   (tek bir `src/index.css` değişikliği, `src/ui/`'nin HİÇBİRİ dokunulmaz) ama D-218'in kendi
   onayı yalnızca İKİ spesifik yüzey içindi — eski `--accent`'in DEĞERİNİ sessizce Farplas
   teal'ine çevirmek, Barış'ın hiç görmediği HER yerde (örn. `Button`'ın `primary` varyantı,
   onlarca yerde kullanılıyor) görsel bir değişikliğe yol açar, kendi onayı olmadan. İkincisi
   daha güvenli ama çok daha büyük bir iş (her bileşen, her varyant, kendi BVVL turu).
3. **Sıralama/bölünme — tek dilim mi, birden fazla mı?** `src/ui/`'nin 12 bileşeninin hepsi
   AYNI oturumda mı, yoksa D-114'ün kendi disiplinine göre (bir dilim = bir doğrulanabilir
   birim) birkaç gruba mı bölünsün (örn. form kontrolleri: Input/Select/Checkbox/Textarea/
   Label bir grup; geri bildirim: Badge/Tooltip/Dialog başka bir grup; StepTick/ThemeToggle/
   Tabs/Button ayrı)?
4. **Dark-mode renk DEĞERLERİ — D-220'nin kendi owed görsel turu bu oturuma mı bağlansın?**
   D-220 mekanizmayı düzeltti ama renklerin kendisi (okunabilirlik-öncelikli, GÖRSEL OLARAK
   DOĞRULANMAMIŞ) hâlâ Barış'a hiç gösterilmedi. Bu oturum `src/ui/`'yi Farplas'a taşırken AYNI
   BVVL turunda dark-mode'u da (hem eski hem yeni yüzeylerde) onaylatabilir — tek bir görsel
   tur, iki ayrı yerine.

### 2.2 Muhtemel dilim adayları (madde 2.1'in cevaplarına göre)

- Eğer madde 2.1.2'nin cevabı "birleştir" ise: muhtemelen TEK küçük dilim —
  `src/index.css`'in `--surface`/`--ink`/`--accent` vb. primitiflerini `--fp-*` değerlerine
  yönlendir, `src/ui/`'ye HİÇ dokunma, sonra tüm uygulamayı (screenshot/BVVL) gözden geçir.
- Eğer madde 2.1.2'nin cevabı "elle taşı" ise: D-114'ün bütçesine göre birkaç dilime bölünmüş
  bir plan — her biri kendi BVVL turuyla.
- Her iki durumda da: her değişen bileşenin kendi testi (görsel/renk sınıfı doğrulayan varsa)
  güncellenmeli, davranış testleri (rol/erişilebilirlik) DOKUNULMAMALI.

---

## 3. Kapsam dışı

- `src/ui/`'nin bileşen API'sini (prop şekli, varyant isimleri) değiştirmek — bu oturum
  yalnızca GÖRSEL, davranış/API sabit kalmalı.
- Faz 12'nin kendi kapsamı — ayrı, madde 2.1.1'in cevabına bağlı olarak orada da tartışılabilir
  ama bu dosyanın kendi kapsamı DEĞİL (bkz. `faz12-kapsam-belirleme.md`'nin kendi madde 2.1.5).
- Yeni bir bileşen eklemek — bu oturum mevcut 12 bileşeni yeniden markalıyor, yeni bir primitif
  icat etmiyor.

---

## 4. Bütçe ve kapanış disiplini

Yüksek patlama-yarıçapı nedeniyle bu oturum kendi ilerlemesini SIK SIK doğrulamalı: her
bileşen grubu bittiğinde `npm test`/`npm run build` çalıştır, tüm gruplar bitene kadar
bekleme. D-218'in kendi BVVL disiplini burada da geçerli — gerçek örnek içerik, gerçek pt→px
ölçek (varsa), gerçek geri bildirim, aynı artifact URL'sine yeniden yayınlama.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, P-58'in kendi satırının KAPANDI olarak
işaretlenmesi (ya da kısmen kapandıysa hangi bileşenlerin kaldığının notu), `docs/oturumlar/
README.md`'ye yeni bir bölüm, `CLAUDE.md`'nin "Current state"ine özet.

---

**Model önerisi**: kapsam sorularının kendi turu Sonnet 5 yeterli (D-28). Gerçek görsel BVVL
turu da D-218/W1'in kendi emsaliyle Sonnet 5'te yapıldı — burada farklı bir gereksinim yok,
ama bu oturumun kendi patlama-yarıçapı büyük olduğu için ekstra dikkatli, adım adım
doğrulama (§4) şart.
