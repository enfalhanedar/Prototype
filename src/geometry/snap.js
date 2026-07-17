import {
  cizgiler,
  SNAP_MESAFESI,
} from "../core/state.js";

import { viewport } from "../core/stage.js";
import { gridNoktasinaSnap } from "./grid.js";


// Matematiksel Snap ve Hizalama fonksiyonlarımız kararlı halleriyle kalıyor
export function mesafeBul(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function cizgiUzerindeEnYakinNokta(x, y, x1, y1, x2, y2) {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  return { x: xx, y: yy, mesafe: mesafeBul(x, y, xx, yy) };
}

export function hesaplaSnap(mouseX, mouseY) {
  let enYakinNokta = {
    x: Math.round(mouseX),
    y: Math.round(mouseY),
    snapTuru: "NONE",
  };

  let enKisaMesafe =
    SNAP_MESAFESI / viewport.scaleX;

  // Önce mevcut çizgilerin köşeleri
  for (const cizgi of cizgiler) {
    const d1 = mesafeBul(
      mouseX,
      mouseY,
      cizgi.x1,
      cizgi.y1,
    );

    if (d1 < enKisaMesafe) {
      enKisaMesafe = d1;

      enYakinNokta = {
        x: cizgi.x1,
        y: cizgi.y1,
        snapTuru: "OBJECT",
      };
    }

    const d2 = mesafeBul(
      mouseX,
      mouseY,
      cizgi.x2,
      cizgi.y2,
    );

    if (d2 < enKisaMesafe) {
      enKisaMesafe = d2;

      enYakinNokta = {
        x: cizgi.x2,
        y: cizgi.y2,
        snapTuru: "OBJECT",
      };
    }
  }

  // Köşe bulunamadıysa çizgi kenarları
  if (enYakinNokta.snapTuru === "NONE") {
    for (const cizgi of cizgiler) {
      const sonuc =
        cizgiUzerindeEnYakinNokta(
          mouseX,
          mouseY,
          cizgi.x1,
          cizgi.y1,
          cizgi.x2,
          cizgi.y2,
        );

      if (sonuc.mesafe < enKisaMesafe) {
        enKisaMesafe = sonuc.mesafe;

        enYakinNokta = {
          x: Math.round(sonuc.x),
          y: Math.round(sonuc.y),
          snapTuru: "OBJECT",
        };
      }
    }
  }

  // Nesneye snap olduysa grid kontrol etme
  if (enYakinNokta.snapTuru === "OBJECT") {
    return enYakinNokta;
  }

  const gridSonucu =
    gridNoktasinaSnap(mouseX, mouseY);

  if (gridSonucu.miknatislandiMi) {
    return {
      x: gridSonucu.x,
      y: gridSonucu.y,
      snapTuru: "GRID",
    };
  }

  return enYakinNokta;
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
    Math.round(aciDerece / ACI_KILIT_ADIMI_DERECE) *
    ACI_KILIT_ADIMI_DERECE;

  const kilitliAciRadyan =
    (kilitliAciDerece * Math.PI) / 180;

  return {
    x: baslangicX + Math.cos(kilitliAciRadyan) * uzunluk,
    y: baslangicY + Math.sin(kilitliAciRadyan) * uzunluk,
  };
}

export function cizgiEslesiyorMu(cizgi, x1, y1, x2, y2) {
  const ayniYon =
    cizgi.x1 === x1 &&
    cizgi.y1 === y1 &&
    cizgi.x2 === x2 &&
    cizgi.y2 === y2;

  const tersYon =
    cizgi.x1 === x2 &&
    cizgi.y1 === y2 &&
    cizgi.x2 === x1 &&
    cizgi.y2 === y1;

  return ayniYon || tersYon;
}

export function kenarVarMi(x1, y1, x2, y2) {
  return cizgiler.some((cizgi) =>
    cizgiEslesiyorMu(cizgi, x1, y1, x2, y2),
  );
}

export function hesaplaGrupTasimaSnap(
  tasinanCizgiler,
  hamDx,
  hamDy,
  tasinanGrupIdleri,
) {
   let sonucDx = hamDx;
  let sonucDy = hamDy;
  let enKisaMesafe = SNAP_MESAFESI / viewport.scaleX;

  const tasinanGrupSet = new Set(
    (Array.isArray(tasinanGrupIdleri)
      ? tasinanGrupIdleri
      : [tasinanGrupIdleri]
    ).filter(Boolean),
  );

  const digerCizgiler = cizgiler.filter(
    (cizgi) =>
      !tasinanGrupSet.has(
        cizgi.groupId ?? cizgi.id,
      ),
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

            sonucDx =
              hamDx +
              (hedefNokta.x - nokta.x);

            sonucDy =
              hamDy +
              (hedefNokta.y - nokta.y);
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

          sonucDx =
            hamDx +
            (kenarSonucu.x - nokta.x);

          sonucDy =
            hamDy +
            (kenarSonucu.y - nokta.y);
        }
      }
    }
  }

  return {
    dx: Math.round(sonucDx),
    dy: Math.round(sonucDy),
  };
}
