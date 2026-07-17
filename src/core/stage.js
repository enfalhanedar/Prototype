export const canvas = document.getElementById("cizimAlani");

export const stage = new createjs.Stage(canvas);

canvas.oncontextmenu = (event) => {
  event.preventDefault();
};

// Bütün dünya bu container içinde olacak.
// Zoom ve pan bu container üzerinden yapılacak.
export const viewport = new createjs.Container();

export const gridKatmani = new createjs.Shape();
export const odaKatmani = new createjs.Shape();
export const cizgiKatmani = new createjs.Shape();
export const etiketKatmani = new createjs.Container();
export const onizlemeKatmani = new createjs.Shape();
export const secimKatmani =
  new createjs.Shape();

// Çizim sırası önemlidir.
viewport.addChild(gridKatmani);
viewport.addChild(odaKatmani);
viewport.addChild(cizgiKatmani);
viewport.addChild(etiketKatmani);
viewport.addChild(onizlemeKatmani);
viewport.addChild(secimKatmani);

stage.addChild(viewport);
