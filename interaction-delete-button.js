import {
  cizgiler,
  aktifMod,
  setCizgiler,
  seciliGrupIdleri, // state.js'deki orijinal seçim listemiz
  setSeciliGrupId,
  setSeciliGrupIdleri,
} from "./state.js";

import { canvas } from "./stage.js";
import { dunyadanSahneye } from "./camera.js";
import { gecmiseKaydet } from "./history.js";
import { odalariYenidenHesapla } from "./rooms.js";
import { ekraniGuncelle } from "./render.js";

const silButonu = document.getElementById("btnDeleteSelected");
const canvasWrapper = document.getElementById("canvasWrapper");

function sahneNoktasiniCssNoktasina(stageX, stageY) {
  const canvasRect = canvas.getBoundingClientRect();
  const wrapperRect = canvasWrapper?.getBoundingClientRect();

  const cssOranX = canvasRect.width / canvas.width;
  const cssOranY = canvasRect.height / canvas.height;

  return {
    x: (canvasRect.left - (wrapperRect?.left ?? canvasRect.left)) + stageX * cssOranX,
    y: (canvasRect.top - (wrapperRect?.top ?? canvasRect.top)) + stageY * cssOranY,
  };
}

/**
 * Silme butonunu sadece seçili olan tekil çizginin tam orta noktasına yerleştirir.
 */
export function silButonunuKonumlandir() {
  if (!silButonu || !canvasWrapper || !seciliGrupIdleri || seciliGrupIdleri.length === 0) {
    silButonu?.classList.add("hidden");
    return;
  }

  // Seçili olan çizgi ID'sini doğrudan alıyoruz
  const seciliCizgiId = seciliGrupIdleri[0];
  const seciliCizgi = cizgiler.find(c => c.id === seciliCizgiId);

  if (!seciliCizgi) {
    silButonu.classList.add("hidden");
    return;
  }

  // Çizginin tam orta noktasını hesapla
  const ortaX = (seciliCizgi.x1 + seciliCizgi.x2) / 2;
  const ortaY = (seciliCizgi.y1 + seciliCizgi.y2) / 2;

  // Koordinatları ekrana izdüşür
  const sahneNoktasi = dunyadanSahneye(ortaX, ortaY);
  const cssNoktasi = sahneNoktasiniCssNoktasina(sahneNoktasi.x, sahneNoktasi.y);

  const butonGenisligi = silButonu.offsetWidth || 36;
  const butonYuksekligi = silButonu.offsetHeight || 36;
  const wrapperGenisligi = canvasWrapper.clientWidth;
  const wrapperYuksekligi = canvasWrapper.clientHeight;

  let left = cssNoktasi.x - (butonGenisligi / 2);
  let top = cssNoktasi.y - butonYuksekligi - 12; // Çizginin hemen üstü

  left = Math.max(4, Math.min(left, wrapperGenisligi - butonGenisligi - 4));
  top = Math.max(4, Math.min(top, wrapperYuksekligi - butonYuksekligi - 4));

  silButonu.style.left = `${left}px`;
  silButonu.style.top = `${top}px`;

  silButonu.classList.remove("hidden");
  silButonu.classList.add("flex");
}

/**
 * DÜZELTİLDİ: Seçilen tekil çizgiyi grup süzgecine takılmadan doğrudan ID bazlı siler.
 */
function silSeciliGruplari() {
  if (!seciliGrupIdleri || seciliGrupIdleri.length === 0) return;

  // Grup kimlik yardımcılarını tamamen devre dışı bırakıp doğrudan ham ID setini alıyoruz
  const silinecekIdler = new Set(seciliGrupIdleri);

  gecmiseKaydet();

  // Sahnedeki çizgileri tara, sadece seçilen ID'ye/ID'lere sahip olanları listeden ayıkla
  const kalanCizgiler = cizgiler.filter(cizgi => !silinecekIdler.has(cizgi.id));

  setCizgiler(kalanCizgiler);
  setSeciliGrupId(null);
  setSeciliGrupIdleri([]);

  silButonu?.classList.add("hidden");
  silButonu?.classList.remove("flex");

  odalariYenidenHesapla();
  ekraniGuncelle();
}

silButonu?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  silSeciliGruplari();
});

window.addEventListener("keydown", (event) => {
  if (aktifMod !== "SELECT") return;
  if (!seciliGrupIdleri || seciliGrupIdleri.length === 0) return;

  const silmeTusu = event.key === "Delete" || event.key === "Backspace";
  if (!silmeTusu) return;

  const aktifElement = document.activeElement;
  if (aktifElement instanceof HTMLInputElement || aktifElement instanceof HTMLTextAreaElement) return;

  event.preventDefault();
  silSeciliGruplari();
});

canvas.addEventListener("wheel", () => { requestAnimationFrame(() => { silButonunuKonumlandir(); }); });
canvas.addEventListener("pointermove", (event) => {
  if ((event.buttons & 2) === 2) { requestAnimationFrame(() => { silButonunuKonumlandir(); }); }
});
window.addEventListener("resize", () => { requestAnimationFrame(() => { silButonunuKonumlandir(); }); });