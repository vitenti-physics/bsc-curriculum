# DadosFísica — Diagnóstico de Evasão (Física UEL)

Reorganização e análise dos relatórios *Indicadores da Graduação* (PROPLAN/DAII)
do curso de **Física Bacharelado (62) integral** da UEL, snapshots anuais
2021–2025. (O escopo é apenas o Bacharelado; a Licenciatura foi descartada.)

## O problema dos arquivos originais

Cada relatório vem em `.xlsx` e `.pdf`, mas **os dois são relatórios visuais**:
as tabelas e gráficos (evasão, reprovação, perfil, etc.) estão gravados como
**imagens** (PNG/JPG) — o `.xlsx` não tem objetos de gráfico nem células
numéricas, e o `.pdf` não tem texto selecionável nas tabelas. Ou seja, os
números **não podem ser copiados como texto**; precisam ser transcritos a partir
das imagens. Cada snapshot recente já traz a série histórica longa (evasão
2009–2023, formados 2007–2023), então o arquivo mais recente de cada curso
cobre quase toda a série; os antigos servem para reconciliar revisões.

## Estrutura

```
raw/        # arquivos originais (.xlsx + .pdf), intocados
data/
  transcribed/   # tabelas largas transcritas das imagens (fonte verificável)
  evasao.csv     # dataset tidy (gerado por extract/build_tidy.py)
extract/
  extract_assets.py  # extrai imagens dos .xlsx + renderiza páginas dos .pdf
  build_tidy.py      # transforma transcrições largas -> tidy long
  images/            # saída: imagens por curso/ano (+ _anchor_index.tsv) e páginas de PDF
report/
  diagnostico_evasao.qmd  # relatório Quarto (HTML/PDF)
```

## Fluxo de trabalho

1. `python3 extract/extract_assets.py` — extrai todas as imagens e renderiza os PDFs.
   O `_anchor_index.tsv` diz a que linha da planilha (logo, a que indicador) cada
   imagem pertence. Indicadores-chave (Bacharelado 2024):
   - `row101_image7.png` — **evasão por coorte × situação** (tabela mestra)
   - `row101_image8.png` — % ativo/evasão/formado por coorte (resumo)
   - `row057_image10.png` — evasão **por forma de ingresso**
   - `row151..row232` — **reprovação** por disciplina/ano
2. Transcrever cada tabela para `data/transcribed/<curso>__<ano>__<indicador>.csv`
   (largo, espelhando a imagem; somar colunas confere contra a linha "Geral").
3. `python3 extract/build_tidy.py` — gera `data/evasao.csv`.
4. `quarto render report/diagnostico_evasao.qmd` — gera o relatório.

## Definição de evasão (conforme os relatórios)

`evasão = cancelamento + cancelamento Art.43 + desistência sem vínculo +
transferência externa + jubilado`. *Permuta* e *transferência interna* são
mobilidade interna e **não** contam como evasão.

## Estado

- [x] Extração de imagens + render de PDFs (arquivos do Bacharelado)
- [x] Esquema tidy + Bacharelado 2024 (coorte × situação) — **verificado** (somas
      batem com a linha "Geral"; taxas batem com o gráfico-resumo independente)
- [x] Evasão por forma de ingresso × cota (Bacharelado 2024) — **verificado**
      (totais por ano e geral reconciliam: 391 ingressantes / 233 evasão)
- [x] Tempo até a evasão (matriz coorte × ano de evasão, image11) — **verificado**
      (pico no 4º ano; cauda tardia → retenção). Ver `data/evasao_timing.csv`.
- [x] Reprovação disciplinas estruturais, 4 séries (image3–6) + cruzamento com
      tempo de evasão — `data/reprovacao_disciplina.csv`. Reprovação média cai
      52→42→33→20% do 1º ao 4º ano; porta = Física Geral I, Cálculo I, Química
      (~60–67%). Séries 3–4 best-effort (pivot aninhado).
- [x] Benchmark curso × CCE × UEL (image12) — `data/benchmark_uel.csv`. Física =
      9,8% da evasão do CCE e 1,7% da UEL (acum. 2014–2024). Verificado.
- [x] Reconciliação entre snapshots (2022/2023/2024/2025) — `data/evasao_reconciliacao.csv`.
      2022-2024 consistentes (acúmulo natural); 2025 = quebra de metodologia (coluna
      "Desistente", coortes antigas reaumentadas → não comparável). Base = snapshot 2024.
- [ ] Comparação de TAXAS curso×CCE×UEL (precisa ingressantes de CCE/UEL — outra fonte)

## Contexto de reformulação (não-dados)

As notas da reforma estão em `../notes/` e o rascunho do PPC em
`../support_docs/ppc-draft/`.
Proposta central: disciplinas **Práticas** (ex.: *Práticas de Cálculo I*, *Práticas de
Física Geral I*, 30 h) co-requisitas, em paralelo às disciplinas-porta, para ensinar
o aluno a estudar/resolver exercícios — atacando exatamente Física Geral I e Cálculo I,
que o diagnóstico apontou como gargalos (~65% de reprovação). No futuro: um único
projeto Quarto reunindo dados + planos. Por ora é só contexto.

## Dependências

Python: `pandas`, `openpyxl`, `Pillow`, `matplotlib`, `jupyter`.
Sistema: `poppler` (`pdftotext`, `pdftoppm`), `quarto`.
Opcional p/ OCR: `pytesseract` + `tesseract`.
