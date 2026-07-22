import {
  cizgiler,
  aktifMod,
  seciliCizgiIdleri,
  setCizgiler,
  secimiTemizle,
} from "../core/state.js";

import { canvas } from "../core/stage.js";
import { dunyadanSahneye } from "../camera/camera.js";
import { gecmiseKaydet } from "../drawing/history.js";
import { odalariYenidenHesapla } from "../drawing/rooms.js";
import { ekraniGuncelle } from "../drawing/render.js";

const silButonu = document.getElementById("btnDeleteSelected");
const canvasWrapper = document.getElementById("canvasWrapper");

function sahneNoktasiniCssNoktasina(stageX, stageY) {
  const canvasRect = canvas.getBoundingClientRect();
  const wrapperRect = canvasWrapper?.getBoundingClientRect();

  const cssOranX = canvasRect.width / canvas.width;
  const cssOranY = canvasRect.height / canvas.height;

  return {
    x:
      canvasRect.left -
      (wrapperRect?.left ?? canvasRect.left) +
      stageX * cssOranX,
    y:
      canvasRect.top - (wrapperRect?.top ?? canvasRect.top) + stageY * cssOranY,
  };
}

function seciliCizgilerinUstOrtasiniBul() {
  const seciliIdSeti = new Set(seciliCizgiIdleri);

  const seciliCizgiler = cizgiler.filter((cizgi) => seciliIdSeti.has(cizgi.id));

  if (seciliCizgiler.length === 0) return null;

  const xs = seciliCizgiler.flatMap((cizgi) => [cizgi.x1, cizgi.x2]);

  const ys = seciliCizgiler.flatMap((cizgi) => [cizgi.y1, cizgi.y2]);

  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: Math.min(...ys),
  };
}

export function silButonunuKonumlandir() {
  if (!silButonu || !canvasWrapper || seciliCizgiIdleri.length === 0) {
    silButonu?.classList.add("hidden");
    silButonu?.classList.remove("flex");
    return;
  }

  const hedefNokta = seciliCizgilerinUstOrtasiniBul();

  if (!hedefNokta) {
    silButonu.classList.add("hidden");
    silButonu.classList.remove("flex");
    return;
  }

  const sahneNoktasi = dunyadanSahneye(hedefNokta.x, hedefNokta.y);

  const cssNoktasi = sahneNoktasiniCssNoktasina(sahneNoktasi.x, sahneNoktasi.y);

  const butonGenisligi = silButonu.offsetWidth || 36;
  const butonYuksekligi = silButonu.offsetHeight || 36;

  let left = cssNoktasi.x - butonGenisligi / 2;
  let top = cssNoktasi.y - butonYuksekligi - 12;

  left = Math.max(
    4,
    Math.min(left, canvasWrapper.clientWidth - butonGenisligi - 4),
  );

  top = Math.max(
    4,
    Math.min(top, canvasWrapper.clientHeight - butonYuksekligi - 4),
  );

  silButonu.style.left = `${left}px`;
  silButonu.style.top = `${top}px`;

  silButonu.classList.remove("hidden");
  silButonu.classList.add("flex");
}

function seciliCizgileriSil() {
  if (seciliCizgiIdleri.length === 0) return;

  const silinecekIdler = new Set(seciliCizgiIdleri);

  gecmiseKaydet();

  setCizgiler(cizgiler.filter((cizgi) => !silinecekIdler.has(cizgi.id)));

  secimiTemizle();

  silButonu?.classList.add("hidden");
  silButonu?.classList.remove("flex");

  odalariYenidenHesapla();
  ekraniGuncelle();
}

silButonu?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  seciliCizgileriSil();
});

window.addEventListener("keydown", (event) => {
  if (aktifMod !== "SELECT") return;
  if (seciliCizgiIdleri.length === 0) return;

  const silmeTusu = event.key === "Delete" || event.key === "Backspace";

  if (!silmeTusu) return;

  const aktifElement = document.activeElement;

  if (
    aktifElement instanceof HTMLInputElement ||
    aktifElement instanceof HTMLTextAreaElement
  ) {
    return;
  }

  event.preventDefault();
  seciliCizgileriSil();
});

canvas.addEventListener("wheel", () => {
  requestAnimationFrame(silButonunuKonumlandir);
});

canvas.addEventListener("pointermove", (event) => {
  if ((event.buttons & 2) === 2) {
    requestAnimationFrame(silButonunuKonumlandir);
  }
});

window.addEventListener("resize", () => {
  requestAnimationFrame(silButonunuKonumlandir);
});
