export let cizgiler = [];
export let odalar = [];

export const undoStack = [];
export let redoStack = [];

export let aktifMod = "LINE";
export let mevcutCizim = null;

export const SNAP_MESAFESI = 15;

export let hoverCizgiId = null;
export let hoverKoseNoktasi = null;

export let seciliCizgiIdleri = [];

export let gridGorunur = true;
export let gridSnapAktif = true;

// 1 dünya birimi = 1 santimetre kabul edilir.
// Yani 100 dünya birimi = 1 metre. Grid adımı ve çizgi
// uzunluk etiketleri bu sabite göre hesaplanır.
export const PIXEL_PER_METRE = 100;

export const GRID_SNAP_EKRAN_MESAFESI = 10;

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

export function setSeciliCizgiIdleri(cizgiIdleri) {
  seciliCizgiIdleri = [
    ...new Set(cizgiIdleri.filter(Boolean)),
  ];
}

export function secimiTemizle() {
  seciliCizgiIdleri = [];
}

export function setGridGorunur(deger) {
  gridGorunur = deger;
}

export function setGridSnapAktif(deger) {
  gridSnapAktif = deger;
}

export function setHoverCizgiId(cizgiId) {
  hoverCizgiId = cizgiId;
}

export function setHoverKoseNoktasi(nokta) {
  hoverKoseNoktasi = nokta;
}
