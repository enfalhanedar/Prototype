import {
  gridGorunur,
  gridSnapAktif,
  PIXEL_PER_METRE,
  GRID_SNAP_EKRAN_MESAFESI,
  setGridGorunur,
  setGridSnapAktif,
} from "../core/state.js";

import {
  canvas,
  stage,
  viewport,
  gridKatmani,
} from "../core/stage.js";

// Büyük grid çizgisi, küçük grid çizgisinin kaç katında bir çizilsin.
const BUYUK_GRID_ARALIGI = 10;

// Küçük grid çizgileri arasında ekranda hedeflenen mesafe (piksel).
// Zoom yapıldıkça grid adımı bu değere yakın kalacak şekilde
// 10 kat büyür/küçülür (0.1m -> 1m -> 10m gibi "yuvarlak" değerler).
const HEDEF_EKRAN_PIKSELI = 40;

/**
 * Mevcut zoom seviyesine göre küçük grid aralığını (dünya biriminde)
 * hesaplar. Adım her zaman yuvarlak bir metre değerine denk gelir
 * böylece çok yakınlaşınca grid aşırı sık, çok uzaklaşınca aşırı
 * seyrek görünmez.
 */
function kucukGridAdimiHesapla() {
  const dunyaAdimi = HEDEF_EKRAN_PIKSELI / viewport.scaleX;
  const metreAdimi = dunyaAdimi / PIXEL_PER_METRE;

  const us = Math.round(Math.log10(metreAdimi));
  const yuvarlakMetre = Math.pow(10, us);

  return yuvarlakMetre * PIXEL_PER_METRE;
}

export function gridiCiz() {
  gridKatmani.graphics.clear();

  if (!gridGorunur) {
    stage.update();
    return;
  }

  const kucukAdim = kucukGridAdimiHesapla();
  const buyukAdim = kucukAdim * BUYUK_GRID_ARALIGI;

  const solUst = viewport.globalToLocal(0, 0);

  const sagAlt = viewport.globalToLocal(
    canvas.width,
    canvas.height,
  );

  const baslangicX =
    Math.floor(solUst.x / kucukAdim) * kucukAdim;

  const bitisX =
    Math.ceil(sagAlt.x / kucukAdim) * kucukAdim;

  const baslangicY =
    Math.floor(solUst.y / kucukAdim) * kucukAdim;

  const bitisY =
    Math.ceil(sagAlt.y / kucukAdim) * kucukAdim;

  const grafik = gridKatmani.graphics;

  // Önce küçük grid çizgileri (ince, çok açık renk)
    grafik
    .beginStroke("rgba(124, 58, 237, 0.07)")
    .setStrokeStyle(1 / viewport.scaleX);

  for (
    let x = baslangicX;
    x <= bitisX;
    x += kucukAdim
  ) {
    grafik.moveTo(x, baslangicY).lineTo(x, bitisY);
  }

  for (
    let y = baslangicY;
    y <= bitisY;
    y += kucukAdim
  ) {
    grafik.moveTo(baslangicX, y).lineTo(bitisX, y);
  }

  // Sonra büyük grid çizgileri (daha kalın, daha belirgin),
  // küçük çizgilerin üzerine çizilir.
  const buyukBaslangicX =
    Math.floor(solUst.x / buyukAdim) * buyukAdim;

  const buyukBitisX =
    Math.ceil(sagAlt.x / buyukAdim) * buyukAdim;

  const buyukBaslangicY =
    Math.floor(solUst.y / buyukAdim) * buyukAdim;

  const buyukBitisY =
    Math.ceil(sagAlt.y / buyukAdim) * buyukAdim;

  grafik
    .beginStroke("rgba(124, 58, 237, 0.14)")
    .setStrokeStyle(1 / viewport.scaleX);

  for (
    let x = buyukBaslangicX;
    x <= buyukBitisX;
    x += buyukAdim
  ) {
    grafik.moveTo(x, buyukBaslangicY).lineTo(x, buyukBitisY);
  }

  for (
    let y = buyukBaslangicY;
    y <= buyukBitisY;
    y += buyukAdim
  ) {
    grafik.moveTo(buyukBaslangicX, y).lineTo(buyukBitisX, y);
  }

  stage.update();
}

export function gridNoktasinaSnap(x, y) {
  if (!gridGorunur || !gridSnapAktif) {
    return {
      x,
      y,
      miknatislandiMi: false,
    };
  }

  const adim = kucukGridAdimiHesapla();

  const gridX = Math.round(x / adim) * adim;
  const gridY = Math.round(y / adim) * adim;

  const dunyaMesafesi = Math.hypot(
    gridX - x,
    gridY - y,
  );

  // Grid snap sınırı ekranda her zoom seviyesinde
  // yaklaşık aynı piksel mesafesinde kalsın.
  const ekranMesafesi =
    dunyaMesafesi * viewport.scaleX;

  if (
    ekranMesafesi <=
    GRID_SNAP_EKRAN_MESAFESI
  ) {
    return {
      x: gridX,
      y: gridY,
      miknatislandiMi: true,
    };
  }

  return {
    x,
    y,
    miknatislandiMi: false,
  };
}

export function gridGorunumunuDegistir() {
  setGridGorunur(!gridGorunur);
  gridiCiz();
  gridButonlariniGuncelle();
}

export function gridSnapDegistir() {
  setGridSnapAktif(!gridSnapAktif);
  gridButonlariniGuncelle();
}

export function gridButonlariniGuncelle() {
  const gridButonu =
    document.getElementById("btnGrid");

  const snapButonu =
    document.getElementById("btnGridSnap");

  if (gridButonu) {
    gridButonu.textContent = gridGorunur
      ? "▦ Grid: Açık"
      : "▦ Grid: Kapalı";
  }

  if (snapButonu) {
    snapButonu.textContent = gridSnapAktif
      ? "🧲 Grid Snap: Açık"
      : "🧲 Grid Snap: Kapalı";

    snapButonu.disabled = !gridGorunur;
    snapButonu.classList.toggle(
      "opacity-50",
      !gridGorunur,
    );
  }
}

document
  .getElementById("btnGrid")
  ?.addEventListener(
    "click",
    gridGorunumunuDegistir,
  );

document
  .getElementById("btnGridSnap")
  ?.addEventListener(
    "click",
    gridSnapDegistir,
  );
