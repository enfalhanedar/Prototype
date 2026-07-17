export const canvas =
  document.getElementById("cizimAlani");

export const stage =
  new createjs.Stage(canvas);

canvas.oncontextmenu = (event) => {
  event.preventDefault();
};

/*
 * Bütün dünya bu container içinde.
 * Zoom ve pan yalnızca viewport üzerinde uygulanacak.
 */
export const viewport =
  new createjs.Container();

export const gridKatmani =
  new createjs.Shape();

export const odaKatmani =
  new createjs.Shape();

export const cizgiKatmani =
  new createjs.Shape();

export const etiketKatmani =
  new createjs.Container();

export const odaEtiketKatmani =
  new createjs.Container();

export const onizlemeKatmani =
  new createjs.Shape();

export const secimKatmani =
  new createjs.Shape();

/*
 * Çizim sırası:
 *
 * grid en arkada,
 * oda dolguları onun üzerinde,
 * çizgiler daha üstte,
 * etiketler çizgilerin üzerinde,
 * önizleme ve seçim en üstte.
 */
viewport.addChild(
  gridKatmani,
  odaKatmani,
  cizgiKatmani,
  etiketKatmani,
  odaEtiketKatmani,
  onizlemeKatmani,
  secimKatmani,
);

/*
 * Stage doğrudan yalnızca viewport'u içerir.
 */
stage.addChild(viewport);