import {
  gridGorunur,
  gridSnapAktif,
  GRID_BOYUTU,
  GRID_SNAP_EKRAN_MESAFESI,
  setGridGorunur,
  setGridSnapAktif,
} from "./state.js";

import {
  canvas,
  stage,
  viewport,
  gridKatmani,
} from "./stage.js";

export function gridiCiz() {
  gridKatmani.graphics.clear();

  if (!gridGorunur) {
    stage.update();
    return;
  }

  const solUst = viewport.globalToLocal(0, 0);

  const sagAlt = viewport.globalToLocal(
    canvas.width,
    canvas.height,
  );

  const baslangicX =
    Math.floor(solUst.x / GRID_BOYUTU) *
    GRID_BOYUTU;

  const bitisX =
    Math.ceil(sagAlt.x / GRID_BOYUTU) *
    GRID_BOYUTU;

  const baslangicY =
    Math.floor(solUst.y / GRID_BOYUTU) *
    GRID_BOYUTU;

  const bitisY =
    Math.ceil(sagAlt.y / GRID_BOYUTU) *
    GRID_BOYUTU;

  const grafik = gridKatmani.graphics;

  grafik
    .beginStroke("rgba(124, 58, 237, 0.12)")
    .setStrokeStyle(1 / viewport.scaleX);

  for (
    let x = baslangicX;
    x <= bitisX;
    x += GRID_BOYUTU
  ) {
    grafik
      .moveTo(x, baslangicY)
      .lineTo(x, bitisY);
  }

  for (
    let y = baslangicY;
    y <= bitisY;
    y += GRID_BOYUTU
  ) {
    grafik
      .moveTo(baslangicX, y)
      .lineTo(bitisX, y);
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

  const gridX =
    Math.round(x / GRID_BOYUTU) *
    GRID_BOYUTU;

  const gridY =
    Math.round(y / GRID_BOYUTU) *
    GRID_BOYUTU;

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