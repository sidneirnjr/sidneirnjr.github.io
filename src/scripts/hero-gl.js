// Esfera de pontos em três chapas (ciano, magenta, amarelo), como numa impressão offset.
// Fora de registro, as cores aparecem separadas. Com o ponteiro perto, as chapas se alinham
// e a soma das três vira branco. WebGL puro, sem bibliotecas (~3 KB).

const VS = `
attribute vec3 a_pos;
attribute float a_rnd;
uniform float u_t, u_aspect, u_size, u_shift, u_scale;
uniform vec2 u_rot;
uniform vec3 u_off;
varying float v_a;
void main() {
  vec3 p = a_pos;
  float n = sin(p.x * 2.2 + u_t * 1.1) * cos(p.y * 2.4 + u_t * .8) * .13
          + sin(p.z * 3.1 + u_t * 1.7 + a_rnd) * .05;
  p *= 1. + n;
  float cy = cos(u_rot.x), sy = sin(u_rot.x);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  float cx = cos(u_rot.y), sx = sin(u_rot.y);
  p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
  p = p * u_scale + u_off;
  float zc = 6.0 - p.z;
  float f = 2.4;
  gl_Position = vec4(p.x * f / u_aspect + u_shift * zc, p.y * f, 0., zc);
  float depth = clamp((p.z + 2.) / 4., 0., 1.);
  gl_PointSize = u_size * (0.55 + 1.6 * clamp(n * 4. + .5, 0., 1.)) * (6. / zc);
  v_a = .25 + .75 * depth;
}`;

const FS = `
precision mediump float;
uniform vec3 u_col;
uniform float u_alpha;
varying float v_a;
void main() {
  float d = length(gl_PointCoord - .5);
  if (d > .5) discard;
  float a = smoothstep(.5, .32, d) * v_a * u_alpha;
  gl_FragColor = vec4(u_col * a, a);
}`;

export function initHero(canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) { canvas.classList.add('nogl'); return; }

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { canvas.classList.add('nogl'); return; }
  gl.useProgram(pr);

  const mobile = innerWidth < 760;
  const N = mobile ? 3200 : 7000;
  const data = new Float32Array(N * 4);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i, R = 1.9;
    data[i * 4] = Math.cos(th) * r * R;
    data[i * 4 + 1] = y * R;
    data[i * 4 + 2] = Math.sin(th) * r * R;
    data[i * 4 + 3] = Math.random() * 6.28;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(pr, 'a_pos'), aRnd = gl.getAttribLocation(pr, 'a_rnd');
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(aRnd); gl.vertexAttribPointer(aRnd, 1, gl.FLOAT, false, 16, 12);

  const U = {};
  ['u_t', 'u_aspect', 'u_size', 'u_shift', 'u_scale', 'u_rot', 'u_off', 'u_col', 'u_alpha'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // aditivo: C + M + Y = branco

  const plates = [
    { col: [0, .62, .82], dir: [-1, .35, .2] },
    { col: [.92, .12, .45], dir: [.95, .45, -.1] },
    { col: [.85, .7, 0], dir: [.05, -1, .15] },
  ];

  let W = 0, H = 0, dpr = 1, shift = 0, scale = 1, dim = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    const wide = W > 900;
    shift = wide ? .46 : .18;
    scale = wide ? .82 : (W < 500 ? .7 : .78);
    dim = wide ? 1 : .55; // em telas estreitas a esfera fica atrás do texto: mais discreta
  }
  resize();
  addEventListener('resize', resize);

  let mx = 0, my = 0, tmx = 0, tmy = 0, mis = .16, tmis = .16, scroll = 0;
  addEventListener('pointermove', e => {
    tmx = e.clientX / innerWidth - .5;
    tmy = e.clientY / innerHeight - .5;
    // distância do ponteiro ao centro da esfera, em px
    const cx = W * (.5 + shift / 2), cy = H * .5;
    const d = Math.hypot(e.clientX - cx, e.clientY - cy) / Math.min(W, H);
    tmis = d < .38 ? .0 : .16;
  }, { passive: true });
  addEventListener('scroll', () => { scroll = Math.min(1, scrollY / Math.max(1, H)); }, { passive: true });

  let visible = true, raf = 0, t0 = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !reduce) raf = requestAnimationFrame(frame); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf && !reduce) raf = requestAnimationFrame(frame); });

  function draw(t) {
    mx += (tmx - mx) * .04; my += (tmy - my) * .04;
    mis += (tmis + scroll * .9 - mis) * .05;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.u_t, t);
    gl.uniform1f(U.u_aspect, W / H);
    gl.uniform1f(U.u_size, (mobile ? 2.4 : 2.7) * dpr);
    gl.uniform1f(U.u_shift, shift);
    gl.uniform1f(U.u_scale, scale);
    gl.uniform1f(U.u_alpha, (1 - scroll * .85) * .62 * dim);
    gl.uniform2f(U.u_rot, t * .12 + mx * 1.4, my * .9);
    for (const p of plates) {
      gl.uniform3f(U.u_col, ...p.col);
      gl.uniform3f(U.u_off, p.dir[0] * mis, p.dir[1] * mis, p.dir[2] * mis);
      gl.drawArrays(gl.POINTS, 0, N);
    }
  }
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    draw((now - t0) / 1000);
    raf = requestAnimationFrame(frame);
  }
  if (reduce) draw(2); else raf = requestAnimationFrame(frame);
}
