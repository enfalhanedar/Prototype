/*
 * Bu tolerans altında kalan uç noktalar aynı köşe sayılır ve birleştirilir.
 * 1 dünya birimi = 1cm olduğundan 0.5 birim = 5mm; gerçek/kasıtlı bir
 * köşeyi asla birleştirmeyecek kadar küçük, ama iki bağımsız snap/bölme
 * yolunun aynı köşeyi ufak bir kaymayla iki ayrı nokta gibi üretmesini
 * (duplicate köşe) yutacak kadar büyük.
 */
const KOSE_BIRLESTIRME_TOLERANSI = 0.5;

const MINIMUM_CIZGI_UZUNLUGU = 0.01;
const PARALELLIK_TOLERANSI = 0.001;

/**
 * Birbirine `KOSE_BIRLESTIRME_TOLERANSI` kadar yakın uç noktaları tek bir
 * temsilci noktaya eşler ve çizgilerin uçlarını bu temsilcilere yeniden
 * yazar.
 */
export function koseleriBirlestir(cizgiler) {
  const temsilciler = [];

  function temsilciBul(x, y) {
    for (const temsilci of temsilciler) {
      const mesafe = Math.hypot(
        temsilci.x - x,
        temsilci.y - y,
      );

      if (mesafe < KOSE_BIRLESTIRME_TOLERANSI) {
        return temsilci;
      }
    }

    const yeni = { x, y };
    temsilciler.push(yeni);
    return yeni;
  }

  let degistiMi = false;

  const yeniCizgiler = cizgiler.map((cizgi) => {
    const bas = temsilciBul(cizgi.x1, cizgi.y1);
    const bit = temsilciBul(cizgi.x2, cizgi.y2);

    const ayniMi =
      bas.x === cizgi.x1 &&
      bas.y === cizgi.y1 &&
      bit.x === cizgi.x2 &&
      bit.y === cizgi.y2;

    if (ayniMi) {
      return cizgi;
    }

    degistiMi = true;

    return {
      ...cizgi,
      x1: bas.x,
      y1: bas.y,
      x2: bit.x,
      y2: bit.y,
    };
  });

  return {
    cizgiler: yeniCizgiler,
    degistiMi,
  };
}

function cizgiUzunlugu(cizgi) {
  return Math.hypot(
    cizgi.x2 - cizgi.x1,
    cizgi.y2 - cizgi.y1,
  );
}

/**
 * İki çizginin aynı doğru üzerinde (collinear) olup olmadığını kontrol
 * eder. `a` sıfır uzunluklu olamaz (çağıran taraf garanti eder).
 */
function collinearMi(a, b) {
  const dax = a.x2 - a.x1;
  const day = a.y2 - a.y1;
  const dbx = b.x2 - b.x1;
  const dby = b.y2 - b.y1;

  const yonCarpimi = dax * dby - day * dbx;

  if (Math.abs(yonCarpimi) > PARALELLIK_TOLERANSI) {
    return false;
  }

  const noktayaCarpim =
    (b.x1 - a.x1) * day -
    (b.y1 - a.y1) * dax;

  return (
    Math.abs(noktayaCarpim) / cizgiUzunlugu(a) <
    PARALELLIK_TOLERANSI
  );
}

/**
 * Çizgileri, aynı doğru (collinear) üzerinde olanlar aynı grupta olacak
 * şekilde gruplar. Her çizgi, referans doğrusuyla collinear olan ilk
 * gruba eklenir; uymazsa kendi grubunu açar.
 */
function collinearGruplaraAyir(cizgiler) {
  const gruplar = [];

  for (const cizgi of cizgiler) {
    const grup = gruplar.find((aday) =>
      collinearMi(aday.referans, cizgi),
    );

    if (grup) {
      grup.uyeler.push(cizgi);
    } else {
      gruplar.push({ referans: cizgi, uyeler: [cizgi] });
    }
  }

  return gruplar;
}

/**
 * Bir collinear grubun üyelerini, gerçek mesafe cinsinden [min, max]
 * aralıklarına birleştirir. İki aralık sadece ölçülebilir bir uzunlukla
 * (>`MINIMUM_CIZGI_UZUNLUGU`) örtüşüyorsa birleştirilir; sadece uç
 * noktada değen (örtüşme ~0) aralıklar ayrı kalır — bu, T-birleşimi
 * için bilinçli olarak bölünmüş bitişik parçaların köşesini korur.
 */
function araliklariBirlestir(uyeler, ux, uy, ox, oy) {
  const araliklar = uyeler
    .map((cizgi) => {
      const t1 = (cizgi.x1 - ox) * ux + (cizgi.y1 - oy) * uy;
      const t2 = (cizgi.x2 - ox) * ux + (cizgi.y2 - oy) * uy;

      return {
        min: Math.min(t1, t2),
        max: Math.max(t1, t2),
        ornek: cizgi,
        birlestiMi: false,
      };
    })
    .sort((a, b) => a.min - b.min);

  const sonuc = [];

  for (const aralik of araliklar) {
    const mevcut = sonuc[sonuc.length - 1];

    if (
      mevcut &&
      aralik.min < mevcut.max - MINIMUM_CIZGI_UZUNLUGU
    ) {
      mevcut.max = Math.max(mevcut.max, aralik.max);
      mevcut.birlestiMi = true;
    } else {
      sonuc.push(aralik);
    }
  }

  return sonuc;
}

/**
 * Sıfır uzunluklu çizgileri eler; aynı doğru üzerinde gerçekten (sadece
 * bir noktada değmenin ötesinde) örtüşen çizgileri, kapladıkları
 * aralığın birleşimini temsil eden tek bir çizgide toplar.
 *
 * Bu, tam yinelenen (aynı iki uç) ve tam kapsanan (biri ötekinin
 * gövdesi içinde) durumları da otomatik olarak kapsar — ikisi de
 * "aralıkların örtüştüğü" durumun özel halleridir. Çapraz kesişimler
 * zaten `kesisimleriKoseyeDonustur` tarafından ayrıca bölünüyor.
 */
export function ortusenKenarlariBirlestir(cizgiler) {
  const kalan = cizgiler.filter(
    (cizgi) =>
      cizgiUzunlugu(cizgi) >= MINIMUM_CIZGI_UZUNLUGU,
  );

  let degistiMi = kalan.length !== cizgiler.length;

  const gruplar = collinearGruplaraAyir(kalan);
  const sonucCizgiler = [];

  for (const grup of gruplar) {
    if (grup.uyeler.length === 1) {
      sonucCizgiler.push(grup.uyeler[0]);
      continue;
    }

    const ref = grup.referans;
    const uzunluk = cizgiUzunlugu(ref);
    const ux = (ref.x2 - ref.x1) / uzunluk;
    const uy = (ref.y2 - ref.y1) / uzunluk;

    const birlesmisAraliklar = araliklariBirlestir(
      grup.uyeler,
      ux,
      uy,
      ref.x1,
      ref.y1,
    );

    for (const aralik of birlesmisAraliklar) {
      if (aralik.birlestiMi) {
        degistiMi = true;
      }

      sonucCizgiler.push({
        ...aralik.ornek,
        x1: ref.x1 + ux * aralik.min,
        y1: ref.y1 + uy * aralik.min,
        x2: ref.x1 + ux * aralik.max,
        y2: ref.y1 + uy * aralik.max,
      });
    }
  }

  return {
    cizgiler: sonucCizgiler,
    degistiMi,
  };
}
