# Notas do NDE

Notas de trabalho da reformulação. São a fonte das ementas publicadas no site: uma ementa
nova ou alterada entra aqui primeiro e depois é transcrita para a página do ano
(`chapters/common-core-year*.qmd`, `chapters/advanced-cycle-year*.qmd`).

## Organização

- `courses/`: uma nota por disciplina da proposta. O nome do arquivo começa pelo
  semestre (`s1-` a `s8-`).
- `curriculum-2023/`: uma nota por disciplina do currículo vigente (2023), com ementa,
  carga horária e pré-requisitos, transcritas de `support_docs/curriculum-2023/`.
- `planning/`: planos de trabalho que não são ementas.

## Formato de uma nota de disciplina

```markdown
# Nome da disciplina

- Carga horária: 60 h
- Semestre: 1º (1º ano)
- Situação: proposta do NDE

## Ementa

- Primeiro item.
- Segundo item.

## Notas

- Observações que não fazem parte da ementa.
```

- **Carga horária**: horas totais. As disciplinas de Prática têm 30 h (15 h em cada uma das
  Práticas bimestrais de Física Geral IIa e IIb).
- **Semestre**: semestre do curso e ano entre parênteses; bimestre quando a disciplina é
  bimestral.
- **Situação**: *proposta do NDE*; *ementa incompleta*; *ementa a definir pelo NDE*;
  *proposta de roteiros, pendente de aprovação pelo NDE*; ou *ementa sem fonte nas notas do
  NDE*, quando a ementa foi escrita a partir do curso principal e ainda não foi revista.
- **Ementa**: um item por linha, cada um terminado em ponto. Uma ementa dividida em partes
  usa subtítulos `###` dentro da seção. Os laboratórios têm também `## Roteiros previstos`.
- **Notas**: seção opcional; comentários, referências e decisões sobre a disciplina.

As notas do currículo de 2023 usam o mesmo formato, com o código no título e os campos
*Série* e *Pré-requisito* no lugar de *Semestre*.

## Disciplinas da proposta

| Semestre | Disciplina | Carga | Situação |
|---|---|---|---|
| 1º | [Física Básica](courses/s1-basic-physics.md) | 60 h | proposta do NDE |
| 1º | [Cálculo I](courses/s1-calculus-1.md) | 60 h | proposta do NDE |
| 1º | [Práticas de Cálculo I](courses/s1-calculus-1-practice.md) | 30 h | proposta do NDE |
| 1º | [Física Geral I](courses/s1-general-physics-1.md) | 60 h | proposta do NDE |
| 1º | [Prática de Física Geral I](courses/s1-general-physics-1-practice.md) | 30 h | proposta do NDE |
| 1º | [Laboratório de Física Geral I](courses/s1-general-physics-1-lab.md) | 60 h | proposta do NDE |
| 2º | [Cálculo II](courses/s2-calculus-2.md) | 60 h | proposta do NDE |
| 2º | [Práticas de Cálculo II](courses/s2-calculus-2-practice.md) | 30 h | proposta do NDE |
| 2º | [Métodos Lineares para Física](courses/s2-linear-methods.md) | 60 h | proposta do NDE |
| 2º | [Física Geral IIa](courses/s2-general-physics-2a.md) | 30 h | proposta do NDE |
| 2º | [Física Geral IIb](courses/s2-general-physics-2b.md) | 30 h | proposta do NDE |
| 2º | [Prática de Física Geral IIa](courses/s2-general-physics-2a-practice.md) | 15 h | proposta do NDE |
| 2º | [Prática de Física Geral IIb](courses/s2-general-physics-2b-practice.md) | 15 h | ementa sem fonte nas notas do NDE (escrita a partir da ementa do curso principal), pendente de revisão |
| 2º | [Laboratório de Física Geral II](courses/s2-general-physics-2-lab.md) | 60 h | proposta do NDE |
| 3º | [Cálculo III](courses/s3-calculus-3.md) | 60 h | proposta do NDE |
| 3º | [Práticas de Cálculo III](courses/s3-calculus-3-practice.md) | 30 h | ementa sem fonte nas notas do NDE (escrita a partir da ementa do curso principal), pendente de revisão |
| 3º | [Computação para Física](courses/s3-computing-for-physics.md) | 60 h | proposta do NDE |
| 3º | [Física Geral III](courses/s3-general-physics-3.md) | 60 h | proposta do NDE |
| 3º | [Prática de Física Geral III](courses/s3-general-physics-3-practice.md) | 30 h | ementa sem fonte nas notas do NDE (escrita a partir da ementa do curso principal), pendente de revisão |
| 3º | [Laboratório de Física Geral III](courses/s3-general-physics-3-lab.md) | 60 h | proposta de roteiros, pendente de aprovação pelo NDE |
| 3º | [Métodos de Variáveis Complexas para a Física](courses/s3-complex-variables.md) | 60 h | proposta do NDE |
| 4º | [Cálculo IV](courses/s4-calculus-4.md) | 60 h | proposta do NDE |
| 4º | [Práticas de Cálculo IV](courses/s4-calculus-4-practice.md) | 30 h | ementa sem fonte nas notas do NDE (escrita a partir da ementa do curso principal), pendente de revisão |
| 4º | [Física Geral IV](courses/s4-general-physics-4.md) | 60 h | proposta do NDE |
| 4º | [Prática de Física Geral IV](courses/s4-general-physics-4-practice.md) | 30 h | ementa sem fonte nas notas do NDE (escrita a partir da ementa do curso principal), pendente de revisão |
| 4º | [Laboratório de Física Geral IV](courses/s4-general-physics-4-lab.md) | 60 h | proposta de roteiros, pendente de aprovação pelo NDE |
| 4º | [Física Matemática I](courses/s4-mathematical-physics-1.md) | 60 h | proposta do NDE |
| 5º | [Mecânica Geral](courses/s5-general-mechanics.md) | 60 h | proposta do NDE |
| 5º | [Eletromagnetismo I](courses/s5-electromagnetism-1.md) | 60 h | proposta do NDE |
| 5º | [Relatividade Restrita](courses/s5-special-relativity.md) | 60 h | proposta do NDE |
| 5º | [Física Moderna](courses/s5-modern-physics.md) | 60 h | proposta do NDE |
| 5º | [Laboratório de Física Moderna I](courses/s5-modern-physics-lab-1.md) | 60 h | ementa a definir pelo NDE |
| 5º | [Física Matemática II](courses/s5-mathematical-physics-2.md) | 60 h | proposta do NDE |
| 6º | [Mecânica Analítica I](courses/s6-analytical-mechanics-1.md) | 60 h | proposta do NDE |
| 6º | [Eletromagnetismo II](courses/s6-electromagnetism-2.md) | 60 h | proposta do NDE |
| 6º | [Termodinâmica](courses/s6-thermodynamics.md) | 60 h | proposta do NDE |
| 6º | [Laboratório de Física Moderna II](courses/s6-modern-physics-lab-2.md) | 60 h | ementa a definir pelo NDE |
| 6º | [Física Matemática III](courses/s6-mathematical-physics-3.md) | 60 h | ementa incompleta, em elaboração pelo NDE |
| 7º | [Mecânica Analítica II](courses/s7-analytical-mechanics-2.md) | 60 h | proposta do NDE |
| 7º | [Mecânica Quântica I](courses/s7-quantum-mechanics-1.md) | 60 h | proposta do NDE |
| 7º | [Mecânica Estatística](courses/s7-statistical-mechanics.md) | 60 h | proposta do NDE |
| 8º | [Mecânica Quântica II](courses/s8-quantum-mechanics-2.md) | 60 h | proposta do NDE |

Ainda sem nota: Introdução à Física Nuclear, Introdução à Física do Estado Sólido,
Evolução dos Conceitos e Teorias da Física, Introdução às Técnicas de Ensino e Pesquisa em
Física e Trabalho de Conclusão de Curso (ver as notas de 2023).

## Currículo vigente (2023)

| Código | Disciplina | Carga | Série |
|---|---|---|---|
| 2COP032 | [Introdução à Linguagem de Computação](curriculum-2023/2COP032-introducao-linguagem-computacao.md) | 60 h | 2ª, oferta 1º semestre |
| 2FIS090 | [Estrutura da Matéria](curriculum-2023/2FIS090-estrutura-da-materia.md) | 60 h | 1ª, oferta 2º semestre |
| 2FIS091 | [Física Básica](curriculum-2023/2FIS091-fisica-basica.md) | 90 h | 1ª, oferta 1º semestre |
| 2FIS092 | [Laboratório de Física Geral I](curriculum-2023/2FIS092-laboratorio-fisica-geral-1.md) | 90 h | 1ª, oferta anual |
| 2FIS093 | [Física Geral I](curriculum-2023/2FIS093-fisica-geral-1.md) | 90 h | 1ª, oferta 2º semestre |
| 2FIS094 | [Física Geral II](curriculum-2023/2FIS094-fisica-geral-2.md) | 120 h | 2ª, oferta anual |
| 2FIS095 | [Laboratório de Física Geral II](curriculum-2023/2FIS095-laboratorio-fisica-geral-2.md) | 120 h | 2ª, oferta anual |
| 2FIS096 | [Física Geral III](curriculum-2023/2FIS096-fisica-geral-3.md) | 90 h | 2ª, oferta 1º semestre |
| 2FIS097 | [Física Matemática I](curriculum-2023/2FIS097-fisica-matematica-1.md) | 60 h | 2ª, oferta 2º semestre |
| 2FIS098 | [Laboratório de Física Moderna](curriculum-2023/2FIS098-laboratorio-fisica-moderna.md) | 120 h | 3ª, oferta anual |
| 2FIS099 | [Física Moderna I A](curriculum-2023/2FIS099-fisica-moderna-1a.md) | 90 h | 3ª, oferta 1º semestre |
| 2FIS100 | [Física Moderna I B](curriculum-2023/2FIS100-fisica-moderna-1b.md) | 60 h | 3ª, oferta 2º semestre |
| 2FIS101 | [Física Matemática II](curriculum-2023/2FIS101-fisica-matematica-2.md) | 60 h | 3ª, oferta 1º semestre |
| 2FIS102 | [Mecânica Geral A](curriculum-2023/2FIS102-mecanica-geral-a.md) | 90 h | 3ª, oferta 1º semestre |
| 2FIS103 | [Eletromagnetismo I](curriculum-2023/2FIS103-eletromagnetismo-1.md) | 90 h | 3ª, oferta 1º semestre |
| 2FIS104 | [Eletromagnetismo II](curriculum-2023/2FIS104-eletromagnetismo-2.md) | 60 h | 3ª, oferta 2º semestre |
| 2FIS105 | [Mecânica Analítica](curriculum-2023/2FIS105-mecanica-analitica.md) | 90 h | 3ª, oferta 2º semestre |
| 2FIS106 | [Termodinâmica](curriculum-2023/2FIS106-termodinamica.md) | 60 h | 3ª, oferta 2º semestre |
| 2FIS107 | [Introdução às Técnicas de Ensino e Pesquisa em Física](curriculum-2023/2FIS107-tecnicas-ensino-pesquisa.md) | 60 h | 4ª, oferta anual |
| 2FIS108 | [Relatividade Restrita](curriculum-2023/2FIS108-relatividade-restrita.md) | 60 h | 4ª, oferta 1º semestre |
| 2FIS109 | [Mecânica Quântica I](curriculum-2023/2FIS109-mecanica-quantica-1.md) | 60 h | 4ª, oferta 1º semestre |
| 2FIS110 | [Introdução à Física Nuclear](curriculum-2023/2FIS110-fisica-nuclear.md) | 60 h | 4ª, oferta 1º semestre |
| 2FIS111 | [Mecânica Estatística](curriculum-2023/2FIS111-mecanica-estatistica.md) | 60 h | 4ª, oferta 1º semestre |
| 2FIS112 | [Mecânica Quântica II](curriculum-2023/2FIS112-mecanica-quantica-2.md) | 60 h | 4ª, oferta 2º semestre |
| 2FIS113 | [Evolução dos Conceitos e Teorias da Física](curriculum-2023/2FIS113-evolucao-conceitos-teorias.md) | 60 h | 4ª, oferta 2º semestre |
| 2FIS114 | [Introdução à Física do Estado Sólido](curriculum-2023/2FIS114-fisica-estado-solido.md) | 60 h | 4ª, oferta 2º semestre |
| 2MAT161 | [Cálculo e Geometria Analítica I](curriculum-2023/2MAT161-calculo-geometria-analitica-1.md) | 150 h | 1ª, oferta anual |
| 2MAT162 | [Cálculo e Geometria Analítica II](curriculum-2023/2MAT162-calculo-geometria-analitica-2.md) | 150 h | 2ª, oferta anual |
| 2MAT163 | [Álgebra Linear B](curriculum-2023/2MAT163-algebra-linear-b.md) | 60 h | 2ª, oferta 2º semestre |
| 2QUI198 | [Química](curriculum-2023/2QUI198-quimica.md) | 120 h | 1ª, oferta anual |
| 2TCC314 | [Trabalho de Conclusão de Curso](curriculum-2023/2TCC314-trabalho-conclusao-curso.md) | 180 h | 4ª, oferta anual |
