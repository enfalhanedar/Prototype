import {
  cizgiler,
  aktifMod,
  setCizgiler,
  setSeciliGrupId,
  setSeciliGrupIdleri,
} from "../core/state.js";

import { canvas } from "../core/stage.js";
import { dunyadanSahneye } from "../camera/camera.js";
import { gecmiseKaydet } from "../drawing/history.js";
import { odalariYenidenHesapla } from "../drawing/rooms.js";
import { ekraniGuncelle } from "../drawing/render.js";
import {
  grupAnahtariAl,
  grupCizgileriniBul,
  aktifSeciliGrupIdleri,
} from "./interaction-selection-helpers.js";

const silButonu = document.getElementById("btnDeleteSelected");
const canvasWrapper = document.getElementById("canvasWrapper");

/**
 * Canvas'ın gerçek koordinatını, HTML/CSS üzerindeki
 * konuma dönüştürür.
 *
 * Canvas responsive olarak küçülürse silme butonunun
 * doğru yerde görünmesini sağlar.
 */
function sahneNoktasiniCssNoktasina(stageX, stageY) {
  const canvasRect = canvas.getBoundingClientRect();
  const wrapperRect = canvasWrapper?.getBoundingClientRect();

  const cssOranX = canvasRect.width / canvas.width;
  const cssOranY = canvasRect.height / canvas.height;

  return {
    x:
      (canvasRect.left -
        (wrapperRect?.left ?? canvasRect.left)) +
      stageX * cssOranX,

    y:
      (canvasRect.top -
        (wrapperRect?.top ?? canvasRect.top)) +
      stageY * cssOranY,
  };
}

/**
 * Seçili grup(lar)ın toplam sınırlarını hesaplar.
 */
function grupSinirlariniHesapla(grup) {
  const xDegerleri = [];
  const yDegerleri = [];

  for (const cizgi of grup) {
    xDegerleri.push(cizgi.x1, cizgi.x2);
    yDegerleri.push(cizgi.y1, cizgi.y2);
  }

  return {
    sol: Math.min(...xDegerleri),
    sag: Math.max(...xDegerleri),
    ust: Math.min(...yDegerleri),
    alt: Math.max(...yDegerleri),
  };
}

/**
 * Silme butonunu seçili şekil(ler)in sağ üst tarafına taşır.
 * Tekli veya çoklu seçim fark etmeksizin çalışır.
 */
export function silButonunuKonumlandir() {
  const grupIdleri = aktifSeciliGrupIdleri();

  if (
    !silButonu ||
    !canvasWrapper ||
    grupIdleri.length === 0
  ) {
    silButonu?.classList.add("hidden");
    return;
  }

  const grup = grupIdleri.flatMap((grupId) =>
    grupCizgileriniBul(grupId),
  );

  if (grup.length === 0) {
    silButonu.classList.add("hidden");
    return;
  }

  const sinirlar = grupSinirlariniHesapla(grup);

  // Dünya koordinatını EaselJS stage koordinatına çevir
  const sahneNoktasi = dunyadanSahneye(
    sinirlar.sag,
    sinirlar.ust,
  );

  // EaselJS koordinatını CSS koordinatına çevir
  const cssNoktasi = sahneNoktasiniCssNoktasina(
    sahneNoktasi.x,
    sahneNoktasi.y,
  );

  const butonGenisligi = silButonu.offsetWidth || 36;
  const butonYuksekligi = silButonu.offsetHeight || 36;
  const wrapperGenisligi = canvasWrapper.clientWidth;
  const wrapperYuksekligi = canvasWrapper.clientHeight;

  let left = cssNoktasi.x + 10;
  let top = cssNoktasi.y - butonYuksekligi - 8;

  // Buton wrapper dışına çıkmasın.
  left = Math.max(
    4,
    Math.min(
      left,
      wrapperGenisligi - butonGenisligi - 4,
    ),
  );

  top = Math.max(
    4,
    Math.min(
      top,
      wrapperYuksekligi - butonYuksekligi - 4,
    ),
  );

  silButonu.style.left = `${left}px`;
  silButonu.style.top = `${top}px`;

  silButonu.classList.remove("hidden");

  // Tailwind içinde başlangıçta hidden kullanıldığı için,
  // görünürken flex yapıyoruz.
  silButonu.classList.add("flex");
}

/**
 * Şu an seçili olan grup(lar)ı (tekli veya kutu seçimle
 * çoklu) siler.
 */
function silSeciliGruplari() {
  const silinecekler = aktifSeciliGrupIdleri();

  if (silinecekler.length === 0) return;

  // Silme işleminden önce geçmişe kaydet.
  gecmiseKaydet();

  const kalanCizgiler = cizgiler.filter(
    (cizgi) =>
      !silinecekler.includes(grupAnahtariAl(cizgi)),
  );

  setCizgiler(kalanCizgiler);
  setSeciliGrupId(null);
  setSeciliGrupIdleri([]);

  silButonu?.classList.add("hidden");
  silButonu?.classList.remove("flex");

  odalariYenidenHesapla();
  ekraniGuncelle();
}

/**
 * Seçili şeklin yanındaki çöp kutusu butonu.
 */
silButonu?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  silSeciliGruplari();
});

/**
 * Delete veya Backspace tuşuyla seçili şekli/şekilleri sil.
 */
window.addEventListener("keydown", (event) => {
  if (aktifMod !== "SELECT") return;
  if (aktifSeciliGrupIdleri().length === 0) return;

  const silmeTusu =
    event.key === "Delete" ||
    event.key === "Backspace";

  if (!silmeTusu) return;

  // Input veya textarea içindeyken Backspace normal çalışsın.
  const aktifElement = document.activeElement;

  const metinAlaniAktif =
    aktifElement instanceof HTMLInputElement ||
    aktifElement instanceof HTMLTextAreaElement;

  if (metinAlaniAktif) return;

  event.preventDefault();

  silSeciliGruplari();
});

/**
 * Zoom yapıldığında silme butonunun konumunu yenile.
 *
 * camera.js içindeki wheel listener önce viewport'u
 * değiştirir; ardından bu listener butonu günceller.
 */
canvas.addEventListener("wheel", () => {
  requestAnimationFrame(() => {
    silButonunuKonumlandir();
  });
});

/**
 * Sağ tuşla pan yapılırken silme butonu da
 * seçili şekille birlikte ekranda hareket etsin.
 */
canvas.addEventListener("pointermove", (event) => {
  const sagTusBasili = (event.buttons & 2) === 2;

  if (!sagTusBasili) return;

  requestAnimationFrame(() => {
    silButonunuKonumlandir();
  });
});

/**
 * Pencere yeniden boyutlandırıldığında responsive
 * canvas oranı değişebilir. Butonu yeniden konumlandır.
 */
window.addEventListener("resize", () => {
  requestAnimationFrame(() => {
    silButonunuKonumlandir();
  });
});
