import { cizgiler, SNAP_MESAFESI } from "../core/state.js";

import { viewport } from "../core/stage.js";
import { gridNoktasinaSnap } from "./grid.js";

export function mesafeBul(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function cizgiUzerindeEnYakinNokta(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  const uzunlukKaresi = dx * dx + dy * dy;

  if (uzunlukKaresi === 0) {
    return {
      x: x1,
      y: y1,
      mesafe: Math.hypot(x - x1, y - y1),
    };
  }

  let t = ((x - x1) * dx + (y - y1) * dy) / uzunlukKaresi;

  t = Math.max(0, Math.min(1, t));

  const enYakinX = x1 + t * dx;
  const enYakinY = y1 + t * dy;

  return {
    x: enYakinX,
    y: enYakinY,
    mesafe: Math.hypot(x - enYakinX, y - enYakinY),
  };
}
export function hesaplaSnap(mouseX, mouseY, haricTutulacakIdler = []) {
  const haricSet = new Set(haricTutulacakIdler);

  let snapX = mouseX;
  let snapY = mouseY;

  let enKisaMesafe = SNAP_MESAFESI / viewport.scaleX;

  for (const cizgi of cizgiler) {
    if (haricSet.has(cizgi.id)) {
      continue;
    }

    const adayNoktalar = [
      {
        x: cizgi.x1,
        y: cizgi.y1,
      },
      {
        x: cizgi.x2,
        y: cizgi.y2,
      },
    ];

    for (const aday of adayNoktalar) {
      const mesafe = mesafeBul(mouseX, mouseY, aday.x, aday.y);

      if (mesafe < enKisaMesafe) {
        enKisaMesafe = mesafe;
        snapX = aday.x;
        snapY = aday.y;
      }
    }

    const kenarSonucu = cizgiUzerindeEnYakinNokta(
      mouseX,
      mouseY,
      cizgi.x1,
      cizgi.y1,
      cizgi.x2,
      cizgi.y2,
    );

    if (kenarSonucu.mesafe < enKisaMesafe) {
      enKisaMesafe = kenarSonucu.mesafe;
      snapX = kenarSonucu.x;
      snapY = kenarSonucu.y;
    }
  }

  if (snapX === mouseX && snapY === mouseY) {
    const gridSnap = gridNoktasinaSnap(mouseX, mouseY);

    snapX = gridSnap.x;
    snapY = gridSnap.y;
  }

  return {
    x: snapX,
    y: snapY,
  };
}
// Çizim sırasında, üzerinde çalışılan nokta mevcut çizgilerin
// köşelerinden biriyle yatayda veya dikeyde hizalandığında bunu
// haber vermek (ve o eksene kilitlemek) için kullanılan mesafe.
const HIZALAMA_EKRAN_MESAFESI = 6;

/**
 * Verilen dünya noktasını, mevcut çizgilerin köşe noktalarıyla
 * yatay (aynı Y) ve dikey (aynı X) hizalanma açısından karşılaştırır.
 *
 * Her eksen için en yakın eşleşmeyi döndürür (varsa); eşleşme yoksa
 * o eksen için null döner.
 */
export function hizalamaBul(nokta, haricTutulacakIdler = []) {
  const esik = HIZALAMA_EKRAN_MESAFESI / viewport.scaleX;
  const haricSet = new Set(haricTutulacakIdler);

  let enYakinX = null;
  let enYakinY = null;

  for (const cizgi of cizgiler) {
    if (haricSet.has(cizgi.id)) {
      continue;
    }

    for (const aday of [
      { x: cizgi.x1, y: cizgi.y1 },
      { x: cizgi.x2, y: cizgi.y2 },
    ]) {
      const farkX = Math.abs(aday.x - nokta.x);

      if (farkX < esik && (!enYakinX || farkX < enYakinX.mesafe)) {
        enYakinX = {
          deger: aday.x,
          mesafe: farkX,
          kaynak: aday,
        };
      }

      const farkY = Math.abs(aday.y - nokta.y);

      if (farkY < esik && (!enYakinY || farkY < enYakinY.mesafe)) {
        enYakinY = {
          deger: aday.y,
          mesafe: farkY,
          kaynak: aday,
        };
      }
    }
  }

  return { x: enYakinX, y: enYakinY };
}

// Çizim aracı, Shift basılı değilken açıyı bu adımın katlarına
// (0°, 45°, 90°, 135°, 180° ...) otomatik kilitler. Shift basılıyken
// serbestMi=true gönderilir ve açı hiç değiştirilmeden döner.
const ACI_KILIT_ADIMI_DERECE = 45;

export function aciyaKilitle(
  baslangicX,
  baslangicY,
  hedefX,
  hedefY,
  serbestMi,
) {
  if (serbestMi) {
    return { x: hedefX, y: hedefY };
  }

  const dx = hedefX - baslangicX;
  const dy = hedefY - baslangicY;
  const uzunluk = Math.hypot(dx, dy);

  if (uzunluk === 0) {
    return { x: hedefX, y: hedefY };
  }

  const aciDerece = (Math.atan2(dy, dx) * 180) / Math.PI;

  const kilitliAciDerece =
    Math.round(aciDerece / ACI_KILIT_ADIMI_DERECE) * ACI_KILIT_ADIMI_DERECE;

  const kilitliAciRadyan = (kilitliAciDerece * Math.PI) / 180;

  return {
    x: baslangicX + Math.cos(kilitliAciRadyan) * uzunluk,
    y: baslangicY + Math.sin(kilitliAciRadyan) * uzunluk,
  };
}

export function cizgiEslesiyorMu(cizgi, x1, y1, x2, y2) {
  const ayniYon =
    cizgi.x1 === x1 && cizgi.y1 === y1 && cizgi.x2 === x2 && cizgi.y2 === y2;

  const tersYon =
    cizgi.x1 === x2 && cizgi.y1 === y2 && cizgi.x2 === x1 && cizgi.y2 === y1;

  return ayniYon || tersYon;
}

export function kenarVarMi(x1, y1, x2, y2) {
  return cizgiler.some((cizgi) => cizgiEslesiyorMu(cizgi, x1, y1, x2, y2));
}

export function hesaplaCizgiTasimaSnap(
  tasinanCizgiler,
  hamDx,
  hamDy,
  tasinanCizgiIdleri,
) {
  let sonucDx = hamDx;
  let sonucDy = hamDy;
  let enKisaMesafe = SNAP_MESAFESI / viewport.scaleX;

  const tasinanCizgiSet = new Set(
    (Array.isArray(tasinanCizgiIdleri)
      ? tasinanCizgiIdleri
      : [tasinanCizgiIdleri]
    ).filter(Boolean),
  );

  const digerCizgiler = cizgiler.filter(
    (cizgi) => !tasinanCizgiSet.has(cizgi.id),
  );

  for (const tasinanCizgi of tasinanCizgiler) {
    const tasinanNoktalar = [
      {
        x: tasinanCizgi.x1 + hamDx,
        y: tasinanCizgi.y1 + hamDy,
      },
      {
        x: tasinanCizgi.x2 + hamDx,
        y: tasinanCizgi.y2 + hamDy,
      },
    ];

    for (const nokta of tasinanNoktalar) {
      for (const hedefCizgi of digerCizgiler) {
        const hedefNoktalar = [
          { x: hedefCizgi.x1, y: hedefCizgi.y1 },
          { x: hedefCizgi.x2, y: hedefCizgi.y2 },
        ];

        for (const hedefNokta of hedefNoktalar) {
          const mesafe = mesafeBul(
            nokta.x,
            nokta.y,
            hedefNokta.x,
            hedefNokta.y,
          );

          if (mesafe < enKisaMesafe) {
            enKisaMesafe = mesafe;

            sonucDx = hamDx + (hedefNokta.x - nokta.x);

            sonucDy = hamDy + (hedefNokta.y - nokta.y);
          }
        }

        const kenarSonucu = cizgiUzerindeEnYakinNokta(
          nokta.x,
          nokta.y,
          hedefCizgi.x1,
          hedefCizgi.y1,
          hedefCizgi.x2,
          hedefCizgi.y2,
        );

        if (kenarSonucu.mesafe < enKisaMesafe) {
          enKisaMesafe = kenarSonucu.mesafe;

          sonucDx = hamDx + (kenarSonucu.x - nokta.x);

          sonucDy = hamDy + (kenarSonucu.y - nokta.y);
        }
      }
    }
  }

  return {
    dx: Math.round(sonucDx),
    dy: Math.round(sonucDy),
  };
}
