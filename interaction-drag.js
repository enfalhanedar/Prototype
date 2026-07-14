import { cizgiler, setSeciliGrupId } from "./state.js";
import { canvas, viewport } from "./stage.js";
import { hesaplaGrupTasimaSnap } from "./snap.js";
import { gecmiseKaydet } from "./history.js";
import { odalariYenidenHesapla } from "./rooms.js";
import { ekraniGuncelle } from "./render.js";
import { silButonunuKonumlandir } from "./interaction-delete-button.js";
import {
  grupCizgileriniBul,
  aktifSeciliGrupIdleri,
} from "./interaction-selection-helpers.js";

let suruklemeAktif = false;
let hareketGerceklesti = false;
let gecmiseKaydedildi = false;

let suruklemeBaslangicX = 0;
let suruklemeBaslangicY = 0;

let orijinalTumCizgiler = [];
let orijinalGrupCizgileri = [];
let orijinalSuruklenenGrupIdleri = [];

export function suruklemeAktifMi() {
  return suruklemeAktif;
}

function suruklemeyiBaslat(dunyaNoktasi, grupIdleri) {
  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  suruklemeBaslangicX = dunyaNoktasi.x;
  suruklemeBaslangicY = dunyaNoktasi.y;

  orijinalTumCizgiler = structuredClone(cizgiler);
  orijinalSuruklenenGrupIdleri = [...grupIdleri];
  orijinalGrupCizgileri = structuredClone(
    grupIdleri.flatMap((grupId) =>
      grupCizgileriniBul(grupId),
    ),
  );

  canvas.style.cursor = "grabbing";

  ekraniGuncelle();
  silButonunuKonumlandir();
}

/**
 * Bir çizgiye/odaya tıklanınca ilgili grubu seçer ve
 * sürüklemeye hazırlar. Tıklanan grup zaten mevcut çoklu
 * seçimin bir parçasıysa, seçimi bozmadan hepsini birlikte
 * sürüklemeye başlar.
 */
export function grupSecVeSuruklemeyeHazirla(
  grupId,
  dunyaNoktasi,
) {
  const mevcutSecim = aktifSeciliGrupIdleri();

  if (
    mevcutSecim.includes(grupId) &&
    mevcutSecim.length > 1
  ) {
    suruklemeyiBaslat(dunyaNoktasi, mevcutSecim);
    return;
  }

  setSeciliGrupId(grupId);
  suruklemeyiBaslat(dunyaNoktasi, [grupId]);
}

/**
 * Sol tuş basılıyken seçili grubu/grupları taşır.
 * Sürükleme aktif değilse hiçbir şey yapmaz.
 */
export function suruklemeyiTasi(dunyaNoktasi) {
  if (!suruklemeAktif) return;
  if (orijinalGrupCizgileri.length === 0) return;

  const hamDx = dunyaNoktasi.x - suruklemeBaslangicX;
  const hamDy = dunyaNoktasi.y - suruklemeBaslangicY;

  // Çok küçük mouse hareketlerini sürükleme olarak sayma.
  const ekranHareketi = Math.hypot(
    hamDx * viewport.scaleX,
    hamDy * viewport.scaleY,
  );

  if (ekranHareketi < 2) return;

  hareketGerceklesti = true;

  // Taşıma işlemini geçmişe yalnızca bir kez kaydet.
  if (!gecmiseKaydedildi) {
    gecmiseKaydet(orijinalTumCizgiler);
    gecmiseKaydedildi = true;
  }

  // Taşınan grubun köşe ve kenarlarını diğer
  // şekillere mıknatısla.
  const snapSonucu = hesaplaGrupTasimaSnap(
    orijinalGrupCizgileri,
    hamDx,
    hamDy,
    orijinalSuruklenenGrupIdleri,
  );

  for (const orijinalCizgi of orijinalGrupCizgileri) {
    const mevcutCizgi = cizgiler.find(
      (cizgi) => cizgi.id === orijinalCizgi.id,
    );

    if (!mevcutCizgi) continue;

    mevcutCizgi.x1 = orijinalCizgi.x1 + snapSonucu.dx;
    mevcutCizgi.y1 = orijinalCizgi.y1 + snapSonucu.dy;
    mevcutCizgi.x2 = orijinalCizgi.x2 + snapSonucu.dx;
    mevcutCizgi.y2 = orijinalCizgi.y2 + snapSonucu.dy;
  }

  odalariYenidenHesapla();
  ekraniGuncelle();
  silButonunuKonumlandir();
}

/**
 * Mouse bırakıldığında (veya canvas dışına çıkıldığında)
 * taşıma işlemini bitirir. Sürükleme aktif değilse
 * hiçbir şey yapmaz.
 */
export function suruklemeyiBitir() {
  if (!suruklemeAktif) return;

  suruklemeAktif = false;

  canvas.style.cursor = hareketGerceklesti
    ? "default"
    : "pointer";

  silButonunuKonumlandir();
}
