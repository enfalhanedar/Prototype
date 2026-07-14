import {
  cizgiler,
  odalar,
  seciliGrupId,
  seciliGrupIdleri,
} from "./state.js";

import {
  stage,
  odaKatmani,
  cizgiKatmani,
} from "./stage.js";


// 2. EKRANI GÜNCELLEME (EASELJS TARZI)
export function ekraniGuncelle() {
  // Eski çizimleri temizle
  odaKatmani.graphics.clear();
  cizgiKatmani.graphics.clear();

  // Odaları EaselJS ile çiziyoruz
  odalar.forEach((oda) => {
  if (!oda.noktalar || oda.noktalar.length < 3) {
    return;
  }

  const ilkNokta = oda.noktalar[0];

  odaKatmani.graphics
    .beginFill("rgba(91, 14, 233, 0.15)")
    .moveTo(ilkNokta.x, ilkNokta.y);

  for (let i = 1; i < oda.noktalar.length; i += 1) {
    const nokta = oda.noktalar[i];

    odaKatmani.graphics.lineTo(
      nokta.x,
      nokta.y,
    );
  }

  odaKatmani.graphics
    .lineTo(ilkNokta.x, ilkNokta.y)
    .endFill();
});

  // Çizgileri ve köşelerdeki kırmızı daireleri EaselJS ile çiziyoruz
  // Önce bütün çizgileri çiz
cizgiler.forEach((cizgi) => {
  const grupId = cizgi.groupId ?? cizgi.id;

  const secili =
    grupId === seciliGrupId ||
    seciliGrupIdleri.includes(grupId);

  const cizgiKalinligi = secili ? 10 : 8;

  cizgiKatmani.graphics
    .beginStroke(secili ? "#ef4444" : "#9a44ef")
    .setStrokeStyle(
      cizgiKalinligi,
      "round",
      "round",
    )
    .moveTo(cizgi.x1, cizgi.y1)
    .lineTo(cizgi.x2, cizgi.y2)
    .endStroke();
});

  const cizilenKoseler = new Set();

cizgiler.forEach((cizgi) => {
  const grupId = cizgi.groupId ?? cizgi.id;

  const secili =
    grupId === seciliGrupId ||
    seciliGrupIdleri.includes(grupId);

  const koseYaricapi = secili ? 5 : 4;
  const koseRengi = secili ? "#ef4444" : "#9a44ef";

  const noktalar = [
    { x: cizgi.x1, y: cizgi.y1 },
    { x: cizgi.x2, y: cizgi.y2 },
  ];

  noktalar.forEach((nokta) => {
    const anahtar = `${nokta.x.toFixed(3)}-${nokta.y.toFixed(3)}`;

    if (cizilenKoseler.has(anahtar)) {
      return;
    }

    cizilenKoseler.add(anahtar);

    cizgiKatmani.graphics
      .beginFill(koseRengi)
      .drawCircle(
        nokta.x,
        nokta.y,
        koseYaricapi,
      )
      .endFill();
  });
});

stage.update();
}