import {
  cizgiler,
  setSeciliGrupId,
  setHoverKoseNoktasi
} from "../core/state.js";
import { canvas, viewport } from "../core/stage.js";
import { hesaplaGrupTasimaSnap, hesaplaSnap } from "../geometry/snap.js";
import { gecmiseKaydet, dinamikBolmeUygula } from "../drawing/history.js";
import { odalariYenidenHesapla } from "../drawing/rooms.js";
import { ekraniGuncelle } from "../drawing/render.js";
import { silButonunuKonumlandir } from "./interaction-delete-button.js";
import {
  grupCizgileriniBul,
  aktifSeciliGrupIdleri,
} from "./interaction-selection-helpers.js";

let suruklemeAktif = false;
let hareketGerceklesti = false;
let gecmiseKaydedildi = false;

let suruklemeTuru = "GROUP"; 

let suruklemeBaslangicX = 0;
let suruklemeBaslangicY = 0;
let orijinalTumCizgiler = [];
let orijinalGrupCizgileri = [];
let orijinalSuruklenenGrupIdleri = [];

let suruklenenKoseNoktasi = null;
let bagliCizgiReferanslari = [];

export function suruklemeAktifMi() {
  return suruklemeAktif;
}

function suruklemeyiBaslat(dunyaNoktasi, grupIdleri) {
  suruklemeTuru = "GROUP";
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

export function koseSuruklemeyeHazirla(koseNoktasi) {
  suruklemeTuru = "CORNER";
  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;
  
  suruklenenKoseNoktasi = { ...koseNoktasi };
  orijinalTumCizgiler = structuredClone(cizgiler);
  bagliCizgiReferanslari = [];

  const TOLERANS = 1e-3;
  cizgiler.forEach((cizgi) => {
    if (Math.hypot(cizgi.x1 - koseNoktasi.x, cizgi.y1 - koseNoktasi.y) < TOLERANS) {
      bagliCizgiReferanslari.push({ id: cizgi.id, uc: "v1" });
    }
    if (Math.hypot(cizgi.x2 - koseNoktasi.x, cizgi.y2 - koseNoktasi.y) < TOLERANS) {
      bagliCizgiReferanslari.push({ id: cizgi.id, uc: "v2" });
    }
  });

  canvas.style.cursor = "grabbing";
  ekraniGuncelle();
}

export function grupSecVeSuruklemeyeHazirla(grupId, dunyaNoktasi) {
  const mevcutSecim = aktifSeciliGrupIdleri();

  if (mevcutSecim.includes(grupId) && mevcutSecim.length > 1) {
    suruklemeyiBaslat(dunyaNoktasi, mevcutSecim);
    return;
  }

  setSeciliGrupId(grupId);
  suruklemeyiBaslat(dunyaNoktasi, [grupId]);
}

export function suruklemeyiTasi(dunyaNoktasi) {
  if (!suruklemeAktif) return;

  if (!gecmiseKaydedildi) {
    gecmiseKaydet(orijinalTumCizgiler);
    gecmiseKaydedildi = true;
  }

  if (suruklemeTuru === "GROUP") {
    if (orijinalGrupCizgileri.length === 0) return;

    const hamDx = dunyaNoktasi.x - suruklemeBaslangicX;
    const hamDy = dunyaNoktasi.y - suruklemeBaslangicY;

    const ekranHareketi = Math.hypot(hamDx * viewport.scaleX, hamDy * viewport.scaleY);
    if (ekranHareketi < 2) return;

    hareketGerceklesti = true;

    const snapSonucu = hesaplaGrupTasimaSnap(
      orijinalGrupCizgileri,
      hamDx,
      hamDy,
      orijinalSuruklenenGrupIdleri,
    );

    for (const orijinalCizgi of orijinalGrupCizgileri) {
      const mevcutCizgi = cizgiler.find((cizgi) => cizgi.id === orijinalCizgi.id);
      if (!mevcutCizgi) continue;

      mevcutCizgi.x1 = orijinalCizgi.x1 + snapSonucu.dx;
      mevcutCizgi.y1 = orijinalCizgi.y1 + snapSonucu.dy;
      mevcutCizgi.x2 = orijinalCizgi.x2 + snapSonucu.dx;
      mevcutCizgi.y2 = orijinalCizgi.y2 + snapSonucu.dy;
    }
  } 
  else if (suruklemeTuru === "CORNER") {
    if (bagliCizgiReferanslari.length === 0) return;
    
    hareketGerceklesti = true;

    const snapSonucu = hesaplaSnap(dunyaNoktasi.x, dunyaNoktasi.y);

    setHoverKoseNoktasi({ x: snapSonucu.x, y: snapSonucu.y });

    bagliCizgiReferanslari.forEach((ref) => {
      const mevcutCizgi = cizgiler.find((c) => c.id === ref.id);
      if (!mevcutCizgi) return;

      if (ref.uc === "v1") {
        mevcutCizgi.x1 = snapSonucu.x;
        mevcutCizgi.y1 = snapSonucu.y;
      } else {
        mevcutCizgi.x2 = snapSonucu.x;
        mevcutCizgi.y2 = snapSonucu.y;
      }
    });
  }

  odalariYenidenHesapla();
  ekraniGuncelle();
  silButonunuKonumlandir();
}

export function suruklemeyiBitir() {
  if (!suruklemeAktif) return;

  suruklemeAktif = false;
  canvas.style.cursor = hareketGerceklesti ? "default" : "pointer";

  suruklenenKoseNoktasi = null;
  bagliCizgiReferanslari = [];
  setHoverKoseNoktasi(null);

  // Sürükleme bittiğinde, sahnedeki kesişen tüm çizgileri otomatik olarak böl ve birleştir!
  if (hareketGerceklesti) {
    dinamikBolmeUygula();
  }

  odalariYenidenHesapla();
  ekraniGuncelle();
  silButonunuKonumlandir();
}