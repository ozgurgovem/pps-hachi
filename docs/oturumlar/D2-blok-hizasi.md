# OTURUM D2 — blok hizası kök neden keşfi (D-149'un dört oturumluk planının son dilimi)

> `docs/oturumlar/D-i18n-blok-hizasi.md`'nin önerdiği iki dilimden (§3.2) ikincisi ve sonuncusu
> — P-26'nın **layout/hizalama** yarısı. i18n yarısı (D1) 2026-08-18'de bitti, bkz. D-188;
> P-26'nın o satırı artık "i18n yarısı CLOSED, layout yarısı OPEN" diyor.
>
> **Bu bir keşif oturumudur, bir uygulama oturumu değil.** P-26'nın kendi notu kök nedenin
> henüz bulunmadığını söylüyor — bu prompt bilerek bir düzeltme planı içermiyor. Kök neden
> bulunmadan yazılan bir plan tahmindir (`D-i18n-blok-hizasi.md` §3.2'nin kendi cümlesi).
>
> Kanonik konum: `docs/oturumlar/D2-blok-hizasi.md`. Yazıldı: 2026-08-18, D1'in kapanışının
> hemen ardından, Barış'ın açık isteğiyle ("yeni oturum için prompt paylaşır mısın?").

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      docs/oturumlar/D-i18n-blok-hizasi.md \
      src/a3/buildA3Layout.ts src/a3/layout/place.ts src/a3/layout/placeZones.ts \
      src/a3/templates/farplas-7step-tr.ts src/a3/templates/types.ts \
      src/a3/methodContract.ts \
      src-tauri/src/xlsx/writer.rs src-tauri/src/commands/xlsx.rs \
      src-tauri/tests/xlsx.rs scripts/gen-a3-fixture.ts \
      src-tauri/src/bin/gen_ppsx_fixtures.rs \
      src/a3/p25TwoImageEntries.probe.test.ts
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle** — bu liste 2026-08-18'de doğrulandı.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — kod yazılacaksa (bulgu bir düzeltme
   gerektiriyorsa) istisnasız.
2. `CLAUDE.md` — "Decisions already made" (özellikle template/geometri kararları: Rev00'ın
   referans format olduğu ama `farplas-7step-tr`'nin **hâlâ tek şevkedilen şablon** olduğu,
   D-95/D-157), "Current state"in D1 paragrafı (bu dilimin kardeşi, hemen önceki).
3. `DECISIONS.md`: **P-26** (bu oturumun tek girdisi, artık "layout yarısı OPEN" diyor),
   **D-136** (P-25'in kök-neden metodolojisi — "gerçek pipeline'ın her katmanını gerçek
   girdiyle kanıtla", geçici prob/test kullanıp sildi — bu oturumun **doğrudan şablonu**),
   **D-97** (xlsx fidelity testinin normalize-structural-comparison yaklaşımı, `write_a3_workbook`
   nasıl doğrulanıyor), **D-04/D-99/D-102** (layout kararının tek yeri `buildA3Layout`/`place.ts`
   olduğu — Rust yalnızca serialize eder, bu yüzden hizalama hatası TypeScript tarafında aranır,
   Rust tarafında değil, aksi kanıtlanana kadar).
4. `reference/TEMPLATE_ANALYSIS.md` §12.1–§12.6 (sayfa sözleşmesi — kolon/satır ızgarası, blok
   bütçesi) — **ama §3'ün kendi uyarısını oku: §12 gelecekteki Rev00-tabanlı 8-adımlı şablonun
   ("pps-8step-auto") sözleşmesidir, `farplas-7step-tr` için DEĞİLDİR.** Bugün sevk edilen ve
   export edilen tek şablon `farplas-7step-tr` (D-95/D-157) — o şablonun blok sınırları §12'de
   değil, doğrudan `src/a3/templates/farplas-7step-tr.ts`'nin kendi `TemplateBlock[]`
   tanımlarında yaşıyor (`headerRange`/`contentRows`/`contentColumns`, her biri gerçek
   `.xls`'ten §9'da transkribe edildi). **D-i18n-blok-hizasi.md §3.2'nin "§12.8'e karşı kontrol
   et" cümlesi muhtemelen yanlış hedef gösteriyor** — §12.8 elastik tahsis modelidir ve
   `pps-8step-auto`'ya aittir, henüz inşa edilmedi (D-186/P-40). Bu promptun kendisi düzeltmeyi
   yapıyor: aşağıdaki §2, gerçek zemin gerçeği olarak `farplas-7step-tr.ts`'nin kendi blok
   tanımlarını kullanıyor.
5. `docs/oturumlar/D-i18n-blok-hizasi.md` §2.2 tam olarak — bu ikinci yarının kendi ön
   araştırması: iki kanıtlanmamış aday şüpheli (`place.ts`'in hücre/merge yerleşimi, ya da
   `farplas-7step-tr.ts`'nin blok sınır tanımlarıyla gerçek içerik satırlarının uyuşmazlığı),
   ve P-26'nın kendi orijinal gözlemi (2026-08-04, Barış'ın gerçek uygulama yürüyüşü: "content
   does not always land inside its intended block — text reads as offset from where the
   block's own borders are").

---

## 2. Kapsam — kök neden keşfi, uygulama değil

### 2.1 Hedef

P-26'nın layout yarısının **gerçek** kök nedenini, tahmin değil kanıtla bulmak. D-136'nın
P-25'te kullandığı metodoloji doğrudan model: gerçek pipeline'ın her katmanını gerçek girdiyle
kanıtla, mock'lama, geçici prob'ları/testleri iş bitince sil.

### 2.2 Önerilen yürüyüş (bir öneri, mandat değil — dosyaları görmeden kesinleşmez)

1. **Gerçek bir `.ppsx` projesi kur**, her 8 adıma en az bir entry ile — `scripts/
   gen-a3-fixture.ts`'in kendi fixture-oluşturma deseni bir başlangıç noktası (şu an yalnızca
   birkaç grafik-taşıyan yöntemi kullanıyor, D1'in `CLAUDE.md` notuna göre); bu oturum onu
   genişletebilir ya da paralel yeni bir geçici script yazabilir — **8 adımın hepsinde en az
   bir entry**, farklı içerik şekilleri (düz metin, grafik-taşıyan, zon-taşıyan) karışık olsun
   ki blok sınırlarının her türü gerçekten sınansın.
2. **Gerçek `buildA3Layout` çağrısıyla gerçek bir `A3LayoutDescriptor` üret**, gerçek
   `farplas7StepTr` şablonuyla — D-102'nin iki-çağrı deseni (`pendingImages` keşfet, rasterize
   et, tekrar çağır).
3. **Gerçek `write_a3_workbook`'a ver** (geçici bir Rust test/probe, D-136'nın "kullan, sil"
   pratiği — `src-tauri/tests/xlsx.rs`'in kendisi kalıcı, ama bu araştırmanın kendi geçici
   probu ayrı tutulmalı) ve gerçek bir `.xlsx` dosyası yaz.
4. **Gerçek `xl/worksheets/sheet1.xml`'i aç** (zip içinden, `calamine` ya da doğrudan XML
   parse — D-97'nin fidelity testi zaten bu deseni kullanıyor, oradan ödünç alınabilir) ve her
   hücrenin gerçek `ref`'ini (A1 notasyonu) oku.
5. **Her hücreyi, ait olduğu bloğun `farplas-7step-tr.ts`'teki gerçek `TemplateBlock`
   tanımına karşı kontrol et** — `contentColumns.first`–`last` ve `contentRows.start`–`end`
   aralığının içinde mi? Değilse: bu, `place.ts`'in yerleşim hatası (aday şüpheli #1).
   İçindeyse ama yine de yanlış görünüyorsa (örn. statik `template.merges` dinamik yerleşimle
   çakışıyor, ya da kolon genişliği/satır yüksekliği hesap hatası nedeniyle görsel olarak
   kaymış): kök neden başka bir katmanda — bu durumda §2.3'e geç.
6. **Barış'ın orijinal gözlemini yeniden üret**: gerçek `.xlsx`'i gerçek bir uygulamada aç
   (Excel/Numbers/LibreOffice) ve 2026-08-04'te gördüğü "metin blok sınırlarının dışında
   duruyormuş gibi okunuyor" izlenimini tekrar gözlemleyip gözlemleyemediğini doğrula — bir
   önceki adımların XML kanıtı ile bu görsel izlenim **aynı hücreleri mi işaret ediyor**?

### 2.3 XML hücre pozisyonları doğruysa — ikinci tur şüpheliler

Eğer 2.2 adım 5 hiçbir hücre-blok uyuşmazlığı bulmazsa (yani her hücre kendi bloğunun aralığı
içinde), P-26'nın gözlemi geometri değil **görsel** bir şey olabilir — kontrol edilecekler:
- Statik `template.merges` ile dinamik yerleşimin (`placeBlockContent`/`placeZones.ts`)
  çakışıp çakışmadığı (`buildA3Layout.ts`'in kendi `rangesOverlap` filtresi zaten bunu
  ele almaya çalışıyor — filtre gerçekten doğru mu çalışıyor?).
- Kolon genişliği birim çevrimi (`excelColumnWidthToPt`, D-154'ün "visible-character vs
  stored width" tuzağı — bu tuzağın bir başka biçimi burada da olabilir mi?).
- Hücre içi hizalama/kenar boşluğu (Rust `styles.rs`'in ürettiği `Format` — dikey/yatay
  hizalama ayarları blok sınırına göre doğru mu?).
- `block.headerRange` (blok başlığı) ile `block.contentRows.start` arasında görsel bir
  boşluk/çakışma var mı — başlık satırı içeriğin "üstüne" mi taşıyor?

### 2.4 Bulgu nereye gider

D-136'nın kendi ayrımı: gerçek bir kod hatası bulunursa **düzeltilir ve test edilir** (aynı
oturumda, eğer küçükse — Anayasa Madde 1'in bütçe kontrolüne tabi, aşağıdaki §4'e bakın).
Kök neden büyük bir mimari soruna işaret ederse (örn. `place.ts`'in tüm yerleşim modelinin
yeniden düşünülmesi gerekiyorsa), **bulgu belgelensin, düzeltme planı ayrı bir oturuma
bırakılsın** — D-136'nın kendi "not claimed as a confirmed fix" dürüstlük standardı burada da
geçerli: gerçek kanıtla doğrulanmamış bir düzeltmeyi "bitti" diye raporlama.

---

## 3. Kapsam dışı

- i18n yarısı — D1'de BİTTİ, D-188. Dokunulmaz.
- Şablon dosyasının kendisinin yeniden tasarımı (`pps-8step-auto`, Rev00-tabanlı 8-adımlı
  şablon) — D-95, Faz 11. Bu oturum yalnızca **mevcut** `farplas-7step-tr` üzerinde çalışır;
  §12.8'in elastik tahsis modeli bu oturumun konusu değil (P-40, Faz 11'e ertelendi).
- P-42 (Fishbone'un diyagram kategori etiketlerinin `project.meta.language` yerine editörün
  aktif i18next dilini kullanması) — D1'de bulundu, ayrı bir kusur sınıfı, bu oturumla ilgisiz.
- `MethodPlugin.tier`/`MethodBand`, esnek tahsis sürükle-tutamacı — Oturum C'nin/C6'nın işiydi.

---

## 4. Bütçe ve kapanış disiplini

**Bu oturumun büyüklüğü önceden bilinmiyor** — bulunan kök nedene göre değişir (Madde 1/G1,
D-i18n-blok-hizasi.md §5'in kendi uyarısı). Açılışta: keşif adımlarının (§2.2) kabaca ne kadar
token yakacağını tahmin et, Barış'a söyle. Kök neden bulunduktan sonra, düzeltme küçükse aynı
oturumda bitir; büyükse (yeni bir mekanizma ya da `place.ts`'in mimari bir değişikliği
gerektiriyorsa) bulguyu belgeleyip düzeltmeyi D2b gibi ayrı bir dilime böl — tek oturumda hem
keşif hem büyük bir düzeltme yapmaya çalışmak Anayasa G4'tür (şişmiş oturum).

TDD: bulunan her gerçek hata için, önce onu **kırmızı** olarak kanıtlayan bir regresyon testi
yaz (D-136'nın P-25 regresyon testleri gibi — düzeltmeden önce KIRMIZI, düzeltmeden sonra
YEŞİL, ikisi de doğrulanmalı), sonra düzelt. Bu araştırmanın kendi geçici prob'ları/scriptleri
(Rust test, TS script) **iş bitince silinir** — D-136'nın "kullan, sil" pratiği; kalıcı olması
gereken tek şey bulunan gerçek hatayı kanıtlayan kalıcı regresyon testidir.

Kapanışta (bir düzeltme yapıldıysa): `npm test`/`npm run lint`/`npm run build` ve `cargo test`/
`cargo clippy`/`cargo fmt` hepsi yeşil olmadan iş bitmiş sayılmaz — `npm test`'in **exit
code**'u ayrı bir logfile + `echo $?` ile kontrol edilir (`tail`/pipe üzerinden DEĞİL, D-143'ün
dersi, D1 dahil her sonraki oturumda tekrarlandı). `scripts/gen-a3-fixture.ts`'in yeniden
çalıştırılması gerekip gerekmediğini kontrol edin.

`docs/oturumlar/D-i18n-blok-hizasi.md`'ye bu dilimin sonucu yazılır (kök neden neydi, düzeltme
mi yapıldı yoksa D2b'ye mi bırakıldı), `DECISIONS.md`'ye yeni bir D-numarası eklenir, P-26'nın
satırı güncellenir (layout yarısı da kapanır ya da kısmi kapanır), `CLAUDE.md` "Current state"e
bir "Oturum D — D2" paragrafı eklenir, `docs/oturumlar/README.md`'nin D2 satırı güncellenir.
**D2'nin kapanışıyla D-149'un dört oturumluk planı (A, B1-B3, C1-C6, D1-D2) tamamen biter.**

---

**Model önerisi:** Opus — D-28'in kendi routing'i, kök neden bilinmeyen, birden fazla katmanı
(TypeScript layout mantığı, Rust serialize katmanı, gerçek xlsx binary formatı) kanıtla ayırt
etmesi gereken bir keşif işi için derin akıl yürütme istiyor; D-136'nın kendi P-25 kök-neden
oturumu da benzer şekilde derin, çok katmanlı kanıt toplama gerektirmişti. Yüzeysel bir kod
okuması yeterli olursa Sonnet'e düşürülebilir — ama bunu yalnızca dosyaları gerçekten görüp
karar ver, önceden varsayma.
