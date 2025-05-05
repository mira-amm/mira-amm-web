!(function () {
  "use strict";

  function o() {
    return window.zyxplay.context;
  }

  function L(t) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
      i = document.createElementNS("http://www.w3.org/2000/svg", "path");
    return (
      e.appendChild(i),
      i.setAttribute("d", t),
      i.setAttribute("fill", "none"),
      i.setAttribute("stroke", "black"),
      i.setAttribute("stroke-width", "2"),
      i.setAttribute("id", "path"),
      i
    );
  }

  function k(t) {
    return (t * Math.PI) / 180;
  }

  function _(t, e, i) {
    return Math.min(Math.max(t, i), e);
  }

  function x(t) {
    let { x: e = 0, y: i = 0, width: s, height: h } = t;
    return (
      (e -= 0.5 * s),
      (i -= 0.5 * h),
      s < 0 && ((e += s), (s *= -1)),
      h < 0 && ((i += h), (h *= -1)),
      {
        x: e,
        y: i,
        width: s,
        height: h,
      }
    );
  }

  function C(t, e, ...i) {
    return setTimeout(t, e, ...i);
  }

  function H(t = 0, e = 1) {
    return Math.random() * (e - t) + t;
  }
  let r = {};

  function N(t, e) {
    (r[t] = r[t] || []), r[t].push(e);
  }

  function j(t, ...e) {
    (r[t] || []).map((t) => t(...e));
  }
  let a = {},
    D = {};

  function g(t, e) {
    return new URL(t, e).href;
  }

  function m() {
    window.__k ||
      (window.__k = {
        u: g,
        i: a,
        d: D,
      });
  }

  function t(t, e, i) {
    if ((m(), D[t])) return D[t];
    D[t] = e(...i);
  }

  function e(h, r = null) {
    return (
      m(),
      new Promise((t, e) => {
        let i, s;
        return r
          ? ((a[h] = r), t(r))
          : a[h]
          ? t(a[h])
          : (((i = new Image()).onload = () => {
              (s = g(h, window.location.href)), (a[s] = a[h] = i), t(i);
            }),
            (i.onerror = () => {
              e();
            }),
            void (i.src = h));
      })
    );
  }
  class i {
    constructor(t) {
      this.init(t);
    }
    init(t = {}) {
      t = {
        name: "",
        x: 0,
        y: 0,
        width: 8,
        height: 8,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        anchor: {
          x: 0,
          y: 0,
        },
        color: "white",
        dx: 0,
        dy: 0,
        ddx: 0,
        ddy: 0,
        ttl: 1 / 0,
        frame: 0,
        sprite: 0,
        context: o(),
        spritesheet: [a["spritesheet.png"], 8, 8],
        shield: 20,
        hitted: !1,
        _uf: t.update,
        _rf: t.render,
        _df: t.draw,
        ...t,
      };
      Object.assign(this, t);
    }
    hit(t) {
      j("hit"),
        (this.shield -= t),
        (this.hitted = !0),
        this.shield <= 0 && this.die && this.die(),
        C(() => (this.hitted = !1), 100);
    }
    advance() {
      (this.x += this.dx), (this.y += this.dy), (this.dx += this.ddx), (this.dy += this.ddy), this.ttl--, this.frame++;
    }
    update() {
      this._uf ? this._uf() : this.advance();
    }
    render() {
      if (this._rf) return this._rf();
      var { context: t, x: e, y: i, anchor: s, rotation: h, scaleX: r, scaleY: a, width: n, height: o } = this;
      t.save(),
        t.translate(e, i),
        h && t.rotate(h),
        r && a && t.scale(r, a),
        t.translate(-n * s.x, -o * s.y),
        this.draw(),
        t.restore();
    }
    draw() {
      if (this._df) return this._df();
      var { context: t, color: e, width: i, height: s } = this;
      this.hitted && (t.save(), t.translate(0, -1)),
        this.color
          ? ((t.fillStyle = e), t.fillRect(0, 0, i, s))
          : t.drawImage(this.spritesheet[0], this.sprite * this.spritesheet[1], 0, i, s, 0, 0, i, s),
        this.hitted &&
          ((t.globalCompositeOperation = "source-atop"),
          (t.fillStyle = "white"),
          t.fillRect(0, 0, i, s),
          (t.globalCompositeOperation = "source-over"),
          t.restore());
    }
    isAlive() {
      return 0 < this.ttl;
    }
  }
  const Y = (t) => new i(t);
  class y {
    constructor(t) {
      this.init(t);
    }
    init(i = {}) {
      var t = Object.keys(i).reduce((t, e) => ("function" != typeof i[e] && (t[e] = i[e]), t), {}),
        t = {
          id: "scene",
          context: o(),
          _uf: i.update,
          _rf: i.render,
          children: [],
          paused: !1,
          ...t,
        };
      Object.assign(this, t);
    }
    add(t) {
      this.children.push(t);
    }
    pause() {
      this.paused = !0;
    }
    resume() {
      this.paused = !1;
    }
    update(e) {
      this.paused ||
        (this.children.forEach((t) => {
          if (!t.isAlive) return t.update(e);
          t.isAlive() && t.update(e);
        }),
        this._uf && this._uf());
    }
    render() {
      this.context.save(),
        this._uf && this._uf(),
        this.children.forEach((t) => {
          if (!t.isAlive) return t.render();
          t.isAlive() && t.render();
        }),
        this.context.restore();
    }
  }

  function P(t) {
    return new y(t);
  }
  class w extends i {
    constructor(t = {}) {
      super({
        name: "text",
        x: 0,
        y: 0,
        text: "",
        color: "white",
        align: "left",
        lineHeight: 8,
        scale: 1,
        spritesheet: a["font.png"],
        ...t,
      });
    }
    draw() {
      var t = this.text.split("\n");
      const { context: r, align: e, lineHeight: a, color: n } = this;
      r.save(),
        t.forEach((i) => {
          r.save(),
            "center" === e && r.translate((8 * -i.length) / 2, 0),
            "right" === e && r.translate(8 * -i.length, 0);
          for (let e = 0; e < i.length; e++) {
            var s,
              h = i.charCodeAt(e);
            let t =
              64 === h
                ? 41
                : 58 === h
                ? 40
                : 33 === h
                ? 39
                : 63 === h
                ? 38
                : 44 === h
                ? 37
                : 46 === h
                ? 36
                : 32 === h
                ? -1
                : 48 <= h && h <= 57
                ? h - 22
                : 65 <= h && h <= 90
                ? h - 65
                : 0;
            -1 !== t &&
              ((h = 8 * t),
              (s = 8 * e),
              0,
              r.drawImage(this.spritesheet, h, 0, 8, 8, s, 0, 8, 8),
              (r.globalCompositeOperation = "source-atop"),
              (r.fillStyle = n || "white"),
              r.fillRect(s, 0, 8, 8),
              (r.globalCompositeOperation = "source-over"));
          }
          r.restore(), r.translate(0, a);
        }),
        r.restore();
    }
  }

  function G(t) {
    return new w(t);
  }
  class v extends i {
    constructor(t) {
      super({
        name: "explosion-particle",
        color: "white",
        anchor: {
          x: 0.5,
          y: 0.5,
        },
        ...t,
      });
    }
    update() {
      !this.color && this.ttl < 30 && (this.scaleX = this.scaleY = this.ttl / 30),
        this.color && this.ttl < 60 && (this.scaleX = this.scaleY = this.ttl / 60),
        this.advance();
    }
    draw() {
      this.color || this.context.drawImage(this.spritesheet[0], 120, 0, 8, 8, 0, 0, 8, 8),
        this.color && ((this.context.fillStyle = this.color), this.context.fillRect(0, 0, 1, 1));
    }
  }

  function q(t) {
    return new v(t);
  }
  let n = {},
    l = {},
    s = {},
    d = {
      Enter: "enter",
      Escape: "esc",
      Space: "space",
      ArrowLeft: "arrowleft",
      ArrowUp: "arrowup",
      ArrowRight: "arrowright",
      ArrowDown: "arrowdown",
    };

  function S(t = () => {}, e) {
    t._pd && e.preventDefault(), t(e);
  }

  function E(t) {
    var e = d[t.code],
      i = n[e];
    (s[e] = !0), S(i, t);
  }

  function O(t) {
    var e = d[t.code],
      i = l[e];
    (s[e] = !1), S(i, t);
  }

  function h(t) {
    return [].concat(t).some((t) => s[t]);
  }

  function U(t, e, { handler: i = "keydown", preventDefault: s = !0 } = {}) {
    let h = "keydown" == i ? n : l;
    (e._pd = s), [].concat(t).map((t) => (h[t] = e));
  }

  function J(t, { handler: e = "keydown" } = {}) {
    let i = "keydown" == e ? n : l;
    [].concat(t).map((t) => delete i[t]);
  }
  const F = (...t) => {
      let e = c.createBufferSource(),
        i = c.createBuffer(t.length, t[0].length, V);
      return t.map((t, e) => i.getChannelData(e).set(t)), (e.buffer = i), e.connect(c.destination), e.start(), e;
    },
    R = (
      t = 1,
      e = 0.05,
      i = 220,
      s = 0,
      h = 0,
      r = 0.1,
      a = 0,
      n = 1,
      o = 0,
      l = 0,
      d = 0,
      c = 0,
      p = 0,
      f = 0,
      u = 0,
      x = 0,
      g = 0,
      m = 1,
      y = 0,
      w = 0
    ) => {
      let v = 2 * Math.PI,
        S = (o *= (500 * v) / V ** 2),
        E = ((0 < u ? 1 : -1) * v) / 4,
        O = (i *= ((1 + 2 * e * Math.random() - e) * v) / V),
        b = [],
        I = 0,
        A = 0,
        T = 0,
        R = 1,
        M = 0,
        z = 0,
        L = 0,
        k,
        _;
      for (
        s = 99 + V * s,
          y *= V,
          h *= V,
          r *= V,
          g *= V,
          l *= (500 * v) / V ** 3,
          u *= v / V,
          d *= v / V,
          c *= V,
          p = (V * p) | 0,
          _ = (s + y + h + r + g) | 0;
        T < _;
        b[T++] = L
      )
        ++z % ((100 * x) | 0) ||
          ((L = a
            ? 1 < a
              ? 2 < a
                ? 3 < a
                  ? Math.sin((I % v) ** 3)
                  : Math.max(Math.min(Math.tan(I), 1), -1)
                : 1 - (((((2 * I) / v) % 2) + 2) % 2)
              : 1 - 4 * Math.abs(Math.round(I / v) - I / v)
            : Math.sin(I)),
          (L =
            (p ? 1 - w + w * Math.sin((2 * Math.PI * T) / p) : 1) *
            (0 < L ? 1 : -1) *
            Math.abs(L) ** n *
            t *
            Q *
            (T < s
              ? T / s
              : T < s + y
              ? 1 - ((T - s) / y) * (1 - m)
              : T < s + y + h
              ? m
              : T < _ - g
              ? ((_ - T - g) / r) * m
              : 0)),
          (L = g ? L / 2 + (g > T ? 0 : ((T < _ - g ? 1 : (_ - T) / g) * b[(T - g) | 0]) / 2) : L)),
          (k = (i += o += l) * Math.sin(A * u - E)),
          (I += k - k * f * (1 - ((1e9 * (Math.sin(T) + 1)) % 2))),
          (A += k - k * f * (1 - ((1e9 * (Math.sin(T) ** 2 + 1)) % 2))),
          R && ++R > c && ((i += d), (O += d), (R = 0)),
          !p || ++M % p || ((i = O), (o = S), (R = R || 1));
      return b;
    },
    Q = 0.3,
    V = 44100,
    c = new (window.AudioContext || webkitAudioContext)();
  class tt extends i {
    init(t) {
      t = {
        name: "ship",
        spawning: !0,
        y: 248,
        imune: !1,
        dying: !1,
        shield: 100,
        lives: 3,
        score: 0,
        fireLevel: 0,
        firing: !1,
        fireTimeout: null,
        anchor: {
          x: 0.5,
          y: 0.5,
        },
        sprite: 1,
        ...t,
      };
      super.init(t), this.spawn();
    }
    powerUp(t) {
      F(D.powerup),
        "shield" === t.type && ((this.shield += 50), 100 < this.shield) && (this.shield = 100),
        "fire" === t.type &&
          (this.fireLevel++, 4 < this.fireLevel && (this.fireLevel = 4), 4 === this.fireLevel) &&
          (clearTimeout(this.fireTimeout),
          j("start-fire-timer"),
          (this.fireTimeout = C(() => {
            j("end-fire-timer"), 4 === this.fireLevel && (this.fireLevel = 3);
          }, 3e4)));
    }
    fire() {
      this.firing ||
        ((this.firing = !0),
        j("ship-fire", this.x - 1, this.y - 8, H(-0.3, 0.3)),
        0 < this.fireLevel && j("ship-fire", this.x - 1, this.y - 8, H(-0.5, 0.5)),
        1 < this.fireLevel &&
          C(() => {
            j("ship-fire", this.x - 1, this.y - 8, H(-0.3, 0.3)), j("ship-fire", this.x - 1, this.y - 8, H(-0.5, 0.5));
          }, 100),
        2 < this.fireLevel &&
          C(() => {
            j("ship-fire", this.x - 1, this.y - 8, -2), j("ship-fire", this.x - 1, this.y - 8, 2);
          }, 400),
        3 < this.fireLevel &&
          C(() => {
            j("ship-fire", this.x - 16, this.y - 4, H(-0.1, 0.1)),
              j("ship-fire", this.x + 14, this.y - 4, H(-0.1, 0.1));
          }, 200),
        C(() => {
          this.firing = !1;
        }, 200));
    }
    die() {
      j("ship-die"),
        j("explosion", this.x, this.y - 4, 60, 4, "white"),
        (this.dying = !0),
        (this.ttl = 0),
        this.lives--,
        (this.imune = !0),
        (this.dx = 0),
        (this.ddx = 0),
        (this.x = 128),
        C(() => {
          this.spawn();
        }, 1e3);
    }
    spawn() {
      (this.imune = !0),
        (this.spawning = !0),
        (this.ttl = 1 / 0),
        (this.y = 248),
        (this.frame = 0),
        (this.shield = 100),
        (this.fireLevel = 0),
        C(() => {
          (this.spawning = !1), (this.imune = !1);
        }, 1e3);
    }
    update() {
      (this.ddx = 0),
        (this.ddy = 0),
        (this.dx *= 0.96),
        (this.dy *= 0.96),
        (this.sprite = 1),
        h(["d", "arrowright"]) && this.dx < 5 && ((this.ddx = 0.2), (this.sprite = 2)),
        h(["a", "arrowleft"]) && -5 < this.dx && ((this.ddx = -0.2), (this.sprite = 0)),
        this.spawning ||
          (h(["s", "arrowdown"]) && this.dy < 5 && (this.ddy = 0.2),
          h(["w", "arrowup"]) && -5 < this.dy && (this.ddy = -0.2)),
        !this.firing && h("space") && this.fire(),
        this.spawning && ((this.ddy = -0.03), (this.scaleX = this.scaleY = _(1, 2, 2 - this.frame / 60))),
        this.shield <= 0 && this.die(),
        this.advance(),
        this.x < 4 && ((this.x = 4), (this.dx = 0)),
        252 < this.x && ((this.x = 252), (this.dx = 0)),
        this.y < 4 && ((this.y = 4), (this.dy = 0)),
        236 < this.y && ((this.y = 236), (this.dy = 0));
    }
    draw() {
      var { context: t, width: e, height: i } = this;
      t.drawImage(this.spritesheet[0], this.spritesheet[1] * this.sprite, 0, e, i, 0, 0, e, i);
      let s = 1;
      this.ddy < 0 && (s = this.frame % 10 < 5 ? 2 : 3),
        (t.fillStyle = "#FFaa33"),
        t.fillRect(3, 7, 2, s),
        (t.fillStyle = "#FF6633"),
        t.fillRect(this.frame % 10 < 5 ? 3 : 4, 7 + s, 1, s),
        4 === this.fireLevel && ((t.fillStyle = "#FFF"), t.fillRect(18, 4, 2, 2), t.fillRect(-12, 4, 2, 2)),
        this.hitted &&
          ((t.globalCompositeOperation = "source-atop"),
          (t.fillStyle = "red"),
          t.fillRect(0, 0, e, i),
          (t.globalCompositeOperation = "source-over"));
    }
  }
  class b {
    constructor({ create: t, maxSize: e = 1024 } = {}) {
      let i;
      if (
        !t ||
        !(i = t({
          id: "",
        })) ||
        !(i.update && i.init && i.isAlive && i.render)
      )
        throw Error(
          "Must provide create() function which returns an object with init(), update(), render(), and isAlive() functions"
        );
      (this._c = t),
        (this.objects = [
          t({
            id: "",
          }),
        ]),
        (this.size = 0),
        (this.maxSize = e);
    }
    get(t = {}) {
      if (this.size == this.objects.length) {
        if (this.size == this.maxSize) return;
        for (let t = 0; t < this.size && this.objects.length < this.maxSize; t++) this.objects.push(this._c());
      }
      var e = this.objects[this.size];
      return this.size++, e.init(t), e;
    }
    getAliveObjects() {
      return this.objects.slice(0, this.size);
    }
    clear() {
      (this.size = this.objects.length = 0), this.objects.push(this._c());
    }
    update(e) {
      var i;
      let s = !1;
      for (let t = this.size; t--; ) (i = this.objects[t]).update(e), i.isAlive() || ((s = !0), this.size--);
      s && this.objects.sort((t, e) => e.isAlive() - t.isAlive());
    }
    render() {
      for (let t = this.size; t--; ) this.objects[t].render();
    }
  }

  function W(t) {
    return new b(t);
  }

  function X(e = 1) {
    var i = W({
      create: Y,
      maxSize: 241,
    });
    (i.increaseVel = function (e) {
      this.objects.forEach((t) => {
        t.dy = t.dy * e;
      });
    }),
      (i.decreaseVel = function (e) {
        this.objects.forEach((t) => {
          t.dy = t.dy / e;
        });
      }),
      (i.velocity = e);
    for (let t = 0; t < 240; t++) {
      var s = H(1, 3) * e,
        h = Math.floor((s / e) * 50) + 50;
      i.get({
        x: Math.floor(H(0, 256)),
        y: t,
        width: 1,
        height: 1,
        dy: s / 4,
        color: `rgb(${h}, ${h}, ${h})`,
        update() {
          this.advance(), 240 < this.y && (this.y = 0);
        },
      });
    }
    return (i.isAlive = () => !0), i;
  }
  class I extends i {
    init(t) {
      t = {
        name: "asteroid",
        spritesheet: [a["spritesheet16.png"], 16, 16],
        sprite: 1,
        width: 16,
        height: 16,
        color: null,
        anchor: {
          x: 0.5,
          y: 0.5,
        },
        shield: 10,
        ...t,
      };
      super.init(t);
    }
    die() {
      j("explosion", this.x, this.y, 50, 4, "white"), j("score", 10), (this.ttl = 0);
    }
    update() {
      (this.rotation = this.frame / (10 / this.dy)),
        this.advance(),
        this.x < 0 || 264 < this.x || (248 < this.y && (this.ttl = 0));
    }
  }

  function et(t) {
    return new I(t);
  }

  function A(t, e) {
    var i = [],
      s = e.x + e.width / 2,
      e = e.y + e.height / 2,
      h = t.y < e,
      e = t.y + t.height >= e;
    return t.x < s && (h && i.push(0), e) && i.push(2), t.x + t.width >= s && (h && i.push(1), e) && i.push(3), i;
  }
  class T {
    constructor({ maxDepth: t = 3, maxObjects: e = 25, bounds: i } = {}) {
      (this.maxDepth = t), (this.maxObjects = e);
      t = o().canvas;
      (this.bounds = i || {
        x: 0,
        y: 0,
        width: t.width,
        height: t.height,
      }),
        (this._b = !1),
        (this._d = 0),
        (this._o = []),
        (this._s = []),
        (this._p = null);
    }
    clear() {
      this._s.map((t) => {
        t.clear();
      }),
        (this._b = !1),
        (this._o.length = 0);
    }
    get(e) {
      let i = new Set();
      return this._s.length && this._b
        ? (A(e, this.bounds).map((t) => {
            this._s[t].get(e).map((t) => i.add(t));
          }),
          Array.from(i))
        : this._o.filter((t) => t !== e);
    }
    add(...t) {
      t.flat().map((t) => {
        this._b
          ? this._a(t)
          : (this._o.push(t),
            this._o.length > this.maxObjects &&
              this._d < this.maxDepth &&
              (this._sp(), this._o.map((t) => this._a(t)), (this._o.length = 0)));
      });
    }
    _a(e) {
      A(e, this.bounds).map((t) => {
        this._s[t].add(e);
      });
    }
    _sp(t, e, i) {
      if (((this._b = !0), !this._s.length))
        for (t = (this.bounds.width / 2) | 0, e = (this.bounds.height / 2) | 0, i = 0; i < 4; i++)
          (this._s[i] = new T({
            bounds: {
              x: this.bounds.x + (i % 2 == 1 ? t : 0),
              y: this.bounds.y + (2 <= i ? e : 0),
              width: t,
              height: e,
            },
            maxDepth: this.maxDepth,
            maxObjects: this.maxObjects,
          })),
            (this._s[i]._d = this._d + 1);
    }
  }

  function B(t) {
    return new T(t);
  }
  class M extends i {
    init(t) {
      t = {
        name: "enemy",
        sprite: 3,
        color: null,
        anchor: {
          x: 0.5,
          y: 0.5,
        },
        shield: 1,
        frame: 0,
        loop: !0,
        firstRun: !0,
        debryColor: "white",
        fireRate: 200,
        speed: 1,
        ...t,
      };
      super.init(t),
        this.path && (this.ttl = Math.floor(t.path.getTotalLength() / this.speed)),
        this.loop && (this.ttl = 1 / 0);
    }
    fire() {
      j("enemy-fire", this.x - 4, this.y - 4, this.rotation, 3);
    }
    die() {
      j("explosion", this.x, this.y, 30, 3, this.debryColor), j("score", 10), (this.ttl = 0);
    }
    update() {
      var t, e;
      (this.rotation = k(180)),
        this.path
          ? ((t = this.path.getPointAtLength(this.frame * this.speed)),
            (e = this.path.getPointAtLength(this.frame * this.speed + 1)),
            (this.x = Math.floor(t.x)),
            (this.y = Math.floor(t.y)),
            this.rotate && (this.rotation = k(90) + Math.atan2(e.y - t.y, e.x - t.x)))
          : ((this.x =
              this.parent.x +
              Math.cos(this.frame / this.parent.childrenSpeed + this.anglePlacement) * this.parent.childrenRadius),
            (this.y =
              this.parent.y +
              Math.sin(this.frame / this.parent.childrenSpeed + this.anglePlacement) * this.parent.childrenRadius)),
        this.firstRun && (this.scaleX = this.scaleY = _(0, 1, (this.frame * this.speed + 1) / 100)),
        !this.loop && this.ttl < 100 && (this.scaleX = this.scaleY = _(0, 1, this.ttl / 100)),
        this.scaleX < 1 && (this.imune = !0),
        1 <= this.scaleX && (this.imune = !1),
        1 == this.scaleX && this.frame % this.fireRate == 0 && this.fire(),
        this.path &&
          this.frame * this.speed >= this.path.getTotalLength() &&
          this.loop &&
          ((this.frame = 0), (this.firstRun = !1)),
        this.frame++,
        this.ttl--;
    }
  }

  function it(t) {
    return new M(t);
  }
  class z extends M {
    init(t) {
      t = {
        name: "boss",
        spritesheet: [a["spritesheet16.png"], 16, 16],
        sprite: 0,
        width: 16,
        height: 16,
        color: null,
        shield: 10,
        debryColor: "white",
        fireRate: 200,
        firing: !1,
        loop: !1,
        imune: !0,
        showStatus: !1,
        timers: [],
        ...t,
      };
      super.init(t), (this.maxShield = this.shield);
    }
    hit(t) {
      super.hit(t),
        (this.showStatus = !0),
        C(() => {
          this.showStatus = !1;
        }, 1e3);
    }
    fire() {
      (this.firing = !0),
        (this.imune = !1),
        (this.timers[0] = C(() => {
          j("boss-fire", this.x, this.y, this.rotation, 3);
        }, 400)),
        (this.timers[1] = C(() => {
          j("boss-fire", this.x, this.y, this.rotation, 3);
        }, 800)),
        (this.timers[2] = C(() => {
          j("boss-fire", this.x, this.y, this.rotation, 3);
        }, 1200)),
        C(() => {
          (this.firing = !1), (this.imune = !0);
        }, 1600);
    }
    die() {
      j("explosion", this.x, this.y, 30, 3, this.debryColor),
        j("score", 10),
        (this.ttl = 0),
        this.timers.map((t) => clearTimeout(t)),
        j("boss-die");
    }
    update() {
      this.firing || super.update(), this.firing || (this.imune = !0);
    }
    draw() {
      var t, e;
      super.draw(),
        this.showStatus &&
          ((t = this["context"]),
          (e = (20 * this.shield) / this.maxShield),
          t.save(),
          t.translate(this.width / 2, this.height / 2),
          t.rotate(-this.rotation),
          (t.fillStyle = "white"),
          t.fillRect(-12, -16, 24, 6),
          (t.fillStyle = "black"),
          t.fillRect(-11, -15, 22, 4),
          (t.fillStyle = "green"),
          this.shield < this.maxShield / 4 && (t.fillStyle = "red"),
          t.fillRect(-10, -14, e, 2),
          t.restore());
    }
  }

  function st(t) {
    return new z(t);
  }
  class ht extends i {
    init(t) {
      t = {
        name: "dialog",
        x: -16,
        y: 200,
        sprites: [10, 11, 12, 13, 14],
        text: G({
          text: "",
          x: 16,
          y: 8,
          align: "left",
        }),
        textIndex: 0,
        texts: [],
        textsIndex: 0,
        spriteIndex: 0,
        frame: 0,
        anchor: {
          x: 0,
          y: 0,
        },
        talking: !1,
        isTalking: !1,
        stopping: !1,
        pauseOnTalk: !0,
        ...t,
      };
      super.init(t);
    }
    skip() {
      0 == this.texts.length ||
        this.textsIndex > this.texts.length ||
        (this.textIndex = this.texts[this.textsIndex].length);
    }
    start(t) {
      (this.stopping = !1),
        setTimeout(() => {
          (this.isTalking = !0), (this.texts = ["", ...t.texts]), (this.frame = 0), (this.pauseOnTalk = t.pauseOnTalk);
        }, 1e3),
        (this.dx = 2);
    }
    stop() {
      (this.stopping = !0),
        (this.text.text = "        "),
        (this.isTalking = !1),
        setTimeout(() => {
          (this.texts = []), (this.textsIndex = 0), (this.textIndex = 0), (this.frame = 0);
        }, 1e3),
        (this.dx = -2);
    }
    update() {
      var t;
      8 < this.x && ((this.dx = 0), (this.x = 8)),
        this.y < -16 && ((this.dx = 0), (this.x = -16)),
        0 != this.texts.length &&
          ((this.talking = !1),
          " " !== (t = this.texts[this.textsIndex] + "      ")[this.textIndex] && (this.talking = !0),
          this.frame % 5 == 0 && (this.textIndex++, " " !== t[this.textIndex]) && F(D.typing),
          this.textsIndex < this.texts.length && (this.text.text = t.slice(0, this.textIndex)),
          this.frame++,
          this.textIndex >= t.length && (this.textsIndex++, (this.frame = 0), (this.textIndex = 0)),
          this.textsIndex >= this.texts.length && !this.stopping && this.stop(),
          this.talking && this.frame % 5 == 0 && this.spriteIndex++,
          this.spriteIndex >= this.sprites.length && (this.spriteIndex = 0),
          super.update());
    }
    draw() {
      var { context: t, spritesheet: e } = this;
      (t.fillStyle = "white"),
        t.fillRect(-2, -2, 12, 12),
        t.drawImage(e[0], 8 * this.sprites[this.spriteIndex], 0, 8, 8, 0, 0, 8, 8),
        t.translate(16, 0),
        this.text.draw();
    }
  }
  const rt = (t) => new ht(t);

  function K(s, t) {
    s.isAlive() &&
      t.forEach((t) => {
        var e, i;
        ("enemy" === s.name && "enemy" === t.name) ||
          (t.isAlive() &&
            !s.imune &&
            !t.imune &&
            ((i = s), (e = x((e = t))), (i = x(i)), e.x < i.x + i.width) &&
            e.x + e.width > i.x &&
            e.y < i.y + i.height &&
            e.y + e.height > i.y &&
            ("ship-bullet" != s.name || t.imune || ((s.ttl = 0), t.hit(1)),
            "ship" != s.name || ("asteroid" != t.name && "boss" != t.name) || (s.die(), (s.ttl = 0), t.hit(5)),
            "ship" == s.name && "enemy" == t.name && (t.die(), (t.ttl = 0), s.hit(50)),
            "ship" == s.name && "enemy-bullet" == t.name && ((t.ttl = 0), s.hit(10)),
            "ship" != s.name || "powerup" != t.name || t.taken || (t.die(), s.powerUp(t))));
      });
  }
  class at extends i {
    init(t) {
      super.init({
        name: "powerup",
        type: "fire",
        width: 16,
        height: 16,
        taken: !1,
        anchor: {
          x: 0.5,
          y: 0.5,
        },
        spritesheet: [a["font.png"], 8, 8],
        ...t,
      });
    }
    die() {
      (this.taken = !0), (this.ttl = 10), (this.frame = 0);
    }
    update() {
      248 < this.y && (this.ttl = 0), super.update();
    }
    draw() {
      var { context: t, type: e, taken: i, frame: s } = this;
      let h, r;
      "shield" === e && ((h = "yellow"), (r = 18)),
        "fire" === e && ((h = "lightblue"), (r = 15)),
        (t.strokeStyle = h),
        (t.lineWidth = 2),
        s % 20 < 10 && !i && t.strokeRect(0, 0, 16, 16),
        (t.fillStyle = h),
        t.fillRect(3, 3, 10, 10),
        t.drawImage(this.spritesheet[0], 8 * r, 0, 8, 8, 4, 4, 8, 8),
        i &&
          ((t.globalAlpha = 1 - this.frame / 10),
          t.strokeRect(-this.frame, -this.frame, 16 + 2 * this.frame, 16 + 2 * this.frame),
          (t.globalAlpha = 1));
    }
  }

  function nt(t) {
    return new at(t);
  }
  const p = {
    spiral:
      "M127 120V43c0-77 99 8 99 77 0 70-35 102-99 102S22 181 22 120s32-84 84-84 85 32 85 84c0 53-28 62-64 62-35 0-68-18-68-62 0-43 25-47 47-47 21 0 48 24 48 47 0 24-7 28-27 28s0-14 0-28Z",
    zigzag: "M287 13-21 61l293 46-293 31 293 48-290 52",
    zigzagLeft: "m-21 13 308 48-293 46 293 31-293 48 291 52",
    zzLeft: "m20 7 50 48-48 46 48 31-48 48 48 52",
    zzRight: "m237 7-50 48 48 46-48 31 48 48-48 52",
    sandClock: "M121 123S-30 40 24 24C78 6 168 7 233 24 298 40-40 214 24 227c63 12 159 12 209 0 51-12-112-104-112-104Z",
    w: "M223-33v238c0 42-61 41-61 0V41c0-44-64-44-64 0v164c0 43-71 33-71 0V-27",
    wReversed: "M27-33v238c0 42 61 41 61 0V41c0-44 64-44 64 0v164c0 43 71 33 71 0V-27",
  };
  const f = [
    [
      {
        500: [3, 400, 4, !0, !0, 1, 0, 200, p.sandClock],
        1e3: [3, 400, 5, !0, !0, 2, 0, 200, p.sandClock],
      },
      {},
      {
        1500: ["fire", 128, 0.6],
      },
      {
        100: [!1, ["CAPTAIN", "    ", "WE DETECTED SOME ENEMY SCOUTS", "BETTER DESTROY THEM"]],
        1e3: [!1, ["TOO LATE!", "THEY ARE COMING", "WITH A FULL FLEET", "    ", "GOOD LUCK!"]],
      },
      [],
    ],
    [
      {
        1e3: [3, 1e3, 3, !0, !1, 1, 0, 200, p.zigzag],
        2e3: [5, 1500, 6, !1, !1, 1, 0, 130, p.zigzagLeft],
      },
      {},
      {
        2500: ["fire", 128, 0.6],
        550: ["shield", 140, 0.3],
      },
      {
        100: [!1, ["TOO LATE!", "THEY ARE COMING", "WITH A FULL FLEET", "    ", "GOOD LUCK!"]],
      },
      [
        0,
        10,
        50,
        "M127 120V43c0-77 99 8 99 77 0 70-35 102-99 102S22 181 22 120s32-84 84-84 85 32 85 84c0 53-28 62-64 62-35 0-68-18-68-62 0-43 25-47 47-47 21 0 48 24 48 47 0 24-7 28-27 28s0-14 0-28Z",
        30,
        8,
        9,
        1,
        20,
        150,
      ],
    ],
    [
      {},
      {
        1e3: [
          13,
          1e3,
          [20, 200, 120, 180, 60, 220, 180, 40, 120, 60],
          [0, -0.1, 0, -0.1, 0.1, -0.1, 0, 0.1, 0, 0.1],
          [1, 0.5, 0.7, 0.5, 0.9, 0.5, 1, 0.8, 0.4, 0.7],
        ],
      },
      {
        1500: ["fire", 128, 0.6],
        2500: ["shield", 140, 0.3],
        3500: ["fire", 128, 0.6],
      },
      {
        100: [
          !1,
          [
            "13 ASTEROIDS DETECTED",
            "      ",
            "OOOPSS...",
            "HOPE THIS DOES NOT TRIGGER",
            "YOUR TRISKAIDEKAPHOBIA...",
            "         ",
          ],
        ],
      },
      [
        0,
        10,
        100,
        "M127 120V43c0-77 99 8 99 77 0 70-35 102-99 102S22 181 22 120s32-84 84-84 85 32 85 84c0 53-28 62-64 62-35 0-68-18-68-62 0-43 25-47 47-47 21 0 48 24 48 47 0 24-7 28-27 28s0-14 0-28Z",
        40,
        4,
        9,
        1,
        60,
        50,
      ],
    ],
    [
      {
        800: [5, 400, 9, !0, !1, 4, 0, 400, p.zigzag],
        810: [5, 400, 9, !0, !1, 4, 0, 400, p.zigzagLeft],
        2e3: [5, 400, 7, !0, !1, 4, 0, 400, p.w],
        2010: [5, 400, 7, !0, !1, 4, 0, 400, p.wReversed],
      },
      {},
      {
        1500: ["fire", 128, 0.6],
      },
      {
        100: [!1, ["THAT CONDITION STILL", "AFFECTING YOUR", "VISION, HUH!?", "         "]],
      },
      [0, 10, 250, p.sandClock, 30, 8, 8, 0, 10, 50],
    ],
    [
      {
        2500: [14, 200, 5, !0, !0, 1, 0, 50, p.spiral],
      },
      {
        1e3: [
          13,
          1e3,
          [20, 200, 120, 180, 60, 220, 180, 40, 120, 60],
          [0, -0.1, 0, -0.1, 0.1, -0.1, 0, 0.1, 0, 0.1],
          [1, 0.5, 0.7, 0.5, 0.9, 0.5, 1, 0.8, 0.4, 0.7],
        ],
      },
      {
        1500: ["fire", 128, 0.6],
      },
      {
        100: [
          !1,
          [
            "HERE COME MORE ASTEROIDS",
            "12 PLUS 1, HEHE!",
            "         ",
            "ALSO 13 SHIPS",
            "        ",
            "OH MAN! NOT AGAIN!",
          ],
        ],
      },
      [],
    ],
    [
      {
        500: [10, 400, 3, !1, !1, 2, 0, 200, p.zzLeft],
        800: [10, 400, 4, !1, !1, 2, 0, 200, p.zzRight],
        1500: [10, 400, 3, !1, !1, 2, 0, 200, p.zzLeft],
        1800: [10, 400, 4, !1, !1, 2, 0, 200, p.zzRight],
        2500: [5, 1e3, 6, !1, !1, 1, 0, 40, p.spiral],
      },
      {},
      {
        1500: ["fire", 128, 0.6],
      },
      {
        100: [!1, ["HMMM... ZIGZAGERS?", "    "]],
      },
      [],
    ],
    [
      {
        500: [3, 400, 4, !0, !1, 4, 1, 100, p.spiral],
        2e3: [3, 1e3, 5, !0, !1, 4, 1, 100, p.sandClock],
      },
      {
        500: [
          30,
          700,
          [220, 180, 40, 120, 60, 20, 200, 120, 180, 60],
          [-0.1, 0, 0.1, 0, 0.1, 0, -0.1, 0, -0.1, 0.1],
          [0.5, 1, 0.8, 0.4, 0.7, 1, 0.5, 0.7, 0.5, 0.9],
        ],
      },
      {
        1500: ["shield", 128, 0.6],
        500: ["fire", 64, 0.3],
      },
      {},
      [0, 60, 150, p.sandClock, 30, 16, 8, 1, 100, 50],
    ],
    [
      {
        500: [5, 1e3, 9, !0, !1, 1, 0, 100, p.w],
        501: [5, 1e3, 9, !0, !1, 1, 0, 100, p.wReversed],
        1500: [5, 1e3, 3, !1, !1, 1, 0, 100, p.zzLeft],
        1501: [5, 1e3, 3, !1, !1, 1, 0, 100, p.zzRight],
      },
      {},
      {
        2500: ["fire", 128, 0.6],
        550: ["shield", 140, 0.3],
      },
      {
        100: [!1, ["THEY JUST KEEP COMING"]],
      },
      [],
    ],
    [
      {
        500: [1, 1e3, 9, !0, !1, 10, 0, 30, p.spiral],
      },
      {},
      {
        1500: ["fire", 128, 0.6],
        2500: ["shield", 140, 0.3],
        3500: ["fire", 128, 0.6],
      },
      {},
      [0, 20, 110, p.spiral, 100, 8, 9, 1, 60, 100],
    ],
    [
      {
        1200: [13, 400, 9, !0, !1, 4, 0, 400, p.zigzag],
        3500: [20, 400, 9, !0, !1, 1, 0, 1e3, p.spiral],
      },
      {
        2e3: [
          30,
          700,
          [20, 200, 120, 180, 60, 220, 180, 40, 120, 60],
          [0, -0.1, 0, -0.1, 0.1, -0.1, 0, 0.1, 0, 0.1],
          [1, 0.5, 0.7, 0.5, 0.9, 0.5, 1, 0.8, 0.4, 0.7],
        ],
      },
      {
        1500: ["fire", 128, 0.6],
      },
      {
        100: [
          !1,
          [
            "HMMM... DETECTING A SHIP",
            "WITH SOME TAG ON IT...",
            "A NUMBER, MAYBE?",
            "YEP, IT IS 13",
            "YIKES! I AM SORRY...",
          ],
        ],
      },
      [0, 30, 150, p.sandClock, 30, 8, 8, 0, 100, 500],
    ],
    [
      {
        2500: [13, 200, 5, !0, !0, 1, 0, 50, p.spiral],
      },
      {
        10: [
          60,
          400,
          [20, 200, 120, 180, 60, 220, 180, 40, 120, 60],
          [0, -0.1, 0, -0.1, 0.1, -0.1, 0, 0.1, 0, 0.1],
          [1, 0.5, 0.7, 0.5, 0.9, 0.5, 1, 0.8, 0.4, 0.7],
        ],
      },
      {
        1500: ["fire", 128, 0.6],
      },
      {
        3e3: [!1, ["CONTROL YOURSELF, CAPTAIN!"]],
      },
      [],
    ],
    [
      {
        1500: [10, 400, 3, !1, !1, 2, 0, 200, p.zzLeft],
        1800: [10, 400, 4, !1, !1, 2, 0, 200, p.zzRight],
        2500: [5, 1e3, 6, !1, !1, 1, 0, 40, p.spiral],
      },
      {},
      {
        1500: ["fire", 64, 0.6],
        1500: ["shield", 156, 0.4],
      },
      {
        100: [
          !1,
          [
            "I GOT A FEELING",
            "THIS NEVER ENDS",
            "       ",
            "MAYBE THAT IS WHY",
            "IT IS A GAME.",
            "       ",
            "OH WELL, LETS KEEP GOING.",
            "BUT HARDER THIS TIME. HEHE!",
          ],
        ],
      },
      [],
    ],
  ];

  function Z(t) {
    var t = f[t],
      e = Math.max(...Object.keys(t[0]), ...Object.keys(t[1]));
    let i = t[0][e];
    return (e += ((i = i ?? t[1][e])[1] / 1e3) * 60 * i[0]);
  }
  const ot = f.length;

  function lt(t = 0, e = 0, i = 0, s = !1) {
    var h,
      r = f[e],
      a = Z(e);
    r[0][t] &&
      j("spawn-enemy", (h = r[0][t])[0], h[1], {
        sprite: h[2],
        rotate: h[3],
        loop: h[4],
        shield: h[5],
        fireMode: h[6],
        fireRate: h[7],
        path: L(h[8]),
      }),
      r[1][t] && j("spawn-asteroid", ...r[1][t]),
      r[2][t] && j("spawn-powerup", ...r[2][t]),
      r[3][t] && j("set-dialog", ...r[3][t]),
      0 === r[4].length && a <= t && 0 === i && j("next-level", e + 1 >= ot ? 0 : e + 1),
      0 < r[4].length && s && 0 === i && j("spawn-boss", ...r[4]);
  }

  const $ = {
    node: null,
    buffer: null,
    audio() {
      const ac = document.querySelector("#audio-control");
      const c = document.querySelector("#control");
      return {
        on() {
          ac.setAttribute("data-audio", "on"), c.setAttribute("src", "audio-on.png");
        },
        off() {
          ac.setAttribute("data-audio", "off"), c.setAttribute("src", "audio-off.png");
        },
        isOn() {
          return ac.getAttribute("data-audio") === "on";
        },
        init(cb) {
          ac.addEventListener("click", cb);
        },
      };
    },
    async set(t) {
      var e = !!this.node;
      e && (await this.stop()), (this.buffer = D[t]), e && (await this.start());
    },
    async play() {
      this.node || ((this.node = F(...this.buffer)), (this.node.loop = !0));
    },
    async stop() {
      this.node && (this.node.stop(), this.node.disconnect(), (this.node = null));
    },
    async mute() {
      await c.suspend(), this.audio().off();
    },
    async unmute() {
      await c.resume(), this.audio().on();
    },
    async toggleMute() {
      this.audio().isOn() ? this.mute() : this.unmute();
    },
    async init() {
      this.audio().init(this.toggleMute.bind(this));
    },
  };

  function dt() {
    U(["esc"], () => {
      var t = localStorage.getItem("hiScore") || 0;
      j("change-scene", "menu", {
        score: r.score,
        previous: t,
      });
      document.body.setAttribute("data-game-state", "exit");
    }),
      U(["p"], () => {
        j("pause");
      }),
      U(["m"], () => {
        $.toggleMute();
      }),
      J(["enter"]),
      U(["enter"], () => i.skip()),
      $.set("song1"),
      $.play();
    const r = new tt({
        x: 120,
        y: 248,
      }),
      e = X(20),
      i = rt(),
      s = rt();
    let h = 0,
      a = 0,
      n = 12 < a ? Math.floor(0.25 * a) : 0,
      o = 0,
      l = !0,
      d = !1,
      c = Z(h),
      p = !1,
      f;
    const u = W({
        create: q,
        maxSize: 400,
      }),
      x = W({
        create: Y,
        maxSize: 40,
      }),
      g = W({
        create: Y,
        maxSize: 400,
      }),
      m = W({
        create: et,
        maxSize: 10,
      }),
      y = W({
        create: it,
        maxSize: 50,
      }),
      w = W({
        create: st,
        maxSize: 4,
      }),
      v = W({
        create: nt,
        maxSize: 4,
      }),
      S = G({
        text: "SCORE 00000",
        x: 8,
        y: 8,
      });
    var t = G({
      text: "HI " + (localStorage.getItem("hiScore") || 0),
      x: 128,
      y: 8,
      color: "gray",
      align: "center",
    });
    const E = G({
      x: 218,
      y: 8,
      text: "@@@",
      color: "red",
    });
    var O = G({
      x: 128,
      y: 120,
      text: "LEVEL 1",
      align: "center",
      color: "lightgreen",
      ttl: 0,
    });
    const b = G({
      x: 248,
      y: 224,
      text: "FIRE PODS :00",
      align: "right",
      color: "gray",
      ttl: 0,
    });
    var I = Y({
      x: 188,
      y: 8,
      width: 24,
      height: 8,
      anchor: {
        x: 0,
        y: 0,
      },
      draw() {
        var t = this["context"],
          e = 0 <= r.shield ? r.shield / 5 : 0;
        (t.strokeStyle = "white"),
          (t.lineWidth = 2),
          t.strokeRect(0, 0, this.width, this.height),
          (t.fillStyle = "green"),
          r.shield < 25 && (t.fillStyle = "red"),
          t.fillRect(2, 2, e, this.height - 4);
      },
    });
    const A = Y({
      x: 0,
      y: 0,
      active: !1,
      radius: 384,
      update() {},
      update() {
        this.active && 60 < this.radius && (this.radius -= 2),
          !this.active && this.radius < 384 && (this.radius += 1),
          this.advance();
      },
      draw() {
        var t = this["context"];
        t.save(),
          t.beginPath(),
          (t.strokeStyle = "white"),
          (t.lineWidth = 3),
          t.arc(r.x, r.y, this.radius, 0, 2 * Math.PI, !0),
          t.clip(),
          t.stroke();
      },
      start() {
        F(D.transition), (this.radius = 384), (this.active = !0);
      },
      end() {
        F(D.transition), (this.active = !1);
      },
      render() {
        this.draw();
      },
    });
    var T = Y({
      x: 0,
      y: 0,
      update() {},
      draw() {
        var t = this["context"];
        t.restore();
      },
      render() {
        this.draw();
      },
    });
    N("hit", () => {
      F(D.hit);
    }),
      N("explosion", (e, i, s, h, r) => {
        F(D.explosion);
        for (let t = 0; t < s; t++)
          t % 2 == 0 &&
            u.get({
              x: e,
              y: i,
              dx: H(-1, 1) / 2,
              dy: H(-1, 1) / 2,
              color: null,
              ttl: 30,
            }),
            u.get({
              x: e,
              y: i,
              dx: H(-h / 2, h / 2),
              dy: H(-h / 2, h / 2),
              color: r,
              ttl: 30 * h,
            });
      }),
      N("ship-fire", (t, e, i) => {
        F(D.shoot),
          x.get({
            name: "ship-bullet",
            x: t,
            y: e,
            width: 2,
            height: 4,
            dy: -4,
            dx: i,
            color: null,
            sprite: 16,
            ttl: 100,
            update() {
              this.advance(), this.y < 0 && (this.ttl = 0);
            },
          });
      }),
      N("ship-die", () => {
        j("spawn-powerup", "fire", 128, 0.6);
      }),
      N("enemy-fire", (t, e) => {
        F(D.shoot);
        var i = r.x - 4 - t,
          s = r.y - 4 - e,
          h = +Math.hypot(i, s);
        g.get({
          name: "enemy-bullet",
          x: t + 4,
          y: e + 4,
          dx: i / h,
          dy: s / h,
          width: 2,
          height: 2,
          color: "red",
          ttl: 300,
        });
      }),
      N("boss-fire", (e, i) => {
        F(D.shoot2);
        for (let t = 0; t < 12; t++) {
          var s = +Math.cos(k(30 * t)),
            h = +Math.sin(k(30 * t));
          g.get({
            name: "enemy-bullet",
            x: e,
            y: i,
            dx: s,
            dy: h,
            width: 2,
            height: 2,
            color: "red",
            ttl: 400,
          });
        }
      }),
      N("score", (t) => {
        r.score += Math.floor(t + 2 * n);
        document.body.setAttribute("data-game-score", r.score);
        var t = localStorage.getItem("hiScore") || 0;
        r.score > t && localStorage.setItem("hiScore", r.score);
      }),
      N("spawn-boss", (t, e, i, s, h, r, a, n, o, l) => {
        (d = !1),
          j("spawn-enemy", r, 0, {
            sprite: a,
            shield: 2,
            fireRate: l,
            fireMode: n,
            parent: w.get({
              sprite: t,
              shield: e,
              fireRate: i,
              rotate: !1,
              loop: !0,
              imune: !0,
              debryColor: "pink",
              childrenSpeed: o,
              childrenRadius: h,
              path: L(s),
            }),
            path: null,
          });
      }),
      N("spawn-enemy", (e, i, s) => {
        13 === e && (A.start(), C(() => A.end(), 15e3)), (e += n);
        for (let t = 0; t < e; t++) {
          var h = t * (360 / e);
          const r = _(1, 2, s.sprite / 4);
          C(
            (t) => {
              y.get({
                ...s,
                speed: r,
                anglePlacement: k(t),
                shield: s.shield + n,
              });
            },
            t * i,
            h
          );
        }
      }),
      N("spawn-asteroid", (e, i, s, h, r) => {
        13 === e && (A.start(), C(() => A.end(), 15e3));
        let a = 0;
        for (let t = 0; t < e; t++)
          a > s.length - 1 && (a = 0),
            C(
              (t, e) => {
                m.get({
                  x: s[e],
                  y: -8,
                  dx: h[e],
                  dy: r[e],
                  shield: 10 + n,
                });
              },
              t * i,
              t,
              a
            ),
            a++;
      }),
      N("spawn-powerup", (t, e, i) => {
        ("shield" === t && p) ||
          v.get({
            type: t,
            x: e,
            y: -8,
            dy: i,
          });
      }),
      N("set-dialog", (t, e) => {
        t
          ? s.start({
              texts: e,
              pauseOnTalk: !0,
            })
          : i.start({
              texts: e,
              pauseOnTalk: !1,
            });
      }),
      N("next-level", (t) => {
        (d = !1),
          (h = t),
          a++,
          (o = 0),
          (l = !1),
          (c = Z(t)),
          (n = 12 < a ? Math.floor(0.25 * a) : 0),
          j("score", 100),
          12 === a && j("level-13"),
          25 === a && j("level-26");
      }),
      N("boss-die", () => {
        j("score", 200), j("next-level", (h = ++h >= ot ? 0 : h));
      }),
      N("game-over", () => {
        var t = localStorage.getItem("hiScore") || 0;
        j("change-scene", "game-over", {
          score: r.score,
          previous: t,
        });
        document.body.setAttribute("data-game-state", "game-over");
      }),
      N("start-fire-timer", () => {
        (f = performance.now() + 3e4), (b.ttl = 1 / 0);
      }),
      N("end-fire-timer", () => {
        (f = null), (b.ttl = 0);
      }),
      N("level-13", () => {
        j("set-dialog", !0, ["LETS MAKE THIS", "INSTERESTING.", "NOW WITH ONE LIFE ONLY"]),
          (r.lives = 1),
          (r.shield = 100);
      }),
      N("level-26", () => {
        j("set-dialog", !0, ["HEY! YOU ARE GOOD AT THIS!", "NOW ONE HIT AND YOU DIE!", "AND NO SHIELD POWERUPS."]),
          (r.lives = 1),
          (r.shield = 10),
          (p = !0);
      });
    const R = B(),
      M = B(),
      z = B();
    return P({
      children: [A, e, x, g, r, y, w, m, v, u, T, i, s, I, O, S, t, E, b],
      gameOver: !1,
      update() {
        var t;
        (this.paused = !1),
          s.isTalking && s.pauseOnTalk
            ? (s.update(), (this.paused = !0))
            : ((b.text = "PODS " + (f ? Math.floor((f - performance.now()) / 1e3) : "00")),
              (t = y.size + m.size),
              o === c && (d = !0),
              lt(o, h, t, d),
              r.lives <= 0 && !this.gameOver
                ? ((this.gameOver = !0), C(() => j("game-over"), 1e3))
                : (x.getAliveObjects().forEach((t) => {
                    R.clear(), R.add(t, m.getAliveObjects(), y.getAliveObjects(), w.getAliveObjects()), K(t, R.get(t));
                  }),
                  M.clear(),
                  M.add(
                    r,
                    m.getAliveObjects(),
                    y.getAliveObjects(),
                    g.getAliveObjects(),
                    w.getAliveObjects(),
                    v.getAliveObjects()
                  ),
                  K(r, M.get(r)),
                  z.clear(),
                  z.add(m.getAliveObjects()),
                  m.getAliveObjects().forEach((t) => {
                    K(t, z.get(t));
                  }),
                  (S.text = "SCORE " + r.score),
                  (E.text = "@@@".slice(0, r.lives)),
                  l && 40 < o && o < 140 && o % 20 == 0 && e.decreaseVel(2),
                  o++));
      },
    });
  }

  function ct() {
    U(["enter"], () => {
      j("change-scene", "game");
      document.body.setAttribute("data-game-state", "game");
    }),
      J(["esc"]);
    const t = X(20),
      e = G({
        x: 128,
        y: 24,
        text: "BLIND FEAR",
        align: "center",
        color: "#F95465",
        scaleX: 2,
        scaleY: 4,
      }),
      s = G({
        x: 128,
        y: 70,
        text: "HIGH SCORE: " + (localStorage.getItem("hiScore") || 0),
        align: "center",
        color: "#01EC97",
      }),
      h = G({
        x: 128,
        y: 130,
        text: "PRESS ESCAPE TO EXIT THE GAME\nPRESS M TO MUTE AUDIO",
        lineHeight: 16,
        scaleX: 0.5,
        align: "center",
        color: "#72A2FF",
      });
    var a = G({
      x: 128,
      y: 224,
      text: "PRESS ENTER TO START",
      color: "#01EC97",
      align: "center",
    });
    const n = P({
      frame: 0,
      children: [t, a],
      update() {
        40 < this.frame && this.frame < 140 && this.frame % 20 == 0 && t.decreaseVel(2), this.frame++;
      },
    });
    return (
      C(() => {
        n.add(e);
      }, 1e3),
      C(() => {
        n.add(s);
      }, 2e3),
      C(() => {
        n.add(h);
      }, 3e3),
      n
    );
  }
  var pt = (i, s, h, t = 125) => {
      let r,
        a,
        n,
        o,
        l,
        d,
        c,
        p,
        f,
        u,
        x,
        g,
        m,
        y,
        w = 0,
        v = [],
        S = [],
        E = [],
        O = 0,
        b = 0,
        I = 1,
        A = {},
        T = ((V / t) * 60) >> 2;
      for (; I; O++)
        (v = [(I = p = g = 0)]),
          h.map((t, e) => {
            for (
              c = s[t][O] || [0, 0, 0],
                I |= !!s[t][O],
                y = g + (s[t][0].length - 2 - !p) * T,
                m = e == h.length - 1,
                a = 2,
                o = g;
              a < c.length + m;
              p = ++a
            ) {
              for (
                l = c[a], f = (a == c.length + m - 1 && m) || (u != (c[0] || 0)) | l | 0, n = 0;
                n < T && p;
                n++ > T - 99 && f && (x += (x < 1) / 99)
              )
                (d = ((1 - x) * v[w++]) / 2 || 0), (S[o] = (S[o] || 0) - d * b + d), (E[o] = (E[o++] || 0) + d * b + d);
              l &&
                ((x = l % 1), (b = c[1] || 0), (l |= 0)) &&
                (v = A[[(u = c[(w = 0)] || 0), l]] =
                  A[[u, l]] || (((r = [...i[u]])[2] *= 2 ** ((l - 12) / 12)), 0 < l ? R(...r) : []));
            }
            g = y;
          });
      return [S, E];
    },
    ft = [
      [
        [, 0, 77, , , 0.7, 2, 0.41, , , , , , , , 0.06],
        [, 0, 43, 0.01, , 0.3, 2, , , , , , , , , 0.02, 0.01],
        [, 0, 170, 0.003, , 0.008, , 0.97, -35, 53, , , , , , 0.1],
        [0.8, 0, 270, , , 0.12, 3, 1.65, -2, , , , , 4.5, , 0.02],
        [, 0, 86, , , , , 0.7, , , , 0.5, , 6.7, 1, 0.05],
        [, 0, 41, , 0.05, 0.4, 2, 0, , , 9, 0.01, , , , 0.08, 0.02],
        [, 0, 2200, , , 0.04, 3, 2, , , 800, 0.02, , 4.8, , 0.01, 0.1],
        [0.3, 0, 16, , , 0.3, 3],
      ],
      [
        [
          [
            1, -1, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33,
            21, 21, 33, 21, 21, 33, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 33, 21, 21, 33, 21,
            21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 33,
          ],
          [
            3,
            1,
            22,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            22,
            ,
            22,
            ,
            22,
            ,
            ,
            ,
          ],
          [
            5,
            -1,
            21,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            23,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            23,
            ,
            21,
            ,
            ,
            ,
          ],
          [
            ,
            1,
            21,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            23,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            23,
            ,
            21,
            ,
            ,
            ,
          ],
        ],
        [
          [
            1, -1, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33,
            21, 21, 33, 21, 21, 33, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 33, 21, 21, 33, 21,
            21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 33,
          ],
          [
            3,
            1,
            24,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            27,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            27,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            27,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            24,
            ,
            24,
            ,
            ,
            ,
          ],
          [
            5,
            -1,
            21,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            23,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            23,
            ,
            21,
            ,
            ,
            ,
          ],
          [
            ,
            1,
            21,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            23,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            23,
            ,
            21,
            ,
            ,
            ,
          ],
          [
            6,
            1,
            ,
            ,
            34,
            34,
            34,
            ,
            ,
            ,
            ,
            ,
            34,
            34,
            ,
            ,
            ,
            ,
            34,
            ,
            ,
            ,
            34,
            34,
            ,
            ,
            ,
            ,
            34,
            ,
            ,
            ,
            34,
            ,
            ,
            ,
            34,
            34,
            34,
            ,
            ,
            ,
            ,
            ,
            34,
            ,
            ,
            ,
            ,
            ,
            34,
            34,
            ,
            ,
            34,
            34,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            34,
            34,
          ],
          [
            4,
            1,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            24,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            24,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            24,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
          ],
        ],
        [
          [
            1, -1, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33,
            21, 21, 33, 21, 21, 33, 33, 23, 23, 35, 23, 23, 36, 23, 23, 35, 23, 23, 36, 23, 23, 35, 35, 23, 23, 35, 23,
            23, 35, 23, 23, 36, 23, 23, 35, 23, 23, 36, 36,
          ],
          [
            5,
            -1,
            21,
            ,
            ,
            19,
            ,
            ,
            21,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            21,
            ,
            ,
            19,
            ,
            ,
            17,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
          ],
          [
            3,
            1,
            24,
            ,
            ,
            24,
            ,
            ,
            24,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24,
            ,
            ,
            24,
            ,
            ,
            24,
            ,
            ,
            ,
            24.75,
            24.5,
            24.26,
            24.01,
            24.01,
            24.01,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            25,
            25,
            25,
          ],
          [
            4,
            -1,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            24.75,
            24.5,
            24.26,
            24.01,
            24.01,
            24.01,
            24.01,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
          ],
          [
            7,
            -1,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            23,
            ,
            21,
            23,
            ,
            35,
            ,
            23,
            ,
            21,
            23,
            ,
            35,
            ,
            35,
            ,
            23,
            ,
            21,
            23,
            ,
            35,
            ,
            21,
            23,
            ,
            35,
            ,
            21,
            23,
            ,
            ,
          ],
          [
            6,
            1,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            34,
            36,
            34,
            ,
            33,
            34,
            34,
            36,
            31,
            36,
            34,
            ,
            31,
            34,
            32,
            ,
            33,
            36,
            34,
            ,
            31,
            34,
            34,
            36,
            33,
            36,
            33,
            ,
            31,
            ,
            ,
          ],
        ],
        [
          [
            1, -1, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33, 33, 21, 21, 33, 21, 21, 33, 21, 21, 33,
            21, 21, 33, 21, 21, 33, 33, 17, 17, 29, 17, 17, 29, 17, 17, 29, 17, 17, 29, 17, 17, 29, 29, 17, 17, 29, 17,
            17, 29, 17, 17, 29, 17, 17, 29, 17, 17, 29, 29,
          ],
          [
            4,
            1,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            ,
            ,
            24,
            24,
            ,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
          ],
          [
            7,
            -1,
            21,
            ,
            19,
            21,
            ,
            33,
            ,
            21,
            ,
            19,
            21,
            ,
            33,
            ,
            33,
            ,
            21,
            ,
            19,
            21,
            ,
            33,
            ,
            21,
            ,
            19,
            21,
            ,
            33,
            ,
            33,
            ,
            17,
            ,
            17,
            17,
            29,
            17,
            17,
            29,
            17,
            ,
            17,
            17,
            29,
            17,
            17,
            29,
            17,
            ,
            17,
            17,
            29,
            17,
            17,
            29,
            17,
            ,
            17,
            17,
            29,
            17,
            17,
            29,
          ],
          [
            2,
            1,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            ,
            ,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            34,
            34,
            ,
            34,
            ,
            ,
          ],
          [
            6,
            1,
            ,
            ,
            36,
            ,
            ,
            ,
            ,
            ,
            36,
            ,
            36,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            36,
            ,
            ,
            ,
            ,
            ,
            36,
            ,
            36,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            36,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            36,
            ,
            ,
            ,
            ,
            ,
            36,
            ,
            36,
            ,
            ,
            ,
            ,
            ,
          ],
          [
            3,
            1,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            25,
            25,
            25,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            25,
            25,
            25,
          ],
        ],
        [
          [
            1, -1, 14, 14, 26, 14, 14, 26, 14, 14, 26, 14, 14, 26, 14, 14, 26, 26, 14, 14, 26, 14, 14, 26, 14, 14, 26,
            14, 14, 26, 14, 14, 26, 26, 17, 17, 29, 17, 17, 29, 17, 17, 29, 17, 17, 29, 17, 17, 29, 29, 19, 19, 31, 19,
            19, 31, 19, 19, 31, 19, 19, 31, 19, 19, 31, 31,
          ],
          [
            4,
            1,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            36,
            ,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
            24,
            24,
            ,
            24,
            24,
            ,
            24,
            24,
          ],
          [
            7,
            -1,
            14,
            ,
            14,
            14,
            26,
            14,
            14,
            26,
            14,
            ,
            14,
            14,
            26,
            14,
            14,
            26,
            14,
            ,
            14,
            14,
            26,
            14,
            14,
            26,
            14,
            ,
            14,
            14,
            26,
            14,
            14,
            26,
            17,
            ,
            17,
            17,
            29,
            17,
            17,
            29,
            17,
            ,
            17,
            17,
            29,
            17,
            17,
            29,
            19,
            ,
            19,
            19,
            31,
            19,
            19,
            31,
            19,
            ,
            19,
            19,
            31,
            19,
            19,
            31,
          ],
          [
            2,
            1,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            ,
            ,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            36,
            36,
            ,
            36,
            ,
            ,
          ],
          [
            3,
            1,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            25,
            25,
            25,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            25,
            25,
            25,
            25,
          ],
          [
            6,
            1,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            34,
            ,
            ,
            ,
            ,
            ,
            34,
            ,
            34,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            34,
            ,
            ,
            ,
            ,
            ,
            34,
            ,
            34,
            ,
            ,
            ,
            ,
            ,
          ],
        ],
      ],
      [0, 1, 1, 2, 3, 4, 4],
    ],
    ut = [, , 45, 0.03, 0.21, 0.6, 4, 0.9, 2, -3, , , , 0.2, , 0.9, , 0.45, 0.26],
    xt = [0.9, , 413, , 0.05, 0.01, 1, 3.8, -3, -13.4, , , , , , , 0.11, 0.65, 0.07, , 237],
    gt = [1.5, , 261, 0.01, 0.02, 0.08, 1, 1.5, -0.5, , , -0.5, , , , , 0.9, 0.05],
    mt = [1.6, , 291, 0.01, 0.21, 0.35, , 2.2, , , -136, 0.09, 0.03, , , 0.2, 0.2, 0.7, 0.28],
    yt = [, , 468, 0.05, 0.62, 0.7, , 0.3, , , 300, 0.05, 0.02, , , , 0.32, , 0.6],
    wt = [0.8, , 112, 0.03, 0.1, 0.2, 3, 3.6, 18, -9, , , , , , , 0.03, 0.83, 0.12],
    vt = [2.3, , 330, , 0.06, 0.17, 2, 3.7, , , , , 0.05, 0.4, 2, 0.5, 0.13, 0.89, 0.05, 0.17],
    u =
      ((u = document.getElementById("c").getContext("2d")),
      (window.zyxplay = window.zyxplay || {}),
      (window.zyxplay.context = u));
  (u.imageSmoothingEnabled = !1),
    u.setTransform(1, 0, 0, 1, 0, 0),
    (async () => {
      {
        let t;
        for (t = 0; t < 26; t++) d["Key" + String.fromCharCode(t + 65)] = String.fromCharCode(t + 97);
        for (t = 0; t < 10; t++) d["Digit" + t] = d["Numpad" + t] = "" + t;
        window.addEventListener("keydown", E), window.addEventListener("keyup", O);
      }

      function i(t, e) {
        var i, s;
        switch (
          ((i = ["change-scene"]),
          (s = Object.keys(r).reduce((t, e) => (i.includes(e) && (t[e] = r[e]), t), {})),
          (r = s),
          $.stop(),
          t)
        ) {
          case "game":
            h = dt();
            break;
          case "menu":
            h = ct();
            break;
          case "game-over":
            console.log("game-over", e),
              (h = (function ({ score: t = 0, previous: e = localStorage.getItem("hiScore") || 0 } = {}) {
                U(["enter"], () => {
                  j("change-scene", "menu");
                  document.body.setAttribute("data-game-state", "menu");
                }),
                  N("explosion", (e, i, s, h, r) => {
                    F(D.explosion);
                    for (let t = 0; t < s; t++)
                      a.get({
                        x: e,
                        y: i,
                        dx: H(-h / 2, h / 2),
                        dy: H(-h / 2, h / 2),
                        color: r,
                        ttl: 30 * h,
                      });
                  });
                var i = X(1);
                const a = W({
                    create: q,
                    maxSize: 400,
                  }),
                  s = G({
                    x: 128,
                    y: 32,
                    text: "GAME OVER",
                    align: "center",
                    color: "#F95465",
                    scaleX: 2,
                    scaleY: 4,
                  }),
                  h = G({
                    x: 128,
                    y: 80,
                    text: "YOUR SCORE:",
                    color: "#72A2FF",
                    align: "center",
                  }),
                  r = G({
                    x: 128,
                    y: 96,
                    text: "" + t,
                    color: "#01EC97",
                    align: "center",
                    scaleX: 2,
                    scaleY: 2,
                  }),
                  n = G({
                    x: 128,
                    y: 128,
                    text: "NEW HIGH SCORE!",
                    color: "#FFFF00",
                    align: "center",
                  }),
                  o = P({
                    frame: 0,
                    children: [
                      i,
                      G({
                        x: 128,
                        y: 224,
                        text: "ENTER TO CONTINUE",
                        color: "#01EC97",
                        align: "center",
                      }),
                      a,
                    ],
                  });
                return (
                  C(() => {
                    o.add(s);
                  }, 1e3),
                  C(() => {
                    o.add(h);
                  }, 2e3),
                  C(() => {
                    o.add(r);
                  }, 2500),
                  e < t &&
                    C(() => {
                      o.add(n), j("explosion", 128, 132, 60, 4, "yellow");
                    }, 3e3),
                  o
                );
              })(e));
        }
      }
      await t("song1", pt, ft),
        await t("explosion", R, ut),
        await t("shoot", R, xt),
        await t("shoot2", R, wt),
        await t("typing", R, gt),
        await t("powerup", R, mt),
        await t("hit", R, vt),
        await t("transition", R, yt),
        await e("font.png"),
        await e("spritesheet.png"),
        await e("spritesheet16.png"),
        $.init(),
        N("change-scene", (t, e) => i(t, e));
      let h = ct();
      (function ({ update: t, render: e }) {
        let i = 0,
          s,
          h,
          r;
        const a = o();

        function n() {
          if ((requestAnimationFrame(n), (h = performance.now()), (r = h - s), (s = h), !(1e3 < r))) {
            for (i += r; i >= 1e3 / 60; ) t(1 / 60), (i -= 1e3 / 60);
            a.clearRect(0, 0, a.canvas.width, a.canvas.height), e();
          }
        }
        return {
          start() {
            (s = performance.now()), requestAnimationFrame(n);
          },
        };
      })({
        update(t) {
          h.update(t);
        },
        render() {
          h.render();
        },
      }).start();
    })();
})();
