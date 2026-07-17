import {
  cizgiler,
  setCizgiler,
} from "../core/state.js";

const KESISIM_TOLERANSI = 0.001;
const MINIMUM_CIZGI_UZUNLUGU = 0.01;

/**
 * Bir değeri 0 ile 1 arasında sınırlar.
 */
function sinirla01(deger) {
  return Math.max(0, Math.min(1, deger));
}

/**
 * Çizgi üzerinde t oranındaki noktayı döndürür.
 *
 * t = 0 başlangıç
 * t = 1 bitiş
 */
function cizgiUzerindekiNokta(cizgi, t) {
  return {
    x:
      cizgi.x1 +
      (cizgi.x2 - cizgi.x1) * t,

    y:
      cizgi.y1 +
      (cizgi.y2 - cizgi.y1) * t,
  };
}

/**
 * İki sonlu doğru parçasının kesişimini hesaplar.
 *
 * Paralel veya aynı doğrultudaki çizgiler için null döner.
 */
function cizgiKesisiminiBul(a, b) {
  const ax = a.x1;
  const ay = a.y1;

  const abx = a.x2 - a.x1;
  const aby = a.y2 - a.y1;

  const bx = b.x1;
  const by = b.y1;

  const bdx = b.x2 - b.x1;
  const bdy = b.y2 - b.y1;

  const payda =
    abx * bdy -
    aby * bdx;

  // Paralel veya aynı doğrultuda
  if (
    Math.abs(payda) <
    KESISIM_TOLERANSI
  ) {
    return null;
  }

  const farkX = bx - ax;
  const farkY = by - ay;

  const tA =
    (
      farkX * bdy -
      farkY * bdx
    ) / payda;

  const tB =
    (
      farkX * aby -
      farkY * abx
    ) / payda;

  const aUzerindeMi =
    tA >= -KESISIM_TOLERANSI &&
    tA <= 1 + KESISIM_TOLERANSI;

  const bUzerindeMi =
    tB >= -KESISIM_TOLERANSI &&
    tB <= 1 + KESISIM_TOLERANSI;

  if (!aUzerindeMi || !bUzerindeMi) {
    return null;
  }

  return {
    x: ax + abx * tA,
    y: ay + aby * tA,

    tA: sinirla01(tA),
    tB: sinirla01(tB),
  };
}

/**
 * Bir t değeri çizginin gerçek iç bölümünde mi?
 *
 * Çizginin başlangıç veya bitiş noktasındaki temaslarda
 * tekrar bölme yapılmaz.
 */
function cizgininIcindeMi(t) {
  return (
    t > KESISIM_TOLERANSI &&
    t < 1 - KESISIM_TOLERANSI
  );
}

/**
 * Aynı veya çok yakın t değerlerini temizler.
 */
function benzersizTSirala(tDegerleri) {
  const sirali = [...tDegerleri]
    .map((t) => sinirla01(t))
    .sort((a, b) => a - b);

  const sonuc = [];

  for (const t of sirali) {
    const onceki =
      sonuc[sonuc.length - 1];

    if (
      onceki === undefined ||
      Math.abs(t - onceki) >
        KESISIM_TOLERANSI
    ) {
      sonuc.push(t);
    }
  }

  return sonuc;
}

/**
 * Çizginin kesişim noktalarına göre yeni parçalarını oluşturur.
 */
function cizgiyiParcala(
  cizgi,
  tDegerleri,
) {
  const siraliT =
    benzersizTSirala([
      0,
      ...tDegerleri,
      1,
    ]);

  const parcalar = [];

  for (
    let i = 0;
    i < siraliT.length - 1;
    i += 1
  ) {
    const baslangicT = siraliT[i];
    const bitisT = siraliT[i + 1];

    const baslangic =
      cizgiUzerindekiNokta(
        cizgi,
        baslangicT,
      );

    const bitis =
      cizgiUzerindekiNokta(
        cizgi,
        bitisT,
      );

    const uzunluk =
      Math.hypot(
        bitis.x - baslangic.x,
        bitis.y - baslangic.y,
      );

    if (
      uzunluk <
      MINIMUM_CIZGI_UZUNLUGU
    ) {
      continue;
    }

    parcalar.push({
      ...cizgi,

      id: crypto.randomUUID(),

      x1: baslangic.x,
      y1: baslangic.y,

      x2: bitis.x,
      y2: bitis.y,

      /*
       * Bütün parçalar aynı çizim grubunda kalır.
       * Böylece seçim mantığın bozulmaz.
       */
      groupId:
        cizgi.groupId ??
        cizgi.id ??
        crypto.randomUUID(),

      kaynakCizgiId:
        cizgi.kaynakCizgiId ??
        cizgi.id ??
        null,
    });
  }

  return parcalar;
}

/**
 * Bütün çizgilerin kesişimlerini bulur ve gereken çizgileri böler.
 *
 * Fonksiyon true dönerse çizgi dizisi değiştirilmiştir.
 */
export function kesisimleriKoseyeDonustur() {
  if (
    !Array.isArray(cizgiler) ||
    cizgiler.length < 2
  ) {
    return false;
  }

  /*
   * Her çizgi için bölüneceği t değerleri tutulur.
   */
  const bolmeNoktalari =
    cizgiler.map(() => []);

  for (
    let i = 0;
    i < cizgiler.length;
    i += 1
  ) {
    for (
      let j = i + 1;
      j < cizgiler.length;
      j += 1
    ) {
      const birinci = cizgiler[i];
      const ikinci = cizgiler[j];

      if (!birinci || !ikinci) {
        continue;
      }

      const kesisim =
        cizgiKesisiminiBul(
          birinci,
          ikinci,
        );

      if (!kesisim) {
        continue;
      }

      /*
       * Kesişim birinci çizginin ortasındaysa
       * birinci çizgiyi böl.
       */
      if (
        cizgininIcindeMi(
          kesisim.tA,
        )
      ) {
        bolmeNoktalari[i].push(
          kesisim.tA,
        );
      }

      /*
       * Kesişim ikinci çizginin ortasındaysa
       * ikinci çizgiyi böl.
       */
      if (
        cizgininIcindeMi(
          kesisim.tB,
        )
      ) {
        bolmeNoktalari[j].push(
          kesisim.tB,
        );
      }
    }
  }

  const bolunmesiGerekenVarMi =
    bolmeNoktalari.some(
      (noktalar) =>
        noktalar.length > 0,
    );

  if (!bolunmesiGerekenVarMi) {
    return false;
  }

  const yeniCizgiler = [];

  for (
    let i = 0;
    i < cizgiler.length;
    i += 1
  ) {
    const cizgi = cizgiler[i];

    const tDegerleri =
      bolmeNoktalari[i];

    if (tDegerleri.length === 0) {
      yeniCizgiler.push(cizgi);
      continue;
    }

    const parcalar =
      cizgiyiParcala(
        cizgi,
        tDegerleri,
      );

    yeniCizgiler.push(
      ...parcalar,
    );
  }

  setCizgiler(yeniCizgiler);

  return true;
}