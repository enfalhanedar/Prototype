import { 
  cizgiler, 
  setSeciliGrupId,
  setSeciliGrupIdleri,
  setHoverKoseNoktasi
} from "./state.js";
import { canvas, viewport } from "./stage.js";
import { hesaplaSnap } from "./snap.js";
import { gecmiseKaydet, dinamikBolmeUygula } from "./history.js";
import { odalariYenidenHesapla } from "./rooms.js";
import { ekraniGuncelle } from "./render.js";
import { silButonunuKonumlandir } from "./interaction-delete-button.js";

let suruklemeAktif = false;
let hareketGerceklesti = false;
let gecmiseKaydedildi = false;

let suruklemeTuru = "GROUP"; 

let suruklemeBaslangicX = 0;
let suruklemeBaslangicY = 0;
let orijinalTumCizgiler = [];
let orijinalTasinanCizgi = null;

// %100 GEOMETRİK KOPMAMAYI GARANTİLEYEN HAFIZA LİSTESİ
let bagliKomsuUclar = []; 

let suruklenenKoseNoktasi = null;
let bagliCizgiReferanslari = [];

export function suruklemeAktifMi() {
  return suruklemeAktif;
}

function tasimayiHazirla(dunyaNoktasi, cizgiId) {
  suruklemeTuru = "GROUP";
  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;

  suruklemeBaslangicX = dunyaNoktasi.x;
  suruklemeBaslangicY = dunyaNoktasi.y;

  orijinalTumCizgiler = structuredClone(cizgiler);
  
  const hedefCizgi = cizgiler.find(c => c.id === cizgiId);
  if (!hedefCizgi) return;

  orijinalTasinanCizgi = structuredClone(hedefCizgi);

  // KOPMAYI ÖNLEYEN GEOMETRİK ANALİZ:
  bagliKomsuUclar = [];
  const TOLERANS = 1e-2;

  cizgiler.forEach(mevcut => {
    if (mevcut.id === cizgiId) return; // Kendisini komşu algılama

    // Dışarıdaki komşu çizginin v1 (x1, y1) ucu taşınan çizginin uçlarından birine mi yapışık?
    if (Math.hypot(mevcut.x1 - hedefCizgi.x1, mevcut.y1 - hedefCizgi.y1) < TOLERANS) 
      bagliKomsuUclar.push({ cizgiId: mevcut.id, uc: "v1", hedefUc: "v1" });
    if (Math.hypot(mevcut.x1 - hedefCizgi.x2, mevcut.y1 - hedefCizgi.y2) < TOLERANS) 
      bagliKomsuUclar.push({ cizgiId: mevcut.id, uc: "v1", hedefUc: "v2" });
    
    // Dışarıdaki komşu çizginin v2 (x2, y2) ucu taşınan çizginin uçlarından birine mi yapışık?
    if (Math.hypot(mevcut.x2 - hedefCizgi.x1, mevcut.y2 - hedefCizgi.y1) < TOLERANS) 
      bagliKomsuUclar.push({ cizgiId: mevcut.id, uc: "v2",  hedefUc: "v1" });
    if (Math.hypot(mevcut.x2 - hedefCizgi.x2, mevcut.y2 - hedefCizgi.y2) < TOLERANS) 
      bagliKomsuUclar.push({ cizgiId: mevcut.id, uc: "v2",  hedefUc: "v2" });
  });

  canvas.style.cursor = "grabbing";
  ekraniGuncelle();
  silButonunuKonumlandir();
}

export function grupSecVeSuruklemeyeHazirla(grupId, dunyaNoktasi) {
  tasimayiHazirla(dunyaNoktasi, grupId);
}

export function tekilCizgiSecVeSuruklemeyeHazirla(cizgi, dunyaNoktasi) {
  setSeciliGrupId(null);
  setSeciliGrupIdleri([cizgi.id]);
  tasimayiHazirla(dunyaNoktasi, cizgi.id);
}

export function koseSuruklemeyeHazirla(koseNoktasi) {
  suruklemeTuru = "CORNER";
  suruklemeAktif = true;
  hareketGerceklesti = false;
  gecmiseKaydedildi = false;
  
  suruklenenKoseNoktasi = { ...koseNoktasi };
  orijinalTumCizgiler = structuredClone(cizgiler);
  bagliCizgiReferanslari = [];

  const TOLERANS = 1e-3;
  cizgiler.forEach((cizgi) => {
    if (Math.hypot(cizgi.x1 - koseNoktasi.x, cizgi.y1 - koseNoktasi.y) < TOLERANS) {
      bagliCizgiReferanslari.push({ id: cizgi.id, uc: "v1" });
    }
    if (Math.hypot(cizgi.x2 - koseNoktasi.x, cizgi.y2 - koseNoktasi.y) < TOLERANS) {
      bagliCizgiReferanslari.push({ id: cizgi.id, uc: "v2" });
    }
  });

  canvas.style.cursor = "grabbing";
  ekraniGuncelle();
}

export function suruklemeyiTasi(dunyaNoktasi) {
  if (!suruklemeAktif) return;

  if (!gecmiseKaydedildi) {
    gecmiseKaydet(orijinalTumCizgiler);
    gecmiseKaydedildi = true;
  }

  hareketGerceklesti = true;

  if (suruklemeTuru === "GROUP") {
    if (!orijinalTasinanCizgi) return;

    const hamDx = dunyaNoktasi.x - suruklemeBaslangicX;
    const hamDy = dunyaNoktasi.y - suruklemeBaslangicY;

    const guncelCizgi = cizgiler.find((c) => c.id === orijinalTasinanCizgi.id);
    if (!guncelCizgi) return;

    // Fırlama hatasını çözen kararlı tekil snap hesaplaması
    const hamX = orijinalTasinanCizgi.x1 + hamDx;
    const hamY = orijinalTasinanCizgi.y1 + hamDy;
    const snapSonucu = hesaplaSnap(hamX, hamY);
    
    const dx = snapSonucu.x - orijinalTasinanCizgi.x1;
    const dy = snapSonucu.y - orijinalTasinanCizgi.y1;

    // 1. Seçilen tekil çizgiyi paralel kaydır
    guncelCizgi.x1 = orijinalTasinanCizgi.x1 + dx;
    guncelCizgi.y1 = orijinalTasinanCizgi.y1 + dy;
    guncelCizgi.x2 = orijinalTasinanCizgi.x2 + dx;
    guncelCizgi.y2 = orijinalTasinanCizgi.y2 + dy;

    // 2. KESİNLİKLE KOPMAMA KONTROLÜ
    bagliKomsuUclar.forEach(b => {
      const komsuCizgi = cizgiler.find(c => c.id === b.cizgiId);
      if (!komsuCizgi) return;

      const yeniX = b.hedefUc === "v1" ? guncelCizgi.x1 : guncelCizgi.x2;
      const yeniY = b.hedefUc === "v1" ? guncelCizgi.y1 : guncelCizgi.y2;

      if (b.uc === "v1") {
        komsuCizgi.x1 = yeniX;
        komsuCizgi.y1 = yeniY;
      } else {
        komsuCizgi.x2 = yeniX;
        komsuCizgi.y2 = yeniY;
      }
    });

  } 
  else if (suruklemeTuru === "CORNER") {
    if (bagliCizgiReferanslari.length === 0) return;

    const snapSonucu = hesaplaSnap(dunyaNoktasi.x, dunyaNoktasi.y);
    setHoverKoseNoktasi({ x: snapSonucu.x, y: snapSonucu.y });

    bagliCizgiReferanslari.forEach((ref) => {
      const mevcutCizgi = cizgiler.find((c) => c.id === ref.id);
      if (!mevcutCizgi) return;

      if (ref.uc === "v1") {
        mevcutCizgi.x1 = snapSonucu.x;
        mevcutCizgi.y1 = snapSonucu.y;
      } else {
        mevcutCizgi.x2 = snapSonucu.x;
        mevcutCizgi.y2 = snapSonucu.y;
      }
    });
  }

  odalariYenidenHesapla();
  ekraniGuncelle();
  silButonunuKonumlandir();
}

export function suruklemeyiBitir() {
  if (!suruklemeAktif) return;

  suruklemeAktif = false;
  canvas.style.cursor = hareketGerceklesti ? "default" : "pointer";

  suruklenenKoseNoktasi = null;
  orijinalTasinanCizgi = null;
  bagliCizgiReferanslari = [];
  bagliKomsuUclar = []; 
  setHoverKoseNoktasi(null);

  if (hareketGerceklesti) {
    dinamikBolmeUygula();
  }

  odalariYenidenHesapla();
  ekraniGuncelle();
  silButonunuKonumlandir();
}