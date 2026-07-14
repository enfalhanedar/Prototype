import {
  setAktifMod,
  setMevcutCizim,
  setSeciliGrupId,
  setSeciliGrupIdleri,
} from "./state.js";

import {
  stage,
  onizlemeKatmani,
} from "./stage.js";

const tools = {
  SELECT: document.getElementById("toolSelect"),
  LINE: document.getElementById("toolLine"),
  RECT: document.getElementById("toolRect"),
  SQUARE: document.getElementById("toolSquare"),
};

const aktifButonClass =
  "w-full bg-purple-600 hover:bg-purple-700 text-white text-left font-semibold py-2.5 px-3 rounded-xl text-sm transition shadow-sm";

const pasifButonClass =
  "w-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-left font-semibold py-2.5 px-3 rounded-xl text-sm transition border border-purple-100";

export function modDegistir(yeniMod) {
  setAktifMod(yeniMod);
  setMevcutCizim(null);

  onizlemeKatmani.graphics.clear();

  if (yeniMod !== "SELECT") {
    setSeciliGrupId(null);
    setSeciliGrupIdleri([]); 

    const silButonu = document.getElementById("btnDeleteSelected");

    if (silButonu) {
      silButonu.classList.add("hidden");
    }
  }

  Object.entries(tools).forEach(([mod, buton]) => {
    if (!buton) return;

    buton.className =
      mod === yeniMod
        ? aktifButonClass
        : pasifButonClass;
  });

  stage.update();
}

tools.SELECT?.addEventListener("click", () => {
  modDegistir("SELECT");
});

tools.LINE?.addEventListener("click", () => {
  modDegistir("LINE");
});

tools.RECT?.addEventListener("click", () => {
  modDegistir("RECT");
});

tools.SQUARE?.addEventListener("click", () => {
  modDegistir("SQUARE");
});

// Sayfa ilk açıldığında çizgi aracı seçili görünsün
modDegistir("LINE");