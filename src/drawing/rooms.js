import { cizgiler, setOdalar } from "../core/state.js";

import { poligonSinirlari, noktaPoligonIcinde } from "../geometry/geometry.js";

const NOKTA_HASSASIYETI = 3;
const MINIMUM_ODA_ALANI = 10;

function koordinatAnahtari(x, y) {
  return `${Number(x).toFixed(NOKTA_HASSASIYETI)},${Number(y).toFixed(
    NOKTA_HASSASIYETI,
  )}`;
}

function yonluKenarAnahtari(baslangic, bitis) {
  return `${baslangic.anahtar}->${bitis.anahtar}`;
}

function isaretliPoligonAlani(noktalar) {
  let toplam = 0;

  for (let i = 0; i < noktalar.length; i += 1) {
    const mevcut = noktalar[i];

    const sonraki = noktalar[(i + 1) % noktalar.length];

    toplam += mevcut.x * sonraki.y - sonraki.x * mevcut.y;
  }

  return toplam / 2;
}

function poligonImzasi(noktalar) {
  const anahtarlar = noktalar.map((nokta) =>
    koordinatAnahtari(nokta.x, nokta.y),
  );

  const duzAdaylar = [];
  const tersAdaylar = [];

  const tersAnahtarlar = [...anahtarlar].reverse();

  for (let i = 0; i < anahtarlar.length; i += 1) {
    duzAdaylar.push(
      [...anahtarlar.slice(i), ...anahtarlar.slice(0, i)].join("|"),
    );

    tersAdaylar.push(
      [...tersAnahtarlar.slice(i), ...tersAnahtarlar.slice(0, i)].join("|"),
    );
  }

  return [...duzAdaylar, ...tersAdaylar].sort()[0];
}

function poligonMerkezi(noktalar) {
  const toplam = noktalar.reduce(
    (sonuc, nokta) => ({
      x: sonuc.x + nokta.x,
      y: sonuc.y + nokta.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: toplam.x / noktalar.length,
    y: toplam.y / noktalar.length,
  };
}

function komsulariSirala(kavsak) {
  kavsak.siraliKomsular = [...kavsak.komsular].sort((a, b) => {
    const aciA = Math.atan2(a.y - kavsak.y, a.x - kavsak.x);

    const aciB = Math.atan2(b.y - kavsak.y, b.x - kavsak.x);

    return aciA - aciB;
  });
}

function sonrakiKavsagiBul(onceki, mevcut) {
  const komsular = mevcut.siraliKomsular;

  if (!komsular || komsular.length < 2) {
    return null;
  }

  const geriDonusIndeksi = komsular.indexOf(onceki);

  if (geriDonusIndeksi === -1) {
    return null;
  }

  const sonrakiIndeks =
    (geriDonusIndeksi - 1 + komsular.length) % komsular.length;

  return komsular[sonrakiIndeks];
}

function grafiOlustur() {
  const kavsakHaritasi = new Map();

  function kavsakGetirVeyaOlustur(x, y) {
    const anahtar = koordinatAnahtari(x, y);

    if (!kavsakHaritasi.has(anahtar)) {
      kavsakHaritasi.set(anahtar, {
        anahtar,
        x: Number(x),
        y: Number(y),
        komsular: new Set(),
        siraliKomsular: [],
      });
    }

    return kavsakHaritasi.get(anahtar);
  }

  for (const cizgi of cizgiler) {
    if (!cizgi) {
      continue;
    }

    const gecerliMi =
      Number.isFinite(cizgi.x1) &&
      Number.isFinite(cizgi.y1) &&
      Number.isFinite(cizgi.x2) &&
      Number.isFinite(cizgi.y2);

    if (!gecerliMi) {
      continue;
    }

    const baslangic = kavsakGetirVeyaOlustur(cizgi.x1, cizgi.y1);

    const bitis = kavsakGetirVeyaOlustur(cizgi.x2, cizgi.y2);

    if (baslangic === bitis) {
      continue;
    }

    baslangic.komsular.add(bitis);
    bitis.komsular.add(baslangic);
  }

  const kavsaklar = [...kavsakHaritasi.values()];

  for (const kavsak of kavsaklar) {
    komsulariSirala(kavsak);
  }

  return kavsaklar;
}

function yuzuTakipEt(baslangic, ilkSonraki, maksimumAdim) {
  const noktalar = [];
  const kullanilanKenarlar = [];
  const gorulenKenarlar = new Set();

  let onceki = baslangic;
  let mevcut = ilkSonraki;

  for (let adim = 0; adim < maksimumAdim; adim += 1) {
    const kenarAnahtari = yonluKenarAnahtari(onceki, mevcut);

    if (gorulenKenarlar.has(kenarAnahtari)) {
      return null;
    }

    gorulenKenarlar.add(kenarAnahtari);

    kullanilanKenarlar.push(kenarAnahtari);

    noktalar.push({
      x: onceki.x,
      y: onceki.y,
    });

    const sonraki = sonrakiKavsagiBul(onceki, mevcut);

    if (!sonraki) {
      return null;
    }

    onceki = mevcut;
    mevcut = sonraki;

    if (onceki === baslangic && mevcut === ilkSonraki) {
      return {
        noktalar,
        kullanilanKenarlar,
      };
    }
  }

  return null;
}

function yuzleriBul(kavsaklar) {
  const ziyaretEdilenKenarlar = new Set();

  const bulunanImzalar = new Set();

  const bulunanYuzler = [];

  const toplamKenarSayisi = kavsaklar.reduce(
    (toplam, kavsak) => toplam + kavsak.komsular.size,
    0,
  );

  const maksimumAdim = toplamKenarSayisi + 5;

  for (const baslangic of kavsaklar) {
    for (const ilkSonraki of baslangic.siraliKomsular) {
      const ilkKenarAnahtari = yonluKenarAnahtari(baslangic, ilkSonraki);

      if (ziyaretEdilenKenarlar.has(ilkKenarAnahtari)) {
        continue;
      }

      const sonuc = yuzuTakipEt(baslangic, ilkSonraki, maksimumAdim);

      if (!sonuc) {
        ziyaretEdilenKenarlar.add(ilkKenarAnahtari);

        continue;
      }

      for (const kullanilanKenar of sonuc.kullanilanKenarlar) {
        ziyaretEdilenKenarlar.add(kullanilanKenar);
      }

      if (sonuc.noktalar.length < 3) {
        continue;
      }

      const alan = isaretliPoligonAlani(sonuc.noktalar);

      if (alan <= MINIMUM_ODA_ALANI) {
        continue;
      }

      const imza = poligonImzasi(sonuc.noktalar);

      if (bulunanImzalar.has(imza)) {
        continue;
      }

      bulunanImzalar.add(imza);

      bulunanYuzler.push({
        noktalar: sonuc.noktalar,
        alan,
      });
    }
  }

  return bulunanYuzler;
}

function odaNesnesiOlustur(noktalar, alan) {
  const sinirlar = poligonSinirlari(noktalar);

  return {
    id: crypto.randomUUID(),
    noktalar: noktalar.map((nokta) => ({
      x: Number(nokta.x),
      y: Number(nokta.y),
    })),

    alan: Number(alan),

    minX: sinirlar.minX,
    minY: sinirlar.minY,
    maxX: sinirlar.maxX,
    maxY: sinirlar.maxY,

    genislik: sinirlar.maxX - sinirlar.minX,

    yukseklik: sinirlar.maxY - sinirlar.minY,
  };
}

function kapsayiciOdalariEle(odalar) {
  return odalar.filter((adayOda) => {
    const icindekiOdalar = odalar.filter((digerOda) => {
      if (adayOda === digerOda) {
        return false;
      }

      if (digerOda.alan >= adayOda.alan) {
        return false;
      }

      const merkez = poligonMerkezi(digerOda.noktalar);

      return noktaPoligonIcinde(merkez.x, merkez.y, adayOda.noktalar);
    });

    if (icindekiOdalar.length < 2) {
      return true;
    }

    const icAlanToplami = icindekiOdalar.reduce(
      (toplam, oda) => toplam + oda.alan,
      0,
    );

    const alanFarki = Math.abs(adayOda.alan - icAlanToplami);

    const tolerans = Math.max(1, adayOda.alan * 0.001);

    /*
     * Aday oda, içindeki küçük odaların
     * birleşiminden oluşuyorsa onu ele.
     */
    return alanFarki > tolerans;
  });
}

export function odalariYenidenHesapla() {
  if (!Array.isArray(cizgiler) || cizgiler.length < 3) {
    setOdalar([]);
    return;
  }

  const kavsaklar = grafiOlustur();

  const yuzler = yuzleriBul(kavsaklar);

  const bulunanOdalar = yuzler.map((yuz) =>
    odaNesnesiOlustur(yuz.noktalar, yuz.alan),
  );

  const yeniOdalar = kapsayiciOdalariEle(bulunanOdalar);

  console.table(
    yeniOdalar.map((oda, indeks) => ({
      indeks,
      id: oda.id,
      alan: oda.alan,
      noktaSayisi: oda.noktalar.length,
      minX: oda.minX,
      minY: oda.minY,
      maxX: oda.maxX,
      maxY: oda.maxY,
    })),
  );

  setOdalar(yeniOdalar);
}
