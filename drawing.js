import {
  cizgiler,
  aktifMod,
  mevcutCizim,
  aktifCizimGrupId,
  SNAP_MESAFESI,
  setMevcutCizim,
  setAktifCizimGrupId,
} from "./state.js";

import {
  stage,
  viewport,
  onizlemeKatmani,
} from "./stage.js";

import {
  hesaplaSnap,
  hesaplaHizalama,
} from "./snap.js";

import { sahnedenDunyaya } from "./camera.js";
import { odalariYenidenHesapla } from "./rooms.js";
import { ekraniGuncelle } from "./render.js";
import { cizgiEkle } from "./history.js";

// ESC : mevcut çizimi iptal et
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  setMevcutCizim(null);
  setAktifCizimGrupId(null);

  onizlemeKatmani.graphics.clear();
  stage.update();
});

// SOL TIK: çizimi başlat veya tamamla
stage.on("stagemousedown", (e) => {
  if (aktifMod === "SELECT") return;
  if (e.nativeEvent.button === 2) return;

  const dunyaNoktasi =
  sahnedenDunyaya(
    e.stageX,
    e.stageY,
  );

  const x = dunyaNoktasi.x;
  const y = dunyaNoktasi.y;
  const snap = hesaplaSnap(x, y);

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

// MOUSE HAREKETİ: önizlemeyi güncelle
stage.on("stagemousemove", (e) => {
  if (aktifMod === "SELECT") return;
  if (!mevcutCizim) return;

  const dunyaNoktasi =
  sahnedenDunyaya(
    e.stageX,
    e.stageY,
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

function cizgiModundaTiklama(snap,nesneyeMiknatislandiMi) {

  if (!mevcutCizim) {
    const grupId =
      aktifCizimGrupId ??
      crypto.randomUUID();

    setAktifCizimGrupId(grupId);

    setMevcutCizim({
      x1: snap.x,
      y1: snap.y,
      x2: snap.x,
      y2: snap.y,
    });

    return;
  }

  const finalNokta = hesaplaHizalama(snap.x, snap.y);

  const dx = Math.abs(finalNokta.x - mevcutCizim.x1);
  const dy = Math.abs(finalNokta.y - mevcutCizim.y1);

  if (dx > dy) {
    finalNokta.y = mevcutCizim.y1;
  } else {
    finalNokta.x = mevcutCizim.x1;
  }

  const cizgiBosDegil =
    mevcutCizim.x1 !== finalNokta.x ||
    mevcutCizim.y1 !== finalNokta.y;

  if (cizgiBosDegil) {
    cizgiEkle(
      {
        x1: mevcutCizim.x1,
        y1: mevcutCizim.y1,
        x2: finalNokta.x,
        y2: finalNokta.y,
      },
      aktifCizimGrupId,
    );
  }

  if (nesneyeMiknatislandiMi) {
  setMevcutCizim(null);
  setAktifCizimGrupId(null);

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
    {
      x1,
      y1,
      x2: x1 + w,
      y2: y1,
    },
    {
      x1: x1 + w,
      y1,
      x2: x1 + w,
      y2: y1 + h,
    },
    {
      x1: x1 + w,
      y1: y1 + h,
      x2: x1,
      y2: y1 + h,
    },
    {
      x1,
      y1: y1 + h,
      x2: x1,
      y2: y1,
    },
  ]);

  setMevcutCizim(null);
  setAktifCizimGrupId(null);

  onizlemeKatmani.graphics.clear();
  odalariYenidenHesapla();
}

function cizgiOnizlemesiniGuncelle(snap) {
  const hizali = hesaplaHizalama(snap.x, snap.y);

  const dx = Math.abs(hizali.x - mevcutCizim.x1);
  const dy = Math.abs(hizali.y - mevcutCizim.y1);

  if (dx > dy) {
    mevcutCizim.x2 = hizali.x;
    mevcutCizim.y2 = mevcutCizim.y1;
  } else {
    mevcutCizim.x2 = mevcutCizim.x1;
    mevcutCizim.y2 = hizali.y;
  }

  onizlemeKatmani.graphics
  .beginStroke("#710ee946")
  .setStrokeStyle(
    8,
    "round",
    "round",
  )
  .moveTo(mevcutCizim.x1, mevcutCizim.y1)
  .lineTo(mevcutCizim.x2, mevcutCizim.y2)
  .endStroke();

onizlemeKatmani.graphics
  .beginFill("#9a44ef47")
  .drawCircle(
    mevcutCizim.x1,
    mevcutCizim.y1,
    4,
  )
  .endFill();

onizlemeKatmani.graphics
  .beginFill("#9144ef3a")
  .drawCircle(
    mevcutCizim.x2,
    mevcutCizim.y2,
    4,
  )
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

  mevcutCizim.x =
    rawW < 0
      ? mevcutCizim.startX + rawW
      : mevcutCizim.startX;

  mevcutCizim.y =
    rawH < 0
      ? mevcutCizim.startY + rawH
      : mevcutCizim.startY;

  mevcutCizim.w = Math.abs(rawW);
  mevcutCizim.h = Math.abs(rawH);

  onizlemeKatmani.graphics
  .beginFill("rgba(156, 14, 233, 0.2)")
  .beginStroke("#690ee957")
  .setStrokeStyle(
    8,
    "round",
    "round",
  )
  .drawRoundRect(
    mevcutCizim.x,
    mevcutCizim.y,
    mevcutCizim.w,
    mevcutCizim.h,
    4, // köşe yarıçapı
  )
  .endStroke()
  .endFill();
}