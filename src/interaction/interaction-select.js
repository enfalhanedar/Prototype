import { cizgiler, odalar } from "../core/state.js";
import { viewport } from "../core/stage.js";
import { noktaPoligonIcinde } from "../geometry/geometry.js";
import { cizgiUzerindeEnYakinNokta } from "../geometry/snap.js";

// Seçim mesafesi ekran pikseli cinsindendir.
// Zoom yapılsa bile çizgiye tıklama kolaylığı yaklaşık aynı kalır.
const SECIM_EKRAN_MESAFESI = 6;

/**
 * Verilen dünya koordinatına en yakın çizgiyi bulur.
 */
export function tiklananCizgiyiBul(x, y) {
  let bulunanCizgi = null;

  let enKisaMesafe = SECIM_EKRAN_MESAFESI / viewport.scaleX;

  for (const cizgi of cizgiler) {
    const sonuc = cizgiUzerindeEnYakinNokta(
      x,
      y,
      cizgi.x1,
      cizgi.y1,
      cizgi.x2,
      cizgi.y2,
    );

    if (sonuc.mesafe < enKisaMesafe) {
      enKisaMesafe = sonuc.mesafe;
      bulunanCizgi = cizgi;
    }
  }

  return bulunanCizgi;
}

/**
 * Verilen dünya koordinatının içinde kaldığı en küçük odayı bulur.
 * (İç içe odalarda en küçüğü seçilsin diye alana göre sıralanır.)
 */
export function tiklananOdayiBul(x, y) {
  const bulunanOdalar = odalar
    .filter((oda) => noktaPoligonIcinde(x, y, oda.noktalar))
    .sort((a, b) => a.alan - b.alan);

  return bulunanOdalar[0] ?? null;
}
