/* Árvore de habilidades interativa.
 *
 * Lê skill-tree/skills.yml (fonte única), desenha as disciplinas em anéis — um por
 * semestre, do 1º no centro ao 8º na borda — e as habilidades de cada disciplina como
 * satélites ao redor dela. O estudante marca as disciplinas concluídas; as que ficam
 * disponíveis (todos os pré-requisitos de semestres anteriores cumpridos) passam a
 * pulsar. O progresso fica salvo apenas no navegador (localStorage).
 */
(function () {
  "use strict";

  const EIXOS = {
    matematica: { nome: "Matemática", cor: "#5aa9ff" },
    eletromagnetismo: { nome: "Eletromagnetismo", cor: "#4fdc8a" },
    quantica: { nome: "Moderna e quântica", cor: "#bb86ff" },
    mecanica: { nome: "Mecânica", cor: "#ff8f4d" },
    "ondas-termo": { nome: "Ondas e termo", cor: "#ffd84d" },
    experimental: { nome: "Experimental", cor: "#e0a86b" },
    computacao: { nome: "Computação", cor: "#9fb0c3" },
  };
  const ORDEM = Object.keys(EIXOS); // sentido horário a partir do topo

  const SIGLA = {
    fb: "FB", c1: "C I", c2: "C II", c3: "C III", c4: "C IV", ml: "ML", mvc: "VC", fm1: "FM I",
    fg1: "FG I", fg2a: "FG IIa", fg2b: "FG IIb", fg3: "FG III", fg4: "FG IV",
    lab1: "L I", lab2: "L II", lab3: "L III", lab4: "L IV", labfm1: "LFM I", labfm2: "LFM II", comp: "CP",
    mg: "MG", ma1: "MA I", ma2: "MA II", em1: "EM I", em2: "EM II", rr: "RR",
    fmod: "FMod", mq1: "MQ I", mq2: "MQ II", termo: "TD",
  };

  const EMENTA = {
    nde: "Ementa do NDE",
    proposta: "Roteiros em proposta",
    "legado-2023": "Ementa transcrita (2023)",
    "a-definir": "Ementa a definir",
  };

  const R0 = 200, DR = 138, R_SKILL = 50, R_COURSE = 25, R_SAT = 7;
  const STORE = "bsc-skilltree-v1";
  const SVGNS = "http://www.w3.org/2000/svg";

  const root = document.getElementById("skill-tree");
  if (!root) return;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const ring = (sem) => R0 + (sem - 1) * DR;

  fetch(root.dataset.src)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then((txt) => start(jsyaml.load(txt)))
    .catch((err) => { root.innerHTML = `<p style="padding:1rem">Não foi possível carregar a árvore (${esc(err)}).</p>`; });

  // ───────────────────────────── Dados ─────────────────────────────
  function buildModel(raw) {
    const all = raw.disciplinas;
    const byId = Object.fromEntries(all.map((c) => [c.id, c]));
    const courses = all.filter((c) => !c.pratica_de).map((c) => ({ ...c, skills: [], praticas: [] }));
    const C = Object.fromEntries(courses.map((c) => [c.id, c]));
    const S = {};
    for (const c of all) {
      const main = C[c.pratica_de || c.id];
      if (c.pratica_de) main.praticas.push(c.nome);
      for (const s of c.habilidades) {
        const sk = { ...s, course: main.id, pratica: !!c.pratica_de, dependentes: [] };
        main.skills.push(sk);
        S[s.id] = sk;
      }
    }
    for (const s of Object.values(S)) for (const r of s.requer) S[r].dependentes.push(s.id);
    for (const c of courses) {
      c.pre = new Set(); c.co = new Set(); c.abre = new Set();
      for (const s of c.skills) for (const r of s.requer) {
        const o = S[r].course;
        if (o === c.id) continue;
        (C[o].semestre < c.semestre ? c.pre : c.co).add(o);
      }
    }
    for (const c of courses) for (const p of c.pre) C[p].abre.add(c.id);
    // Redução transitiva das dependências entre disciplinas: só as arestas diretas
    // essenciais são desenhadas; a disponibilidade usa o conjunto completo.
    const reach = (a, b, skipDirect) => {
      const stack = [...C[a].abre].filter((x) => !(skipDirect && x === b));
      const seen = new Set();
      while (stack.length) {
        const u = stack.pop();
        if (u === b) return true;
        if (!seen.has(u)) { seen.add(u); stack.push(...C[u].abre); }
      }
      return false;
    };
    const edges = [];
    for (const c of courses) for (const t of c.abre) if (!reach(c.id, t, true)) edges.push([c.id, t]);
    return { courses, C, S, edges };
  }

  function layout(model) {
    const { courses } = model;
    // Largura de cada setor = maior número de disciplinas do eixo num mesmo semestre.
    const weight = {};
    for (const e of ORDEM) {
      const counts = {};
      for (const c of courses) if (c.eixo === e) counts[c.semestre] = (counts[c.semestre] || 0) + 1;
      weight[e] = Math.max(1, ...Object.values(counts));
    }
    const total = ORDEM.reduce((a, e) => a + weight[e], 0);
    const sector = {};
    let a = -Math.PI / 2 - (weight[ORDEM[0]] / total) * Math.PI;
    for (const e of ORDEM) {
      const w = (weight[e] / total) * 2 * Math.PI;
      sector[e] = { start: a, width: w, mid: a + w / 2 };
      a += w;
    }
    for (const e of ORDEM) for (let sem = 1; sem <= 8; sem++) {
      const list = courses.filter((c) => c.eixo === e && c.semestre === sem);
      list.forEach((c, j) => {
        const ang = sector[e].start + ((j + 0.5) / list.length) * sector[e].width;
        c.ang = ang;
        c.x = ring(sem) * Math.cos(ang);
        c.y = ring(sem) * Math.sin(ang);
        const n = c.skills.length;
        c.skills.forEach((s, i) => {
          const t = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
          s.x = c.x + R_SKILL * Math.cos(t);
          s.y = c.y + R_SKILL * Math.sin(t);
        });
      });
    }
    model.sector = sector;
  }

  // ───────────────────────────── Estado ─────────────────────────────
  function loadDone(model) {
    try {
      const ids = JSON.parse(localStorage.getItem(STORE) || "[]");
      return new Set(ids.filter((id) => model.C[id]));
    } catch (e) { return new Set(); }
  }
  function saveDone(done) {
    try { localStorage.setItem(STORE, JSON.stringify([...done])); } catch (e) { /* sem armazenamento */ }
  }

  // ───────────────────────────── Interface ─────────────────────────────
  const standalone = root.dataset.mode === "standalone";
  const ementaBase = root.dataset.ementaBase || "";

  function start(raw) {
    const model = buildModel(raw);
    layout(model);
    const { courses, C, S } = model;
    let done = loadDone(model);
    let selected = null;
    let hudCollapsed = (() => { try { return localStorage.getItem(STORE + "-hud") === "1"; } catch (e) { return false; } })();

    const courseState = (c) => (done.has(c.id) ? "done" : [...c.pre].every((p) => done.has(p)) ? "available" : "locked");
    const skillState = (s) => (done.has(s.course) ? "done" : courseState(C[s.course]) === "available" ? "available" : "locked");

    root.innerHTML = `
      <div class="st-map">
        <div class="st-hud" aria-live="polite"></div>
        <div class="st-toasts" aria-live="polite"></div>
        <div class="st-tip" role="tooltip"></div>
        <div class="st-controls">
          <button class="st-btn" data-act="in" aria-label="Ampliar">+</button>
          <button class="st-btn" data-act="out" aria-label="Reduzir">−</button>
          <button class="st-btn" data-act="fit">Ver tudo</button>
          <button class="st-btn" data-act="core">Núcleo comum</button>
          <select class="st-select" aria-label="Simular progresso até o semestre">
            <option value="">Simular até…</option>
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">${s}º semestre</option>`).join("")}
          </select>
          <button class="st-btn" data-act="reset">Reiniciar</button>
          <button class="st-btn" data-act="panel" aria-pressed="false">Ocultar painel</button>
          <button class="st-btn" data-act="full">Tela cheia</button>
          ${standalone
            ? `<a class="st-btn" href="../chapters/skill-tree.html" style="text-decoration:none">← Voltar ao PPC</a>`
            : `<a class="st-btn" data-act="window" href="../skill-tree/index.html" target="_blank" rel="noopener" style="text-decoration:none">Abrir em nova aba ↗</a>`}
        </div>
      </div>
      <aside class="st-panel"></aside>`;
    const mapDiv = root.querySelector(".st-map");
    const hud = root.querySelector(".st-hud");
    const panel = root.querySelector(".st-panel");
    const tip = root.querySelector(".st-tip");
    const toasts = root.querySelector(".st-toasts");

    const svg = el("svg", { role: "img", "aria-label": "Árvore de habilidades do curso" });
    mapDiv.insertBefore(svg, mapDiv.firstChild);

    // Filtros e fundo
    const defs = el("defs", {}, svg);
    const glow = el("filter", { id: "st-glow", x: "-100%", y: "-100%", width: "300%", height: "300%" }, defs);
    el("feGaussianBlur", { stdDeviation: "7" }, glow);
    const grad = el("radialGradient", { id: "st-bg", cx: "50%", cy: "50%", r: "60%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#15204a" }, grad);
    el("stop", { offset: "100%", "stop-color": "#0a0f1e" }, grad);
    const RMAX = ring(8) + 230;
    el("rect", { x: -RMAX * 2, y: -RMAX * 2, width: RMAX * 4, height: RMAX * 4, fill: "url(#st-bg)" }, svg);
    const stars = el("g", { opacity: "0.7" }, svg);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      el("circle", { cx: (rnd() - 0.5) * RMAX * 2.6, cy: (rnd() - 0.5) * RMAX * 2.6, r: (rnd() * 1.3 + 0.3).toFixed(2), fill: "#cfd8ff", opacity: (rnd() * 0.6 + 0.1).toFixed(2) }, stars);
    }

    // Anéis, divisória núcleo comum / ciclo avançado, setores
    const deco = el("g", {}, svg);
    const labelAng = model.sector[ORDEM[0]].start;
    for (let sem = 1; sem <= 8; sem++) {
      el("circle", { class: "st-ring", r: ring(sem) }, deco);
      const t = el("text", { class: "st-ring-label", x: (ring(sem) + 8) * Math.cos(labelAng), y: (ring(sem) + 8) * Math.sin(labelAng), "text-anchor": "middle" }, deco);
      t.textContent = `${sem}º`;
    }
    const rDiv = (ring(4) + ring(5)) / 2;
    el("circle", { class: "st-divider", r: rDiv }, deco);
    for (const [txt, rr, dy] of [["Núcleo comum", rDiv - 14, 0], ["Ciclo avançado", rDiv + 24, 0]]) {
      const t = el("text", { class: "st-divider-label", x: 0, y: -rr + dy, "text-anchor": "middle" }, deco);
      t.textContent = txt;
    }
    for (const e of ORDEM) {
      const rr = ring(8) + 165, m = model.sector[e].mid;
      const t = el("text", { class: "st-sector-label", x: rr * Math.cos(m), y: rr * Math.sin(m), "text-anchor": "middle", "dominant-baseline": "central", fill: EIXOS[e].cor }, deco);
      t.textContent = EIXOS[e].nome;
    }

    // Arestas entre disciplinas
    const edgeG = el("g", { class: "st-edges" }, svg);
    const curve = (a, b) => {
      const ra = Math.hypot(a.x, a.y), rb = Math.hypot(b.x, b.y);
      const mx = a.x + b.x, my = a.y + b.y;
      const ang = Math.atan2(my, mx);
      const rm = ((ra + rb) / 2) * 0.93;
      return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${(rm * Math.cos(ang)).toFixed(1)},${(rm * Math.sin(ang)).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
    };
    const edgeEls = model.edges.map(([a, b]) => {
      const p = el("path", { class: "st-edge", d: curve(C[a], C[b]), style: `--c:${EIXOS[C[a].eixo].cor}` }, edgeG);
      return { a, b, p };
    });
    const startEdges = courses.filter((c) => c.pre.size === 0).map((c) =>
      el("path", { class: "st-edge lit", d: `M0,0 L${c.x.toFixed(1)},${c.y.toFixed(1)}`, style: "--c:#9ec5ff; opacity:.35" }, edgeG));
    void startEdges;

    const hlG = el("g", {}, svg);

    // Nó central
    const st = el("g", { class: "st-start" }, svg);
    el("circle", { class: "halo", r: 42, filter: "url(#st-glow)" }, st);
    el("circle", { class: "core", r: 30 }, st);
    const stT = el("text", { y: 0 }, st);
    stT.textContent = "INGRESSO";

    // Disciplinas e satélites
    const nodeG = el("g", {}, svg);
    for (const c of courses) {
      const cls = ["st-course", c.ementa === "legado-2023" ? "legado" : "", c.ementa === "a-definir" ? "adefinir" : ""].join(" ");
      const g = el("g", { class: cls, transform: `translate(${c.x.toFixed(1)},${c.y.toFixed(1)})`, style: `--c:${EIXOS[c.eixo].cor}`, tabindex: "0", role: "button", "data-id": c.id }, nodeG);
      for (const s of c.skills) el("line", { class: "st-spoke", x1: 0, y1: 0, x2: (s.x - c.x).toFixed(1), y2: (s.y - c.y).toFixed(1) }, g);
      el("circle", { class: "halo", r: R_COURSE + 12, filter: "url(#st-glow)" }, g);
      el("circle", { class: "core", r: R_COURSE }, g);
      const sg = el("text", { class: "sigla" }, g);
      sg.textContent = SIGLA[c.id] || c.id;
      const nm = el("text", { class: "nome", y: R_SKILL + 22 }, g);
      nm.textContent = c.curto || c.nome;
      c.g = g;
      for (const s of c.skills) {
        s.el = el("circle", { class: "st-skill", cx: (s.x - c.x).toFixed(1), cy: (s.y - c.y).toFixed(1), r: R_SAT, "data-skill": s.id }, g);
      }
    }

    // ───────── Destaques de dependências de habilidades ─────────
    const line = (a, b, cls, color) => el("path", { class: `st-hl ${cls}`, d: `M${a.x},${a.y} L${b.x},${b.y}`, style: color ? `--c:${color}` : "" }, hlG);
    function highlightSkills(ids) {
      hlG.innerHTML = "";
      for (const id of ids) {
        const s = S[id];
        for (const r of s.requer) if (S[r].course !== s.course) line(S[r], s, "in");
        for (const d of s.dependentes) if (S[d].course !== s.course) line(s, S[d], "out", EIXOS[C[s.course].eixo].cor);
      }
      edgeG.classList.toggle("dim", ids.length > 0);
    }

    // ───────── Atualização ─────────
    function refresh() {
      for (const c of courses) {
        const stt = courseState(c);
        c.g.classList.toggle("done", stt === "done");
        c.g.classList.toggle("available", stt === "available");
        c.g.classList.toggle("selected", selected === c.id);
        c.g.setAttribute("aria-label", `${c.nome}, ${c.semestre}º semestre, ${stt === "done" ? "concluída" : stt === "available" ? "disponível" : "bloqueada"}`);
        for (const s of c.skills) {
          const ss = skillState(s);
          s.el.classList.toggle("done", ss === "done");
          s.el.classList.toggle("available", ss === "available");
        }
      }
      for (const { a, b, p } of edgeEls) {
        p.classList.toggle("lit", done.has(a) && done.has(b));
        p.classList.toggle("active", done.has(a) && !done.has(b));
      }
      renderHud();
      renderPanel();
    }

    function renderHud() {
      const nSk = Object.keys(S).length;
      const learned = Object.values(S).filter((s) => done.has(s.course)).length;
      const avail = courses.filter((c) => courseState(c) === "available").length;
      let html = `<h3><button class="st-collapse" aria-expanded="${!hudCollapsed}" title="Mostrar/ocultar detalhes">${hudCollapsed ? "▸" : "▾"}</button> Árvore de habilidades</h3>
        <div class="st-total"><b>${done.size}</b>/${courses.length} disciplinas · <b>${learned}</b>/${nSk} habilidades</div>
        <div class="st-meta" style="margin:0 0 6px">${avail} disciplina${avail === 1 ? "" : "s"} disponíve${avail === 1 ? "l" : "is"} agora</div>`;
      const barras = [];
      for (const e of ORDEM) {
        const cs = courses.filter((c) => c.eixo === e);
        const d = cs.filter((c) => done.has(c.id)).length;
        barras.push(`<div class="st-bar-row" style="--c:${EIXOS[e].cor}"><span class="lbl">${esc(EIXOS[e].nome)}</span>
          <span class="st-bar"><i style="width:${(100 * d) / cs.length}%"></i></span><span class="n">${d}/${cs.length}</span></div>`);
      }
      if (!hudCollapsed) html += barras.join("") + `<div class="st-hint">Arraste para mover · role para ampliar · clique numa disciplina</div>`;
      hud.innerHTML = html;
    }

    function ementaUrl(c) {
      const page = c.semestre <= 2 ? "common-core-year1.html" : c.semestre <= 4 ? "common-core-year2.html"
        : c.semestre <= 6 ? "advanced-cycle-year3.html" : "advanced-cycle-year4.html";
      const slug = c.ancora || c.nome.toLowerCase().replace(/[^\p{L}\p{N}\s_.-]/gu, "").trim().replace(/\s+/g, "-");
      return `${ementaBase}${page}#${slug}`;
    }

    const stateLabel = (c) => {
      const s = courseState(c);
      return s === "done" ? '<span class="st-state ok">concluída</span>'
        : s === "available" ? '<span class="st-state new">disponível</span>' : '<span class="st-state">bloqueada</span>';
    };
    const courseLi = (id, extra = "") => {
      const c = C[id], s = courseState(c);
      return `<li><span class="st-dot ${s}" style="--c:${EIXOS[c.eixo].cor}"></span><span class="st-link" data-go="${id}">${esc(c.nome)}</span>${extra || stateLabel(c)}</li>`;
    };

    function renderPanel() {
      if (!selected) {
        panel.innerHTML = `
          <h2>Como usar</h2>
          <p>Cada <b>anel</b> é um semestre — o 1º no centro, o 8º na borda — e cada cor é um
          <b>eixo</b> do curso. Os pontos pequenos em volta de cada disciplina são as
          <b>habilidades</b> que ela desenvolve.</p>
          <p>Clique numa disciplina para ver o que ela exige e o que ela abre; clique de novo
          (ou use o botão no painel) para marcá-la como <b>concluída</b>. As disciplinas que
          passam a ter todos os pré-requisitos cumpridos começam a <b>pulsar</b>.</p>
          <p>Passe o mouse sobre uma habilidade para ver de quais habilidades ela depende
          (linhas brancas tracejadas) e quais ela prepara (linhas coloridas).</p>
          <div class="st-legend">
            <div><svg width="18" height="18"><circle cx="9" cy="9" r="7" fill="#161d31" stroke="#3a4563" stroke-width="2"/></svg> bloqueada</div>
            <div><svg width="18" height="18"><circle cx="9" cy="9" r="7" fill="#18223d" stroke="#5aa9ff" stroke-width="3"/></svg> disponível</div>
            <div><svg width="18" height="18"><circle cx="9" cy="9" r="7" fill="#5aa9ff" stroke="#fff" stroke-width="1.5"/></svg> concluída</div>
            <div><svg width="18" height="18"><circle cx="9" cy="9" r="7" fill="#18223d" stroke="#bb86ff" stroke-width="2" stroke-dasharray="4 2"/></svg> ementa transcrita (2023)</div>
          </div>
          <p class="st-meta" style="margin-top:14px">O progresso fica salvo apenas neste navegador.
          As habilidades são uma <b>proposta preliminar</b> do NDE.</p>`;
        return;
      }
      const c = C[selected];
      const stt = courseState(c);
      const missing = [...c.pre].filter((p) => !done.has(p));
      const eixo = EIXOS[c.eixo];
      let html = `<h2>${esc(c.nome)}</h2>
        <div class="st-meta">${c.semestre}º semestre
          ${c.praticas.length ? " · com " + c.praticas.map(esc).join(", ") : ""}</div>
        <div><span class="st-badge eixo" style="--c:${eixo.cor}">${esc(eixo.nome)}</span>
          <span class="st-badge ${c.ementa === "legado-2023" ? "legado" : ""}">${esc(EMENTA[c.ementa] || c.ementa)}</span></div>
        <div style="margin:12px 0 4px; display:flex; gap:8px; flex-wrap:wrap">
          <button class="st-btn primary" data-toggle="${c.id}">${stt === "done" ? "Desmarcar" : "Marcar como concluída"}</button>
          <a class="st-btn" href="${ementaUrl(c)}"${standalone ? ' target="_blank" rel="noopener"' : ""} style="text-decoration:none">Ver ementa →</a>
        </div>`;
      if (stt === "locked") html += `<p class="st-meta" style="color:#ff8a8a">Falta${missing.length > 1 ? "m" : ""} ${missing.length} pré-requisito${missing.length > 1 ? "s" : ""}.</p>`;
      html += `<h4>Pré-requisitos</h4>`;
      html += c.pre.size ? `<ul>${[...c.pre].sort((a, b) => C[a].semestre - C[b].semestre).map((id) => courseLi(id, done.has(id) ? '<span class="st-state ok">✔</span>' : '<span class="st-state no">✖</span>')).join("")}</ul>` : `<p class="st-empty">Nenhum — disponível desde o ingresso.</p>`;
      if (c.co.size) html += `<h4>Cursar junto com</h4><ul>${[...c.co].map((id) => courseLi(id)).join("")}</ul>`;
      html += `<h4>Habilidades (${c.skills.length})</h4><ul>`;
      for (const s of c.skills) {
        const ss = skillState(s);
        const ext = s.requer.filter((r) => S[r].course !== c.id).map((r) => S[r].nome);
        html += `<li class="st-skill-li" data-skill="${s.id}"><span class="st-dot ${ss}" style="--c:${eixo.cor}"></span>
          <span>${esc(s.nome)}${s.pratica ? " <small>(prática)</small>" : ""}${ext.length ? `<br><small>usa: ${ext.map(esc).join("; ")}</small>` : ""}</span></li>`;
      }
      html += `</ul><h4>Abre caminho para</h4>`;
      html += c.abre.size ? `<ul>${[...c.abre].sort((a, b) => C[a].semestre - C[b].semestre).map((id) => courseLi(id)).join("")}</ul>` : `<p class="st-empty">Nenhuma disciplina depende diretamente desta.</p>`;
      panel.innerHTML = html;
    }

    function toast(msg, color) {
      const t = document.createElement("div");
      t.className = "st-toast";
      t.style.setProperty("--c", color);
      t.innerHTML = msg;
      toasts.appendChild(t);
      setTimeout(() => t.remove(), 3900);
    }

    function setDone(newDone) {
      const before = new Set(courses.filter((c) => courseState(c) === "available").map((c) => c.id));
      done = newDone;
      saveDone(done);
      const fresh = courses.filter((c) => courseState(c) === "available" && !before.has(c.id));
      fresh.slice(0, 4).forEach((c, i) => setTimeout(() => toast(`✦ Desbloqueada: <b>${esc(c.nome)}</b>`, EIXOS[c.eixo].cor), i * 250));
      if (fresh.length > 4) setTimeout(() => toast(`✦ e mais ${fresh.length - 4} disciplinas`, "#9ec5ff"), 1000);
      refresh();
    }
    function toggle(id) {
      const d = new Set(done);
      if (d.has(id)) d.delete(id); else d.add(id);
      setDone(d);
    }
    function select(id) {
      selected = id;
      highlightSkills(id ? C[id].skills.map((s) => s.id) : []);
      refresh();
    }

    // ───────── Câmera (pan/zoom) ─────────
    let vb = { x: 0, y: 0, w: 1, h: 1 };
    const apply = () => svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    function fit(radius) {
      const r = svg.getBoundingClientRect();
      const aspect = r.width / Math.max(r.height, 1) || 1;
      const h = aspect >= 1 ? 2 * radius : (2 * radius) / aspect;
      vb = { w: h * aspect, h, x: -(h * aspect) / 2, y: -h / 2 };
      apply();
    }
    function zoomAt(px, py, k) {
      const nw = Math.min(Math.max(vb.w / k, 250), RMAX * 3.2);
      k = vb.w / nw;
      vb.x = px - (px - vb.x) / k;
      vb.y = py - (py - vb.y) / k;
      vb.w = nw;
      vb.h = vb.h / k;
      apply();
    }
    const toSvg = (cx, cy) => {
      const p = svg.createSVGPoint();
      p.x = cx; p.y = cy;
      return p.matrixTransform(svg.getScreenCTM().inverse());
    };
    const scale = () => { const r = svg.getBoundingClientRect(); return Math.min(r.width / vb.w, r.height / vb.h); };

    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
    }, { passive: false });

    const pointers = new Map();
    let drag = null, pinch = null;
    svg.addEventListener("pointerdown", (e) => {
      pointers.set(e.pointerId, e);
      svg.setPointerCapture(e.pointerId);
      if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y, moved: false, target: e.target };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), w: vb.w };
        drag = null;
      }
    });
    svg.addEventListener("pointermove", (e) => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e);
      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const mid = toSvg((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
        zoomAt(mid.x, mid.y, vb.w / (pinch.w * (pinch.d / d)));
        return;
      }
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 5) { drag.moved = true; svg.classList.add("dragging"); hideTip(); }
        if (drag.moved) { const s = scale(); vb.x = drag.vx - dx / s; vb.y = drag.vy - dy / s; apply(); }
      } else hoverAt(e);
    });
    const endPointer = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (drag && !drag.moved && e.type === "pointerup") click(drag.target);
      if (pointers.size === 0) { drag = null; svg.classList.remove("dragging"); }
    };
    svg.addEventListener("pointerup", endPointer);
    svg.addEventListener("pointercancel", endPointer);

    function click(target) {
      const g = target.closest && target.closest(".st-course");
      if (!g) { select(null); return; }
      const id = g.dataset.id;
      if (selected === id) toggle(id); else select(id);
    }

    // Tooltip de habilidades e disciplinas
    let hoverSkill = null;
    function hoverAt(e) {
      const t = e.target;
      const sid = t.dataset && t.dataset.skill;
      if (sid) {
        if (hoverSkill !== sid) {
          if (hoverSkill) S[hoverSkill].el.classList.remove("hover");
          hoverSkill = sid;
          S[sid].el.classList.add("hover");
          highlightSkills([sid]);
        }
        showTip(e, S[sid].nome, skillTipBody(S[sid]));
        return;
      }
      if (hoverSkill) {
        S[hoverSkill].el.classList.remove("hover");
        hoverSkill = null;
        highlightSkills(selected ? C[selected].skills.map((s) => s.id) : []);
      }
      const g = t.closest && t.closest(".st-course");
      if (g) {
        const c = C[g.dataset.id];
        showTip(e, c.nome, `${c.semestre}º semestre · ${c.skills.length} habilidades`);
      } else hideTip();
    }
    const skillTipBody = (s) => {
      const req = s.requer.map((r) => `${S[r].nome} <i>(${esc(C[S[r].course].curto || C[S[r].course].nome)})</i>`);
      return `${esc(C[s.course].nome)}${req.length ? "<br>requer: " + req.join("; ") : ""}`;
    };
    function showTip(e, title, body) {
      const r = mapDiv.getBoundingClientRect();
      tip.innerHTML = `<div class="t">${esc(title)}</div><div class="s">${body}</div>`;
      tip.style.display = "block";
      const x = Math.min(e.clientX - r.left + 14, r.width - 290);
      tip.style.left = `${x}px`;
      tip.style.top = `${e.clientY - r.top + 14}px`;
    }
    function hideTip() { tip.style.display = "none"; }
    svg.addEventListener("pointerleave", hideTip);

    // Teclado nos nós
    svg.addEventListener("keydown", (e) => {
      const g = e.target.closest && e.target.closest(".st-course");
      if (!g) return;
      if (e.key === "Enter") { e.preventDefault(); select(g.dataset.id); }
      if (e.key === " ") { e.preventDefault(); toggle(g.dataset.id); }
    });

    hud.addEventListener("click", (e) => {
      if (!e.target.closest(".st-collapse")) return;
      hudCollapsed = !hudCollapsed;
      try { localStorage.setItem(STORE + "-hud", hudCollapsed ? "1" : "0"); } catch (err) { /* sem armazenamento */ }
      renderHud();
    });

    // Painel e controles
    panel.addEventListener("click", (e) => {
      const tg = e.target.closest("[data-toggle]");
      if (tg) { toggle(tg.dataset.toggle); return; }
      const go = e.target.closest("[data-go]");
      if (go) { select(go.dataset.go); centerOn(C[go.dataset.go]); }
    });
    panel.addEventListener("mouseover", (e) => {
      const li = e.target.closest("[data-skill]");
      if (li) highlightSkills([li.dataset.skill]);
    });
    panel.addEventListener("mouseleave", () => highlightSkills(selected ? C[selected].skills.map((s) => s.id) : []));

    function centerOn(c) {
      vb.x = c.x - vb.w / 2;
      vb.y = c.y - vb.h / 2;
      apply();
    }

    const fullBtn = root.querySelector('[data-act="full"]');
    if (!root.requestFullscreen) fullBtn.hidden = true;
    document.addEventListener("fullscreenchange", () => {
      fullBtn.textContent = document.fullscreenElement === root ? "Sair da tela cheia" : "Tela cheia";
    });
    root.querySelector(".st-controls").addEventListener("click", (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (act === "window") e.target.href = "../skill-tree/index.html" + location.hash;
      if (act === "full") {
        if (document.fullscreenElement) document.exitFullscreen();
        else root.requestFullscreen().catch(() => {});
      }
      if (act === "panel") {
        const off = root.classList.toggle("st-nopanel");
        e.target.textContent = off ? "Mostrar painel" : "Ocultar painel";
        e.target.setAttribute("aria-pressed", String(off));
      }
      if (act === "in") zoomAt(vb.x + vb.w / 2, vb.y + vb.h / 2, 1.35);
      if (act === "out") zoomAt(vb.x + vb.w / 2, vb.y + vb.h / 2, 1 / 1.35);
      if (act === "fit") fit(RMAX);
      if (act === "core") fit(ring(4) + 90);
      if (act === "reset") { select(null); setDone(new Set()); }
    });
    root.querySelector(".st-select").addEventListener("change", (e) => {
      const n = Number(e.target.value);
      if (n) setDone(new Set(courses.filter((c) => c.semestre <= n).map((c) => c.id)));
      e.target.value = "";
    });

    new ResizeObserver(() => { if (vb.w === 1) fit(ring(4) + 90); }).observe(svg);
    fit(ring(4) + 90);
    // Atalho de demonstração: #sim=N marca os semestres 1..N e #sel=id seleciona uma
    // disciplina (útil para apresentar um cenário). Não altera o progresso salvo.
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.get("sim")) done = new Set(courses.filter((c) => c.semestre <= Number(hash.get("sim"))).map((c) => c.id));
    if (hash.get("sel") && C[hash.get("sel")]) { select(hash.get("sel")); centerOn(C[hash.get("sel")]); }
    if (hash.get("zoom")) zoomAt(vb.x + vb.w / 2, vb.y + vb.h / 2, Number(hash.get("zoom")));
    refresh();
  }
})();
