import {
  cizgiler,
  odalar,
  seciliGrupIdleri,
  hoverCizgiId,      
  hoverKoseNoktasi,  
  PIXEL_PER_METRE,
} from "../core/state.js";

import {
  stage,
  viewport,
  odaKatmani,
  cizgiKatmani,
  etiketKatmani,
  odaEtiketKatmani,
} from "../core/stage.js";

const BIR_METRE = 100;
const ETIKET_EKRAN_OFSETI = 14;
const MIN_ETIKET_UZUNLUGU_METRE = 0.2;

function uzunlukEtiketiOlustur(cizgi, renk) {
  const dx = cizgi.x2 - cizgi.x1;
  const dy = cizgi.y2 - cizgi.y1;
  const uzunlukMetre = Math.hypot(dx, dy) / PIXEL_PER_METRE;

  if (uzunlukMetre < MIN_ETIKET_UZUNLUGU_METRE) return null;

  const metin = new createjs.Text(`${uzunlukMetre.toFixed(2)} m`, "12px 'Segoe UI', Arial, sans-serif", renk);
  metin.mouseEnabled = false;
  metin.textAlign = "center";
  metin.textBaseline = "middle";

  const tersOlcek = 1 / viewport.scaleX;
  metin.scaleX = tersOlcek;
  metin.scaleY = tersOlcek;

  let aciDerece = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (aciDerece > 90 || aciDerece < -90) aciDerece += 180;
  metin.rotation = aciDerece;

  const dikAciRadyan = (aciDerece * Math.PI) / 180 - Math.PI / 2;
  const ofset = ETIKET_EKRAN_OFSETI * tersOlcek;

  metin.x = ((cizgi.x1 + cizgi.x2) / 2) + Math.cos(dikAciRadyan) * ofset;
  metin.y = ((cizgi.y1 + cizgi.y2) / 2) + Math.sin(dikAciRadyan) * ofset;

  return metin;
}

export function ekraniGuncelle() {
  odaKatmani.graphics.clear();
  cizgiKatmani.graphics.clear();
  odaEtiketKatmani.removeAllChildren();
  etiketKatmani.removeAllChildren();

  // Odalar
  odalar.forEach((oda) => {
  if (
    !oda.noktalar ||
    oda.noktalar.length < 3
  ) {
    return;
  }

  const ilkNokta =
    oda.noktalar[0];

  odaKatmani.graphics
    .beginFill(
      "rgba(91, 14, 233, 0.15)",
    )
    .moveTo(
      ilkNokta.x,
      ilkNokta.y,
    );

  for (
    let i = 1;
    i < oda.noktalar.length;
    i += 1
  ) {
    const nokta =
      oda.noktalar[i];

    odaKatmani.graphics.lineTo(
      nokta.x,
      nokta.y,
    );
  }

  odaKatmani.graphics
    .lineTo(
      ilkNokta.x,
      ilkNokta.y,
    )
    .endFill();

  odaEtiketiniEkle(oda);
});

  // 2. ÇİZGİLERİ ÇİZ (DÜZELTİLDİ: Sadece tıklanan tek çizgi kırmızı olur)
  cizgiler.forEach((cizgi) => {
    // Çizginin kırmızı boyanması için seciliGrupIdleri listesinde kendi ID'sinin olması yeterlidir (Grup boyama iptal edildi)
    const secili = seciliGrupIdleri.includes(cizgi.id);
    const hoverMi = !secili && cizgi.id === hoverCizgiId; 

    const cizgiKalinligi = secili ? 10 : hoverMi ? 9 : 8;
    const cizgiRengi = secili ? "#ef4444" : hoverMi ? "#a78bfa" : "#9a44ef";

    cizgiKatmani.graphics
      .beginStroke(cizgiRengi)
      .setStrokeStyle(cizgiKalinligi, "round", "round")
      .moveTo(cizgi.x1, cizgi.y1)
      .lineTo(cizgi.x2, cizgi.y2)
      .endStroke();

    const etiket = uzunlukEtiketiOlustur(cizgi, secili ? "#ef4444" : hoverMi ? "#a78bfa" : "#5b21b6");
    if (etiket) {
      etiketKatmani.addChild(etiket);
    }
  });

  // Köşeler
  const cizilenKoseler = new Set();
  const TOLERANS = 1e-3;

  cizgiler.forEach((cizgi) => {
    const secili = seciliGrupIdleri.includes(cizgi.id);
    const noktalar = [{ x: cizgi.x1, y: cizgi.y1 }, { x: cizgi.x2, y: cizgi.y2 }];

    noktalar.forEach((nokta) => {
      const anahtar = `${nokta.x.toFixed(3)}-${nokta.y.toFixed(3)}`;
      if (cizilenKoseler.has(anahtar)) return;
      cizilenKoseler.add(anahtar);

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

function poligonMerkeziniHesapla(noktalar) {
  if (
    !Array.isArray(noktalar) ||
    noktalar.length < 3
  ) {
    return null;
  }

  let alanToplami = 0;
  let merkezXToplami = 0;
  let merkezYToplami = 0;

  for (
    let i = 0;
    i < noktalar.length;
    i += 1
  ) {
    const mevcut = noktalar[i];
    const sonraki =
      noktalar[
        (i + 1) % noktalar.length
      ];

    const carpim =
      mevcut.x * sonraki.y -
      sonraki.x * mevcut.y;

    alanToplami += carpim;

    merkezXToplami +=
      (mevcut.x + sonraki.x) *
      carpim;

    merkezYToplami +=
      (mevcut.y + sonraki.y) *
      carpim;
  }

  const isaretliAlan =
    alanToplami / 2;

  /*
   * Çok küçük veya bozuk poligonlarda
   * köşelerin ortalamasına düş.
   */
  if (
    Math.abs(isaretliAlan) <
    0.000001
  ) {
    const toplam = noktalar.reduce(
      (sonuc, nokta) => ({
        x: sonuc.x + nokta.x,
        y: sonuc.y + nokta.y,
      }),
      { x: 0, y: 0 },
    );

    return {
      x: toplam.x / noktalar.length,
      y: toplam.y / noktalar.length,
    };
  }

  return {
    x:
      merkezXToplami /
      (6 * isaretliAlan),

    y:
      merkezYToplami /
      (6 * isaretliAlan),
  };
}

function odaEtiketiniEkle(oda) {
  const merkez =
    poligonMerkeziniHesapla(
      oda.noktalar,
    );

  if (!merkez) {
    return;
  }

  const alanMetrekare =
    Math.abs(oda.alan) /
    (BIR_METRE * BIR_METRE);

  const kapsayici =
    new createjs.Container();

  /*
   * Başlık
   */
  const baslik =
    new createjs.Text(
      "ODA",
      "bold 14px Arial",
      "#4c1d95",
    );

  baslik.textAlign = "center";
  baslik.textBaseline = "middle";
  baslik.y = -9;

  /*
   * Alan bilgisi
   */
  const alanMetni =
    new createjs.Text(
      `${alanMetrekare.toFixed(2)} m²`,
      "12px Arial",
      "#6b7280",
    );

  alanMetni.textAlign = "center";
  alanMetni.textBaseline = "middle";
  alanMetni.y = 9;

  /*
   * Yazının arkasındaki soft beyaz alan
   */
  const arkaPlan =
    new createjs.Shape();

  arkaPlan.graphics
    .beginFill(
      "rgba(255, 255, 255, 0.82)",
    )
    .drawRoundRect(
      -36,
      -22,
      72,
      44,
      8,
    )
    .endFill();

  kapsayici.addChild(
    arkaPlan,
    baslik,
    alanMetni,
  );

  kapsayici.x = merkez.x;
  kapsayici.y = merkez.y;

  odaEtiketKatmani.addChild(
    kapsayici,
  );
}