import {
  cizgiler,
  seciliGrupId,
  seciliGrupIdleri,
} from "../core/state.js";

/**
 * Bir çizginin hangi gruba ait olduğunu döndürür.
 * Grup kimliği yoksa çizginin kendi kimliğini kullanır.
 */
export function grupAnahtariAl(cizgi) {
  return cizgi.groupId ?? cizgi.id;
}

/**
 * Belirtilen grup kimliğine ait bütün çizgileri bulur.
 */
export function grupCizgileriniBul(grupId) {
  return cizgiler.filter(
    (cizgi) => grupAnahtariAl(cizgi) === grupId,
  );
}

/**
 * Şu an "aktif" kabul edilen seçili grup kimliklerini döndürür.
 * Kutu seçimle çoklu seçim yapılmışsa onu, yoksa tekli seçimi döndürür.
 */
export function aktifSeciliGrupIdleri() {
  if (seciliGrupIdleri.length > 0) {
    return seciliGrupIdleri;
  }

  if (seciliGrupId) {
    return [seciliGrupId];
  }

  return [];
}
