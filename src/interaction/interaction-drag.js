import {
  cizgiler,
  setSeciliGrupId,
  setSeciliGrupIdleri,
  setHoverKoseNoktasi
} from "../core/state.js";
import { canvas,odaKatmani, } from "../core/stage.js";
import { hesaplaSnap } from "../geometry/snap.js";
import { gecmiseKaydet,  } from "../drawing/history.js";
import { odalariYenidenHesapla } from "../drawing/rooms.js";
import { ekraniGuncelle } from "../drawing/render.js";
import { silButonunuKonumlandir } from "./interaction-delete-button.js";


import {
  kesisimleriKoseyeDonustur,
} from "../drawing/intersections.js";


const BAGLANTI_TOLERANSI = 0.01;
const KOSE_TOLERANSI = 0.001;

let suruklemeAktif = false;
let hareketGerceklesti = false;
let gecmiseKaydedildi = false;

let suruklemeTuru = "GROUP";

let suruklemeBaslangicX = 0;
let suruklemeBaslangicY = 0;

let orijinalTumCizgiler = [];
let orijinalTasinanCizgi = null;

/*
 * Taşınan çizginin uçlarına bağlı olan
 * komşu çizgi uçlarını tutar.
 */
let bagliKomsuUclar = [];

/*
 * Köşe sürüklenirken aynı koordinattaki
 * bütün çizgi uçlarını tutar.
 */
let bagliCizgiReferanslari = [];


/**
 * Dışarıdan sürüklemenin aktif olup olmadığını öğrenmek için.
 */
export function suruklemeAktifMi() {
  return suruklemeAktif;
}


/**
 * Bir çizginin uçlarına bağlı komşu çizgi uçlarını bulur.
 */
function bagliKomsuUclariBul(hedefCizgi) {
  const bulunanBaglantilar = [];

  for (const mevcutCizgi of cizgiler) {
    if (mevcutCizgi.id === hedefCizgi.id) {
      continue;
    }

    const mevcutV1HedefV1 =
      Math.hypot(
        mevcutCizgi.x1 - hedefCizgi.x1,
        mevcutCizgi.y1 - hedefCizgi.y1,
      ) < BAGLANTI_TOLERANSI;

    const mevcutV1HedefV2 =
      Math.hypot(
        mevcutCizgi.x1 - hedefCizgi.x2,
        mevcutCizgi.y1 - hedefCizgi.y2,
      ) < BAGLANTI_TOLERANSI;

    const mevcutV2HedefV1 =
      Math.hypot(
        mevcutCizgi.x2 - hedefCizgi.x1,
        mevcutCizgi.y2 - hedefCizgi.y1,
      ) < BAGLANTI_TOLERANSI;

    const mevcutV2HedefV2 =
      Math.hypot(
        mevcutCizgi.x2 - hedefCizgi.x2,
        mevcutCizgi.y2 - hedefCizgi.y2,
      ) < BAGLANTI_TOLERANSI;

    if (mevcutV1HedefV1) {
      bulunanBaglantilar.push({
        cizgiId: mevcutCizgi.id,
        uc: "v1",
        hedefUc: "v1",
      });
    }

    if (mevcutV1HedefV2) {
      bulunanBaglantilar.push({
        cizgiId: mevcutCizgi.id,
        uc: "v1",
        hedefUc: "v2",
      });
    }

    if (mevcutV2HedefV1) {
      bulunanBaglantilar.push({
        cizgiId: mevcutCizgi.id,
        uc: "v2",
        hedefUc: "v1",
      });
    }

    if (mevcutV2HedefV2) {
      bulunanBaglantilar.push({
        cizgiId: mevcutCizgi.id,
        uc: "v2",
        hedefUc: "v2",
      });
    }
  }

  return bulunanBaglantilar;
}


/**
 * Belirli bir köşeye bağlı bütün çizgi uçlarını bulur.
 */
function koseyeBagliUclariBul(koseNoktasi) {
  const bulunanReferanslar = [];

  for (const cizgi of cizgiler) {
    const birinciUcBagliMi =
      Math.hypot(
        cizgi.x1 - koseNoktasi.x,
        cizgi.y1 - koseNoktasi.y,
      ) < KOSE_TOLERANSI;

    const ikinciUcBagliMi =
      Math.hypot(
        cizgi.x2 - koseNoktasi.x,
        cizgi.y2 - koseNoktasi.y,
      ) < KOSE_TOLERANSI;

    if (birinciUcBagliMi) {
      bulunanReferanslar.push({
        id: cizgi.id,
        uc: "v1",
      });
    }

    if (ikinciUcBagliMi) {
      bulunanReferanslar.push({
        id: cizgi.id,
        uc: "v2",
      });
    }
  }

  return bulunanReferanslar;
}


/**
 * Çizgi gövdesini sürüklemeye hazırlar.
 */
function tasimayiHazirla(dunyaNoktasi, cizgiId) {
  const hedefCizgi = cizgiler.find(
    (cizgi) => cizgi.id === cizgiId,
  );

  if (!hedefCizgi) {
    suruklemeAktif = false;
    return;
  }

  suruklemeTuru = "GROUP";
  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  suruklemeBaslangicX = dunyaNoktasi.x;
  suruklemeBaslangicY = dunyaNoktasi.y;

  orijinalTumCizgiler =
    structuredClone(cizgiler);

  orijinalTasinanCizgi =
    structuredClone(hedefCizgi);

  bagliKomsuUclar =
    bagliKomsuUclariBul(hedefCizgi);

  /*
   * Sürükleme boyunca eski oda dolgularının
   * yanlış yerde görünmesini engeller.
   */
  odaKatmani.visible = false;

  canvas.style.cursor = "grabbing";

  ekraniGuncelle();
  silButonunuKonumlandir();
}


/**
 * Seçilen çizgiyi sürüklemeye hazırlar.
 *
 * Buradaki ilk parametrenin gerçek çizgi ID'si olması gerekir.
 */
export function grupSecVeSuruklemeyeHazirla(
  cizgiId,
  dunyaNoktasi,
) {
  tasimayiHazirla(
    dunyaNoktasi,
    cizgiId,
  );
}


/**
 * Tek bir çizgiyi seçip sürüklemeye hazırlar.
 */
export function tekilCizgiSecVeSuruklemeyeHazirla(
  cizgi,
  dunyaNoktasi,
) {
  setSeciliGrupId(null);
  setSeciliGrupIdleri([cizgi.id]);

  tasimayiHazirla(
    dunyaNoktasi,
    cizgi.id,
  );
}


/**
 * Bir köşeyi sürüklemeye hazırlar.
 */
export function koseSuruklemeyeHazirla(
  koseNoktasi,
) {
  const bulunanUclar =
    koseyeBagliUclariBul(koseNoktasi);

  if (bulunanUclar.length === 0) {
    return;
  }

  suruklemeTuru = "CORNER";
  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  orijinalTumCizgiler =
    structuredClone(cizgiler);

  bagliCizgiReferanslari =
    bulunanUclar;

  odaKatmani.visible = false;
  canvas.style.cursor = "grabbing";

  ekraniGuncelle();
}


/**
 * Taşınan çizgiye bağlı komşu uçları yeni konuma taşır.
 */
function bagliKomsuUclariGuncelle(
  guncelCizgi,
) {
  for (const baglanti of bagliKomsuUclar) {
    const komsuCizgi = cizgiler.find(
      (cizgi) =>
        cizgi.id === baglanti.cizgiId,
    );

    if (!komsuCizgi) {
      continue;
    }

    const yeniX =
      baglanti.hedefUc === "v1"
        ? guncelCizgi.x1
        : guncelCizgi.x2;

    const yeniY =
      baglanti.hedefUc === "v1"
        ? guncelCizgi.y1
        : guncelCizgi.y2;

    if (baglanti.uc === "v1") {
      komsuCizgi.x1 = yeniX;
      komsuCizgi.y1 = yeniY;
    } else {
      komsuCizgi.x2 = yeniX;
      komsuCizgi.y2 = yeniY;
    }
  }
}


/**
 * Seçilen çizgiyi paralel taşır.
 */
function cizgiyiTasi(dunyaNoktasi) {
  if (!orijinalTasinanCizgi) {
    return;
  }

  const guncelCizgi = cizgiler.find(
    (cizgi) =>
      cizgi.id === orijinalTasinanCizgi.id,
  );

  if (!guncelCizgi) {
    return;
  }

  const hamDx =
    dunyaNoktasi.x -
    suruklemeBaslangicX;

  const hamDy =
    dunyaNoktasi.y -
    suruklemeBaslangicY;

  const hamX =
    orijinalTasinanCizgi.x1 +
    hamDx;

  const hamY =
    orijinalTasinanCizgi.y1 +
    hamDy;

  const snapSonucu =
    hesaplaSnap(hamX, hamY);

  const dx =
    snapSonucu.x -
    orijinalTasinanCizgi.x1;

  const dy =
    snapSonucu.y -
    orijinalTasinanCizgi.y1;

  guncelCizgi.x1 =
    orijinalTasinanCizgi.x1 + dx;

  guncelCizgi.y1 =
    orijinalTasinanCizgi.y1 + dy;

  guncelCizgi.x2 =
    orijinalTasinanCizgi.x2 + dx;

  guncelCizgi.y2 =
    orijinalTasinanCizgi.y2 + dy;

  bagliKomsuUclariGuncelle(
    guncelCizgi,
  );
}


/**
 * Seçilen köşeye bağlı bütün çizgi uçlarını taşır.
 */
function koseyiTasi(dunyaNoktasi) {
  if (bagliCizgiReferanslari.length === 0) {
    return;
  }

  const snapSonucu =
    hesaplaSnap(
      dunyaNoktasi.x,
      dunyaNoktasi.y,
    );

  setHoverKoseNoktasi({
    x: snapSonucu.x,
    y: snapSonucu.y,
  });

  for (
    const referans
    of bagliCizgiReferanslari
  ) {
    const mevcutCizgi = cizgiler.find(
      (cizgi) =>
        cizgi.id === referans.id,
    );

    if (!mevcutCizgi) {
      continue;
    }

    if (referans.uc === "v1") {
      mevcutCizgi.x1 = snapSonucu.x;
      mevcutCizgi.y1 = snapSonucu.y;
    } else {
      mevcutCizgi.x2 = snapSonucu.x;
      mevcutCizgi.y2 = snapSonucu.y;
    }
  }
}


/**
 * Mouse hareket ettikçe sürüklemeyi günceller.
 */
export function suruklemeyiTasi(
  dunyaNoktasi,
) {
  if (!suruklemeAktif) {
    return;
  }

  /*
   * History yalnızca ilk gerçek harekette kaydedilir.
   */
  if (!gecmiseKaydedildi) {
    gecmiseKaydet(
      orijinalTumCizgiler,
    );

    gecmiseKaydedildi = true;
  }

  hareketGerceklesti = true;

  if (suruklemeTuru === "GROUP") {
    cizgiyiTasi(dunyaNoktasi);
  } else if (
    suruklemeTuru === "CORNER"
  ) {
    koseyiTasi(dunyaNoktasi);
  }

  /*
   * Sürükleme sırasında oda hesaplama.
   *
   * Oda katmanı zaten gizli. Bu sayede hem performans
   * artar hem odalar yanıp sönmez.
   */
  ekraniGuncelle();
  silButonunuKonumlandir();
}


/**
 * Sürükleme işlemini tamamlar.
 */
export function suruklemeyiBitir() {
  if (!suruklemeAktif) {
    return;
  }

  suruklemeAktif = false;

  canvas.style.cursor =
    hareketGerceklesti
      ? "default"
      : "pointer";

  if (hareketGerceklesti) {
    /*
     * Önce taşıma sonucunda oluşan bütün kesişimleri bulur.
     *
     * Kesişen çizgiler kesişim noktasından bölünür ve
     * kesişim gerçek bir çizgi ucu/köşe hâline gelir.
     */
    kesisimleriKoseyeDonustur();
  }

  /*
   * Çizgiler bölündükten sonra odaları hesaplamak gerekir.
   */
  odalariYenidenHesapla();

  /*
   * Oda hesabı bittikten sonra oda katmanını tekrar göster.
   */
  odaKatmani.visible = true;

  /*
   * Geçici sürükleme verilerini temizle.
   */
  orijinalTasinanCizgi = null;
  orijinalTumCizgiler = [];

  bagliCizgiReferanslari = [];
  bagliKomsuUclar = [];

  setHoverKoseNoktasi(null);

  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  ekraniGuncelle();
  silButonunuKonumlandir();
}