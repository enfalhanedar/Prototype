import {
  cizgiler,
  setSeciliCizgiIdleri,
  setHoverKoseNoktasi,
} from "../core/state.js";

import {
  canvas,
  odaKatmani,
} from "../core/stage.js";

import {
  hesaplaSnap,
  hesaplaCizgiTasimaSnap,
} from "../geometry/snap.js";

import { gecmiseKaydet } from "../drawing/history.js";
import { odalariYenidenHesapla } from "../drawing/rooms.js";
import { ekraniGuncelle } from "../drawing/render.js";
import { silButonunuKonumlandir } from "./interaction-delete-button.js";

import {
  kesisimleriKoseyeDonustur,
} from "../io/intersections.js";

const BAGLANTI_TOLERANSI = 0.01;
const KOSE_TOLERANSI = 0.001;

let suruklemeAktif = false;
let hareketGerceklesti = false;
let gecmiseKaydedildi = false;

let suruklemeTuru = "LINES";

let suruklemeBaslangicX = 0;
let suruklemeBaslangicY = 0;

let orijinalTumCizgiler = [];
let orijinalTasinanCizgiler = [];
let tasinanCizgiIdleri = [];

let bagliKomsuUclar = [];
let bagliCizgiReferanslari = [];

export function suruklemeAktifMi() {
  return suruklemeAktif;
}

function noktalarBagliMi(x1, y1, x2, y2, tolerans) {
  return Math.hypot(x1 - x2, y1 - y2) < tolerans;
}

function bagliKomsuUclariBul(seciliIdSeti) {
  const bulunanBaglantilar = [];

  for (const tasinanCizgi of cizgiler) {
    if (!seciliIdSeti.has(tasinanCizgi.id)) continue;

    const tasinanUclar = [
      {
        uc: "v1",
        x: tasinanCizgi.x1,
        y: tasinanCizgi.y1,
      },
      {
        uc: "v2",
        x: tasinanCizgi.x2,
        y: tasinanCizgi.y2,
      },
    ];

    for (const komsuCizgi of cizgiler) {
      if (seciliIdSeti.has(komsuCizgi.id)) continue;

      const komsuUclar = [
        {
          uc: "v1",
          x: komsuCizgi.x1,
          y: komsuCizgi.y1,
        },
        {
          uc: "v2",
          x: komsuCizgi.x2,
          y: komsuCizgi.y2,
        },
      ];

      for (const tasinanUc of tasinanUclar) {
        for (const komsuUc of komsuUclar) {
          if (
            noktalarBagliMi(
              tasinanUc.x,
              tasinanUc.y,
              komsuUc.x,
              komsuUc.y,
              BAGLANTI_TOLERANSI,
            )
          ) {
            bulunanBaglantilar.push({
              komsuCizgiId: komsuCizgi.id,
              komsuUc: komsuUc.uc,
              kaynakCizgiId: tasinanCizgi.id,
              kaynakUc: tasinanUc.uc,
            });
          }
        }
      }
    }
  }

  return bulunanBaglantilar;
}

function koseyeBagliUclariBul(koseNoktasi) {
  const bulunanReferanslar = [];

  for (const cizgi of cizgiler) {
    if (
      noktalarBagliMi(
        cizgi.x1,
        cizgi.y1,
        koseNoktasi.x,
        koseNoktasi.y,
        KOSE_TOLERANSI,
      )
    ) {
      bulunanReferanslar.push({
        id: cizgi.id,
        uc: "v1",
      });
    }

    if (
      noktalarBagliMi(
        cizgi.x2,
        cizgi.y2,
        koseNoktasi.x,
        koseNoktasi.y,
        KOSE_TOLERANSI,
      )
    ) {
      bulunanReferanslar.push({
        id: cizgi.id,
        uc: "v2",
      });
    }
  }

  return bulunanReferanslar;
}

function tasimayiHazirla(dunyaNoktasi, cizgiIdleri) {
  const benzersizIdler = [
    ...new Set(cizgiIdleri.filter(Boolean)),
  ];

  const idSeti = new Set(benzersizIdler);

  const bulunanCizgiler = cizgiler.filter(
    (cizgi) => idSeti.has(cizgi.id),
  );

  if (bulunanCizgiler.length === 0) {
    suruklemeAktif = false;
    return;
  }

  suruklemeTuru = "LINES";
  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  suruklemeBaslangicX = dunyaNoktasi.x;
  suruklemeBaslangicY = dunyaNoktasi.y;

  tasinanCizgiIdleri = bulunanCizgiler.map(
    (cizgi) => cizgi.id,
  );

  orijinalTumCizgiler = structuredClone(cizgiler);
  orijinalTasinanCizgiler =
    structuredClone(bulunanCizgiler);

  bagliKomsuUclar = bagliKomsuUclariBul(
    new Set(tasinanCizgiIdleri),
  );

  odaKatmani.visible = false;
  canvas.style.cursor = "grabbing";

  ekraniGuncelle();
  silButonunuKonumlandir();
}

export function cizgileriSuruklemeyeHazirla(
  cizgiIdleri,
  dunyaNoktasi,
) {
  tasimayiHazirla(
    dunyaNoktasi,
    Array.isArray(cizgiIdleri)
      ? cizgiIdleri
      : [cizgiIdleri],
  );
}

export function tekilCizgiSecVeSuruklemeyeHazirla(
  cizgi,
  dunyaNoktasi,
) {
  setSeciliCizgiIdleri([cizgi.id]);

  tasimayiHazirla(
    dunyaNoktasi,
    [cizgi.id],
  );
}

export function koseSuruklemeyeHazirla(koseNoktasi) {
  const bulunanUclar =
    koseyeBagliUclariBul(koseNoktasi);

  if (bulunanUclar.length === 0) return;

  suruklemeTuru = "CORNER";
  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  orijinalTumCizgiler = structuredClone(cizgiler);
  bagliCizgiReferanslari = bulunanUclar;

  odaKatmani.visible = false;
  canvas.style.cursor = "grabbing";

  ekraniGuncelle();
}

function bagliKomsuUclariGuncelle() {
  for (const baglanti of bagliKomsuUclar) {
    const komsuCizgi = cizgiler.find(
      (cizgi) =>
        cizgi.id === baglanti.komsuCizgiId,
    );

    const kaynakCizgi = cizgiler.find(
      (cizgi) =>
        cizgi.id === baglanti.kaynakCizgiId,
    );

    if (!komsuCizgi || !kaynakCizgi) continue;

    const yeniX =
      baglanti.kaynakUc === "v1"
        ? kaynakCizgi.x1
        : kaynakCizgi.x2;

    const yeniY =
      baglanti.kaynakUc === "v1"
        ? kaynakCizgi.y1
        : kaynakCizgi.y2;

    if (baglanti.komsuUc === "v1") {
      komsuCizgi.x1 = yeniX;
      komsuCizgi.y1 = yeniY;
    } else {
      komsuCizgi.x2 = yeniX;
      komsuCizgi.y2 = yeniY;
    }
  }
}

function cizgileriTasi(dunyaNoktasi) {
  if (orijinalTasinanCizgiler.length === 0) return;

  const hamDx =
    dunyaNoktasi.x - suruklemeBaslangicX;

  const hamDy =
    dunyaNoktasi.y - suruklemeBaslangicY;

  const snapSonucu = hesaplaCizgiTasimaSnap(
    orijinalTasinanCizgiler,
    hamDx,
    hamDy,
    tasinanCizgiIdleri,
  );

  const orijinalHarita = new Map(
    orijinalTasinanCizgiler.map(
      (cizgi) => [cizgi.id, cizgi],
    ),
  );

  for (const cizgi of cizgiler) {
    const orijinal = orijinalHarita.get(cizgi.id);

    if (!orijinal) continue;

    cizgi.x1 = orijinal.x1 + snapSonucu.dx;
    cizgi.y1 = orijinal.y1 + snapSonucu.dy;
    cizgi.x2 = orijinal.x2 + snapSonucu.dx;
    cizgi.y2 = orijinal.y2 + snapSonucu.dy;
  }

  bagliKomsuUclariGuncelle();
}

function koseyiTasi(dunyaNoktasi) {
  if (bagliCizgiReferanslari.length === 0) return;

  const snapSonucu = hesaplaSnap(
    dunyaNoktasi.x,
    dunyaNoktasi.y,
  );

  setHoverKoseNoktasi({
    x: snapSonucu.x,
    y: snapSonucu.y,
  });

  for (const referans of bagliCizgiReferanslari) {
    const mevcutCizgi = cizgiler.find(
      (cizgi) => cizgi.id === referans.id,
    );

    if (!mevcutCizgi) continue;

    if (referans.uc === "v1") {
      mevcutCizgi.x1 = snapSonucu.x;
      mevcutCizgi.y1 = snapSonucu.y;
    } else {
      mevcutCizgi.x2 = snapSonucu.x;
      mevcutCizgi.y2 = snapSonucu.y;
    }
  }
}

export function suruklemeyiTasi(dunyaNoktasi) {
  if (!suruklemeAktif) return;

  if (!gecmiseKaydedildi) {
    gecmiseKaydet(orijinalTumCizgiler);
    gecmiseKaydedildi = true;
  }

  hareketGerceklesti = true;

  if (suruklemeTuru === "LINES") {
    cizgileriTasi(dunyaNoktasi);
  } else {
    koseyiTasi(dunyaNoktasi);
  }

  ekraniGuncelle();
  silButonunuKonumlandir();
}

export function suruklemeyiBitir() {
  if (!suruklemeAktif) return;

  suruklemeAktif = false;

  canvas.style.cursor =
    hareketGerceklesti
      ? "default"
      : "pointer";

  if (hareketGerceklesti) {
    kesisimleriKoseyeDonustur();
  }

  odalariYenidenHesapla();
  odaKatmani.visible = true;

  orijinalTumCizgiler = [];
  orijinalTasinanCizgiler = [];
  tasinanCizgiIdleri = [];

  bagliCizgiReferanslari = [];
  bagliKomsuUclar = [];

  setHoverKoseNoktasi(null);

  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  ekraniGuncelle();
  silButonunuKonumlandir();
}
