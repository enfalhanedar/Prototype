import {
  cizgiler,
  setOdalar,
} from "../core/state.js";

import {
  noktalarEsitMi,
  poligonAlani,
  poligonSinirlari,
} from "../geometry/geometry.js";

function gruplariOlustur() {
  const gruplar = new Map();

  for (const cizgi of cizgiler) {
    const grupId = cizgi.groupId ?? cizgi.id;

    if (!grupId) continue;

    if (!gruplar.has(grupId)) {
      gruplar.set(grupId, []);
    }

    gruplar.get(grupId).push(cizgi);
  }

  return gruplar;
}

function cizgileriSiraliNoktalaraCevir(grupCizgileri) {
  if (grupCizgileri.length < 3) {
    return null;
  }

  const kalanlar = [...grupCizgileri];
  const ilkCizgi = kalanlar.shift();

  const noktalar = [
    { x: ilkCizgi.x1, y: ilkCizgi.y1 },
    { x: ilkCizgi.x2, y: ilkCizgi.y2 },
  ];

  let mevcutSon = noktalar[noktalar.length - 1];

  while (kalanlar.length > 0) {
    const bulunanIndex = kalanlar.findIndex((cizgi) => {
      const ilkNokta = {
        x: cizgi.x1,
        y: cizgi.y1,
      };

      const ikinciNokta = {
        x: cizgi.x2,
        y: cizgi.y2,
      };

      return (
        noktalarEsitMi(mevcutSon, ilkNokta) ||
        noktalarEsitMi(mevcutSon, ikinciNokta)
      );
    });

    if (bulunanIndex === -1) {
      return null;
    }

    const bulunanCizgi =
      kalanlar.splice(bulunanIndex, 1)[0];

    const ilkNokta = {
      x: bulunanCizgi.x1,
      y: bulunanCizgi.y1,
    };

    const ikinciNokta = {
      x: bulunanCizgi.x2,
      y: bulunanCizgi.y2,
    };

    const sonrakiNokta = noktalarEsitMi(
      mevcutSon,
      ilkNokta,
    )
      ? ikinciNokta
      : ilkNokta;

    noktalar.push(sonrakiNokta);
    mevcutSon = sonrakiNokta;
  }

  const ilkNokta = noktalar[0];
  const sonNokta = noktalar[noktalar.length - 1];

  if (!noktalarEsitMi(ilkNokta, sonNokta)) {
    return null;
  }

  // Son nokta ilk noktanın tekrarıdır.
  noktalar.pop();

  if (noktalar.length < 3) {
    return null;
  }

  if (poligonAlani(noktalar) < 1) {
    return null;
  }

  return noktalar;
}

export function odalariYenidenHesapla() {
  const yeniOdalar = [];
  const gruplar = gruplariOlustur();

  for (const [groupId, grupCizgileri] of gruplar) {
    const noktalar =
      cizgileriSiraliNoktalaraCevir(
        grupCizgileri,
      );

    if (!noktalar) continue;

    const sinirlar = poligonSinirlari(noktalar);

    yeniOdalar.push({
      groupId,
      noktalar,
      alan: poligonAlani(noktalar),
      ...sinirlar,
    });
  }

  setOdalar(yeniOdalar);
}