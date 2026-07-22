  import {
    cizgiler,
    undoStack,
    redoStack,
    setCizgiler,
    setRedoStack,
    setMevcutCizim,
    secimiTemizle,
  } from "../core/state.js";

  import { odalariYenidenHesapla } from "./rooms.js";
  import { ekraniGuncelle } from "./render.js";
  import { onizlemeKatmani } from "../core/stage.js";
  import { kesisimleriKoseyeDonustur } from "../geometry/intersections.js";

  export function gecmiseKaydet(durum = cizgiler) {
    undoStack.push(JSON.stringify(durum));
    setRedoStack([]);
  }


  export function cizgiEkle(yeniCizgiler) {
    gecmiseKaydet();

    const liste = Array.isArray(yeniCizgiler) ? yeniCizgiler : [yeniCizgiler];

    const kimlikliCizgiler = liste.map((cizgi) => ({
      ...cizgi,
      id: cizgi.id ?? crypto.randomUUID(),
    }));

    // Önce çizgileri ekle
    setCizgiler([...cizgiler, ...kimlikliCizgiler]);

    // Sonra yeni çizgilere göre otomatik bölmeyi tetikle
    kesisimleriKoseyeDonustur();
    odalariYenidenHesapla();
    ekraniGuncelle();
    
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
    if (cizgiler.length === 0) return;

    undoStack.push(JSON.stringify(cizgiler));
    setRedoStack([]);
    setCizgiler([]);

    setMevcutCizim(null);
    secimiTemizle();

    onizlemeKatmani.graphics.clear();

    odalariYenidenHesapla();
    ekraniGuncelle();

    const seciliSilButonu = document.getElementById("btnDeleteSelected");
    seciliSilButonu?.classList.add("hidden");
  }

  const tumunuSilButonu = document.getElementById("btnClear");
  tumunuSilButonu?.addEventListener("click", tumunuSil);


