import {
  cizgiler,
  undoStack,
  redoStack,
  setCizgiler,
  setRedoStack,
  setMevcutCizim,
  secimiTemizle,
} from "../core/state.js";

import { odalariYenidenHesapla } from "./rooms.js";
import { ekraniGuncelle } from "./render.js";
import { onizlemeKatmani } from "../core/stage.js";

export function gecmiseKaydet(durum = cizgiler) {
  undoStack.push(JSON.stringify(durum));
  setRedoStack([]);
}

/**
 * Yardımcı Fonksiyon: Bir noktanın, verilen çizginin gövdesi üzerinde olup olmadığını kontrol eder.
 */
function noktaCizgiUzerindeMi(px, py, cizgi) {
  const TOLERANS = 1.0; // Çizginin üstünde sayılması için piksel toleransı
  const KOSE_TOLERANSI = 2.0; // Köşelere yakınlık toleransı (köşeleri bölmemek için)

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
      { x: tarayanCizgi.x2, y: tarayanCizgi.y2 },
    ];

    uclar.forEach((uc) => {
      for (let i = 0; i < aktifCizgiler.length; i++) {
        const mevcut = aktifCizgiler[i];

        // Kendisini veya zaten silinmiş bir çizgiyi bölmesin
        if (
          mevcut.id === tarayanCizgi.id ||
          silinecekCizgiIdleri.has(mevcut.id)
        ) {
          continue;
        }

        if (noktaCizgiUzerindeMi(uc.x, uc.y, mevcut)) {
          silinecekCizgiIdleri.add(mevcut.id);
          degisiklikVarMi = true;

          const parca1 = {
            id: crypto.randomUUID(),
            x1: mevcut.x1,
            y1: mevcut.y1,
            x2: uc.x,
            y2: uc.y,
          };

          const parca2 = {
            id: crypto.randomUUID(),
            x1: uc.x,
            y1: uc.y,
            x2: mevcut.x2,
            y2: mevcut.y2,
          };

          bolunmusCizgiler.push(parca1, parca2);

          // Aktif listeyi anlık güncelliyoruz
          aktifCizgiler = aktifCizgiler.filter((c) => c.id !== mevcut.id);
          aktifCizgiler.push(parca1, parca2);
          break;
        }
      }
    });
  }

  if (degisiklikVarMi) {
    const kalanCizgiler = cizgiler.filter(
      (c) => !silinecekCizgiIdleri.has(c.id),
    );
    setCizgiler([...kalanCizgiler, ...bolunmusCizgiler]);
  }

  return degisiklikVarMi;
}

export function cizgiEkle(yeniCizgiler) {
  gecmiseKaydet();

  const liste = Array.isArray(yeniCizgiler) ? yeniCizgiler : [yeniCizgiler];

  const kimlikliCizgiler = liste.map((cizgi) => ({
    ...cizgi,
    id: cizgi.id ?? crypto.randomUUID(),
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
  secimiTemizle();

  onizlemeKatmani.graphics.clear();

  odalariYenidenHesapla();
  ekraniGuncelle();

  const seciliSilButonu = document.getElementById("btnDeleteSelected");
  seciliSilButonu?.classList.add("hidden");
}

const tumunuSilButonu = document.getElementById("btnClear");
tumunuSilButonu?.addEventListener("click", tumunuSil);

// Çizgileri dışarı aktaran fonksiyon
function exportJSON(data) {
  // 1. JSON verisini okunabilir (formatlı) bir metne dönüştür
  const jsonString = JSON.stringify(data, null, 2);

  // 2. Bu metinden sanal bir dosya (Blob) oluştur
  const blob = new Blob([jsonString], { type: "application/json" });

  // 3. Dosyayı indirmek için geçici bir link (a etiketi) yarat
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "cizim-verileri.json"; // İnecek dosyanın adı

  // 4. Linki tetikle ve bellekten temizle
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Butona tıklama olayı (Event Listener) ekle
document.getElementById("btnExportJson").addEventListener("click", () => {
  // cizgiler değişkeninin adından emin olmalısın.
  // Konsoldaki 'cizgiler' dizisini buraya parametre olarak gönderiyoruz.
  if (typeof cizgiler !== "undefined" && cizgiler.length > 0) {
    exportJSON(cizgiler);
  } else {
    alert("Dışarı aktarılacak aktif bir çizim bulunamadı!");
  }
});
