import {
  cizgiler,
  odalar,
  seciliGrupId,
  seciliGrupIdleri,
} from "./state.js";

import {
  stage,
  odaKatmani,
  cizgiKatmani,
} from "./stage.js";




// 2. EKRANI GÜNCELLEME (EASELJS TARZI)
export function ekraniGuncelle() {
  // Eski çizimleri temizle
  odaKatmani.graphics.clear();
  cizgiKatmani.graphics.clear();

  // Odaları EaselJS ile çiziyoruz
  odalar.forEach((oda) => {
  if (!oda.noktalar || oda.noktalar.length < 3) {
    return;
  }

  const ilkNokta = oda.noktalar[0];

  odaKatmani.graphics
    .beginFill("rgba(91, 14, 233, 0.15)")
    .moveTo(ilkNokta.x, ilkNokta.y);

  for (let i = 1; i < oda.noktalar.length; i += 1) {
    const nokta = oda.noktalar[i];

    odaKatmani.graphics.lineTo(
      nokta.x,
      nokta.y,
    );
  }

  odaKatmani.graphics
    .lineTo(ilkNokta.x, ilkNokta.y)
    .endFill();
});

  // Çizgileri ve köşelerdeki kırmızı daireleri EaselJS ile çiziyoruz
  cizgiler.forEach((cizgi) => {
  const grupId = cizgi.groupId ?? cizgi.id;

const secili =
  grupId === seciliGrupId ||
  seciliGrupIdleri.includes(grupId);

  cizgiKatmani.graphics
    .beginStroke(secili ? "#ef4444" : "#7945ac")
    .setStrokeStyle(secili ? 6 : 4)
    .moveTo(cizgi.x1, cizgi.y1)
    .lineTo(cizgi.x2, cizgi.y2);

  cizgiKatmani.graphics
    .beginFill(secili ? "#ef4444" : "#9a44ef")
    .drawCircle(cizgi.x1, cizgi.y1, secili ? 5 : 4);

  cizgiKatmani.graphics
    .beginFill(secili ? "#ef4444" : "#9144ef")
    .drawCircle(cizgi.x2, cizgi.y2, secili ? 5 : 4);
});

  // Sahneyi (Stage) tarayıcıya yansıt
  stage.update();
}