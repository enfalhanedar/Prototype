import {
  canvas,
  stage,
  viewport,
} from "./stage.js";

import { gridiCiz } from "./grid.js";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;
const ZOOM_ADIMI = 1.15;

let sagTuslaGeziliyor = false;

let oncekiMouseX = 0;
let oncekiMouseY = 0;

export function zoomDegeriniSinirla(zoom) {
  return Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, zoom),
  );
}

export function sahnedenDunyaya(stageX, stageY) {
  return viewport.globalToLocal(
    stageX,
    stageY,
  );
}

export function dunyadanSahneye(x, y) {
  return viewport.localToGlobal(x, y);
}

export function zoomYap(
  yeniZoom,
  merkezX = canvas.width / 2,
  merkezY = canvas.height / 2,
) {
  const sinirliZoom =
    zoomDegeriniSinirla(yeniZoom);

  const zoomOncesiNokta =
    viewport.globalToLocal(
      merkezX,
      merkezY,
    );

  viewport.scaleX = sinirliZoom;
  viewport.scaleY = sinirliZoom;

  const zoomSonrasiNokta =
    viewport.localToGlobal(
      zoomOncesiNokta.x,
      zoomOncesiNokta.y,
    );

  viewport.x +=
    merkezX - zoomSonrasiNokta.x;

  viewport.y +=
    merkezY - zoomSonrasiNokta.y;

  gridiCiz();
  stage.update();
  zoomBilgisiniGuncelle();
}

export function zoomIn() {
  zoomYap(
    viewport.scaleX * ZOOM_ADIMI,
  );
}

export function zoomOut() {
  zoomYap(
    viewport.scaleX / ZOOM_ADIMI,
  );
}

export function zoomSifirla() {
  viewport.scaleX = 1;
  viewport.scaleY = 1;
  viewport.x = 0;
  viewport.y = 0;

  gridiCiz();
  stage.update();
  zoomBilgisiniGuncelle();
}

function zoomBilgisiniGuncelle() {
  const zoomYazisi =
    document.getElementById("zoomValue");

  if (!zoomYazisi) return;

  zoomYazisi.textContent =
    `${Math.round(viewport.scaleX * 100)}%`;
}

// Mouse tekerleği ile zoom
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();

    const rect =
      canvas.getBoundingClientRect();

    const mouseX =
      (event.clientX - rect.left) *
      (canvas.width / rect.width);

    const mouseY =
      (event.clientY - rect.top) *
      (canvas.height / rect.height);

    const yeniZoom =
      event.deltaY < 0
        ? viewport.scaleX * ZOOM_ADIMI
        : viewport.scaleX / ZOOM_ADIMI;

    zoomYap(
      yeniZoom,
      mouseX,
      mouseY,
    );
  },
  {
    passive: false,
  },
);

// Sağ tuşa basınca pan başlasın
canvas.addEventListener(
  "pointerdown",
  (event) => {
    if (event.button !== 2) return;

    event.preventDefault();

    sagTuslaGeziliyor = true;

    oncekiMouseX = event.clientX;
    oncekiMouseY = event.clientY;

    canvas.setPointerCapture(
      event.pointerId,
    );

    canvas.style.cursor = "grabbing";
  },
);

// Sağ tuş basılıyken viewport hareket etsin
canvas.addEventListener(
  "pointermove",
  (event) => {
    if (!sagTuslaGeziliyor) return;

    const rect =
      canvas.getBoundingClientRect();

    const oranX =
      canvas.width / rect.width;

    const oranY =
      canvas.height / rect.height;

    const dx =
      (event.clientX - oncekiMouseX) *
      oranX;

    const dy =
      (event.clientY - oncekiMouseY) *
      oranY;

    viewport.x += dx;
    viewport.y += dy;

    oncekiMouseX = event.clientX;
    oncekiMouseY = event.clientY;

    gridiCiz();
    stage.update();
  },
);

function sagTusGezmesiniBitir(event) {
  if (!sagTuslaGeziliyor) return;

  sagTuslaGeziliyor = false;

  if (
    canvas.hasPointerCapture(
      event.pointerId,
    )
  ) {
    canvas.releasePointerCapture(
      event.pointerId,
    );
  }

  canvas.style.cursor = "default";
}

canvas.addEventListener(
  "pointerup",
  sagTusGezmesiniBitir,
);

canvas.addEventListener(
  "pointercancel",
  sagTusGezmesiniBitir,
);

document
  .getElementById("btnZoomIn")
  ?.addEventListener("click", zoomIn);

document
  .getElementById("btnZoomOut")
  ?.addEventListener("click", zoomOut);

document
  .getElementById("btnZoomReset")
  ?.addEventListener(
    "click",
    zoomSifirla,
  );