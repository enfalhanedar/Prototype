import {
  cizgiler,
  setSeciliCizgiIdleri,
  secimiTemizle,
} from "../core/state.js";

import {
  stage,
  viewport,
  secimKatmani,
} from "../core/stage.js";

import { ekraniGuncelle } from "../drawing/render.js";
import { silButonunuKonumlandir } from "./interaction-delete-button.js";

export let kutuSecimiAktif = false;
let kutuSecimBaslangici = null;

const silButonu = document.getElementById("btnDeleteSelected");

const KESISIM_TOLERANSI = 0.001;

function noktaKutuIcindeMi(x, y, kutu) {
  return (
    x >= kutu.sol &&
    x <= kutu.sag &&
    y >= kutu.ust &&
    y <= kutu.alt
  );
}

function yon(a, b, c) {
  return (
    (b.x - a.x) * (c.y - a.y) -
    (b.y - a.y) * (c.x - a.x)
  );
}

function noktaCizgiAraligindaMi(a, b, c) {
  return (
    b.x >= Math.min(a.x, c.x) - KESISIM_TOLERANSI &&
    b.x <= Math.max(a.x, c.x) + KESISIM_TOLERANSI &&
    b.y >= Math.min(a.y, c.y) - KESISIM_TOLERANSI &&
    b.y <= Math.max(a.y, c.y) + KESISIM_TOLERANSI
  );
}

function cizgilerKesisiyorMu(a1, a2, b1, b2) {
  const yon1 = yon(a1, a2, b1);
  const yon2 = yon(a1, a2, b2);
  const yon3 = yon(b1, b2, a1);
  const yon4 = yon(b1, b2, a2);

  const genelKesisim =
    (
      (yon1 > 0 && yon2 < 0) ||
      (yon1 < 0 && yon2 > 0)
    ) &&
    (
      (yon3 > 0 && yon4 < 0) ||
      (yon3 < 0 && yon4 > 0)
    );

  if (genelKesisim) {
    return true;
  }

  if (
    Math.abs(yon1) <= KESISIM_TOLERANSI &&
    noktaCizgiAraligindaMi(a1, b1, a2)
  ) {
    return true;
  }

  if (
    Math.abs(yon2) <= KESISIM_TOLERANSI &&
    noktaCizgiAraligindaMi(a1, b2, a2)
  ) {
    return true;
  }

  if (
    Math.abs(yon3) <= KESISIM_TOLERANSI &&
    noktaCizgiAraligindaMi(b1, a1, b2)
  ) {
    return true;
  }

  if (
    Math.abs(yon4) <= KESISIM_TOLERANSI &&
    noktaCizgiAraligindaMi(b1, a2, b2)
  ) {
    return true;
  }

  return false;
}

function cizgiSecimKutusuylaKesisiyorMu(cizgi, kutu) {
  if (
    noktaKutuIcindeMi(cizgi.x1, cizgi.y1, kutu) ||
    noktaKutuIcindeMi(cizgi.x2, cizgi.y2, kutu)
  ) {
    return true;
  }

  const cizgiBaslangici = {
    x: cizgi.x1,
    y: cizgi.y1,
  };

  const cizgiBitisi = {
    x: cizgi.x2,
    y: cizgi.y2,
  };

  const solUst = {
    x: kutu.sol,
    y: kutu.ust,
  };

  const sagUst = {
    x: kutu.sag,
    y: kutu.ust,
  };

  const sagAlt = {
    x: kutu.sag,
    y: kutu.alt,
  };

  const solAlt = {
    x: kutu.sol,
    y: kutu.alt,
  };

  return (
    cizgilerKesisiyorMu(
      cizgiBaslangici,
      cizgiBitisi,
      solUst,
      sagUst,
    ) ||
    cizgilerKesisiyorMu(
      cizgiBaslangici,
      cizgiBitisi,
      sagUst,
      sagAlt,
    ) ||
    cizgilerKesisiyorMu(
      cizgiBaslangici,
      cizgiBitisi,
      sagAlt,
      solAlt,
    ) ||
    cizgilerKesisiyorMu(
      cizgiBaslangici,
      cizgiBitisi,
      solAlt,
      solUst,
    )
  );
}

function secimKutusundakiCizgileriBul(baslangic, bitis) {
  const secimKutusu = {
    sol: Math.min(baslangic.x, bitis.x),
    sag: Math.max(baslangic.x, bitis.x),
    ust: Math.min(baslangic.y, bitis.y),
    alt: Math.max(baslangic.y, bitis.y),
  };

  return cizgiler
    .filter((cizgi) =>
      cizgiSecimKutusuylaKesisiyorMu(
        cizgi,
        secimKutusu,
      ),
    )
    .map((cizgi) => cizgi.id);
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

export function kutuSecimBaslat(dunyaNoktasi) {
  kutuSecimiAktif = true;

  kutuSecimBaslangici = {
    x: dunyaNoktasi.x,
    y: dunyaNoktasi.y,
  };

  secimiTemizle();

  silButonu?.classList.add("hidden");
  silButonu?.classList.remove("flex");
}

export function kutuSecimGuncelle(dunyaNoktasi) {
  if (!kutuSecimiAktif || !kutuSecimBaslangici) {
    return;
  }

  secimKutusunuCiz(
    kutuSecimBaslangici,
    dunyaNoktasi,
  );
}

export function kutuSecimBitir(dunyaNoktasi) {
  if (!kutuSecimiAktif || !kutuSecimBaslangici) {
    return;
  }

  const bulunanCizgiIdleri =
    secimKutusundakiCizgileriBul(
      kutuSecimBaslangici,
      dunyaNoktasi,
    );

  setSeciliCizgiIdleri(bulunanCizgiIdleri);

  kutuSecimiAktif = false;
  kutuSecimBaslangici = null;

  secimKatmani.graphics.clear();

  ekraniGuncelle();
  silButonunuKonumlandir();
}