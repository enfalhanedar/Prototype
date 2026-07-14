import {
  cizgiler,
  odalar,
  aktifMod,
  seciliGrupId,
  seciliGrupIdleri,
  setCizgiler,
  setSeciliGrupId,
  setSeciliGrupIdleri,
} from "./state.js";



let kutuSecimiAktif = false;
let kutuSecimBaslangici = null;


import {
  noktaPoligonIcinde,
  poligonSinirlari,
  kutularKesisiyorMu,
} from "./geometry.js";

import {
  canvas,
  stage,
  viewport,
  secimKatmani,
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
let orijinalSuruklenenGrupIdleri = [];

function aktifSeciliGrupIdleri() {
  if (seciliGrupIdleri.length > 0) {
    return seciliGrupIdleri;
  }

  if (seciliGrupId) {
    return [seciliGrupId];
  }

  return [];
}

function suruklemeyiBaslat(dunyaNoktasi, grupIdleri) {
  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  suruklemeBaslangicX = dunyaNoktasi.x;
  suruklemeBaslangicY = dunyaNoktasi.y;

  orijinalTumCizgiler = structuredClone(cizgiler);
  orijinalSuruklenenGrupIdleri = [...grupIdleri];
  orijinalGrupCizgileri = structuredClone(
    grupIdleri.flatMap((grupId) =>
      grupCizgileriniBul(grupId),
    ),
  );

  canvas.style.cursor = "grabbing";

  ekraniGuncelle();
  silButonunuKonumlandir();
}

function grupSecVeSuruklemeyeHazirla(grupId, dunyaNoktasi) {
  const mevcutSecim = aktifSeciliGrupIdleri();

  if (
    mevcutSecim.includes(grupId) &&
    mevcutSecim.length > 1
  ) {
    suruklemeyiBaslat(dunyaNoktasi, mevcutSecim);
    return;
  }

  setSeciliGrupId(grupId);
  suruklemeyiBaslat(dunyaNoktasi, [grupId]);
}

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
export function secimiTemizle() {
  setSeciliGrupId(null);
  setSeciliGrupIdleri([]);

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

 const grupIdleri = aktifSeciliGrupIdleri();

  if (
    !silButonu ||
    !canvasWrapper ||
    grupIdleri.length === 0
  ) {
    silButonu?.classList.add("hidden");
    return;
  }

  const grup = grupIdleri.flatMap(
    (grupId) => grupCizgileriniBul(grupId),
  );

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

function tiklananOdayiBul(x, y) {
  const bulunanOdalar = odalar
    .filter((oda) =>
      noktaPoligonIcinde(
        x,
        y,
        oda.noktalar,
      ),
    )
    .sort((a, b) => a.alan - b.alan);

  return bulunanOdalar[0] ?? null;
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
 * Sol tuşa basıldığında seçim veya taşıma işlemini başlatır.
 */
stage.on("stagemousedown", (event) => {
  if (aktifMod !== "SELECT") return;
  if (event.nativeEvent.button !== 0) return;

  const dunyaNoktasi = sahnedenDunyaya(
    event.stageX,
    event.stageY,
  );

  const tiklananCizgi = tiklananCizgiyiBul(
    dunyaNoktasi.x,
    dunyaNoktasi.y,
  );

  const tiklananOda = tiklananOdayiBul(
    dunyaNoktasi.x,
    dunyaNoktasi.y,
  );

  // 1) Çizgiye tıklandı → seç + sürüklemeye hazırla
  if (tiklananCizgi) {
    const grupId = grupAnahtariAl(tiklananCizgi);

    if (!grupId) {
      console.warn(
        "Seçilen çizginin id veya groupId değeri bulunamadı.",
        tiklananCizgi,
      );
      return;
    }

    grupSecVeSuruklemeyeHazirla(
      grupId,
      dunyaNoktasi,
    );
    return;
  }

  // 2) Odaya tıklandı → o grubu seç ve taşımaya hazırla
  if (tiklananOda) {
    grupSecVeSuruklemeyeHazirla(
      tiklananOda.groupId,
      dunyaNoktasi,
    );
    return;
  }

  // 3) Boş alana tıklandı → kutu seçimi başlat
  kutuSecimiAktif = true;
  kutuSecimBaslangici = {
    x: dunyaNoktasi.x,
    y: dunyaNoktasi.y,
  };

  setSeciliGrupIdleri([]);
  setSeciliGrupId(null);

  silButonu?.classList.add("hidden");
});

/**
 * Sol tuş basılıyken seçilen grubu taşır.
 */
stage.on("stagemousemove", (event) => {
  if (aktifMod !== "SELECT") return;
  // Kutu seçimi sürükleniyorsa kutuyu çiz
  if (kutuSecimiAktif && kutuSecimBaslangici) {
    const dunyaNoktasi = sahnedenDunyaya(
      event.stageX,
      event.stageY,
    );
    secimKutusunuCiz(
      kutuSecimBaslangici,
      dunyaNoktasi,
    );
    return;
  }
  if (!suruklemeAktif) return;
  if (orijinalGrupCizgileri.length === 0) return;

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
      orijinalSuruklenenGrupIdleri,
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
stage.on("stagemouseup", (event) => {

  if (kutuSecimiAktif && kutuSecimBaslangici) {
    const dunyaNoktasi = sahnedenDunyaya(
      event.stageX,
      event.stageY,
    );

    const bulunanGruplar = secimKutusundakiGruplariBul(
      kutuSecimBaslangici,
      dunyaNoktasi,
    );

    setSeciliGrupIdleri(bulunanGruplar);

    if (bulunanGruplar.length === 1) {
      setSeciliGrupId(bulunanGruplar[0]);
    } else {
      setSeciliGrupId(null);  // ← buna dikkat, aşağıdaki 6. maddeye bak
    }

    kutuSecimiAktif = false;
    kutuSecimBaslangici = null;

    secimKatmani.graphics.clear();

    ekraniGuncelle();
    stage.update();
    silButonunuKonumlandir();

    return;
  }

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

  const silinecekGrupIdleri = aktifSeciliGrupIdleri();

  if (silinecekGrupIdleri.length === 0) return;

  // Silme işleminden önce geçmişe kaydet.
  gecmiseKaydet();

  const kalanCizgiler = cizgiler.filter(
    (cizgi) =>
      !silinecekGrupIdleri.includes(grupAnahtariAl(cizgi)),
  );

  setCizgiler(kalanCizgiler);
  setSeciliGrupId(null);
  setSeciliGrupIdleri([]);

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

  const silinecekGrupIdleri = aktifSeciliGrupIdleri();

  if (silinecekGrupIdleri.length === 0) return;

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
      !silinecekGrupIdleri.includes(grupAnahtariAl(cizgi)),
  );

  setCizgiler(kalanCizgiler);
  setSeciliGrupId(null);
  setSeciliGrupIdleri([]);

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

function grupSinirlariniBul(groupId) {
  const grup = cizgiler.filter(
    (cizgi) =>
      (cizgi.groupId ?? cizgi.id) === groupId,
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
    const grupKutusu =
      grupSinirlariniBul(groupId);

    return (
      grupKutusu &&
      kutularKesisiyorMu(
        secimKutusu,
        grupKutusu,
      )
    );
  });
}