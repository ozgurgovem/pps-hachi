# OTURUM B — Adım sayfası anatomisi ve blok görsel dili

> D-149'un dört oturumundan **ikincisi**. Oturum A sayfa sözleşmesini kesti
> (`reference/TEMPLATE_ANALYSIS.md` §12, D-154…D-160); bu oturum o sözleşmenin
> içini doldurur. Sıra bağlayıcı: **kapasite tavanı girdidir, çıktı değil.**
>
> Kanonik konum: `docs/oturumlar/B-adim-anatomisi.md`. Son güncelleme 2026-08-05.

---

## 0. İlk iş — bu promptu doğrula

Bu dosya eskiyebilir. **Okumaya başlamadan önce** adlandırdığı dosyaların
gerçekten var olduğunu kontrol et:

```bash
ls -1 reference/README.md \
      reference/PPS_A3_Problem_Solving_Template_Rev00.xlsx \
      reference/LeanUK_PPS_A3_worked_example.pdf \
      reference/visual/LeanUK_PPS_A3_worked_example.png \
      reference/visual/5N-1K.jpeg
```

Eksik veya adı değişmiş bir dosya varsa **DUR ve Barış'a söyle** — sessizce
devam etme. Eskimiş prompt sessizce başarısız olur; bu bölüm tam olarak
2026-08-05'te bu promptun yazıldıktan 20 dakika sonra eskimesi üzerine eklendi.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — iş depoya dokunacak
2. `CLAUDE.md` — özellikle **"Decisions already made"** ve **"Quality floor"**;
   ikisi de 2026-08-05'te değişti
3. **`reference/README.md` — BAŞTAN SONA.** Her kaynağın STATÜSÜNÜ tanımlar
   (ÖLÇÜLDÜ / KANIT / GÖRSEL DİL / ANALİZ EDİLMEDİ). Statüleri karıştırmak,
   `TEMPLATE_ANALYSIS.md` §9'un düzeltmek zorunda kaldığı hata sınıfının
   kendisidir. **Sonundaki ⚠️ bölümlerini atlama** — ikisi de bloklayıcı.
4. `DECISIONS.md`: **D-154 · D-158 · D-159 · D-160** (sayfa sözleşmesi, esnek
   tahsis, ADIM 1'in üç paneli, esneklik tabanları + AI sınırı) ve
   D-11 · D-40 · D-99 · D-100 · D-102 · D-114 · D-124 · D-125 · D-132 · D-149 ·
   D-150 · D-151 · D-153; **P-22 · P-23 · P-26 · P-27 · P-30 · P-31 · P-32 · P-33**
5. `reference/TEMPLATE_ANALYSIS.md` **§12 — baştan sona**

> ⚠️ **§12.8 BAĞLAYICI TABLODUR.** §12.4/§12.5/§12.6'nın sayıları onunla
> geçersiz kılındı. §12.4 hâlâ dosyada duruyor ve *"ADIM 2 aşırı tahsis"* diyor.
> **Bu YANLIŞTI** — Barış o alanı bilerek büyük bırakmış, çünkü girişlerin çoğu
> oraya gidiyor (D-158). Aynı hataya düşme.

---

## 2. Bu oturumun çerçevesi — Barış'ın kendi tanımı

> "Her adımın başlığı altındaki boşluğa, birlikte belirleyeceğimiz **formatlarda**
> bilgi girişleri yapılacak. Kullanıcı **sade bir arayüzde** girecek; biz
> **görselliği çok iyi olan** bir formatta o boşluğa yerleştireceğiz. **Tüm
> adımlarda benzer metodu izlemeliyiz.**"

Basılı sonuç için kalite çıtası: **"düzenli ve yalın."**

---

## 3. Referans dosyalar

**İKİ GÖRSELİ ELLE AÇ** (`Read` aracı `.jpeg` ve `.png` okur). `reference/README.md`
onları tarif ediyor, **ama tarif okumak bakmak değildir** — bu bir görsel dil
oturumu; açmadan blok görsel dili hakkında karar verme.

| Dosya | Ne yapılacak |
|---|---|
| `reference/PPS_A3_Problem_Solving_Template_Rev00.xlsx` | Altı çalışma sayfası + `Lists & Settings` **hiç açılmadı** (P-30) → aşağıdaki 1. madde |
| `reference/visual/LeanUK_PPS_A3_worked_example.png` | **AÇ.** 2400 px render. Bu ortamda `poppler` YOK — yanındaki PDF'i açamazsın, PNG'yi açabilirsin. Çelişki halinde **PDF esastır**. [GÖRSEL DİL, P-32 — **yapısı değil yalnızca görselliği** alınır] |
| `reference/visual/5N-1K.jpeg` | **AÇ.** 447 × 447, oran tam 1.000. ADIM 1'in 5N1K formatının görsel referansı. [GÖRSEL DİL, P-33] |
| `reference/PPS_A3_Format_{ENG,TR}.xls` | Mevcut şirket formunun kaydı — tasarım hedefi **değil** |
| `reference/Examples/` | gitignore'da, depoda **YOK**. Ad tuzağı için `reference/README.md` |

---

## 4. Devralınan sayılar

§12.8'den doğrula, yeniden türetme:

```
tuval genişliği    567.00 pt (12 kolon × 47.25) — her blokta aynı
blok bandı         kolon başına 50 satır × 13.00 pt = 650.00 pt — DEĞİŞMEZ
                   (üst ve alt çizgi iki kolonda aynı; kayma yapı gereği imkânsız)
tuval satırı       blok satırı − 2 (kartuş + etiket satırı)
varsayılan         SOL 14/28/8 · SAĞ 20/8/8/8/6
taban              SOL 12/20/5 · SAĞ 14/6/6/6/5
grafik eşiği       CHART_ROW_SPAN = 10 → varsayılanda yalnız ADIM 1, 2, 4
giriş uzunluğu     1 başlık + 3–6 alan satırı (medyan 6)
satır kapasitesi   8 pt yazıda 128 karakter/satır
```

---

## 5. Üretilecek dört şey

### 5.1 Altı çalışma sayfasını çöz (P-30) — bu oturumun ilk işi

`Problem Definition` · `Data Analysis` · `Root Cause Analysis` · `Action Plan` ·
`Effectiveness Check` · `Lessons Learned` + `Lists & Settings`.

Bunlar büyük olasılıkla **adım başına veri modelini** ve açılır liste sözlüklerini
tanımlıyor — yani "hangi format" sorusunun **formun kendi cevabı**.

§9/§12'nin yöntemi zorunlu: parser gerçek dosya açılmadan **ÖNCE** sabit
örneklerle öz-teste tabi tutulur, taranan öğe sayısı basılır, **"temiz" en
tehlikeli çıktıdır.** Gözle tahmin YOK.

> Doldurulmuş bir Rev00 **yok** (P-33) — bu sayfalar elimizdeki en yakın şey.
> Barış'a süreç sahibinden doldurulmuş bir örnek isteyip isteyemeyeceğini sor;
> gelirse bu oturumun alabileceği en değerli girdi olur.

### 5.2 Blok başına görsel dil — asıl çıktı

Her blok için: o boşluğa **hangi format** girer, kaç bölgeye (D-102 `zones`)
bölünür, her bölgenin **kutusu kaç pt**, hangi plugin üretir.

**a) ADIM 1'de üçü de zorunlu (D-159):** 5N1K + gap analysis + problem statement.
12 tuval satırına **TAM** oturuyor, pay yok — biri büyürse ADIM 2 veya 3'ten satır
alınır. Ölçülmüş yerleşim: 5N1K şeridi 4 satır (6 hücre × 94.50 × 52.00 pt) +
altında yan yana gap analizi ve problem statement (283.50 × 104.00 pt).

Barış'ın 5N1K hükmü ölçüldü: **"daire yerine dikdörtgen."** 1.000 oranındaki
dairesel düzen ADIM 1'in 567 × 156 pt kutusunda alanın **%30**'unu kullanır,
%70 boş kalır (§12.6).

Problem statement'ın dört renk bandı (ultimate goal / ideal / current / problem)
için **henüz plugin yok**.

**b) P-31'i cevapla:** sağ kolonun dört izleme bloğu (ADIM 5/6/7 → 6 tuval satırı,
ADIM 8 → 4) `CHART_ROW_SPAN = 10`'u **alamaz**. Ya bu bloklara 4–6 satırlık kendi
görsel dili verilir (KPI şeridi / durum çubuğu / sparkline), ya `CHART_ROW_SPAN`
blok başına parametreleşir. Karar ver ve gerekçesini yaz.

**c) "Düzenli ve yalın" çıtası** (`CLAUDE.md` Quality floor): sekiz blok **tek bir
görsel dil** kullanmalı. Yapısal olarak zorlanan iki şey zaten var (zone'un kolon
sınırına yapışması, D-156 kapasite tavanı); **zorlanmayan şey blokların birbirine
benzemesi** — bu oturumun işi tam olarak bu.

LeanUK PNG'sinden alınacak görsel dilbilgisi: tek tip iki hücreli kartuş çubuğu ·
sınırlı anlamsal palet · çerçeveli beyaz panel olarak grafikler · numaralı alt
paneller (`1.1`, `1.2` / `1.`–`6.`) · panelleri bağlayan oklar · **bilinçli boşluk**
(onun Adım 8'i boş ve sayfa yine bitmiş görünüyor). **Yapısını DEĞİL** — blokları
bizimkilerle 1:1 eşleşmiyor ve D-150 yerinde duruyor.

> 🚫 **BLOKLAYICI — palet çakışması.** `5N-1K.jpeg` **altı ayırt edici** renk
> kullanıyor (anlam taşımaz, yalnızca yaprakları ayırır); LeanUK **dört anlamsal**
> renk kullanıyor (sarı = nihai hedef, yeşil = ideal, mavi = mevcut, kırmızı =
> problem/kök neden). **D-159 ikisini de ADIM 1'e koyuyor** → aynı blokta kırmızı
> üstteki şeritte "NE?", alttaki bantta "problem" demiş olur. **ADIM 1 bu
> çözülmeden tasarlanamaz.** İki görseli yan yana açıp karar ver: ya 5N1K
> nötrleştirilir (tek renk / gri tonlama, ayrım tipografiyle), ya anlamsal palet
> 5N1K'yı da kapsayacak şekilde genişletilir.

### 5.3 Adım sayfası arayüzü — "sade arayüz" tarafı

Faz 5–6c **~37 yöntem plugin'i** sevk etti ve **hiçbirinin seçim deneyimi
tasarlanmadı** (Adım 2 tek başına on tane sunuyor). D-149'un açılış gerekçesi buydu.

Karara bağlanacak: kullanıcı bir adımda ne görür · varsayılan yol nedir · format
seçimi nasıl olur · hangi plugin'ler "önerilen", hangileri "diğer".

> Barış'ın "her adım için bir format" çerçevesi 37 plugin'lik menüyle **gerilim
> halinde.** Bu gerilimi **adlandır ve ölç**, ama plugin ekleme/silme kararını
> **Oturum C'ye bırak**.

### 5.4 Esnek tahsisin yüzeyi (D-158/D-160)

Kullanıcı ADIM 2'yi ADIM 3'ten alarak **%66'ya** kadar büyütebiliyor. Bunun bir
**arayüzü** olmalı: açık kontrol mü, içerikten otomatik mi, ikisi birden mi?
Kullanıcı bir bloğun tabana dayandığını nasıl görür?

> D-160 sınırı çizdi: tahsis **deterministik**, AI yalnızca "neyi yoğunlaştır"
> önerir, **sınırı kendisi oynatmaz.** Bu sınırı koru — AI yerleşim yoluna
> girseydi `CLAUDE.md`'nin "AI kapalıyken uygulama tam çalışır" kuralı ve D-97'nin
> golden-file testleri anlamını kaybederdi.

---

## 6. Kapsam dışı

- Template dosyası yazmak (`src/a3/templates/*`) — D-95 Faz 11, değişmedi
- Plugin ekleme / silme / birleştirme — **Oturum C**
- P-26 (i18n + blok hizası) — **Oturum D**
- Sayfa sözleşmesini yeniden açmak — D-154 LOCKED, aritmetiği doğrulandı
- D-11 (ADIM 3 zorunlu) · D-150 (Rev00 referans) · D-151 (katlama) — LOCKED

Bunlardan birine girme isteği duyarsan **DUR ve söyle** (D-114'ün "dilim başına
tek mekanizma" sınırının bu oturumdaki karşılığı).

---

## 7. Teslimat

`reference/TEMPLATE_ANALYSIS.md`'ye **§13** (adım anatomisi + blok görsel dili),
`DECISIONS.md`'ye ilgili D kayıtları, ve doğrulanmışsa **commit + push**.

**Kod YAZILMAYACAK** — bu da bir ölçüm ve karar oturumu.

---

## 8. Bütçe uyarısı (Madde 1 / G1)

Bu dört iş Oturum A'nın üçünden **belirgin biçimde büyük** ve §5.1 (altı çalışma
sayfasının OOXML analizi) tek başına bir oturum edebilir. **İşe başlamadan bütçeyi
tahmin et** ve gerekirse **B1** (çalışma sayfaları + veri modeli) / **B2** (görsel
dil + arayüz) diye bölmeyi **ÖNER**. Bölme önerisi Anayasa'ya uygundur, tersi değil.

---

## 9. Açık sorular — işe başlamadan Barış'a sor (`AskUserQuestion`)

1. **Problem statement panelinin dört renk bandı** yeni bir plugin mi olacak,
   yoksa sevk edilmiş `gapStatement`'ın (6a) genişletilmesi mi? İkincisi sevk
   edilmiş şemayı değiştirir.
2. **ADIM 1'deki 5N1K**, sevk edilmiş `five-g-5n1k` plugin'inin (Faz 5) yeni bir
   görselleştirmesi mi, yoksa ayrı bir format mı? D-132'nin dersi: mevcut olanı
   ters çevirmek yerine yanına eklemek.
3. **Esnek tahsis** kullanıcıya açık bir kontrol olarak mı görünsün, yoksa
   içerikten sessizce mi hesaplansın?

---

**Model önerisi:** Opus — D-28'in "mimari/tasarım" sınıfı. §5.1 (OOXML analizi)
Oturum A'nın §9/§12 geçişleriyle aynı sınıf.
