import {
  cizgiler,
  aktifMod,
  seciliGrupId,
  setCizgiler,
  setSeciliGrupId,
} from "./state.js";

import {
  canvas,
  stage,
  viewport,
} from "./stage.js";

import {
  cizgiUzerindeEnYakinNokta,
  hesaplaGrupTasimaSnap,
} from "./snap.js";

import {
  sahnedenDunyaya,
  dunyadanSahneye,
} from "./camera.js";

import { gecmiseKaydet } from "./history.js";
import { odalariYenidenHesapla } from "./rooms.js";
import { ekraniGuncelle } from "./render.js";

// Seçim mesafesi ekran pikseli cinsindendir.
// Zoom yapılsa bile çizgiye tıklama kolaylığı yaklaşık aynı kalır.
const SECIM_EKRAN_MESAFESI = 12;

// Canvas üzerinde gösterilen seçili nesne silme butonu
const silButonu =
  document.getElementById("btnDeleteSelected");

const canvasWrapper =
  document.getElementById("canvasWrapper");

let suruklemeAktif = false;
let hareketGerceklesti = false;
let gecmiseKaydedildi = false;

let suruklemeBaslangicX = 0;
let suruklemeBaslangicY = 0;

let orijinalTumCizgiler = [];
let orijinalGrupCizgileri = [];

/**
 * Bir çizginin hangi gruba ait olduğunu döndürür.
 * Grup kimliği yoksa çizginin kendi kimliğini kullanır.
 */
function grupAnahtariAl(cizgi) {
  return cizgi.groupId ?? cizgi.id;
}

/**
 * Belirtilen grup kimliğine ait bütün çizgileri bulur.
 */
function grupCizgileriniBul(grupId) {
  return cizgiler.filter(
    (cizgi) => grupAnahtariAl(cizgi) === grupId,
  );
}

/**
 * Verilen dünya koordinatına en yakın çizgiyi bulur.
 */
function tiklananCizgiyiBul(x, y) {
  let bulunanCizgi = null;

  // Zoom yapılsa bile seçim alanı ekranda yaklaşık
  // 12 piksel genişliğinde kalsın.
  let enKisaMesafe =
    SECIM_EKRAN_MESAFESI / viewport.scaleX;

  for (const cizgi of cizgiler) {
    const sonuc = cizgiUzerindeEnYakinNokta(
      x,
      y,
      cizgi.x1,
      cizgi.y1,
      cizgi.x2,
      cizgi.y2,
    );

    if (sonuc.mesafe < enKisaMesafe) {
      enKisaMesafe = sonuc.mesafe;
      bulunanCizgi = cizgi;
    }
  }

  return bulunanCizgi;
}

/**
 * Seçimi kaldırır ve silme butonunu gizler.
 */
function secimiTemizle() {
  setSeciliGrupId(null);

  if (silButonu) {
    silButonu.classList.add("hidden");
  }

  ekraniGuncelle();
}

/**
 * Canvas'ın gerçek koordinatını, HTML/CSS üzerindeki
 * konuma dönüştürür.
 *
 * Canvas responsive olarak küçülürse silme butonunun
 * doğru yerde görünmesini sağlar.
 */
function sahneNoktasiniCssNoktasina(stageX, stageY) {
  const canvasRect =
    canvas.getBoundingClientRect();

  const wrapperRect =
    canvasWrapper?.getBoundingClientRect();

  const cssOranX =
    canvasRect.width / canvas.width;

  const cssOranY =
    canvasRect.height / canvas.height;

  return {
    x:
      (canvasRect.left -
        (wrapperRect?.left ?? canvasRect.left)) +
      stageX * cssOranX,

    y:
      (canvasRect.top -
        (wrapperRect?.top ?? canvasRect.top)) +
      stageY * cssOranY,
  };
}

/**
 * Seçili grubun sınırlarını hesaplar.
 */
function grupSinirlariniHesapla(grup) {
  const xDegerleri = [];
  const yDegerleri = [];

  for (const cizgi of grup) {
    xDegerleri.push(cizgi.x1, cizgi.x2);
    yDegerleri.push(cizgi.y1, cizgi.y2);
  }

  return {
    sol: Math.min(...xDegerleri),
    sag: Math.max(...xDegerleri),
    ust: Math.min(...yDegerleri),
    alt: Math.max(...yDegerleri),
  };
}

/**
 * Silme butonunu seçili şeklin sağ üst tarafına taşır.
 */
export function silButonunuKonumlandir() {
  if (
    !silButonu ||
    !canvasWrapper ||
    !seciliGrupId
  ) {
    silButonu?.classList.add("hidden");
    return;
  }

  const grup =
    grupCizgileriniBul(seciliGrupId);

  if (grup.length === 0) {
    silButonu.classList.add("hidden");
    return;
  }

  const sinirlar =
    grupSinirlariniHesapla(grup);

  // Dünya koordinatını EaselJS stage koordinatına çevir
  const sahneNoktasi = dunyadanSahneye(
    sinirlar.sag,
    sinirlar.ust,
  );

  // EaselJS koordinatını CSS koordinatına çevir
  const cssNoktasi =
    sahneNoktasiniCssNoktasina(
      sahneNoktasi.x,
      sahneNoktasi.y,
    );

  const butonGenisligi =
    silButonu.offsetWidth || 36;

  const butonYuksekligi =
    silButonu.offsetHeight || 36;

  const wrapperGenisligi =
    canvasWrapper.clientWidth;

  const wrapperYuksekligi =
    canvasWrapper.clientHeight;

  let left = cssNoktasi.x + 10;
  let top = cssNoktasi.y - butonYuksekligi - 8;

  // Buton wrapper dışına çıkmasın.
  left = Math.max(
    4,
    Math.min(
      left,
      wrapperGenisligi - butonGenisligi - 4,
    ),
  );

  top = Math.max(
    4,
    Math.min(
      top,
      wrapperYuksekligi - butonYuksekligi - 4,
    ),
  );

  silButonu.style.left = `${left}px`;
  silButonu.style.top = `${top}px`;

  silButonu.classList.remove("hidden");

  // Tailwind içinde başlangıçta hidden kullanıldığı için,
  // görünürken flex yapıyoruz.
  silButonu.classList.add("flex");
}

/**
 * Sol tuşa basıldığında seçim veya taşıma işlemini başlatır.
 */
stage.on("stagemousedown", (event) => {
  if (aktifMod !== "SELECT") return;

  // Sadece sol tuş
  if (event.nativeEvent.button !== 0) return;

  const dunyaNoktasi = sahnedenDunyaya(
    event.stageX,
    event.stageY,
  );

  const tiklananCizgi = tiklananCizgiyiBul(
    dunyaNoktasi.x,
    dunyaNoktasi.y,
  );

  // Boş alana tıklanırsa seçimi kaldır.
  if (!tiklananCizgi) {
    secimiTemizle();
    return;
  }

  const grupId =
    grupAnahtariAl(tiklananCizgi);

  if (!grupId) {
    console.warn(
      "Seçilen çizginin id veya groupId değeri bulunamadı.",
      tiklananCizgi,
    );

    return;
  }

  setSeciliGrupId(grupId);

  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  suruklemeBaslangicX =
    dunyaNoktasi.x;

  suruklemeBaslangicY =
    dunyaNoktasi.y;

  // Taşıma sırasında başlangıç durumunu koruyoruz.
  orijinalTumCizgiler =
    structuredClone(cizgiler);

  orijinalGrupCizgileri =
    structuredClone(
      grupCizgileriniBul(grupId),
    );

  canvas.style.cursor = "grabbing";

  ekraniGuncelle();
  silButonunuKonumlandir();
});

/**
 * Sol tuş basılıyken seçilen grubu taşır.
 */
stage.on("stagemousemove", (event) => {
  if (aktifMod !== "SELECT") return;
  if (!suruklemeAktif) return;
  if (!seciliGrupId) return;

  const dunyaNoktasi = sahnedenDunyaya(
    event.stageX,
    event.stageY,
  );

  const hamDx =
    dunyaNoktasi.x -
    suruklemeBaslangicX;

  const hamDy =
    dunyaNoktasi.y -
    suruklemeBaslangicY;

  // Çok küçük mouse hareketlerini sürükleme olarak sayma.
  const ekranHareketi = Math.hypot(
    hamDx * viewport.scaleX,
    hamDy * viewport.scaleY,
  );

  if (ekranHareketi < 2) return;

  hareketGerceklesti = true;

  // Taşıma işlemini geçmişe yalnızca bir kez kaydet.
  if (!gecmiseKaydedildi) {
    gecmiseKaydet(orijinalTumCizgiler);
    gecmiseKaydedildi = true;
  }

  // Taşınan grubun köşe ve kenarlarını diğer
  // şekillere mıknatısla.
  const snapSonucu =
    hesaplaGrupTasimaSnap(
      orijinalGrupCizgileri,
      hamDx,
      hamDy,
      seciliGrupId,
    );

  for (const orijinalCizgi of orijinalGrupCizgileri) {
    const mevcutCizgi = cizgiler.find(
      (cizgi) =>
        cizgi.id === orijinalCizgi.id,
    );

    if (!mevcutCizgi) continue;

    mevcutCizgi.x1 =
      orijinalCizgi.x1 + snapSonucu.dx;

    mevcutCizgi.y1 =
      orijinalCizgi.y1 + snapSonucu.dy;

    mevcutCizgi.x2 =
      orijinalCizgi.x2 + snapSonucu.dx;

    mevcutCizgi.y2 =
      orijinalCizgi.y2 + snapSonucu.dy;
  }

  odalariYenidenHesapla();
  ekraniGuncelle();
  silButonunuKonumlandir();
});

/**
 * Mouse bırakıldığında taşıma işlemini bitirir.
 */
stage.on("stagemouseup", () => {
  if (aktifMod !== "SELECT") return;
  if (!suruklemeAktif) return;

  suruklemeAktif = false;

  canvas.style.cursor = hareketGerceklesti
    ? "default"
    : "pointer";

  silButonunuKonumlandir();
});

/**
 * Mouse canvas dışındayken bırakılırsa da
 * sürükleme durumunu kapat.
 */
window.addEventListener("mouseup", () => {
  if (!suruklemeAktif) return;

  suruklemeAktif = false;
  canvas.style.cursor = "default";

  silButonunuKonumlandir();
});

/**
 * Seçili şeklin yanındaki çöp kutusu butonu.
 */
silButonu?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!seciliGrupId) return;

  const silinecekGrup =
    grupCizgileriniBul(seciliGrupId);

  if (silinecekGrup.length === 0) {
    secimiTemizle();
    return;
  }

  // Silme işleminden önce geçmişe kaydet.
  gecmiseKaydet();

  const kalanCizgiler = cizgiler.filter(
    (cizgi) =>
      grupAnahtariAl(cizgi) !== seciliGrupId,
  );

  setCizgiler(kalanCizgiler);
  setSeciliGrupId(null);

  silButonu.classList.add("hidden");
  silButonu.classList.remove("flex");

  odalariYenidenHesapla();
  ekraniGuncelle();
});

/**
 * Delete veya Backspace tuşuyla seçili şekli sil.
 */
window.addEventListener("keydown", (event) => {
  if (aktifMod !== "SELECT") return;
  if (!seciliGrupId) return;

  const silmeTusu =
    event.key === "Delete" ||
    event.key === "Backspace";

  if (!silmeTusu) return;

  // Input veya textarea içindeyken Backspace normal çalışsın.
  const aktifElement = document.activeElement;

  const metinAlaniAktif =
    aktifElement instanceof HTMLInputElement ||
    aktifElement instanceof HTMLTextAreaElement;

  if (metinAlaniAktif) return;

  event.preventDefault();

  gecmiseKaydet();

  const kalanCizgiler = cizgiler.filter(
    (cizgi) =>
      grupAnahtariAl(cizgi) !== seciliGrupId,
  );

  setCizgiler(kalanCizgiler);
  setSeciliGrupId(null);

  silButonu?.classList.add("hidden");
  silButonu?.classList.remove("flex");

  odalariYenidenHesapla();
  ekraniGuncelle();
});

/**
 * Zoom yapıldığında silme butonunun konumunu yenile.
 *
 * camera.js içindeki wheel listener önce viewport'u
 * değiştirir; ardından bu listener butonu günceller.
 */
canvas.addEventListener("wheel", () => {
  requestAnimationFrame(() => {
    silButonunuKonumlandir();
  });
});

/**
 * Sağ tuşla pan yapılırken silme butonu da
 * seçili şekille birlikte ekranda hareket etsin.
 */
canvas.addEventListener("pointermove", (event) => {
  const sagTusBasili =
    (event.buttons & 2) === 2;

  if (!sagTusBasili) return;

  requestAnimationFrame(() => {
    silButonunuKonumlandir();
  });
});

/**
 * Pencere yeniden boyutlandırıldığında responsive
 * canvas oranı değişebilir. Butonu yeniden konumlandır.
 */
window.addEventListener("resize", () => {
  requestAnimationFrame(() => {
    silButonunuKonumlandir();
  });
});