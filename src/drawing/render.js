import {
  cizgiler,
  odalar,
  seciliGrupId,
  seciliGrupIdleri,
  hoverGrupId,
  hoverCizgiId,      // Üzerine gelinen tekil çizginin ID'si
  hoverKoseNoktasi,  // Üzerine gelinen köşenin koordinatı
  PIXEL_PER_METRE,
} from "../core/state.js";

import {
  stage,
  viewport,
  odaKatmani,
  cizgiKatmani,
  etiketKatmani,
} from "../core/stage.js";


// Uzunluk etiketi ekranda çizgiden bu kadar piksel uzağa yazılır.
const ETIKET_EKRAN_OFSETI = 14;

// Bu değerden kısa çizgilerde etiket göstermiyoruz,
// aksi halde küçük duvarlarda yazılar üst üste biner.
const MIN_ETIKET_UZUNLUGU_METRE = 0.2;

function uzunlukEtiketiOlustur(cizgi, renk) {
  const dx = cizgi.x2 - cizgi.x1;
  const dy = cizgi.y2 - cizgi.y1;

  const uzunlukMetre = Math.hypot(dx, dy) / PIXEL_PER_METRE;

  if (uzunlukMetre < MIN_ETIKET_UZUNLUGU_METRE) {
    return null;
  }

  const metin = new createjs.Text(
    `${uzunlukMetre.toFixed(2)} m`,
    "12px 'Segoe UI', Arial, sans-serif",
    renk,
  );

  metin.mouseEnabled = false;
  metin.textAlign = "center";
  metin.textBaseline = "middle";

  // Metin, zoom yapılsa da ekranda hep aynı boyutta görünsün diye
  // viewport'un ölçeğinin tersini uyguluyoruz.
  const tersOlcek = 1 / viewport.scaleX;
  metin.scaleX = tersOlcek;
  metin.scaleY = tersOlcek;

  // Çizginin açısını hesapla ve metni bu açıyla döndür ki
  // çizgiyle paralel dursun (artık çizgiler her açıda olabiliyor).
  // Yazı baş aşağı görünmesin diye ±90° dışına çıkan açılarda
  // 180° çeviriyoruz.
  let aciDerece = (Math.atan2(dy, dx) * 180) / Math.PI;

  if (aciDerece > 90 || aciDerece < -90) {
    aciDerece += 180;
  }

  metin.rotation = aciDerece;

  const ortaX = (cizgi.x1 + cizgi.x2) / 2;
  const ortaY = (cizgi.y1 + cizgi.y2) / 2;

  // Etiketi çizginin tam üstüne değil, dik yönde hafif
  // ofsetle yerleştiriyoruz ki çizgiyi kapatmasın.
  const aciRadyan = (aciDerece * Math.PI) / 180;
  const dikAciRadyan = aciRadyan - Math.PI / 2;

  const ofset = ETIKET_EKRAN_OFSETI * tersOlcek;

  metin.x = ortaX + Math.cos(dikAciRadyan) * ofset;
  metin.y = ortaY + Math.sin(dikAciRadyan) * ofset;

  return metin;
}

export function ekraniGuncelle() {
  odaKatmani.graphics.clear();
  cizgiKatmani.graphics.clear();
  etiketKatmani.removeAllChildren();

  // Odalar
  odalar.forEach((oda) => {
    if (!oda.noktalar || oda.noktalar.length < 3) return;
    const ilkNokta = oda.noktalar[0];
    odaKatmani.graphics
      .beginFill("rgba(91, 14, 233, 0.15)")
      .moveTo(ilkNokta.x, ilkNokta.y);

    for (let i = 1; i < oda.noktalar.length; i += 1) {
      const nokta = oda.noktalar[i];
      odaKatmani.graphics.lineTo(nokta.x, nokta.y);
    }
    odaKatmani.graphics.lineTo(ilkNokta.x, ilkNokta.y).endFill();
  });

  // Çizgiler (ve uzunluk etiketleri). Hover rengi tüm gruba değil,
  // sadece mouse altındaki tekil çizgiye uygulanır.
  cizgiler.forEach((cizgi) => {
    const grupId = cizgi.groupId ?? cizgi.id;

    const secili = grupId === seciliGrupId || seciliGrupIdleri.includes(grupId);

    const hoverMi = !secili && cizgi.id === hoverCizgiId;

    const cizgiKalinligi = secili ? 10 : hoverMi ? 9 : 8;

    const cizgiRengi = secili
      ? "#ef4444"      // Seçili çizgiler kırmızı
      : hoverMi
        ? "#a78bfa"    // Hover durumundaki tek çizgi açık mor
        : "#9a44ef";   // Normal çizgiler koyu mor

    cizgiKatmani.graphics
      .beginStroke(cizgiRengi)
      .setStrokeStyle(cizgiKalinligi, "round", "round")
      .moveTo(cizgi.x1, cizgi.y1)
      .lineTo(cizgi.x2, cizgi.y2)
      .endStroke();

    const etiketRengi = secili ? "#ef4444" : hoverMi ? "#a78bfa" : "#5b21b6";
    const etiket = uzunlukEtiketiOlustur(cizgi, etiketRengi);
    if (etiket) {
      etiketKatmani.addChild(etiket);
    }
  });

  // Köşeler
  const cizilenKoseler = new Set();
  const TOLERANS = 1e-3;

  cizgiler.forEach((cizgi) => {
    const grupId = cizgi.groupId ?? cizgi.id;
    const secili = grupId === seciliGrupId || seciliGrupIdleri.includes(grupId);

    const noktalar = [
      { x: cizgi.x1, y: cizgi.y1 },
      { x: cizgi.x2, y: cizgi.y2 },
    ];

    noktalar.forEach((nokta) => {
      const anahtar = `${nokta.x.toFixed(3)}-${nokta.y.toFixed(3)}`;
      if (cizilenKoseler.has(anahtar)) return;
      cizilenKoseler.add(anahtar);

      // Bu nokta hover durumundaki köşe mi?
      const koseHoverMi = hoverKoseNoktasi && 
        Math.hypot(nokta.x - hoverKoseNoktasi.x, nokta.y - hoverKoseNoktasi.y) < TOLERANS;

      const koseYaricapi = secili ? 5 : koseHoverMi ? 6 : 4;
      const koseRengi = secili ? "#ef4444" : koseHoverMi ? "#a78bfa" : "#9a44ef";

      cizgiKatmani.graphics
        .beginFill(koseRengi)
        .drawCircle(nokta.x, nokta.y, koseYaricapi)
        .endFill();

      // Hover'daki köşenin içine, ayırt edilsin diye beyaz bir iç benek çiz.
      if (koseHoverMi) {
        const icYaricap = 2.5;
        const icRenk = "#ffffff";

        cizgiKatmani.graphics
          .beginFill(icRenk)
          .drawCircle(nokta.x, nokta.y, icYaricap)
          .endFill();
      }
    });
  });

  stage.update();
}