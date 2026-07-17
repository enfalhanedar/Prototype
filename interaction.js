import { aktifMod, cizgiler } from "./state.js";
import { stage, viewport } from "./stage.js";
import { sahnedenDunyaya } from "./camera.js";

import { grupAnahtariAl } from "./interaction-selection-helpers.js";
import { tiklananCizgiyiBul, tiklananOdayiBul } from "./interaction-select.js";

import {
  grupSecVeSuruklemeyeHazirla,
  koseSuruklemeyeHazirla,
  suruklemeyiTasi,
  suruklemeyiBitir,
  suruklemeAktifMi,
} from "./interaction-drag.js";

import {
  kutuSecimiAktif,
  kutuSecimBaslat,
  kutuSecimGuncelle,
  kutuSecimBitir,
} from "./interaction-box-select.js";

import { hoverGuncelle, hoverTemizle } from "./interaction-hover.js";

// Sil butonu, keydown/resize/wheel dinleyicilerini kendi
// içinde kaydeder; burada sadece side-effect olarak
// yüklenmesi yeterli.
import "./interaction-delete-button.js";

/**
 * Tıklanan dünya koordinatında bir köşe (çizgi ucu) olup olmadığını kontrol eder.
 * Tıklama önceliğinde 1. sıradadır.
 */
function tiklananKoseyiBul(dunyaNoktasi) {
  // Ekranda sabit bir tıklama yarıçapı (örn. 10px) sağlamak için zoom oranına bölüyoruz
  const TIKLAMA_TOLERANSI = 10 / viewport.scaleX; 

  for (const cizgi of cizgiler) {
    const d1 = Math.hypot(cizgi.x1 - dunyaNoktasi.x, cizgi.y1 - dunyaNoktasi.y);
    if (d1 < TIKLAMA_TOLERANSI) {
      return { x: cizgi.x1, y: cizgi.y1 };
    }

    const d2 = Math.hypot(cizgi.x2 - dunyaNoktasi.x, cizgi.y2 - dunyaNoktasi.y);
    if (d2 < TIKLAMA_TOLERANSI) {
      return { x: cizgi.x2, y: cizgi.y2 };
    }
  }
  return null;
}

/**
 * Sol tuşa basıldığında: önce köşeye tıklanıp tıklanmadığına bakar,
 * bir çizgi/odaya tıklanmışsa seçip sürüklemeye hazırlar,
 * boş alana tıklanmışsa kutu seçimini başlatır.
 */
stage.on("stagemousedown", (event) => {
  if (aktifMod !== "SELECT") return;
  if (event.nativeEvent.button !== 0) return;

  hoverTemizle();

  const dunyaNoktasi = sahnedenDunyaya(
    event.stageX,
    event.stageY,
  );

  // --- ÖNCELİK 1: KÖŞE KONTROLÜ ---
  const tiklananKose = tiklananKoseyiBul(dunyaNoktasi);
  if (tiklananKose) {
    koseSuruklemeyeHazirla(tiklananKose);
    return;
  }

  // --- ÖNCELİK 2: ÇİZGİ GÖVDESİ KONTROLÜ ---
  const tiklananCizgi = tiklananCizgiyiBul(
    dunyaNoktasi.x,
    dunyaNoktasi.y,
  );

  if (tiklananCizgi) {
    const grupId = grupAnahtariAl(tiklananCizgi);

    if (!grupId) {
      console.warn(
        "Seçilen çizginin id veya groupId değeri bulunamadı.",
        tiklananCizgi,
      );
      return;
    }

    grupSecVeSuruklemeyeHazirla(grupId, dunyaNoktasi);
    return;
  }

  // --- ÖNCELİK 3: ODA İÇİ KONTROLÜ ---
  const tiklananOda = tiklananOdayiBul(
    dunyaNoktasi.x,
    dunyaNoktasi.y,
  );

  if (tiklananOda) {
    grupSecVeSuruklemeyeHazirla(
      tiklananOda.groupId,
      dunyaNoktasi,
    );
    return;
  }

  // 4) Boş alana tıklandı → kutu seçimi başlat
  kutuSecimBaslat(dunyaNoktasi);
});

/**
 * Mouse hareket ederken: kutu seçimi aktifse çerçeveyi,
 * değilse (ve sürükleme aktifse) seçili grubu günceller.
 */
stage.on("stagemousemove", (event) => {
  if (aktifMod !== "SELECT") return;

  const dunyaNoktasi = sahnedenDunyaya(
    event.stageX,
    event.stageY,
  );

  if (kutuSecimiAktif) {
    kutuSecimGuncelle(dunyaNoktasi);
    return;
  }

  if (suruklemeAktifMi()) {
    suruklemeyiTasi(dunyaNoktasi);
    return;
  }

  hoverGuncelle(dunyaNoktasi);
});

/**
 * Mouse bırakıldığında kutu seçimi ya da sürükleme sonlandırılır.
 */
stage.on("stagemouseup", (event) => {
  const dunyaNoktasi = sahnedenDunyaya(
    event.stageX,
    event.stageY,
  );

  if (kutuSecimiAktif) {
    kutuSecimBitir(dunyaNoktasi);
    return;
  }

  if (aktifMod !== "SELECT") return;

  suruklemeyiBitir();
});

/**
 * Mouse canvas dışındayken bırakılırsa da
 * sürükleme durumunu kapat.
 */
window.addEventListener("mouseup", () => {
  suruklemeyiBitir();
});