# OTURUM Faz 12 — M1: i18n tarama tamamlama

> Faz 12 kapsam belirleme (D-230, 2026-09-08) Barış'a beş soru sordu; i18n "complete" için
> **"mekanik tarama + anahtar eşliği"** seçildi (D10.4-D10.9'un tam sistematik denetimi
> AÇIKÇA reddedildi). Ama kapsam oturumunun kendisi bir gerçek buldu: `kontrol-dil.sh` bu
> proje için **KAPSAM DIŞI** döner (0 dosya taranır — yalnızca Swift/Python kapsıyor, bu proje
> TS/Rust). Yani "mekanik tarama" isminin çağrıştırdığı hazır bir araç YOK — bu dilim gerçekte
> küçük, sınırlı, ELLE bir grep turu + bir tane gerçek, otomatikleştirilebilir mekanizma
> (TR/EN anahtar eşliğini gelecekte de koruyan bir test).
>
> Kapsam oturumu bu dilimin gerçek işini büyük ölçüde ÖNDEN yaptı (aşağıdaki §1 bunun kaydı) —
> bu dosyanın kendi işi kalan küçük parçaları kapatmak ve bulguyu kalıcı hale getirmek.
>
> Kanonik konum: `docs/oturumlar/M1-i18n-tarama.md`. Yazıldı: 2026-09-08, Faz 12 kapsam
> belirleme oturumunda (D-230).

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
find src/i18n/locales -name "*.json"
  # src/i18n/locales/{tr,en}/common.json bekleniyor, sekiz üst-seviye ad alanı
  # (app/launch/project/workspace/methods/gallery/a3PreviewWindow/settings).

python3 -c "
import json
def flatten(d, p=''):
    keys=set()
    for k,v in d.items():
        f=f'{p}.{k}' if p else k
        keys |= flatten(v, f) if isinstance(v, dict) else {f}
    return keys
tr=flatten(json.load(open('src/i18n/locales/tr/common.json')))
en=flatten(json.load(open('src/i18n/locales/en/common.json')))
print('tr:', len(tr), 'en:', len(en), 'fark:', len(tr^en))
"
  # 2026-09-08'de 957/957, fark 0 idi. Farklıysa DUR — bu dosyanın kendi önkoşulu bozulmuş.

grep -rn "toLocaleUpperCase" src --include="*.ts*"
  # StepPage.tsx:41 bekleniyor (D-219'un kendi düzeltmesi) — TEK eşleşme.

grep -rln "\.toUpperCase()\|\.toLowerCase()" src --include="*.ts*" | grep -v test
  # 2026-09-08'de iki dosya: StepPage.tsx (yalnızca bir YORUM satırında, gerçek kod değil) ve
  # workspaceEffects.ts (klavye kısayolu karşılaştırması, `event.key.toLowerCase() !== "z"` —
  # fiziksel tuş kodu, kullanıcıya-görünen metin DEĞİL, locale-güvenli). Üçüncü bir gerçek
  # eşleşme çıkarsa YENİ bir bulgu — incele.

grep -rn "toLocaleDateString\|toLocaleTimeString\|new Intl\." src --include="*.ts*" | grep -v test
  # 2026-09-08'de dört dosya, DÖRDÜ de `i18n.language`/`locale` parametresini AÇIKÇA geçiyor
  # (RecentProjectCard.tsx, RoundsBand.tsx, SignOffPanel.tsx, SaveIndicator.tsx) — sistem
  # varsayılan locale'ine güvenen (parametre olmadan) bir `new Intl.DateTimeFormat()` YOKTU.
  # Fark varsa (parametresiz bir çağrı bulursan) bu GERÇEK bir D10 ihlali.

grep -rn "\.sort(" src --include="*.ts*" | grep -v test
  # 2026-09-08'de 7 eşleşme, HEPSİ sayısal karşılaştırma (`a.order - b.order` vb.) — string/
  # alfabetik (Türkçe İ/I/ı/i sıralama tuzağı) sıralama YOK. Yeni bir string `.sort()` eşleşmesi
  # çıkarsa `localeCompare(b, "tr")` ile mi yoksa varsayılan (yanlış) karşılaştırmayla mı
  # yapıldığını kontrol et.

grep -rn "\.toFixed(" src --include="*.ts*" | grep -v test
  # 2026-09-08'de 6 eşleşme (KpiStripChart, distributionChart/stats, SettingsScreen'in maliyet
  # gösterimi ×2, EntryProposalField'in dosya boyutu ×2) — HİÇBİRİ locale-aware değil (`.` her
  # zaman ondalık ayracı). Bu GERÇEK bir §1.2'nin kendi açık sorusu — aşağı bak.
```

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Kapsam oturumunun (D-230) zaten kapattığı bulgular — bu dilimde TEKRAR ARANMAZ

Bunlar 2026-09-08'de gerçek koda karşı doğrulandı, temiz çıktı. §0'ın kendi grep'leri bu
temizliğin hâlâ geçerli olduğunu (kod bu dilim başlarken değişmediyse) doğrulamak için var —
yeniden keşfetmek için değil:

- TR/EN anahtar eşliği: **957/957, fark sıfır.**
- `.toLocaleUpperCase`/`.toUpperCase`/`.toLowerCase`: yalnızca D-219'un kendi düzeltmesi + bir
  locale-duyarsız (ve locale-güvenli) klavye kısayolu karşılaştırması.
- Tarih biçimlendirme (`Intl.DateTimeFormat`): dört çağrı sitesinin DÖRDÜ de `i18n.language`
  parametresini açıkça geçiyor.
- String sıralama: yedi `.sort()` çağrısının hepsi sayısal, alfabetik/locale riski yok.

---

## 2. Bu dilimin gerçek işi

### 2.1 TR/EN anahtar eşliğini KALICI hale getir (yeni, küçük mekanizma)

Bugünkü 957/957 eşliği bir anlık doğrulama — hiçbir şey gelecekte bunu KORUMUYOR. Yeni bir
Vitest testi (`src/i18n/localeParity.test.ts` ya da benzeri): iki `common.json`'ı düzleştirip
anahtar kümelerini karşılaştırır, fark varsa test FAIL olur (hangi anahtarların eksik olduğunu
mesajda listeler). CLAUDE.md'nin kendi "TR and EN keys are added together" kuralını mekanik
hale getiren TEK yeni şey bu — küçük, D-114 bütçesine kolayca sığar.

### 2.2 `.toFixed()`'in decimal-separator sorusu — Barış'a sorulmalı, körü körüne değişmemeli

Altı `.toFixed()` çağrısı hep `.` ondalık ayracı üretiyor (JS'in kendi davranışı, locale'den
bağımsız). İkisi USD tutarı (`SettingsScreen`'in maliyet gösterimi — para birimi ISO formatı,
pek çok uygulamada locale'den bağımsız kalması KABUL EDİLİR), ikisi dosya boyutu (KB/MB, aynı
gerekçe), ikisi gerçek ölçüm değeri (KPI grafiği, dağılım grafiği aralık etiketi — Türkçe
konvansiyon virgül ister). `AskUserQuestion` ile sorulmalı: hepsi olduğu gibi mi kalsın
(mühendisler yazılımda İngilizce sayı formatına alışkın), yoksa yalnızca ölçüm değerleri mi
`Intl.NumberFormat(i18n.language)`'a geçsin (para/dosya boyutu hariç)? Barış'ın kendi Faz 12
seçimi ("tam sistematik denetim değil") bu soruyu "atla, olduğu gibi bırak" yönünde
yorumlanabilir — ama bu spesifik altı nokta zaten bulunmuş durumda, sormak ek bir tarama
maliyeti getirmiyor.

### 2.3 Kalan D10.4-D10.9 maddeleri — BİLEREK dokunulmuz, kaydı burada

Barış'ın kendi seçimi gereği, aşağıdakiler bu dilimin kapsamı DIŞINDA kalır (gelecekte gerçek
bir şikayet/kanıt gelirse kendi P-item'ı açılır, şimdi aranmaz):
- Rust tarafındaki hata mesajlarının/log'ların TR/EN durumu (kullanıcıya hiç gösterilmiyor,
  yalnızca `AiError`/`IngestError` gibi iç tipler — düşük risk).
- Sayı biçimlendirmesinin ötesinde tam bir Türkçe yerelleştirme kalite denetimi (kısaltmalar,
  resmi/gayri-resmi ton tutarlılığı, vb.) — bu D10.4-D10.9'un asıl ELLE kısmı, Barış tarafından
  reddedildi.

---

## 3. Kapsam dışı

- Gerçek koda karşı §0'da doğrulanan dört bulgu grubu — zaten temiz, yeniden aranmaz.
- M2/M3/M4 — bağımsız dilimler, bu dosyanın konusu değil.
- P-58 (görsel dil yayılması) — kendi ayrı oturumu.

---

## 4. Bütçe ve kapanış disiplini

Küçük bir dilim — tek yeni mekanizma (§2.1'in kalıcı test'i), bir `AskUserQuestion` (§2.2), kod
değişikliği yok denecek kadar az. Tek oturumda bitmeli.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, Faz 12 tablosundaki M1 satırının durumu
güncellenir, `CLAUDE.md`'nin Current state'ine özet.

---

**Model önerisi**: küçük, iyi tanımlanmış — Sonnet 5 yeterli (D-28).
