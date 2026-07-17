import {
  aktifMod,
  cizgiler,
  setSeciliGrupId,
  setSeciliGrupIdleri,
} from "../core/state.js";

import { stage, viewport } from "../core/stage.js";
import { sahnedenDunyaya } from "../camera/camera.js";

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
 * bir çizgiye tıklanmışsa SADECE O TEKİL kenarı seçer ve silme butonunu tetikler.
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
    // KRİTİK DEĞİŞİKLİK: Grup mantığını ezip geçiyoruz. 
    // Seçim listelerine grup ID'si yerine çizginin kendi özgün ID'sini kaydediyoruz.
    setSeciliGrupId(null);
    setSeciliGrupIdleri([tiklananCizgi.id]); 

    // Sürükleme ve silme butonunun konumlanması için çizgi ID'sini gönderiyoruz
    grupSecVeSuruklemeyeHazirla(tiklananCizgi.id, dunyaNoktasi);
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

stage.on("stagemouseup", (event) => {
  if (kutuSecimiAktif) {
    const dunyaNoktasi = sahnedenDunyaya(
      event.stageX,
      event.stageY,
    );
    kutuSecimBitir(dunyaNoktasi);
    return;
  }

  if (aktifMod !== "SELECT") return;

  suruklemeyiBitir();
});

window.addEventListener("mouseup", () => {
  suruklemeyiBitir();
});