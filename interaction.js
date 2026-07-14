import { aktifMod } from "./state.js";
import { stage } from "./stage.js";
import { sahnedenDunyaya } from "./camera.js";

import { grupAnahtariAl } from "./interaction-selection-helpers.js";
import { tiklananCizgiyiBul, tiklananOdayiBul } from "./interaction-select.js";

import {
  grupSecVeSuruklemeyeHazirla,
  suruklemeyiTasi,
  suruklemeyiBitir,
} from "./interaction-drag.js";

import {
  kutuSecimiAktif,
  kutuSecimBaslat,
  kutuSecimGuncelle,
  kutuSecimBitir,
} from "./interaction-box-select.js";

// Sil butonu, keydown/resize/wheel dinleyicilerini kendi
// içinde kaydeder; burada sadece side-effect olarak
// yüklenmesi yeterli.
import "./interaction-delete-button.js";

/**
 * Sol tuşa basıldığında: bir çizgi/odaya tıklanmışsa seçip
 * sürüklemeye hazırlar, boş alana tıklanmışsa kutu seçimini
 * başlatır.
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

    grupSecVeSuruklemeyeHazirla(grupId, dunyaNoktasi);
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

  suruklemeyiTasi(dunyaNoktasi);
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
