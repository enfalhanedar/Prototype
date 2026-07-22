import {
  aktifMod,
  cizgiler,
  seciliCizgiIdleri,
  setSeciliCizgiIdleri,
} from "../core/state.js";

import { stage, viewport } from "../core/stage.js";

import { sahnedenDunyaya } from "../camera/camera.js";

import { tiklananCizgiyiBul, tiklananOdayiBul } from "./interaction-select.js";

import {
  cizgileriSuruklemeyeHazirla,
  koseSuruklemeyeHazirla,
  suruklemeyiTasi,
  suruklemeyiBitir,
  suruklemeAktifMi,
} from "./interaction-drag.js";

import {
  kutuSecimiAktif,
  kutuSecimBaslat,
  kutuSecimGuncelle,
  kutuSecimBitir,
} from "./interaction-box-select.js";

import { odaCizgiIdleriniBul } from "./interaction-selection-helpers.js";

import { hoverGuncelle, hoverTemizle } from "./interaction-hover.js";

import "./interaction-delete-button.js";

function tiklananKoseyiBul(dunyaNoktasi) {
  const tiklamaToleransi = 10 / viewport.scaleX;

  for (const cizgi of cizgiler) {
    const birinciUcMesafesi = Math.hypot(
      cizgi.x1 - dunyaNoktasi.x,
      cizgi.y1 - dunyaNoktasi.y,
    );

    if (birinciUcMesafesi < tiklamaToleransi) {
      return {
        x: cizgi.x1,
        y: cizgi.y1,
      };
    }

    const ikinciUcMesafesi = Math.hypot(
      cizgi.x2 - dunyaNoktasi.x,
      cizgi.y2 - dunyaNoktasi.y,
    );

    if (ikinciUcMesafesi < tiklamaToleransi) {
      return {
        x: cizgi.x2,
        y: cizgi.y2,
      };
    }
  }

  return null;
}

stage.on("stagemousedown", (event) => {
  if (aktifMod !== "SELECT") return;
  if (event.nativeEvent.button !== 0) return;

  hoverTemizle();

  const dunyaNoktasi = sahnedenDunyaya(event.stageX, event.stageY);

  const tiklananKose = tiklananKoseyiBul(dunyaNoktasi);

  if (tiklananKose) {
    koseSuruklemeyeHazirla(tiklananKose);
    return;
  }

  const tiklananCizgi = tiklananCizgiyiBul(dunyaNoktasi.x, dunyaNoktasi.y);

  if (tiklananCizgi) {
    const zatenSecili = seciliCizgiIdleri.includes(tiklananCizgi.id);

    const tasinacakIdler = zatenSecili ? seciliCizgiIdleri : [tiklananCizgi.id];

    if (!zatenSecili) {
      setSeciliCizgiIdleri(tasinacakIdler);
    }

    cizgileriSuruklemeyeHazirla(tasinacakIdler, dunyaNoktasi);

    return;
  }

  const tiklananOda = tiklananOdayiBul(dunyaNoktasi.x, dunyaNoktasi.y);

  if (tiklananOda) {
    const odaCizgiIdleri = odaCizgiIdleriniBul(tiklananOda);

    if (odaCizgiIdleri.length > 0) {
      setSeciliCizgiIdleri(odaCizgiIdleri);

      cizgileriSuruklemeyeHazirla(odaCizgiIdleri, dunyaNoktasi);

      return;
    }
  }

  kutuSecimBaslat(dunyaNoktasi);
});

stage.on("stagemousemove", (event) => {
  if (aktifMod !== "SELECT") return;

  const dunyaNoktasi = sahnedenDunyaya(event.stageX, event.stageY);

  if (kutuSecimiAktif) {
    kutuSecimGuncelle(dunyaNoktasi);
    return;
  }

  if (suruklemeAktifMi()) {
    suruklemeyiTasi(dunyaNoktasi);
    return;
  }

  hoverGuncelle(dunyaNoktasi);
});

stage.on("stagemouseup", (event) => {
  if (kutuSecimiAktif) {
    kutuSecimBitir(sahnedenDunyaya(event.stageX, event.stageY));
    return;
  }

  if (aktifMod !== "SELECT") return;

  suruklemeyiBitir();
});

window.addEventListener("mouseup", () => {
  suruklemeyiBitir();
});
