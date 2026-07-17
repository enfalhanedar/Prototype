import {
  cizgiler,
  setHoverGrupId,
  setHoverCizgiId,
  setHoverKoseNoktasi
} from "../core/state.js";
import { viewport } from "../core/stage.js";
import { tiklananCizgiyiBul } from "./interaction-select.js";
import { ekraniGuncelle } from "../drawing/render.js";

/**
 * Mouse hareket ederken hover durumundaki köşe ve çizgiyi günceller.
 */
export function hoverGuncelle(dunyaNoktasi) {
  const eskiHoverKose = window.mevcutHoverKose;
  const eskiHoverCizgiId = window.mevcutHoverCizgiId;

  let yeniHoverKose = null;
  let yeniHoverCizgiId = null;
  let yeniHoverGrupId = null;

  // 1. KÖŞE HOVER KONTROLÜ (Öncelikli)
  const KOSE_HOVER_TOLERANSI = 10 / viewport.scaleX;
  for (const cizgi of cizgiler) {
    const d1 = Math.hypot(cizgi.x1 - dunyaNoktasi.x, cizgi.y1 - dunyaNoktasi.y);
    if (d1 < KOSE_HOVER_TOLERANSI) {
      yeniHoverKose = { x: cizgi.x1, y: cizgi.y1 };
      break;
    }
    const d2 = Math.hypot(cizgi.x2 - dunyaNoktasi.x, cizgi.y2 - dunyaNoktasi.y);
    if (d2 < KOSE_HOVER_TOLERANSI) {
      yeniHoverKose = { x: cizgi.x2, y: cizgi.y2 };
      break;
    }
  }

  // 2. ÇİZGİ HOVER KONTROLÜ
  if (!yeniHoverKose) {
    const bulunanCizgi = tiklananCizgiyiBul(dunyaNoktasi.x, dunyaNoktasi.y);
    if (bulunanCizgi) {
      yeniHoverCizgiId = bulunanCizgi.id;
      yeniHoverGrupId = bulunanCizgi.groupId ?? bulunanCizgi.id;
    }
  }

  // State'leri güncelle
  setHoverKoseNoktasi(yeniHoverKose);
  setHoverCizgiId(yeniHoverCizgiId);
  setHoverGrupId(yeniHoverGrupId);

  // Gereksiz render yükünü önlemek için sadece hover hedefleri değiştiğinde ekranı güncelle
  const koseDegisti = JSON.stringify(yeniHoverKose) !== JSON.stringify(eskiHoverKose);
  const cizgiDegisti = yeniHoverCizgiId !== eskiHoverCizgiId;

  if (koseDegisti || cizgiDegisti) {
    window.mevcutHoverKose = yeniHoverKose;
    window.mevcutHoverCizgiId = yeniHoverCizgiId;
    ekraniGuncelle();
  }
}

/**
 * Hover durumunu tamamen temizler.
 */
export function hoverTemizle() {
  setHoverKoseNoktasi(null);
  setHoverCizgiId(null);
  setHoverGrupId(null);
  window.mevcutHoverKose = null;
  window.mevcutHoverCizgiId = null;
  ekraniGuncelle();
}