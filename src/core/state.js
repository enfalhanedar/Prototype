export let cizgiler = [];
export let odalar = [];

export const undoStack = [];
export let redoStack = [];

export let aktifMod = "LINE";
export let mevcutCizim = null;

export let aktifCizimGrupId = null;
export let seciliGrupId = null;

export const SNAP_MESAFESI = 15;

export let hoverGrupId = null;
export let hoverCizgiId = null;   // Üzerine gelinen tekil çizginin ID'si
export let hoverKoseNoktasi = null; // Üzerine gelinen köşenin koordinatı { x, y }

export function setAktifMod(mod) {
  aktifMod = mod;
}

export function setMevcutCizim(cizim) {
  mevcutCizim = cizim;
}

export function setCizgiler(yeniCizgiler) {
  cizgiler = yeniCizgiler;
}

export function setOdalar(yeniOdalar) {
  odalar.length = 0;
  odalar.push(...yeniOdalar);
}

export function setRedoStack(yeniRedoStack) {
  redoStack = yeniRedoStack;
}

export function setAktifCizimGrupId(grupId) {
  aktifCizimGrupId = grupId;
}

export function setSeciliGrupId(grupId) {
  seciliGrupId = grupId;

  if (grupId) {
    seciliGrupIdleri = [grupId];
  }
}

export let gridGorunur = true;
export let gridSnapAktif = true;

// 1 dünya birimi = 1 santimetre kabul edilir.
// Yani 100 dünya birimi = 1 metre. Grid adımı ve çizgi
// uzunluk etiketleri bu sabite göre hesaplanır.
export const PIXEL_PER_METRE = 100;

export const GRID_SNAP_EKRAN_MESAFESI = 10;

export function setGridGorunur(deger) {
  gridGorunur = deger;
}

export function setGridSnapAktif(deger) {
  gridSnapAktif = deger;
}

export let seciliGrupIdleri = [];

export function setSeciliGrupIdleri(grupIdleri) {
  seciliGrupIdleri = [
    ...new Set(grupIdleri.filter(Boolean)),
  ];
}


export function setHoverGrupId(grupId) {
  hoverGrupId = grupId;
}


export function setHoverCizgiId(cizgiId) {
  hoverCizgiId = cizgiId;
}

export function setHoverKoseNoktasi(nokta) {
  hoverKoseNoktasi = nokta;
}