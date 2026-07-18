import {
  cizgiler,
  aktifMod,
  mevcutCizim,
  SNAP_MESAFESI,
  setMevcutCizim,
} from "../core/state.js";

import {
  stage,
  viewport,
  onizlemeKatmani,
} from "../core/stage.js";

import {
  hesaplaSnap,
  aciyaKilitle,
} from "../geometry/snap.js";

import { kesisimleriKoseyeDonustur } from "../io/intersections.js";
import { sahnedenDunyaya } from "../camera/camera.js";
import { odalariYenidenHesapla } from "./rooms.js";
import { ekraniGuncelle } from "./render.js";
import { cizgiEkle } from "./history.js";

// Shift basılıyken çizgi açısı serbest kalır.
// Basılı değilken açı en yakın 0/45/90 derecelik yöne kilitlenir.
let shiftBasili = false;

window.addEventListener("keydown", (event) => {
  if (event.key === "Shift") {
    shiftBasili = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "Shift") {
    shiftBasili = false;
  }
});

window.addEventListener("blur", () => {
  shiftBasili = false;
});

// ESC: mevcut çizimi iptal et.
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  setMevcutCizim(null);
  onizlemeKatmani.graphics.clear();
  stage.update();
});

// Sol tık: çizimi başlat veya tamamla.
stage.on("stagemousedown", (event) => {
  if (aktifMod === "SELECT") return;
  if (event.nativeEvent.button === 2) return;

  const dunyaNoktasi = sahnedenDunyaya(
    event.stageX,
    event.stageY,
  );

  const snap = hesaplaSnap(
    dunyaNoktasi.x,
    dunyaNoktasi.y,
  );

  const nesneyeMiknatislandiMi =
    snap.snapTuru === "OBJECT";

  if (aktifMod === "LINE") {
    cizgiModundaTiklama(
      snap,
      nesneyeMiknatislandiMi,
    );
  } else {
    kutuModundaTiklama(snap);
  }

  ekraniGuncelle();
});

// Fare hareketi: önizlemeyi güncelle.
stage.on("stagemousemove", (event) => {
  if (aktifMod === "SELECT") return;
  if (!mevcutCizim) return;

  const dunyaNoktasi = sahnedenDunyaya(
    event.stageX,
    event.stageY,
  );

  const snap = hesaplaSnap(
    dunyaNoktasi.x,
    dunyaNoktasi.y,
  );

  onizlemeKatmani.graphics.clear();

  if (aktifMod === "LINE") {
    cizgiOnizlemesiniGuncelle(snap);
  } else {
    kutuOnizlemesiniGuncelle(snap);
  }

  stage.update();
});

function cizgiModundaTiklama(
  snap,
  nesneyeMiknatislandiMi,
) {
  if (!mevcutCizim) {
    setMevcutCizim({
      x1: snap.x,
      y1: snap.y,
      x2: snap.x,
      y2: snap.y,
    });

    return;
  }

  const kilitliNokta = aciyaKilitle(
    mevcutCizim.x1,
    mevcutCizim.y1,
    snap.x,
    snap.y,
    shiftBasili,
  );

  const finalNokta = {
    x: Math.round(kilitliNokta.x),
    y: Math.round(kilitliNokta.y),
  };

  const cizgiBosDegil =
    mevcutCizim.x1 !== finalNokta.x ||
    mevcutCizim.y1 !== finalNokta.y;

  if (cizgiBosDegil) {
    cizgiEkle({
      x1: mevcutCizim.x1,
      y1: mevcutCizim.y1,
      x2: finalNokta.x,
      y2: finalNokta.y,
    });

    kesisimleriKoseyeDonustur();
  }

  if (nesneyeMiknatislandiMi) {
    setMevcutCizim(null);
    onizlemeKatmani.graphics.clear();
  } else {
    setMevcutCizim({
      x1: finalNokta.x,
      y1: finalNokta.y,
      x2: finalNokta.x,
      y2: finalNokta.y,
    });
  }

  odalariYenidenHesapla();
}

function kutuModundaTiklama(snap) {
  if (!mevcutCizim) {
    setMevcutCizim({
      startX: snap.x,
      startY: snap.y,
      x: snap.x,
      y: snap.y,
      w: 0,
      h: 0,
    });

    return;
  }

  const x1 = Math.round(mevcutCizim.x);
  const y1 = Math.round(mevcutCizim.y);
  const w = Math.round(mevcutCizim.w);
  const h = Math.round(mevcutCizim.h);

  cizgiEkle([
    { x1, y1, x2: x1 + w, y2: y1 },
    { x1: x1 + w, y1, x2: x1 + w, y2: y1 + h },
    { x1: x1 + w, y1: y1 + h, x2: x1, y2: y1 + h },
    { x1, y1: y1 + h, x2: x1, y2: y1 },
  ]);

  kesisimleriKoseyeDonustur();
  setMevcutCizim(null);
  onizlemeKatmani.graphics.clear();
  odalariYenidenHesapla();
}

function cizgiOnizlemesiniGuncelle(snap) {
  const kilitliNokta = aciyaKilitle(
    mevcutCizim.x1,
    mevcutCizim.y1,
    snap.x,
    snap.y,
    shiftBasili,
  );

  mevcutCizim.x2 = Math.round(kilitliNokta.x);
  mevcutCizim.y2 = Math.round(kilitliNokta.y);

  onizlemeKatmani.graphics
    .beginStroke("#710ee946")
    .setStrokeStyle(8, "round", "round")
    .moveTo(mevcutCizim.x1, mevcutCizim.y1)
    .lineTo(mevcutCizim.x2, mevcutCizim.y2)
    .endStroke();

  onizlemeKatmani.graphics
    .beginFill("#9a44ef47")
    .drawCircle(mevcutCizim.x1, mevcutCizim.y1, 4)
    .endFill();

  onizlemeKatmani.graphics
    .beginFill("#9144ef3a")
    .drawCircle(mevcutCizim.x2, mevcutCizim.y2, 4)
    .endFill();
}

function kutuOnizlemesiniGuncelle(snap) {
  let rawW = snap.x - mevcutCizim.startX;
  let rawH = snap.y - mevcutCizim.startY;

  if (aktifMod === "SQUARE") {
    const kareBoyutu = Math.max(
      Math.abs(rawW),
      Math.abs(rawH),
    );

    rawW = rawW >= 0 ? kareBoyutu : -kareBoyutu;
    rawH = rawH >= 0 ? kareBoyutu : -kareBoyutu;
  }

  const hedefX = mevcutCizim.startX + rawW;
  const hedefY = mevcutCizim.startY + rawH;
  const esikMesafe = SNAP_MESAFESI / viewport.scaleX;

  for (const cizgi of cizgiler) {
    if (Math.abs(hedefX - cizgi.x1) < esikMesafe) {
      rawW = cizgi.x1 - mevcutCizim.startX;
    }

    if (Math.abs(hedefX - cizgi.x2) < esikMesafe) {
      rawW = cizgi.x2 - mevcutCizim.startX;
    }

    if (Math.abs(hedefY - cizgi.y1) < esikMesafe) {
      rawH = cizgi.y1 - mevcutCizim.startY;
    }

    if (Math.abs(hedefY - cizgi.y2) < esikMesafe) {
      rawH = cizgi.y2 - mevcutCizim.startY;
    }
  }

  if (aktifMod === "SQUARE") {
    const kareBoyutu = Math.max(
      Math.abs(rawW),
      Math.abs(rawH),
    );

    rawW = rawW >= 0 ? kareBoyutu : -kareBoyutu;
    rawH = rawH >= 0 ? kareBoyutu : -kareBoyutu;
  }

  mevcutCizim.x = rawW < 0
    ? mevcutCizim.startX + rawW
    : mevcutCizim.startX;

  mevcutCizim.y = rawH < 0
    ? mevcutCizim.startY + rawH
    : mevcutCizim.startY;

  mevcutCizim.w = Math.abs(rawW);
  mevcutCizim.h = Math.abs(rawH);

  onizlemeKatmani.graphics
    .beginFill("rgba(156, 14, 233, 0.2)")
    .beginStroke("#690ee957")
    .setStrokeStyle(8, "round", "round")
    .drawRoundRect(
      mevcutCizim.x,
      mevcutCizim.y,
      mevcutCizim.w,
      mevcutCizim.h,
      4,
    )
    .endStroke()
    .endFill();
}
