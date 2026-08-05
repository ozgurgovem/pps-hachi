# OTURUM B2 — Blok görsel dili, adım arayüzü, esnek tahsis arayüzü

> D-149'un dört oturumundan ikincisinin **ikinci yarısı**. Oturum B, kendi Bölüm 8'inin
> bütçe uyarısı üzerine B1/B2'ye bölündü (D-161, AskUserQuestion ile Barış onayladı).
> B1 (`docs/oturumlar/B-adim-anatomisi.md` §5.1 — altı çalışma sayfası + veri modeli)
> **BİTTİ** — `TEMPLATE_ANALYSIS.md` §13, P-30 kapandı. Bu dosya B2'nin kapsamıdır:
> `B-adim-anatomisi.md`'nin §5.2 + §5.3 + §5.4'ü, aynen.
>
> Kanonik konum: `docs/oturumlar/B2-gorsel-dil-arayuz.md`. Yazıldı: 2026-08-06.

---

## 0. İlk iş — bu promptu doğrula

Okumaya başlamadan önce adlandırdığı dosyaların gerçekten var olduğunu kontrol et:

```bash
ls -1 docs/oturumlar/B-adim-anatomisi.md \
      reference/TEMPLATE_ANALYSIS.md \
      DECISIONS.md \
      reference/README.md \
      reference/visual/LeanUK_PPS_A3_worked_example.png \
      reference/visual/5N-1K.jpeg
```

Eksik veya adı değişmiş bir dosya varsa **DUR ve Barış'a söyle**.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — iş depoya dokunacak
2. `CLAUDE.md` — özellikle "Decisions already made" ve "Quality floor"
3. `docs/oturumlar/B-adim-anatomisi.md` — **BAŞTAN SONA.** Bu dosyanın kendisi B'nin tam
   çerçevesini taşıyor (Barış'ın "sade arayüz + görsellik" tanımı §2, referans dosyalar §3,
   üretilecek dört şeyin orijinal tarifi §5). B2 yalnızca §5.2/§5.3/§5.4'ü **yürütür** —
   çerçeveyi yeniden okumadan doğru karar veremezsin.
4. `reference/TEMPLATE_ANALYSIS.md` **§12 (sayfa sözleşmesi) ve §13 (B1 çıktısı) — baştan
   sona.** §12.8 bağlayıcı kapasite tablosu; §13 altı çalışma sayfasının veri modelini ve
   yeni yöntem adaylarını taşıyor (Oturum C'nin kapsamı, ama B2'nin bilmesi gereken bağlam).
5. `DECISIONS.md`: **D-158 · D-159 · D-160 · D-161 · D-162 · D-163 · D-164** (bu oturumun
   doğrudan girdisi — üçü zaten karar verilmiş, yeniden sorma) ve D-11 · D-40 · D-99 ·
   D-100 · D-102 · D-104 · D-114 · D-116 · D-124 · D-125 · D-132; **P-26 · P-27 · P-31 ·
   P-32 · P-33**
6. `reference/README.md` — palet çakışması uyarısı hâlâ orada, §12.6'daki bulgu tekrarı

---

## 2. Bu oturumun çerçevesi — Barış'ın kendi tanımı (B'den değişmeden taşındı)

> "Her adımın başlığı altındaki boşluğa, birlikte belirleyeceğimiz **formatlarda**
> bilgi girişleri yapılacak. Kullanıcı **sade bir arayüzde** girecek; biz
> **görselliği çok iyi olan** bir formatta o boşluğa yerleştireceğiz. **Tüm
> adımlarda benzer metodu izlemeliyiz.**"

Basılı sonuç için kalite çıtası: **"düzenli ve yalın."**

---

## 3. B1'den devralınan, B2'nin girdisi olan kararlar

Bunlar zaten Barış'a soruldu ve cevaplandı (2026-08-06) — **yeniden sorma**, doğrudan
uygula:

- **D-162 — Problem statement paneli 3 alan kalıyor** (Ideal / Actual / Gap), şipping
  edilmiş `gapStatement` şemasına dokunulmaz. B2'nin işi yalnızca `renderToA3`'e renk bandı
  eklemek (3 bant: ideal=yeşil, actual=mavi, gap=kırmızı — LeanUK'ın 4 rengin 3'ü, "ultimate
  goal"ın sarısı düşer).
- **D-163 — ADIM 1'in 5N1K paneli ayrı yeni bir plugin/görselleştirme.** Şipping edilmiş
  `five-g-5n1k`'ye dokunulmaz. Yeni plugin'in alan seti referans görselden (`5N-1K.jpeg`):
  Ne / Neden / Nasıl / Kim / Ne zaman / Nerede — **6 alan**, `five-g-5n1k`'nin setinden
  (`neKadar` yerine `neden`) farklı olduğuna dikkat.
- **D-164 — Esnek tahsis arayüzü ikisi birden**: varsayılan otomatik (D-160'ın zaten
  tanımladığı deterministik solver), artı kullanıcının elle override edebileceği bir kontrol.
  İki mekanizmanın etkileşimini tasarlamak **B2'nin işi**.

---

## 4. Referans dosyalar

**İKİ GÖRSELİ ELLE AÇ** (zaten B1'de açıldı, ama B2 kendi başına başlıyorsa tekrar aç —
görsel dil kararı görmeden verilemez):

| Dosya | Ne yapılacak |
|---|---|
| `reference/visual/LeanUK_PPS_A3_worked_example.png` | **AÇ.** Görsel dilbilgisi: iki hücreli kartuş çubuğu, 4 anlamsal renk (sarı=hedef, yeşil=ideal, mavi=mevcut, kırmızı=problem), çerçeveli beyaz panel grafikler, numaralı alt paneller, oklar, bilinçli boşluk. [GÖRSEL DİL, P-32] |
| `reference/visual/5N-1K.jpeg` | **AÇ.** 447×447, oran 1.000. 6 ayırt edici (anlamsız) renk — LeanUK'ın 4 anlamsal rengiyle **çakışıyor** (aşağıdaki §5 bloklayıcı). [GÖRSEL DİL, P-33] |

---

## 5. Üretilecek üç şey (B'nin orijinal §5.2–§5.4'ü)

### 5.1 Blok başına görsel dil — asıl çıktı (B'nin eski §5.2)

Her blok için: hangi format, kaç bölgeye (D-102 `zones`) bölünür, her bölgenin kutusu kaç
pt, hangi plugin üretir. Geometrik zarf `TEMPLATE_ANALYSIS.md` §12.5/§12.6'da hazır —
burada kayda geçen yalnızca geometri, **hangi görselin seçileceği B2'nin kararı.**

**a) ADIM 1'de üçü de zorunlu (D-159):** 5N1K (D-163: ayrı yeni plugin) + gap analysis
(D-162: `gapStatement`, 3 alan, artık renk bandı) + problem statement — **§13.3'ün notu:**
`five-g-5n1k`'nin 5G alanları (Gemba/Gembutsu/Genjitsu/Genri/Gensoku) bu üç panelden
hiçbirine girmiyor; nereye gideceği hâlâ açık, karar B2'nin.

> 🚫 **BLOKLAYICI — palet çakışması, hâlâ çözülmedi.** `5N-1K.jpeg` altı ayırt edici renk
> kullanıyor (anlam taşımaz); LeanUK dört anlamsal renk kullanıyor (sarı/yeşil/mavi/kırmızı).
> D-159 ikisini de ADIM 1'e koyuyor. **ADIM 1 bu çözülmeden tasarlanamaz.** İki seçenek
> (`reference/README.md`'nin kendi önerisi): 5N1K nötrleştirilir (tek renk/gri tonlama,
> ayrım tipografiyle) ya da anlamsal palet 5N1K'yı da kapsayacak şekilde genişletilir.

**b) P-31'i cevapla:** sağ kolonun dört izleme bloğu (ADIM 5/6/7 → 6 tuval satırı, ADIM 8 →
5, `TEMPLATE_ANALYSIS.md` §12.8) şipping edilmiş `CHART_ROW_SPAN = 10`'u **alamaz**. Ya bu
bloklara 4–6 satırlık kendi görsel dili verilir (KPI şeridi / durum çubuğu / sparkline), ya
`CHART_ROW_SPAN` blok başına parametreleşir.

**c) "Düzenli ve yalın" çıtası:** sekiz blok tek bir görsel dil kullanmalı. LeanUK'tan
alınacak (yapısı değil, yalnızca görselliği — D-150 yerinde duruyor): tek tip iki hücreli
kartuş çubuğu, sınırlı anlamsal palet, çerçeveli beyaz panel grafikler, numaralı alt
paneller, oklar, bilinçli boşluk.

### 5.2 Adım sayfası arayüzü — "sade arayüz" tarafı (B'nin eski §5.3)

Faz 5–6c ~37 yöntem plugin'i sevk etti, hiçbirinin seçim deneyimi tasarlanmadı (Adım 2 tek
başına on tane sunuyor). Karara bağlanacak: kullanıcı bir adımda ne görür · varsayılan yol
nedir · format seçimi nasıl olur · hangi plugin'ler "önerilen", hangileri "diğer".

> Plugin ekleme/silme/birleştirme kararı **Oturum C'ye bırak** — bu gerilimi adlandır ve
> ölç, çözme.

### 5.3 Esnek tahsisin yüzeyi (D-158/D-160/D-164)

D-164 zaten "ikisi birden" dedi — kalan iş bunun **arayüzünü** tasarlamak: açık kontrol ile
içerikten otomatik hesaplama nasıl bir arada durur, kullanıcı bir bloğun tabana dayandığını
nasıl görür, override ile otomatik hesap çakıştığında ne olur.

> D-160 sınırını koru — tahsis deterministik, AI yalnızca içerik öneriyor, sınırı kendisi
> oynatmıyor.

---

## 6. Kapsam dışı

- Template dosyası yazmak (`src/a3/templates/*`) — D-95 Faz 11
- Plugin ekleme / silme / birleştirme (§13.4'ün yedi adayı dahil) — **Oturum C**
- P-26 (i18n + blok hizası) — **Oturum D**
- Sayfa sözleşmesini yeniden açmak — D-154 LOCKED
- D-11 · D-150 · D-151 · D-162 · D-163 · D-164 — LOCKED / kararlaştırıldı, yeniden açma

---

## 7. Teslimat

`reference/TEMPLATE_ANALYSIS.md`'ye §13'ün devamı (B2'nin blok görsel dili + arayüz
kararları — kendi alt bölümü, örn. §13.7+ ya da yeni bir §14, o oturumun kararı),
`DECISIONS.md`'ye ilgili D kayıtları, ve doğrulanmışsa **commit + push**.

**Kod YAZILMAYACAK** — bu da bir tasarım/karar oturumu, B1 gibi.

---

## 8. Bütçe uyarısı (Madde 1 / G1)

B1'den daha küçük olması beklenir (P-30'un OOXML analizi B1'e gitti), ama §5.1 (blok görsel
dili, palet çakışması dahil) yine de tek başına ağır olabilir — sekiz blok, her biri kendi
geometrik zarfı ve karar gerektiriyor. İşe başlamadan bütçeyi tahmin et; gerekirse §5.1 /
§5.2+5.3 diye ikinci bir bölmeyi öner.

---

## 9. Açık sorular — işe başlamadan Barış'a sor (`AskUserQuestion`)

1. **Palet çakışması** (§5.1'in bloklayıcısı): 5N1K nötrleştirilsin mi (tek renk/gri, ayrım
   tipografiyle), yoksa anlamsal palet 5N1K'yı kapsayacak şekilde genişlesin mi?
2. **5G'nin (Gemba/Gembutsu/Genjitsu/Genri/Gensoku) ADIM 1'deki yeri** — üç zorunlu panelin
   dışında mı kalsın (görünmez/isteğe bağlı alan), yoksa dördüncü bir panel mi olsun? D-159
   yalnızca üç paneli zorunlu kılıyor, dördüncüsünü yasaklamıyor ama satır bütçesi yok.
3. **Sağ kolonun dört izleme bloğu** (P-31): kendi kısaltılmış görsel dili mi (KPI şeridi /
   durum çubuğu / sparkline), yoksa `CHART_ROW_SPAN`'in blok başına parametreleşmesi mi?

---

**Model önerisi:** Opus — D-28'in "mimari/tasarım" sınıfı, B1 gibi.
