import { cizgiler } from "../core/state.js";

const JSON_SURUM = 1;

function cizimVerisiniOlustur() {
  return {
    surum: JSON_SURUM,
    olusturulmaTarihi: new Date().toISOString(),
    cizgiler,
  };
}

export function cizimiJsonOlarakDisaAktar() {
  const veri = JSON.stringify(cizimVerisiniOlustur(), null, 2);
  const blob = new Blob([veri], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const tarihEtiketi = new Date().toISOString().slice(0, 10);

  const link = document.createElement("a");
  link.href = url;
  link.download = `webcad-plan-${tarihEtiketi}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

document
  .getElementById("btnExportJson")
  ?.addEventListener("click", cizimiJsonOlarakDisaAktar);
