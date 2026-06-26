# Bacharelado em Física — Reformulação Curricular

Documentos de trabalho do **Núcleo Docente Estruturante (NDE)** para a
reformulação do Bacharelado em Física. O projeto é construído com
[Quarto](https://quarto.org) como um *website* e publicado no GitHub Pages.

> Nomes de arquivos e diretórios em inglês; conteúdo em português.

🌐 **Site publicado:** https://vitenti-physics.github.io/bsc-curriculum/

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `_quarto.yml` | Configuração do site Quarto |
| `index.qmd` | Apresentação (página inicial) |
| `chapters/` | Seções do documento |
| `references.qmd` / `references.bib` | Referências bibliográficas |
| `style.scss` | Tema visual |
| `.github/workflows/publish.yml` | Publicação automática no GitHub Pages |

## Pré-visualizar localmente

```bash
quarto preview
```

## Renderizar

```bash
quarto render
```

A saída é gerada em `_site/`.

## Publicação

A cada `push` na branch `main`, o GitHub Actions renderiza o site e o publica
no GitHub Pages. É necessário, uma única vez, configurar em
**Settings → Pages → Build and deployment → Source: GitHub Actions**.
