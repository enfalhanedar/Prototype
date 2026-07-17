import {
  cizgiler,
  setSeciliGrupId,
  setSeciliGrupIdleri,
} from "../core/state.js";

import {
  stage,
  viewport,
  secimKatmani,
} from "../core/stage.js";

import {
  poligonSinirlari,
  kutularKesisiyorMu,
} from "../geometry/geometry.js";

import { ekraniGuncelle } from "../drawing/render.js";
import { silButonunuKonumlandir } from "./interaction-delete-button.js";

export let kutuSecimiAktif = false;
let kutuSecimBaslangici = null;

const silButonu = document.getElementById("btnDeleteSelected");

function grupSinirlariniBul(groupId) {
  const grup = cizgiler.filter(
    (cizgi) => (cizgi.groupId ?? cizgi.id) === groupId,
  );

  if (grup.length === 0) return null;

  const noktalar = grup.flatMap((cizgi) => [
    { x: cizgi.x1, y: cizgi.y1 },
    { x: cizgi.x2, y: cizgi.y2 },
  ]);

  return poligonSinirlari(noktalar);
}

function secimKutusundakiGruplariBul(
  baslangic,
  bitis,
) {
  const secimKutusu = {
    sol: Math.min(baslangic.x, bitis.x),
    sag: Math.max(baslangic.x, bitis.x),
    ust: Math.min(baslangic.y, bitis.y),
    alt: Math.max(baslangic.y, bitis.y),
  };

  const tumGrupIdleri = [
    ...new Set(
      cizgiler.map(
        (cizgi) => cizgi.groupId ?? cizgi.id,
      ),
    ),
  ];

  return tumGrupIdleri.filter((groupId) => {
    const grupKutusu = grupSinirlariniBul(groupId);

    return (
      grupKutusu &&
      kutularKesisiyorMu(secimKutusu, grupKutusu)
    );
  });
}

function secimKutusunuCiz(baslangic, bitis) {
  const x = Math.min(baslangic.x, bitis.x);
  const y = Math.min(baslangic.y, bitis.y);

  const w = Math.abs(bitis.x - baslangic.x);
  const h = Math.abs(bitis.y - baslangic.y);

  secimKatmani.graphics
    .clear()
    .beginFill("rgba(59, 130, 246, 0.12)")
    .beginStroke("rgba(59, 130, 246, 0.9)")
    .setStrokeStyle(1 / viewport.scaleX)
    .drawRect(x, y, w, h);

  stage.update();
}

/**
 * Boş alana tıklanınca kutu seçimini başlatır.
 */
export function kutuSecimBaslat(dunyaNoktasi) {
  kutuSecimiAktif = true;
  kutuSecimBaslangici = {
    x: dunyaNoktasi.x,
    y: dunyaNoktasi.y,
  };

  setSeciliGrupIdleri([]);
  setSeciliGrupId(null);

  silButonu?.classList.add("hidden");
}

/**
 * Mouse hareket ederken kutu seçim çerçevesini günceller.
 * Kutu seçimi aktif değilse hiçbir şey yapmaz.
 */
export function kutuSecimGuncelle(dunyaNoktasi) {
  if (!kutuSecimiAktif || !kutuSecimBaslangici) return;

  secimKutusunuCiz(kutuSecimBaslangici, dunyaNoktasi);
}

/**
 * Mouse bırakıldığında kutu içindeki grupları seçili yapar.
 * Kutu seçimi aktif değilse hiçbir şey yapmaz.
 */
export function kutuSecimBitir(dunyaNoktasi) {
  if (!kutuSecimiAktif || !kutuSecimBaslangici) return;

  const bulunanGruplar = secimKutusundakiGruplariBul(
    kutuSecimBaslangici,
    dunyaNoktasi,
  );

  setSeciliGrupIdleri(bulunanGruplar);

  if (bulunanGruplar.length === 1) {
    setSeciliGrupId(bulunanGruplar[0]);
  } else {
    setSeciliGrupId(null);
  }

  kutuSecimiAktif = false;
  kutuSecimBaslangici = null;

  secimKatmani.graphics.clear();

  ekraniGuncelle();
  stage.update();
  silButonunuKonumlandir();
}
