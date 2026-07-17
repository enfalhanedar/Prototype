import {
  cizgiler,
  undoStack,
  redoStack,
  setCizgiler,
  setRedoStack,
  setMevcutCizim,
  setSeciliGrupId,
  setSeciliGrupIdleri,
  setAktifCizimGrupId,
} from "./state.js";

import { odalariYenidenHesapla } from "./rooms.js";
import { ekraniGuncelle } from "./render.js";
import { onizlemeKatmani } from "./stage.js";

export function gecmiseKaydet(durum = cizgiler) {
  undoStack.push(JSON.stringify(durum));
  setRedoStack([]);
}

/**
 * Yardımcı Fonksiyon: Bir noktanın, verilen çizginin gövdesi üzerinde olup olmadığını kontrol eder.
 */
function noktaCizgiUzerindeMi(px, py, cizgi) {
  const TOLERANS = 1.0;        // Çizginin üstünde sayılması için piksel toleransı
  const KOSE_TOLERANSI = 2.0;  // Köşelere yakınlık toleransı (köşeleri bölmemek için)

  const dStart = Math.hypot(cizgi.x1 - px, cizgi.y1 - py);
  const dEnd = Math.hypot(cizgi.x2 - px, cizgi.y2 - py);

  if (dStart < KOSE_TOLERANSI || dEnd < KOSE_TOLERANSI) {
    return false;
  }

  const dLine = Math.hypot(cizgi.x2 - cizgi.x1, cizgi.y2 - cizgi.y1);
  const dSum = dStart + dEnd;

  return Math.abs(dSum - dLine) < TOLERANS;
}

/**
 * Mevcut tüm çizgileri tarar, uçları başka bir çizginin gövdesine binenleri tespit edip böler.
 * Bu fonksiyonu hem yeni çizgi eklenirken hem de sürükleme bittiğinde çağıracağız.
 */
export function dinamikBolmeUygula() {
  let aktifCizgiler = [...cizgiler];
  const bolunmusCizgiler = [];
  const silinecekCizgiIdleri = new Set();
  let degisiklikVarMi = false;

  // Çizgilerin uç noktalarını kontrol et
  for (let t = 0; t < cizgiler.length; t++) {
    const tarayanCizgi = cizgiler[t];
    const uclar = [
      { x: tarayanCizgi.x1, y: tarayanCizgi.y1 },
      { x: tarayanCizgi.x2, y: tarayanCizgi.y2 }
    ];

    uclar.forEach((uc) => {
      for (let i = 0; i < aktifCizgiler.length; i++) {
        const mevcut = aktifCizgiler[i];

        // Kendisini veya zaten silinmiş bir çizgiyi bölmesin
        if (mevcut.id === tarayanCizgi.id || silinecekCizgiIdleri.has(mevcut.id)) {
          continue;
        }

        if (noktaCizgiUzerindeMi(uc.x, uc.y, mevcut)) {
          silinecekCizgiIdleri.add(mevcut.id);
          degisiklikVarMi = true;

          const parca1 = {
            id: crypto.randomUUID(),
            groupId: mevcut.groupId, // Orijinal grubunu koru ki oda bozulmasın
            x1: mevcut.x1,
            y1: mevcut.y1,
            x2: uc.x,
            y2: uc.y
          };

          const parca2 = {
            id: crypto.randomUUID(),
            groupId: mevcut.groupId,
            x1: uc.x,
            y1: uc.y,
            x2: mevcut.x2,
            y2: mevcut.y2
          };

          bolunmusCizgiler.push(parca1, parca2);
          
          // Aktif listeyi anlık güncelliyoruz
          aktifCizgiler = aktifCizgiler.filter(c => c.id !== mevcut.id);
          aktifCizgiler.push(parca1, parca2);
          break; 
        }
      }
    });
  }

  if (degisiklikVarMi) {
    const kalanCizgiler = cizgiler.filter(c => !silinecekCizgiIdleri.has(c.id));
    setCizgiler([...kalanCizgiler, ...bolunmusCizgiler]);
  }

  return degisiklikVarMi;
}

export function cizgiEkle(
  yeniCizgiler,
  groupId = crypto.randomUUID(),
) {
  gecmiseKaydet();

  const liste = Array.isArray(yeniCizgiler)
    ? yeniCizgiler
    : [yeniCizgiler];

  const kimlikliCizgiler = liste.map((cizgi) => ({
    ...cizgi,
    id: cizgi.id ?? crypto.randomUUID(),
    groupId: cizgi.groupId ?? groupId,
  }));

  // Önce çizgileri ekle
  setCizgiler([...cizgiler, ...kimlikliCizgiler]);

  // Sonra yeni çizgilere göre otomatik bölmeyi tetikle
  dinamikBolmeUygula();
}

document.getElementById("btnUndo").addEventListener("click", () => {
  if (undoStack.length === 0) return;

  redoStack.push(JSON.stringify(cizgiler));

  setCizgiler(JSON.parse(undoStack.pop()));
  setMevcutCizim(null);

  onizlemeKatmani.graphics.clear();

  odalariYenidenHesapla();
  ekraniGuncelle();
});

document.getElementById("btnRedo").addEventListener("click", () => {
  if (redoStack.length === 0) return;

  undoStack.push(JSON.stringify(cizgiler));

  setCizgiler(JSON.parse(redoStack.pop()));
  setMevcutCizim(null);

  onizlemeKatmani.graphics.clear();

  odalariYenidenHesapla();
  ekraniGuncelle();
});

export function tumunuSil() {
  if (cizgiler.length === 0) return;

  undoStack.push(JSON.stringify(cizgiler));
  setRedoStack([]);
  setCizgiler([]);

  setMevcutCizim(null);
  setSeciliGrupId(null);
  setSeciliGrupIdleri([]);
  setAktifCizimGrupId(null);

  onizlemeKatmani.graphics.clear();

  odalariYenidenHesapla();
  ekraniGuncelle();

  const seciliSilButonu = document.getElementById("btnDeleteSelected");
  seciliSilButonu?.classList.add("hidden");
}

const tumunuSilButonu = document.getElementById("btnClear");
tumunuSilButonu?.addEventListener("click", tumunuSil);