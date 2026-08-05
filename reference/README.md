# reference/ — kaynak dosyalar ve statüleri

Bu dizindeki her dosyanın **statüsü farklıdır**. Statü, o dosyadan ne tür iddia
çıkarılabileceğini belirler. Karıştırmak, `TEMPLATE_ANALYSIS.md` §9'un düzeltmek
zorunda kaldığı hata sınıfının kendisidir.

| Statü | Anlamı |
|---|---|
| **ÖLÇÜLDÜ** | Kaynak kayıtlarından öz-testli parser ile okundu. Geometrik iddia çıkarılabilir. |
| **KANIT** | İncelendi ama tasarım hedefi değil. Gözlem çıkarılabilir, geometri değil. |
| **GÖRSEL DİL** | Yalnızca *görünüş* referansı. Yapısal/geometrik iddia çıkarılamaz. |
| **ANALİZ EDİLMEDİ** | Açılmadı. Hakkında hiçbir şey varsayma. |

---

## Tasarım hedefi

| Dosya | Statü | Ne |
|---|---|---|
| `PPS_A3_Problem_Solving_Template_Rev00.xlsx` | **ÖLÇÜLDÜ** | **REFERANS FORMAT** (D-150). Boş, 8 adımlı, hücre ızgarası — 136 birleştirme, 0 kayan şekil, 50 KB. `A3 Summary` sayfasının geometrisi `TEMPLATE_ANALYSIS.md` §11'de; uygulamanın kurulduğu sayfa sözleşmesi **§12**'de. P-29 (D-157): Farplas'ın ONAYLADIĞI form. |
| ↳ altı çalışma sayfası + `Lists & Settings` | **ANALİZ EDİLMEDİ** | P-30 — **Oturum B'nin ilk işi**. Adım başına veri modelini ve açılır liste sözlüklerini tanımlıyor olması muhtemel. |

## Görsel dil referansı

| Dosya | Statü | Ne |
|---|---|---|
| `LeanUK_PPS_A3_worked_example.pdf` | **GÖRSEL DİL** | P-32. Lean Enterprise Academy'nin işlenmiş A3'ü ("Reducing the Data Warehouse overnight build times"). **Ölçüldü:** MediaBox 1190.4 × 841.44 pt = tam A3 yatay, tek sayfa; `/Producer` = Microsoft Excel for Microsoft 365 — yani bu görsellik **Excel'den gerçek A3'te** ulaşılabilir (D-146/D-154'ün öncülünü bağımsız doğrular). **Yapısı alınmaz**, yalnızca görselliği: 8 bloğu bizimkilerle 1:1 eşleşmiyor (Containment ayrı blok, bizim Adım 5–6 birleşik) ve kolon bölünmesi farklı. |
| `visual/LeanUK_PPS_A3_worked_example.png` | **GÖRSEL DİL** | Yukarıdakinin 2400 px render'ı (`sips`). Bu ortamda `poppler` yok — PDF ajan tarafından açılamıyor, PNG açılıyor. İçerik aynıdır; çelişki halinde **PDF esastır**. |
| `visual/5N-1K.jpeg` | **GÖRSEL DİL** | P-33 (kapandı 2026-08-05, Barış kaydetti). 447 × 447 px, **oran tam 1.000**. Merkezde `5N1K` göbeği, çevresinde altı yaprak — saat yönünde: **NE?** (Konuyu verir) · **NEDEN?** (Amacı açıklar) · **NASIL?** (Yöntemi gösterir) · **KİM?** (İlgili ve sorumlu kişileri belirler) · **NE ZAMAN?** (Süre – süreci netleştirir) · **NEREDE?** (Mekan ve yer belirler). Barış'ın hükmü: düzen beğenildi ama **"daire yerine dikdörtgen"** — ölçüm doğruluyor: 1.000 oranındaki bir düzen ADIM 1'in 567 × 156 pt kutusunda alanın yalnızca **%30**'unu kullanır, %70'i boş kalır (§12.6). §12.8'in ölçtüğü oturan yerleşim: 6 hücrelik yatay şerit, hücre 94.50 × 52.00 pt. |

## Mevcut şirket formunun kaydı — tasarım hedefi DEĞİL

| Dosya | Statü | Ne |
|---|---|---|
| `PPS_A3_Format_ENG.xls` | **ÖLÇÜLDÜ** | Farplas'ın 7 adımlı formu, İngilizce. `TEMPLATE_ANALYSIS.md` §3 + §9. D-150 ile tasarım hedefi olmaktan çıktı; *mevcut formun kaydı* olarak kalıyor. |
| `PPS_A3_Format_TR.xls` | **ÖLÇÜLDÜ** | Aynısının Türkçesi. §9.5: ENG'in bir satır kaydırılmışı DEĞİL — kendi satır tablosu var. |

## `Examples/` — gitignore'da, depoda YOK

Gerçek, doldurulmuş şirket A3'leri. Kişi adları ve şirket verisi içerdikleri ve
8–50 MB oldukları için `.gitignore`'dadır. Bulgular `docs/02_REAL_WORLD_FINDINGS.md`'de.

> ⚠️ **AD TUZAĞI:** `Examples/PPS_A3_Template_Rev00.xlsx` (8.6 MB) **Rev00 DEĞİLDİR.**
> Adı öyle olsa da içeriği tamamen başka: sayfaları `TBP · Fire_Detay · head ·
> kalıp duruş dağılımı · pdca-farplas · karşı önlem · Mevcutdurum · Hedef`,
> `sheet1` = `C1:BS207`, 8 birleştirme ama **70 şekil + 36 resim** — doldurulmuş
> bir Farplas vakası, tuval. Referans format `reference/` kökündeki **50 KB**'lık
> `PPS_A3_Problem_Solving_Template_Rev00.xlsx`'tir. **Doldurulmuş bir Rev00 YOKTUR**
> — olsaydı "hangi boşluğa ne girer" sorusuna formun kendi cevabı olurdu.

> `Examples/PPS_A3_Format_Examp_Farplas.xlsx` = §10'un adayı (107 şekil, tuval).
> D-150 ile **KANIT** statüsüne düştü, tasarım hedefi değil.

---

## ⚠️ Oturum B için palet çakışması — çözülmeden ADIM 1 tasarlanamaz

İki görsel dil referansı **uyumsuz renk sistemleri** kullanıyor:

| Kaynak | Sistem | Kırmızının anlamı |
|---|---|---|
| `visual/5N-1K.jpeg` | 6 **ayırt edici** renk, anlam taşımaz — yalnızca yaprakları ayırır | "NE?" |
| `visual/LeanUK_...png` | 4 **anlamsal** renk: sarı=nihai hedef, yeşil=ideal, mavi=mevcut, kırmızı=problem | "problem / kök neden" |

D-159 ikisini de ADIM 1'e koyuyor (üstte 5N1K şeridi, altında problem statement'ın
dört renk bandı). Olduğu gibi alınırsa **aynı blokta kırmızı iki farklı şey demiş
olur** — ve `CLAUDE.md`'nin "düzenli ve yalın" çıtasının ilk kurbanı bu olur.
Oturum B'nin kararı: ya 5N1K nötrleştirilir (tek renk / gri tonlama, ayrım
tipografiyle), ya anlamsal palet 5N1K'yı da kapsayacak şekilde genişletilir.
