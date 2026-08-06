# OTURUM B3 — Blok blok görsel doğrulama (ADIM 1'in devamı, ADIM 2–8)

> D-149'un ikinci oturumunun (B) üçüncü parçası — B1 (altı çalışma sayfası) ve B2 (blok
> görsel dili + arayüz + esnek tahsis **kararları**, prose) bitti. B3'ün işi farklı: B2'nin
> §14'te yazdığı kararları **D-171'in Blok Görsel Doğrulama Döngüsü** ile, blok blok, gerçek
> bir maket üzerinden Barış'a onaylatmak. B2 sırasında ADIM 1 bu döngüden bir kez geçti ve
> yöntemin kendisi tam bu yüzden `CLAUDE.md`'ye kalıcı kural olarak yazıldı — bu dosya o
> kuralın **ikinci kullanıcısı**, ilk kullanıcısı değil.
>
> Kanonik konum: `docs/oturumlar/B3-blok-blok-gorsel-dogrulama.md`. Yazıldı: 2026-08-06,
> Barış'ın haftalık token bütçesi tükenmek üzereyken (Pazartesi sıfırlanacak) — bu yüzden
> yöntem burada ve `CLAUDE.md`'de kayıtlı, sohbette değil.

---

## 0. İlk iş — bu promptu doğrula

```bash
ls -1 reference/TEMPLATE_ANALYSIS.md DECISIONS.md CLAUDE.md \
      reference/visual/LeanUK_PPS_A3_worked_example.png \
      reference/visual/5N-1K.jpeg
```

Eksik/adı değişmiş dosya varsa **DUR ve Barış'a söyle**.

---

## 1. Okuma sırası

1. `~/.claude/ANAYASA.md` + `~/.claude/AKIS.md` — iş depoya dokunacak.
2. `CLAUDE.md` — **özellikle "How I want you to work"'teki "The Block Visual Verification
   Loop"** (D-171, 2026-08-06 eklendi) ve "Current state"'in en sonu. Yöntemin tam tarifi
   orada; burada tekrar edilmiyor.
3. `reference/TEMPLATE_ANALYSIS.md` §14 — **baştan sona.** §14.1 (genişletilmiş palet, ⚠️
   ONAY BEKLEYEN bir not var — aşağıdaki §2'nin ilk işi bu), §14.2 (ADIM 1'in üç zorunlu
   paneli + iki opsiyonel eki), §14.3 (P-31'in çözümü — ADIM 7'nin `kpi-strip`'i, ADIM
   5/6/8'in D-41 durum işaretleri), §14.4 (ADIM 2/3/4), §14.5 (sekiz blok ortak grameri),
   §14.6/§14.7 (adım arayüzü + esnek tahsis — bunlar kod tasarımı, görsel maket gerektirmez,
   B3'ün kapsamı dışında).
4. `DECISIONS.md`: **D-165 – D-172** (bu oturumun doğrudan girdisi) ve D-47/D-49 (palet/font
   token'ları, maketin kendi kullandığı).
5. Artifact: ADIM 1'in yayınlanmış maketi —
   `https://claude.ai/code/artifact/b1ae2136-9785-4985-b7a3-587663d38466`. Barış'a bu linki
   açıp açmadığını / v2'yi onaylayıp onaylamadığını sor — kod bu URL'i okuyamaz, yalnızca
   Barış görebilir.

---

## 2. İlk iş — ADIM 1'in açık döngüsünü kapat

§14.1'in ⚠️ notu: Katman A'nın **ilk** hex değerleri (`#3F7D4A`/`#2D6FA3`/`#B23A3A`) canlı
karşılaştırmada üç somut fark çıkardı (Gap Analizi'nde eksik braket/ok/balon, koyu dolgu/beyaz
metin yerine açık dolgu/siyah metin, uç-uca bantlar yerine ayrık kartlar) ve maket buna göre
**v2**'ye güncellendi (`#8FBF4F`/`#4A90D9`/`#E0342A`, braket+ok+balon eklendi, kartlı Problem
Statement). **Ama bu v2 henüz Barış'a gösterilip onay alınmadı** — B2 oturumu bütçe bitişiyle
kesildi.

Yapılacak: Barış'a artifact linkini hatırlat, v2'yi incelemesini iste. Onaylarsa
`TEMPLATE_ANALYSIS.md` §14.1'in tablosunu ve `DECISIONS.md` D-165'i v2'nin kesin değerleriyle
güncelle (⚠️ notunu kaldır). Onaylamazsa döngü devam eder — D-171'in adımlarını tekrarla.

---

## 3. Sıradaki bloklar — önerilen sıra

D-171: **bir oturumda en fazla bir-iki blok**, tek kümülatif artifact'i büyüterek (aynı dosya
yolunu yeniden yayınla, yeni bir URL açma). Öneri sırası — riske ve yeniliğe göre:

1. **ADIM 1'in onayını kapat** (§2), sonra aynı artifact'e ADIM 2'yi ekle.
2. **ADIM 2** — en kalabalık ve en çok grafik taşıyan blok (§14.4), önce doğrulanmalı.
3. **ADIM 4** — ikinci en kalabalık, fishbone/ağaç diyagramları içeriyor.
4. **ADIM 7** — §14.3'ün önerdiği **yeni** `kpi-strip` mekanizması burada; hiç şipping
   edilmiş plugin'i olmadığı için en soyut/en az test edilmiş tasarım — maket burada özellikle
   değerli.
5. **ADIM 3** — D-38/`smartTarget` zaten şipping edildi ve tasarlandı; burası tam yeniden
   tasarım değil, **hızlı bir doğrulama** (mevcut zones düzeni gerçekten LeanUK'ın "düzenli ve
   yalın" çıtasını tutuyor mu, kısa bir maket ile teyit).
6. **ADIM 5 / 6 / 8** — §14.3'ün "yeni mekanizma gerekmez" kararı; maket burada D-41'in
   şekil-kodlu durum işaretlerinin küçük kutuda okunur kalıp kalmadığını doğrular, muhtemelen
   üçü tek bir oturumda hızlıca geçilebilir.

Her blok kendi mini-döngüsünü (`CLAUDE.md`'nin 8 adımı) yürütür: geometri + karar → maket →
referansla yan yana → Barış'ın somut geri bildirimi → düzelt → onay → **hemen** `TEMPLATE_ANALYSIS.md`/
`DECISIONS.md`'ye yaz. Onay gelmeden bir sonraki bloğa geçme.

---

## 4. Kapsam dışı (B2'den değişmeden taşındı)

- Şablon dosyası yazmak (`src/a3/templates/*`) — D-95, Faz 11.
- Plugin ekleme/silme (5N1K'nın kendisi, `problem-impact`, `kpi-strip`'in gerçek plugin'leri
  dahil) — Oturum C. B3 yalnızca bunların **görsel tasarımını** maketler, kodunu yazmaz.
- P-26 (i18n + blok hizası) — Oturum D.
- Sayfa sözleşmesi (§12, D-154/D-159) — LOCKED. Barış'ın B2'de paylaştığı iki-sütun taslağı
  gibi bir kavram notu gelirse **DUR, soru sor** (B2'nin kendi örneği: bu tam olarak böyle
  çözüldü, geometri açılmadı).

---

## 5. Teslimat

Her onaylanan blok için `TEMPLATE_ANALYSIS.md` §14'ün ilgili alt bölümü güncellenir,
`DECISIONS.md`'ye ilgili D kaydı eklenir/kesinleşir, kümülatif artifact yeniden yayınlanır,
doğrulanmışsa **commit + push**. **Kod YAZILMAZ** — B3 de bir tasarım/doğrulama oturumu.

---

## 6. Bütçe uyarısı (Madde 1 / G1)

Yedi blok kaldı, her biri potansiyel olarak 2+ geri bildirim turu alabilir — ADIM 1 tek
başına iki tur sürdü. **Hepsini tek oturumda bitirmeye çalışma.** İşe başlamadan hangi
blok(lar)ı bu oturumda yapacağını tahmin et ve söyle; bir blok bitince doğal bir durma
noktasıdır, oradan yeni bir temiz oturuma geçmek gerekirse öner.

---

**Model önerisi:** Opus — D-28'in "mimari/tasarım" sınıfı, B1/B2 ile aynı.
