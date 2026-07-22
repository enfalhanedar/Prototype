import { cizgiler, seciliCizgiIdleri } from "../core/state.js";

const NOKTA_TOLERANSI = 0.001;

function noktalarEsitMi(a, b) {
  return (
    Math.abs(a.x - b.x) <= NOKTA_TOLERANSI &&
    Math.abs(a.y - b.y) <= NOKTA_TOLERANSI
  );
}

function cizgiNoktalarlaEslesiyorMu(cizgi, a, b) {
  const baslangic = {
    x: cizgi.x1,
    y: cizgi.y1,
  };

  const bitis = {
    x: cizgi.x2,
    y: cizgi.y2,
  };

  return (
    (noktalarEsitMi(baslangic, a) && noktalarEsitMi(bitis, b)) ||
    (noktalarEsitMi(baslangic, b) && noktalarEsitMi(bitis, a))
  );
}

export function seciliCizgileriBul() {
  const seciliIdSeti = new Set(seciliCizgiIdleri);

  return cizgiler.filter((cizgi) => seciliIdSeti.has(cizgi.id));
}

export function odaCizgiIdleriniBul(oda) {
  if (!oda || !Array.isArray(oda.noktalar) || oda.noktalar.length < 2) {
    return [];
  }

  const bulunanIdler = new Set();

  for (let i = 0; i < oda.noktalar.length; i += 1) {
    const baslangic = oda.noktalar[i];
    const bitis = oda.noktalar[(i + 1) % oda.noktalar.length];

    for (const cizgi of cizgiler) {
      if (cizgiNoktalarlaEslesiyorMu(cizgi, baslangic, bitis)) {
        bulunanIdler.add(cizgi.id);
      }
    }
  }

  return [...bulunanIdler];
}
