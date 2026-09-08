# OTURUM Faz 12 — M3: Packaging/signing kapanışı (kalıcı imzasız)

> Faz 12 kapsam belirleme (D-230, 2026-09-08) Barış'a soruldu: packaging/signing ne zaman
> yapılsın? **Cevap: imzasız kalsın, kalıcı olarak — bu iç-kurumsal bir araç, SmartScreen/
> Gatekeeper uyarısı kabul edilebilir kalıcı durum, IT kendi AppLocker/WDAC politikasıyla
> yönetir.** Bu, D-44'ün (CI imzasız bundle) ve P-12'nin (AppLocker/WDAC, gerçek makine
> gerektiriyor) kendi varsayımlarıyla UYUMLU — Apple Developer Program üyeliği, Windows EV
> sertifikası, notarization akışı hiçbiri SATIN ALINMAYACAK/KURULMAYACAK.
>
> Bu dilim küçük — asıl iş bir KOD dilimi değil, **D-44/D-46'yı "kalıcı kabul edilen durum"
> olarak resmen kapatmak** + birkaç gerçek, küçük paketleme eksiğini (bundle metadata, LICENSE
> dosyası) kapatmak + Barış'ın kendi hesabından yürüyeceği kısa bir SÜREÇ kontrolü.
>
> Kanonik konum: `docs/oturumlar/M3-paketleme-imza-kapanisi.md`. Yazıldı: 2026-09-08, Faz 12
> kapsam belirleme oturumunda (D-230).

---

## 0. İlk iş — gerçek koda karşı doğrula

```bash
python3 -c "
import json
d = json.load(open('src-tauri/tauri.conf.json'))
b = d.get('bundle', {})
print('publisher:', b.get('publisher'))
print('copyright:', b.get('copyright'))
print('license:', b.get('license'))
print('shortDescription:', b.get('shortDescription'))
"
  # 2026-09-08'de DÖRDÜ de None/yok — hiç doldurulmamış. Değiştiyse bu dilim kısmen zaten
  # başlamış olabilir.

ls LICENSE* 2>/dev/null || echo "yok"
  # 2026-09-08'de YOK — `.github/workflows/ci.yml`'in `paths-ignore` listesi "LICENSE"
  # ADINI GEÇİYOR ama dosyanın kendisi hiç yok. Repo M2'de PUBLIC olacağı için bu daha da
  # önem kazanıyor (bkz. §2.1) — M2'den ÖNCE ya da ONUNLA BİRLİKTE kapatılmalı.

grep -n "TAURI_SIGNING_PRIVATE_KEY" .github/workflows/ci.yml
  # `TAURI_SIGNING_PRIVATE_KEY: ""` bekleniyor (D-44'ün kendi bilinçli-imzasız satırı) — bu
  # dilim bunu DEĞİŞTİRMEZ, yalnızca yorum/dokümantasyonla "bu kalıcı bir karar" diye işaretler.
```

`~/.claude/APPLE-GONDERIM.md`'yi oku (Bölüm 0.1 — [AS]/[DID] profilleri). Bu proje App Store'a
GİTMİYOR — dağıtım [DID] (Developer ID doğrudan) modeline benziyor ama D-230'un kararıyla
notarization/imzalama YOK, yani [DID]'in kendi "temiz hesapta Gatekeeper" bölümü (§3) hâlâ
geçerli SENARYODUR (kullanıcı ilk kez uygulamayı açar) ama beklenen SONUÇ farklıdır ("Open
Anyway" ile geçilecek kalıcı bir engel, notarize edilmiş bir "sorunsuz" değil).

Eksik/adı değişmiş dosya varsa DUR ve Barış'a söyle.

---

## 1. Bu dilimin gerçek işi (kod)

### 1.1 Bundle metadata

`tauri.conf.json`'ın `bundle` bölümüne `publisher` (Farplas mı, Barış'ın kendi adı/şirketi mi —
Barış'a sor, varsayma), `copyright`, `shortDescription` eklenir. Bunlar Windows'un kurulum
sihirbazında ve macOS'un "Get Info" panelinde görünür — imzasız bir uygulamada bile kullanıcının
"bu ne, kime ait" sorusuna cevap verirler, D12'nin kendi "kullanıcı anlıyor mu?" temel
değişmeziyle aynı ruhta.

### 1.2 LICENSE dosyası — M2'den ÖNCE karar verilmeli

Repo M2'de public olacak. Bugün hiçbir LICENSE dosyası yok — bu, GitHub'ın kendi varsayılan
davranışı gereği "tüm haklar saklıdır" anlamına gelir (bir açık kaynak lisansı OTOMATİK
uygulanmaz), ama bunu AÇIKÇA bir dosyada belirtmemek, kodun herkese görünür olduğu bir ortamda
niyetin belirsiz kalması demek. Barış'a `AskUserQuestion`: proprietary/all-rights-reserved bir
LICENSE metni mi (Farplas'a özel ticari yazılım), yoksa başka bir düzenleme mi? Bu KOD kararı
değil, bir HUKUKİ/iş kararı — körü körüne bir şablon LICENSE yapıştırılmamalı.

### 1.3 D-44/D-46'nın kendi satırlarını "kalıcı" olarak kapat

`DECISIONS.md`'de D-44'ün "revisit once a real release process exists" notu artık M2 tarafından
çözüldü (release süreci var, ama İMZALAMA hâlâ yok — bu ikisi ayrı sorular, D-230'un kendi notu
bunu zaten ayırdı). D-44'ün durumu OPEN'da kalabilir (gelecekte gerçekten değişebilir) ama bu
dilim bir netleştirme notu ekler: "imzasız kalma kararı D-230'da BİLİNÇLİ verildi, D-44'ün kendi
orijinal gerekçesinden (henüz erken) FARKLI bir gerekçeyle (kalıcı iç-kurumsal kabul)."

---

## 2. Bu dilimin gerçek işi (SÜREÇ — Barış'ın kendi hesabından)

`APPLE-GONDERIM.md`'nin Bölüm 3'ü ([DID], Gatekeeper ilk açılış davranışı) burada UYARLANMIŞ
şekilde geçerli — ama "notarize edilmiş, düzgün imzalı" senaryosu DEĞİL, "imzasız/notarize
edilmemiş" senaryosunun KENDİSİ kalıcı hedef durum. Barış'ın (ya da onun adına birinin) temiz
bir hesapta/makinede yürümesi gereken, kod okunarak BULUNAMAYACAK adımlar:

- macOS: temiz bir kullanıcı hesabında `.dmg`'yi gerçek bir indirme yoluyla getir (quarantine
  bayrağı gerçekçi olsun), çift tıkla. "Apple could not verify..." diyalogu çıkıyor mu?
  System Settings → Privacy & Security altında "Open Anyway" görünüyor mu, tıklanınca gerçekten
  açılıyor mu?
- Windows: temiz bir hesapta `.exe`'yi indir, çalıştır. SmartScreen "Windows protected your PC"
  uyarısı çıkıyor mu? "More info" → "Run anyway" yolu çalışıyor mu?
- **P-12'nin kendi sorusu hâlâ AÇIK**: bu ikisi Farplas'ın KENDİ kurumsal makinesinde (gerçek
  AppLocker/WDAC politikası altında) denenmedi — bu dilim P-12'yi KAPATMAZ, yalnızca genel
  (kurumsal olmayan) bir temiz hesapta beklenen davranışı doğrular. P-12 kendi gerçek makine
  turunu bekliyor.

Bulgu formatı `APPLE-GONDERIM.md`'nin Bölüm 6'sının aynısı — yürünen yol × gözlenen karşılık.

---

## 3. Kapsam dışı

- Gerçek imzalama/notarization altyapısı — D-230'un kararıyla YAPILMAYACAK.
- P-12'nin kendi kapanışı (gerçek Farplas makinesi gerektiriyor, bu dilimin bir SÜREÇ turu
  onu kapatmaya yetmiyor).
- M2 (auto-update) — bağımsız, ama LICENSE kararı (§1.2) M2'nin repo-public adımından ÖNCE
  netleşirse daha iyi (sıralama önerisi, zorunlu değil).

---

## 4. Bütçe ve kapanış disiplini

Küçük dilim — bir `AskUserQuestion` (LICENSE), üç küçük metadata alanı, bir SÜREÇ yürüyüşü.
Tek oturumda biter.

Kapanışta: `DECISIONS.md`'ye yeni bir D-numarası, D-44'ün notunun netleştirilmesi, Faz 12
tablosundaki M3 satırının durumu, `CLAUDE.md`'nin Current state'ine özet.

---

**Model önerisi**: küçük, iyi tanımlanmış — Sonnet 5 yeterli (D-28).
