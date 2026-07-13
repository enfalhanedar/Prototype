import {
  cizgiler,
  undoStack,
  redoStack,
  setCizgiler,
  setRedoStack,
  setMevcutCizim,
  setSeciliGrupId,
  setAktifCizimGrupId,
} from "./state.js";

import { odalariYenidenHesapla } from "./rooms.js";
import { ekraniGuncelle } from "./render.js";
import { onizlemeKatmani } from "./stage.js";

function yeniId() {
  return crypto.randomUUID();
}

export function gecmiseKaydet(durum = cizgiler) {
  undoStack.push(JSON.stringify(durum));
  setRedoStack([]);
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

  cizgiler.push(...kimlikliCizgiler);
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
  // Ekranda çizgi yoksa işlem yapma
  if (cizgiler.length === 0) return;

  // Silmeden önce mevcut durumu geçmişe kaydet
  undoStack.push(JSON.stringify(cizgiler));

  // Yeni işlem yapıldığı için redo geçmişini temizle
  setRedoStack([]);

  // Bütün çizgileri temizle
  setCizgiler([]);

  // Devam eden çizim ve seçimleri temizle
  setMevcutCizim(null);
  setSeciliGrupId(null);
  setAktifCizimGrupId(null);

  // Önizlemeyi temizle
  onizlemeKatmani.graphics.clear();

  // Odaları ve ekranı yeniden hesapla
  odalariYenidenHesapla();
  ekraniGuncelle();

  // Seçili şeklin silme butonunu gizle
  const seciliSilButonu =
    document.getElementById("btnDeleteSelected");

  seciliSilButonu?.classList.add("hidden");
}

const tumunuSilButonu =
  document.getElementById("btnClear");

tumunuSilButonu?.addEventListener("click", tumunuSil);