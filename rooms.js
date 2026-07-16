import {
  cizgiler,
  setOdalar,
  mevcutCizim, // Çizim durumunu kontrol etmek için state'ten içe aktarıyoruz
} from "./state.js";

import {
  poligonAlani,
  poligonSinirlari,
} from "./geometry.js";

/**
 * İki noktanın koordinat olarak birbirine eşleşip eşleşmediğini kontrol eder.
 */
function noktalarEsitMi(p1, p2, tolerans = 1e-2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y) < tolerans;
}

/**
 * Sahnedeki tüm çizgileri tarar; gruplardan bağımsız olarak, 
 * geometrik olarak uç uca birleşip kapalı alan oluşturan her yeri oda olarak tanımlar.
 */
export function odalariYenidenHesapla() {
  // KRİTİK DÜZELTME 1: Eğer kullanıcı o an aktif olarak çizgi veya kutu çiziyorsa,
  // oda hesaplamayı durdur ki üst üste binen gölgeler (koyulaşma) oluşmasın!
  if (mevcutCizim !== null) {
    return;
  }

  // SAHNENİN KİLİTLENMESİNİ ÖNLEYEN KORUMA:
  if (!cizgiler || cizgiler.length < 3) {
    setOdalar([]);
    return;
  }

  const yeniOdalar = [];
  const kavsaklar = [];

  // 1. Tüm çizgilerin uç noktalarından benzersiz köşe listesi (kavşaklar) çıkar
  cizgiler.forEach(c => {
    if (!c) return;
    const v1 = { x: Math.round(c.x1), y: Math.round(c.y1) };
    const v2 = { x: Math.round(c.x2), y: Math.round(c.y2) };
    if (!kavsaklar.some(k => noktalarEsitMi(k, v1))) kavsaklar.push(v1);
    if (!kavsaklar.some(k => noktalarEsitMi(k, v2))) kavsaklar.push(v2);
  });

  // 2. Her kavşağın komşularını haritalandır
  const komsuluk = new Map();
  kavsaklar.forEach(k => komsuluk.set(k, []));

  cizgiler.forEach(c => {
    if (!c) return;
    const v1 = kavsaklar.find(k => noktalarEsitMi(k, { x: c.x1, y: c.y1 }));
    const v2 = kavsaklar.find(k => noktalarEsitMi(k, { x: c.x2, y: c.y2 }));
    if (v1 && v2 && v1 !== v2) {
      if (!komsuluk.get(v1).includes(v2)) komsuluk.get(v1).push(v2);
      if (!komsuluk.get(v2).includes(v1)) komsuluk.get(v2).push(v1);
    }
  });

  const ziyaretEdilenYollar = new Set();

  // 3. Her bir kavşaktan başlayarak kapalı alan (çevrim) tespiti yap
  kavsaklar.forEach(baslangic => {
    const komsular = komsuluk.get(baslangic) || [];
    komsular.forEach(sonraki => {
      const yolAnahtari = `${baslangic.x},${baslangic.y}->${sonraki.x},${sonraki.y}`;
      const tersAnahtar = `${sonraki.x},${sonraki.y}->${baslangic.x},${baslangic.y}`;
      
      if (ziyaretEdilenYollar.has(yolAnahtari) || ziyaretEdilenYollar.has(tersAnahtar)) return;

      const poligonNoktalari = [baslangic, sonraki];
      let mevcut = sonraki;
      let onceki = baslangic;
      let basari = false;

      for (let adim = 0; adim < 30; adim++) {
        const adaylar = komsuluk.get(mevcut) || [];
        if (adaylar.length < 2) break;

        const angBase = Math.atan2(onceki.y - mevcut.y, onceki.x - mevcut.x);
        let enIyiAday = null;
        let enKucukAcı = Infinity;

        adaylar.forEach(aday => {
          if (noktalarEsitMi(aday, onceki)) return;
          let diff = Math.atan2(aday.y - mevcut.y, aday.x - mevcut.x) - angBase;
          if (diff <= 0) diff += 2 * Math.PI;
          if (diff < enKucukAcı) {
            enKucukAcı = diff;
            enIyiAday = aday;
          }
        });

        if (!enIyiAday) break;

        if (noktalarEsitMi(enIyiAday, baslangic)) {
          basari = true;
          break;
        }

        poligonNoktalari.push(enIyiAday);
        onceki = mevcut;
        mevcut = enIyiAday;
      }

      if (basari && poligonNoktalari.length >= 3) {
        for (let i = 0; i < poligonNoktalari.length; i++) {
          const p1 = poligonNoktalari[i];
          const p2 = poligonNoktalari[(i + 1) % poligonNoktalari.length];
          ziyaretEdilenYollar.add(`${p1.x},${p1.y}->${p2.x},${p2.y}`);
        }

        const alan = poligonAlani(poligonNoktalari);
        if (alan > 10) { 
          const sinirlar = poligonSinirlari(poligonNoktalari);
          yeniOdalar.push({
            id: crypto.randomUUID(),
            groupId: crypto.randomUUID(),
            noktalar: poligonNoktalari,
            alan: alan,
            ...sinirlar
          });
        }
      }
    });
  });

  setOdalar(yeniOdalar);
}