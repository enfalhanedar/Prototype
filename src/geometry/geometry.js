export function noktalarEsitMi(a, b, tolerans = 0.001) {
  return (
    Math.abs(a.x - b.x) <= tolerans &&
    Math.abs(a.y - b.y) <= tolerans
  );
}

export function poligonAlani(noktalar) {
  let toplam = 0;

  for (let i = 0; i < noktalar.length; i += 1) {
    const mevcut = noktalar[i];
    const sonraki = noktalar[(i + 1) % noktalar.length];

    toplam += mevcut.x * sonraki.y;
    toplam -= sonraki.x * mevcut.y;
  }

  return Math.abs(toplam / 2);
}

export function noktaPoligonIcinde(x, y, noktalar) {
  let iceride = false;

  for (
    let i = 0, j = noktalar.length - 1;
    i < noktalar.length;
    j = i, i += 1
  ) {
    const a = noktalar[i];
    const b = noktalar[j];

    const yatayIsinKesisiyor =
      a.y > y !== b.y > y &&
      x <
        ((b.x - a.x) * (y - a.y)) /
          (b.y - a.y || Number.EPSILON) +
          a.x;

    if (yatayIsinKesisiyor) {
      iceride = !iceride;
    }
  }

  return iceride;
}

export function poligonSinirlari(noktalar) {
  const xs = noktalar.map((nokta) => nokta.x);
  const ys = noktalar.map((nokta) => nokta.y);

  const sol = Math.min(...xs);
  const sag = Math.max(...xs);
  const ust = Math.min(...ys);
  const alt = Math.max(...ys);

  return {
    sol,
    sag,
    ust,
    alt,
    x: sol,
    y: ust,
    w: sag - sol,
    h: alt - ust,
  };
}

export function kutularKesisiyorMu(a, b) {
  return !(
    a.sag < b.sol ||
    a.sol > b.sag ||
    a.alt < b.ust ||
    a.ust > b.alt
  );
}