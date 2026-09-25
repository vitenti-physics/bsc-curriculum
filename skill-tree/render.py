"""Gera as figuras da árvore de habilidades a partir de skills.yml.

Uso: python3 skill-tree/render.py   (requer PyYAML e Graphviz `dot`)

Saídas, em skill-tree/:
- cursos.svg       — dependências entre disciplinas (redução transitiva: só as
                     dependências diretas essenciais; as implícitas são omitidas);
- habilidades.svg  — todas as habilidades, agrupadas por disciplina.
As Práticas aparecem junto do curso principal que acompanham.
"""

import collections
import pathlib
import subprocess
import sys

import yaml

HERE = pathlib.Path(__file__).parent
FMT = sys.argv[1] if len(sys.argv) > 1 else "svg"

EIXOS = {  # nome, preenchimento, borda
    "matematica": ("Matemática", "#dbe8f6", "#3d6fa8"),
    "mecanica": ("Mecânica", "#fde3cc", "#c46b1b"),
    "ondas-termo": ("Ondas, fluidos e termodinâmica", "#fff3bf", "#9c7f00"),
    "eletromagnetismo": ("Eletromagnetismo e relatividade", "#d7eedb", "#2e7d32"),
    "quantica": ("Física moderna e quântica", "#e9ddf4", "#6a3d9a"),
    "experimental": ("Experimental", "#eee1d5", "#7a4e2d"),
    "computacao": ("Computação", "#e6e6e6", "#555555"),
}
EMENTA_STYLE = {
    "nde": "rounded,filled",
    "proposta": "rounded,filled",
    "legado-2023": "rounded,filled,dashed",
    "a-definir": "rounded,filled,dotted",
}
FONT = 'fontname="Helvetica"'

data = yaml.safe_load((HERE / "skills.yml").read_text())["disciplinas"]
course = {c["id"]: c for c in data}
# Práticas são desenhadas junto do curso principal.
main = {c["id"]: c.get("pratica_de", c["id"]) for c in data}
owner, skill = {}, {}
for c in data:
    for s in c["habilidades"]:
        owner[s["id"]] = main[c["id"]]
        skill[s["id"]] = s
mains = [c for c in data if "pratica_de" not in c]
practices = collections.defaultdict(list)
for c in data:
    if "pratica_de" in c:
        practices[c["pratica_de"]].append(c)


def q(s):
    return '"' + s.replace('"', r"\"") + '"'


def legend():
    out = ["subgraph cluster_legenda {", 'label="Legenda"; fontsize=16; style="rounded"; color="#999999";']
    prev = None
    for k, (nome, fill, border) in EIXOS.items():
        out.append(f'leg_{k.replace("-", "_")} [label={q(nome)}, shape=box, style="rounded,filled", '
                   f'fillcolor="{fill}", color="{border}"];')
        if prev:
            out.append(f"{prev} -> leg_{k.replace('-', '_')} [style=invis];")
        prev = f"leg_{k.replace('-', '_')}"
    out.append('leg_legado [label="Ementa transcrita (2023)", shape=box, style="rounded,dashed"];')
    out.append('leg_adef [label="Ementa a definir", shape=box, style="rounded,dotted"];')
    out.append(f"{prev} -> leg_legado [style=invis]; leg_legado -> leg_adef [style=invis];")
    out.append("}")
    return out


def run_dot(lines, name):
    src = "\n".join(lines)
    out = HERE / f"{name}.{FMT}"
    subprocess.run(["dot", f"-T{FMT}", "-o", str(out)], input=src.encode(), check=True)
    print("gerado", out)


# ───────────── Visão por disciplina ─────────────
pre, co = set(), set()
for sid, s in skill.items():
    for r in s["requer"]:
        a, b = owner[r], owner[sid]
        if a == b:
            continue
        (co if course[a]["semestre"] == course[b]["semestre"] else pre).add((a, b))

succ = collections.defaultdict(set)
for a, b in pre:
    succ[a].add(b)


def reachable_without(a, b):
    """Existe caminho a → b que não seja a aresta direta?"""
    stack, seen = [x for x in succ[a] if x != b], set()
    while stack:
        u = stack.pop()
        if u == b:
            return True
        if u not in seen:
            seen.add(u)
            stack.extend(succ[u])
    return False


essential = {(a, b) for a, b in pre if not reachable_without(a, b)}

g = ["digraph cursos {", "rankdir=LR; newrank=true; nodesep=0.25; ranksep=0.9;",
     f'graph [{FONT}, fontsize=20, labelloc=t, label="Dependências entre disciplinas (proposta preliminar)\\n'
     f'Linha cheia: pré-requisito direto · tracejada: co-requisito (mesmo semestre)"];',
     f"node [{FONT}, fontsize=12, penwidth=1.4]; edge [color=\"#777777\", arrowsize=0.7];"]
by_sem = collections.defaultdict(list)
for c in mains:
    by_sem[c["semestre"]].append(c)
for sem in sorted(by_sem):
    g.append(f'sem{sem} [label="{sem}º semestre", shape=plaintext, fontsize=16, fontcolor="#333333"];')
    for c in by_sem[sem]:
        nome, fill, border = EIXOS[c["eixo"]]
        n = len(c["habilidades"]) + sum(len(p["habilidades"]) for p in practices[c["id"]])
        extra = " + prática" if practices[c["id"]] else ""
        g.append(f'{c["id"]} [label={q(c["nome"] + extra)}, shape=box, style="{EMENTA_STYLE[c["ementa"]]}", '
                 f'fillcolor="{fill}", color="{border}", tooltip={q(f"{n} habilidades")}];')
    g.append("{rank=same; " + f"sem{sem}; " + " ".join(c["id"] for c in by_sem[sem]) + "}")
sems = sorted(by_sem)
g.append(" -> ".join(f"sem{s}" for s in sems) + " [style=invis];")
for a, b in sorted(essential):
    g.append(f"{a} -> {b};")
for a, b in sorted(co):
    g.append(f'{a} -> {b} [style=dashed, color="#aaaaaa", constraint=false];')
g += legend() + ["}"]
run_dot(g, "cursos")

# ───────────── Visão por habilidade ─────────────
h = ["digraph habilidades {", "rankdir=LR; newrank=true; nodesep=0.12; ranksep=0.5;",
     f'graph [{FONT}, fontsize=22, labelloc=t, label="Habilidades por disciplina (proposta preliminar)"];',
     f'node [{FONT}, fontsize=10, shape=box, style="rounded,filled", fillcolor=white, penwidth=1.1];',
     'edge [color="#99999988", arrowsize=0.5];']
for c in mains:
    nome, fill, border = EIXOS[c["eixo"]]
    style = {"legado-2023": "rounded,filled,dashed", "a-definir": "rounded,filled,dotted"}.get(c["ementa"], "rounded,filled")
    h.append(f'subgraph cluster_{c["id"]} {{ label={q(f"{c["semestre"]}º · {c["nome"]}")}; fontsize=13; '
             f'style="{style}"; fillcolor="{fill}"; color="{border}";')
    for s in c["habilidades"]:
        h.append(f'{q(s["id"])} [label={q(s["nome"])}, color="{border}"];')
    for p in practices[c["id"]]:
        for s in p["habilidades"]:
            h.append(f'{q(s["id"])} [label={q(s["nome"] + " (prática)")}, color="{border}", fontname="Helvetica-Oblique"];')
    h.append("}")
# Colunas por semestre: as habilidades "de entrada" de cada semestre (que só dependem
# de semestres anteriores) ficam alinhadas à âncora do seu semestre.
sem_of = {sid: course[owner[sid]]["semestre"] for sid in skill}
anchors = collections.defaultdict(list)
for sid, s in skill.items():
    if all(sem_of[r] < sem_of[sid] for r in s["requer"]):
        anchors[sem_of[sid]].append(sid)
for sem in sorted(anchors):
    h.append(f'hsem{sem} [label="{sem}º semestre", shape=plaintext, style="", fontsize=18];')
    h.append("{rank=same; " + f"hsem{sem}; " + " ".join(q(x) for x in anchors[sem]) + "}")
h.append(" -> ".join(f"hsem{s}" for s in sorted(anchors)) + " [style=invis, minlen=5];")
for sid, s in skill.items():
    for r in s["requer"]:
        same = owner[r] == owner[sid]
        h.append(f'{q(r)} -> {q(sid)}' + (' [color="#555555"]' if same else "") + ";")
h += ["}"]
run_dot(h, "habilidades")

# ───────────── Uma visão por eixo ─────────────
# Habilidades das disciplinas do eixo; pré-requisitos de outros eixos aparecem como
# notas cinzas, com o nome da disciplina de origem.
for eixo, (titulo, fill, border) in EIXOS.items():
    cs = [c for c in mains if c["eixo"] == eixo]
    ids = {s["id"] for c in cs for s in c["habilidades"]}
    ids |= {s["id"] for c in cs for p in practices[c["id"]] for s in p["habilidades"]}
    e = [f"digraph eixo_{eixo.replace('-', '_')} {{", "rankdir=LR; newrank=true; nodesep=0.15; ranksep=0.45;",
         f'graph [{FONT}, fontsize=20, labelloc=t, label={q("Eixo: " + titulo + " (proposta preliminar)")}];',
         f'node [{FONT}, fontsize=11, shape=box, style="rounded,filled", fillcolor=white, penwidth=1.1];',
         'edge [color="#888888", arrowsize=0.6];']
    for c in sorted(cs, key=lambda c: c["semestre"]):
        style = {"legado-2023": "rounded,filled,dashed", "a-definir": "rounded,filled,dotted"}.get(c["ementa"], "rounded,filled")
        e.append(f'subgraph cluster_{c["id"]} {{ label={q(str(c["semestre"]) + "º · " + c["nome"])}; fontsize=13; '
                 f'style="{style}"; fillcolor="{fill}"; color="{border}";')
        for s in c["habilidades"]:
            e.append(f'{q(s["id"])} [label={q(s["nome"])}, color="{border}"];')
        for p in practices[c["id"]]:
            for s in p["habilidades"]:
                e.append(f'{q(s["id"])} [label={q(s["nome"] + " (prática)")}, color="{border}", fontname="Helvetica-Oblique"];')
        e.append("}")
    externos = set()
    for sid in ids:
        for r in skill[sid]["requer"]:
            if r not in ids:
                externos.add(r)
            e.append(f"{q(r)} -> {q(sid)};")
    for r in sorted(externos):
        oc = course[owner[r]]
        e.append(f'{q(r)} [label={q(oc["nome"] + " · " + skill[r]["nome"])}, shape=note, style="filled", '
                 f'fillcolor="#f4f4f4", color="#bbbbbb", fontsize=9, fontcolor="#555555"];')
    e.append("}")
    run_dot(e, f"eixo-{eixo}")
