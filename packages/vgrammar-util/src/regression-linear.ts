import { isNil } from '@visactor/vutils';

/* Adapted from vega by University of Washington Interactive Data Lab
 * https://vega.github.io/vega/
 * Licensed under the BSD-3-Clause

 * url: https://github.com/vega/vega/blob/main/packages/vega-statistics/src/regression/ols.js
 * License: https://github.com/vega/vega/blob/main/LICENSE
 * @license
 */
export function ordinaryLeastSquares(uX: number, uY: number, uXY: number, uX2: number) {
  const delta = uX2 - uX * uX;
  const slope = Math.abs(delta) < 1e-24 ? 0 : (uXY - uX * uY) / delta;
  const intercept = uY - slope * uX;

  return [intercept, slope];
}
/* Adapted from vega by University of Washington Interactive Data Lab
 * https://vega.github.io/vega/
 * Licensed under the BSD-3-Clause

 * url: https://github.com/vega/vega/blob/main/packages/vega-statistics/src/regression/points.js
 * License: https://github.com/vega/vega/blob/main/LICENSE
 * @license
 */
export function points(data: any[], x: (datum: any) => number, y: (datum: any) => number, sort?: boolean) {
  data = data.filter(d => {
    let u = x(d);
    let v = y(d);
    return !isNil(u) && (u = +u) >= u && !isNil(v) && (v = +v) >= v;
  });

  if (sort) {
    data.sort((a, b) => x(a) - x(b));
  }

  const n = data.length;
  const X = new Float64Array(n);
  const Y = new Float64Array(n);

  // extract values, calculate means
  let i = 0;
  let ux: number = 0;
  let uy: number = 0;
  let xv;
  let yv;

  data.forEach(d => {
    X[i] = xv = +x(d);
    Y[i] = yv = +y(d);
    ++i;
    ux += (xv - ux) / i;
    uy += (yv - uy) / i;
  });

  // mean center the data
  for (i = 0; i < n; ++i) {
    X[i] -= ux;
    Y[i] -= uy;
  }

  return [X, Y, ux, uy];
}
// Adapted from d3-regression by Harry Stevens
// License: https://github.com/HarryStevens/d3-regression/blob/master/LICENSE
export function visitPoints(
  data: any[],
  x: (datum: any) => number,
  y: (datum: any) => number,
  callback: (x: number, y: number, index: number) => void
) {
  let i = -1;
  let u;
  let v;

  data.forEach(d => {
    u = x(d);
    v = y(d);
    if (!isNil(u) && (u = +u) >= u && !isNil(v) && (v = +v) >= v) {
      callback(u, v, ++i);
    }
  });
}

// Adapted from d3-regression by Harry Stevens
// License: https://github.com/HarryStevens/d3-regression/blob/master/LICENSE
export function rSquared(
  data: any[],
  x: (datum: any) => number,
  y: (datum: any) => number,
  uY: number,
  predict: (x: number) => number
) {
  let SSE = 0;
  let SST = 0;

  visitPoints(data, x, y, (dx, dy) => {
    const sse = dy - predict(dx);
    const sst = dy - uY;

    SSE += sse * sse;
    SST += sst * sst;
  });

  return 1 - SSE / SST;
}

// Adapted from d3-regression by Harry Stevens
// License: https://github.com/HarryStevens/d3-regression/blob/master/LICENSE
export function regressionLinear(data: any[], x: (datum: any) => number, y: (datum: any) => number) {
  let X = 0;
  let Y = 0;
  let XY = 0;
  let X2 = 0;
  let n = 0;

  visitPoints(data, x, y, (dx, dy) => {
    ++n;
    X += (dx - X) / n;
    Y += (dy - Y) / n;
    XY += (dx * dy - XY) / n;
    X2 += (dx * dx - X2) / n;
  });

  const coef = ordinaryLeastSquares(X, Y, XY, X2);
  const predict = (x: number) => coef[0] + coef[1] * x;

  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, Y, predict)
  };
}
