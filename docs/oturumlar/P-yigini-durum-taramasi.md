# OTURUM — Açık P-madde yığınının durum taraması

> P-58 (D-254/D-255/D-256, 2026-09-15) ve Faz 12'nin dört dilimi (M1-M4) ile P-62 (D-253)
> kapandıktan sonra yazıldı. `DECISIONS.md`'de 70 P-numarası var; bunların kendi SATIR
> METNİ güvenilir değil — bir P-madde başka bir D-numarasının kendi anlatımı içinde
> kapatılmış olabilir ama kendi orijinal satırı hiç güncellenmemiş olabilir. **Somut örnek,
> bu dosyayı yazarken bulundu**: P-40 ("D-170'in `pinned` alanı/komutu + sürükleme tutamacı
> UI'sı — L3a'nın gerçek solver'ı artık var, ona bir manuel override eklensin, planlandı")
> hâlâ "planlandı/scheduled" diyor, ama Faz 11 — L3b (D-227, 2026-09-07) tam olarak bunu
> inşa etti ve "Faz 11'in kendi üç dilimlik planı (D-223) artık TAMAMEN KAPALI (L1+L2+L3a+
> L3b)" diye kapandı. P-40'ın kendi satırı hiç düzeltilmedi. **Bu tek bir kaza değil, bir
> yapısal sızıntı** — bir D-girdisi bir P-maddesini kapatırken P-maddesinin KENDİ satırını
> güncellemeyi unutmak kolay, ve `DECISIONS.md` 700+ satır olduğu için elle göz gezdirmek
> güvenilir değil.

Kanonik konum: `docs/oturumlar/P-yigini-durum-taramasi.md`. Yazıldı: 2026-09-15, P-58'in
kendi kapanışında.

---

## 0. İlk iş — gerçek koda karşı doğrula, DECISIONS.md'nin kendi metnine güvenme

Bu oturum bir **denetim** oturumudur, bir uygulama oturumu değil (P-62/D-232'nin Oturum A
emsali). Amaç: her açık görünen P-maddesini gerçek koda karşı tek tek doğrulamak, kapanmış
olanları KAPANDI olarak işaretlemek, gerçekten açık kalanları doğru, güncel bir listede
toplamak — kod YAZMADAN.

```bash
# 1. Her P-numarasının SON durumunu (satırındaki metin, güvenilmez) çıkar
grep -n "^| P-" DECISIONS.md | wc -l   # kaç P-maddesi var, referans

# 2. "OPEN"/"scheduled"/"planlandı"/"bekliyor" gibi anahtar kelimelerle görünüşte açık
#    olanları listele — ama HER BİRİNİ aşağıdaki gibi gerçek koda karşı doğrula, yalnızca
#    metne güvenme:
grep -B2 "scheduled\|planlandı\|bekliyor\|OPEN\|Not yet\|not scheduled" DECISIONS.md | grep "^| P-"
```

Her açık görünen P-maddesi için: maddenin kendi metninde adı geçen dosya/fonksiyon/mekanizma
gerçekten var mı, gerçekten eksik mi, `grep`/`Read` ile TEK TEK doğrula. P-40 örneğinde
olduğu gibi, bir madde başka bir D-girdisinin (L3b/D-227 gibi) gerçek kapanışıyla zaten
kapanmış olabilir — o D-girdisini bulup okumadan "hâlâ açık" sonucuna varma.

---

## 1. Bilinen, muhtemelen zaten kapanmış adaylar (bu liste ÖNCEDEN DOĞRULANMADI — kontrol listesi, sonuç değil)

Bu oturumu yazarken `DECISIONS.md`'nin son satır metnine bakılarak (tam kod doğrulaması
YAPILMADAN) tespit edilen, muhtemelen stale olan satırlar:

- **P-40** — muhtemelen KAPANDI (D-227/L3b), satırı güncellenmemiş.
- **P-19** — kendi metninde zaten "CLOSED... by D-110" diye kapanmış görünüyor, ama grep
  çıktısında "Barış runs cargo test..." diye eski bir OPEN-tarzı not da var — hangi satırın
  gerçekten son olduğunu `DECISIONS.md`'de P-19'un TÜM geçtiği yerleri okuyarak doğrula.
- **P-06/P-07** — "Phase 9" diyor, Faz 9 çoktan bitti (D-212) — muhtemelen kapanmış,
  doğrulanmadı.
- **P-46/P-47/P-45/P-43/P-36/P-31/P-30/P-67** — kendi satırlarında zaten "KAPANDI"/"CLOSED"
  yazıyor, muhtemelen gerçekten kapalı, yine de tek tek teyit edilebilir.

Gerçekten açık kalması muhtemel (yine doğrulanmadı, yalnızca metinden):

- **P-12** — Windows AppLocker/WDAC gerçek kurumsal makine testi — kod okunarak KAPANAMAZ,
  gerçek bir Farplas Windows makinesi gerektirir.
- **P-18** — takım rozeti/iş planı Gantt/kayıp taksonomisi esnekliği — hiçbir zaman
  kapsamlanmadı, gerçek bir veri modeli kararı gerektirir.
- **P-22** — action plan'ın Gantt yarısı — D-138'de bilerek 6c'den çıkarılmıştı, kendi
  dilimini hâlâ bekliyor.
- **P-27** — Impact/Effort matrix'in serbest-pozisyon UI'sı (`@dnd-kit`) — YAGNI'den
  kapsamlanmadı.
- **P-32** — gerçek bir LibreOffice-headless/PDF-diff pipeline'ı bu ortamda hâlâ yok.
- **P-38** — `renderToA3`'ün determinizm kısıtı yüzünden "Days late" hesaplanamıyor, `asOf`
  parametresi threadlenmeli.
- **P-39** — Why-Why tree'nin node-seviyesi referans mimarisi (D-185, Barış'ın kendi seçtiği
  Option A) hâlâ inşa edilmedi.
- **P-44** — HEIC/iPhone fotoğraf decode desteği yok.
- **P-51** — `AssistantPanel`'in serbest sohbeti (`ai_complete`) hâlâ redaksiyondan geçmiyor
  (yalnızca D-247'nin structured-edit akışı geçiyor).
- **P-52** — çoklu-sayfa xlsx/csv ingestion (yalnızca ilk sayfa okunuyor).
- **P-55** — `condensableFields`'ın alan-anlamına-göre genelleştirilmesi.
- **P-56** — whole-report çeviri modunun kısa/meta-header alanları kapsamıyor olması.
- **P-57** — `meta.language.set` komutu hâlâ yok (proje dilini gerçekten değiştiren bir yol).
- **P-59** — adım-özel AI koçluk/sohbet kutusu (W1'de filed, W2/W3'te de yapılmadı).
- **P-60/P-61** — cost-log'un accept/reject korelasyonu yok; tam-gövde prompt/response
  loglama ayarı inşa edilmedi (kendi güvenlik incelemesini bekliyor).
- **P-66** — `tpmLossTaxonomy`'nin 7-kategori (ENG) vs gerçek TR formunun 8-kategorisi
  farkı — şema/migration gerektirir.
- **P-70** — `CI-kirmizi-durum-devam-2.md`'nin (D-252) kendi taşıdığı iki vacuous-assertion
  notu (bilerek P-70'e ertelenmişti) hâlâ düzeltilmedi.

---

## 2. Bu oturumun kendi çıktısı

1. Yukarıdaki her maddeyi (ve grep'in bulduğu başka her "açık görünen" satırı) gerçek koda
   karşı tek tek doğrula.
2. Gerçekten kapanmış olanların kendi satırını `DECISIONS.md`'de KAPANDI + hangi D-numarası
   tarafından diye düzelt (P-40 gibi).
3. Gerçekten açık kalanları tek bir düzenli listede, her biri için "neden hâlâ açık, ne
   gerektirir, hangi fazın/dilimin kapsamına düşer" notuyla topla.
4. Bu listeyi Barış'a `AskUserQuestion` ile sun — hangisi/hangileri bir sonraki gerçek kod
   dilimi olsun, yoksa hepsi ertelensin mi. **Kod YAZMA** — bu yalnızca bir envanter +
   önceliklendirme oturumu, D-232/P-62 Oturum A'nın emsali.

---

## 3. Kapsam dışı

- Herhangi bir P-maddesinin gerçek düzeltmesi/kodu — bu oturumun işi yalnızca ENVANTER.
- `SPEC.md`/`CLAUDE.md`'nin kendi büyük yeniden yazımı — yalnızca `DECISIONS.md`'nin stale
  satırları düzeltilir.

---

**Model önerisi**: Sonnet 5 yeterli — bu bir grep+okuma+envanter turu, derin mimari analiz
gerekmiyor (D-28).
