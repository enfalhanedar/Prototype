import {
  cizgiler,
  setHoverCizgiId,
  setHoverKoseNoktasi,
} from "../core/state.js";

import { viewport } from "../core/stage.js";
import { tiklananCizgiyiBul } from "./interaction-select.js";
import { ekraniGuncelle } from "../drawing/render.js";

let mevcutHoverKose = null;
let mevcutHoverCizgiId = null;

function noktalarAyniMi(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;

  return a.x === b.x && a.y === b.y;
}

export function hoverGuncelle(dunyaNoktasi) {
  let yeniHoverKose = null;
  let yeniHoverCizgiId = null;

  const koseHoverToleransi =
    10 / viewport.scaleX;

  for (const cizgi of cizgiler) {
    const birinciUcMesafesi = Math.hypot(
      cizgi.x1 - dunyaNoktasi.x,
      cizgi.y1 - dunyaNoktasi.y,
    );

    if (birinciUcMesafesi < koseHoverToleransi) {
      yeniHoverKose = {
        x: cizgi.x1,
        y: cizgi.y1,
      };
      break;
    }

    const ikinciUcMesafesi = Math.hypot(
      cizgi.x2 - dunyaNoktasi.x,
      cizgi.y2 - dunyaNoktasi.y,
    );

    if (ikinciUcMesafesi < koseHoverToleransi) {
      yeniHoverKose = {
        x: cizgi.x2,
        y: cizgi.y2,
      };
      break;
    }
  }

  if (!yeniHoverKose) {
    yeniHoverCizgiId =
      tiklananCizgiyiBul(
        dunyaNoktasi.x,
        dunyaNoktasi.y,
      )?.id ?? null;
  }

  const koseDegisti =
    !noktalarAyniMi(
      yeniHoverKose,
      mevcutHoverKose,
    );

  const cizgiDegisti =
    yeniHoverCizgiId !== mevcutHoverCizgiId;

  if (!koseDegisti && !cizgiDegisti) {
    return;
  }

  mevcutHoverKose = yeniHoverKose;
  mevcutHoverCizgiId = yeniHoverCizgiId;

  setHoverKoseNoktasi(yeniHoverKose);
  setHoverCizgiId(yeniHoverCizgiId);

  ekraniGuncelle();
}

export function hoverTemizle() {
  const degisiklikVar =
    mevcutHoverKose !== null ||
    mevcutHoverCizgiId !== null;

  mevcutHoverKose = null;
  mevcutHoverCizgiId = null;

  setHoverKoseNoktasi(null);
  setHoverCizgiId(null);

  if (degisiklikVar) {
    ekraniGuncelle();
  }
}
