#!/usr/bin/env python3
"""
Build tidy analysis datasets from the human-verified wide transcriptions.

Input : data/transcribed/<program>__<snapshot_year>__evasao_cohort.csv
        (wide tables that mirror the source pivots, one per snapshot)
Output: data/evasao.csv  (tidy long, one row per program/snapshot/cohort/situacao)

Keeping the wide transcription separate from the tidy output means the
transcription can be eyeballed against the source image, while analysis code
consumes the clean long form.

Run:  python3 extract/build_tidy.py
"""
from __future__ import annotations
from pathlib import Path
import csv
import re

ROOT = Path(__file__).resolve().parent.parent
TRANS = ROOT / "data" / "transcribed"
OUT = ROOT / "data" / "evasao.csv"
OUT_FORMA = ROOT / "data" / "evasao_forma_ingresso.csv"
OUT_TIMING = ROOT / "data" / "evasao_timing.csv"
OUT_REPROV = ROOT / "data" / "reprovacao_disciplina.csv"
OUT_BENCH = ROOT / "data" / "benchmark_uel.csv"
OUT_RECON = ROOT / "data" / "evasao_reconciliacao.csv"

# situacao columns and whether each counts toward "evasão"
SITUACOES = {
    "ativo": False,
    "formado": False,
    "permuta": False,
    "transf_interna": False,
    "cancelamento": True,
    "canc_art43": True,
    "desist_sem_vinc": True,
    "transf_externa": True,
    "jubilado": True,
}

FNAME_RE = re.compile(r"(?P<program>.+?)__(?P<snapshot>\d{4})__evasao_cohort\.csv")
FORMA_RE = re.compile(r"(?P<program>.+?)__(?P<snapshot>\d{4})__evasao_forma_ingresso\.csv")


def read_wide(path: Path):
    with path.open(encoding="utf-8") as fh:
        rows = [r for r in fh if not r.lstrip().startswith("#")]
    return list(csv.DictReader(rows))


def build_forma() -> None:
    """Pass the forma de ingresso leaf rows through, tagged with program/snapshot."""
    out_rows = []
    for path in sorted(TRANS.glob("*__*__evasao_forma_ingresso.csv")):
        m = FORMA_RE.match(path.name)
        program, snapshot = m["program"], m["snapshot"]
        for r in read_wide(path):
            ing = int(r["ingressante"])
            ev = int(r["total_evasao"])
            out_rows.append({
                "programa": program,
                "ano_snapshot": snapshot,
                "ano_ingresso": int(r["ano_ingresso"]),
                "forma_ingresso": r["forma_ingresso"],
                "tip_cota": r["tip_cota"],
                "ingressante": ing,
                "total_evasao": ev,
                "pct_evasao": round(100 * ev / ing, 2) if ing else None,
            })
    if not out_rows:
        return
    with OUT_FORMA.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)
    print(f"Wrote {len(out_rows)} rows -> {OUT_FORMA}")


TIMING_RE = re.compile(r"(?P<program>.+?)__(?P<snapshot>\d{4})__evadidos_por_ano\.csv")


def build_timing() -> None:
    """Melt the cohort x evasion-year matrix into long form with years-since-entry."""
    out_rows = []
    for path in sorted(TRANS.glob("*__*__evadidos_por_ano.csv")):
        m = TIMING_RE.match(path.name)
        program, snapshot = m["program"], m["snapshot"]
        for r in read_wide(path):
            cohort = int(r["ano_ingresso"])
            for col, val in r.items():
                if col == "ano_ingresso":
                    continue
                n = int(val)
                if n == 0:
                    continue
                evas_year = int(col)
                out_rows.append({
                    "programa": program,
                    "ano_snapshot": snapshot,
                    "ano_ingresso": cohort,
                    "ano_evasao": evas_year,
                    "anos_desde_ingresso": evas_year - cohort,
                    "n_alunos": n,
                })
    if not out_rows:
        return
    with OUT_TIMING.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)
    print(f"Wrote {len(out_rows)} rows -> {OUT_TIMING}")


REPROV_RE = re.compile(r"(?P<program>.+?)__(?P<snapshot>\d{4})__reprovacao\.csv")


def build_reprovacao() -> None:
    """Pool reprovação cells into one enrollment-weighted rate per discipline.

    The source cells are per offering/turma/year; many disciplines run parallel
    turmas and changed offer mode over time. A pooled rate (Σ reprovados /
    Σ matriculados) is robust to that, unlike averaging the per-cell percentuais.
    """
    from collections import defaultdict
    acc = defaultdict(lambda: {"matric": 0, "reprov": 0.0, "serie": None})
    for path in sorted(TRANS.glob("*__*__reprovacao.csv")):
        m = REPROV_RE.match(path.name)
        program, snapshot = m["program"], m["snapshot"]
        for r in read_wide(path):
            key = (program, snapshot, r["disciplina"])
            ta = int(r["total_alunos"])
            p = float(r["perc_reprov"])
            acc[key]["matric"] += ta
            acc[key]["reprov"] += ta * p / 100.0
            acc[key]["serie"] = int(r["serie"])
    if not acc:
        return
    rows = []
    for (program, snapshot, disc), v in acc.items():
        rows.append({
            "programa": program,
            "ano_snapshot": snapshot,
            "serie": v["serie"],
            "disciplina": disc,
            "matriculados": v["matric"],
            "reprovados": round(v["reprov"]),
            "taxa_reprovacao": round(100 * v["reprov"] / v["matric"], 1) if v["matric"] else None,
        })
    rows.sort(key=lambda x: (-x["taxa_reprovacao"]))
    with OUT_REPROV.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {len(rows)} rows -> {OUT_REPROV}")


BENCH_RE = re.compile(r"(?P<program>.+?)__(?P<snapshot>\d{4})__benchmark_uel\.csv")


def build_benchmark() -> None:
    """Pass benchmark rows through, tagged with program/snapshot."""
    out_rows = []
    for path in sorted(TRANS.glob("*__*__benchmark_uel.csv")):
        m = BENCH_RE.match(path.name)
        for r in read_wide(path):
            out_rows.append({"programa": m["program"], "ano_snapshot": m["snapshot"], **r})
    if not out_rows:
        return
    with OUT_BENCH.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)
    print(f"Wrote {len(out_rows)} rows -> {OUT_BENCH}")


def build_reconciliacao() -> None:
    """Validate and pass through the cross-snapshot reconciliation series."""
    src = TRANS / "bacharelado_62_integral__reconciliacao_snapshots.csv"
    if not src.exists():
        return
    rows = read_wide(src)
    with OUT_RECON.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {len(rows)} rows -> {OUT_RECON}")


def main() -> None:
    out_rows = []
    files = sorted(TRANS.glob("*__*__evasao_cohort.csv"))
    if not files:
        raise SystemExit(f"No transcriptions found in {TRANS}")
    for path in files:
        m = FNAME_RE.match(path.name)
        program, snapshot = m["program"], m["snapshot"]
        for r in read_wide(path):
            cohort = int(r["ano_ingresso"])
            ingressante = int(r["ingressante"])
            for sit, is_evasao in SITUACOES.items():
                n = int(r[sit])
                out_rows.append({
                    "programa": program,
                    "ano_snapshot": snapshot,
                    "ano_ingresso": cohort,
                    "situacao": sit,
                    "conta_evasao": int(is_evasao),
                    "n_alunos": n,
                    "ingressante": ingressante,
                    "pct": round(100 * n / ingressante, 2) if ingressante else 0.0,
                })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)
    print(f"Wrote {len(out_rows)} rows -> {OUT}")


if __name__ == "__main__":
    main()
    build_forma()
    build_timing()
    build_reprovacao()
    build_benchmark()
    build_reconciliacao()
