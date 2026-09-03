# Atualização V2.29.4 — Status da equipe consistente

## Motivo

Na tela **Visão do Squad**, o resultado da equipe estava sendo calculado pela quantidade de técnicos com **pontuação acima da média de pontos do período**. Isso não representa a regra utilizada para classificar o desempenho dos técnicos.

A regra oficial de cada técnico permanece:

- Atendimento >= referência do grupo;
- Total de avaliações >= referência do grupo;
- Nota média >= referência do grupo;
- % de avaliação >= referência do grupo;
- **2, 3 ou 4 critérios = ACIMA**;
- **0 ou 1 critério = ABAIXO**.

## Correção

O resultado da equipe passa a ser calculado a partir desses status individuais:

`Técnicos considerados com status ACIMA / Técnicos considerados classificados`

- **>= 50% = ACIMA**
- **< 50% = ABAIXO**

O checkbox **Desconsiderar na quantidade de técnicos do grupo** mantém a produção e o status individual do técnico, mas retira esse técnico do denominador usado no resultado da equipe.

A pontuação média permanece disponível para ranking e análise, porém não interfere mais no status do Squad.

## Validação com o cenário de agosto do Squad D

Mantendo Diego como técnico com produção, porém fora do divisor das referências do grupo, a regra atual gera 4 técnicos considerados com status ACIMA em uma base de 7 considerados: **57,1%**, portanto o **Squad D = ACIMA**.

## Abrangência

A regra foi aplicada em:

- Visão do Squad;
- cards do portfólio de Squads;
- indicadores consolidados do período;
- `teamResult` recalculado da competência;
- competências fechadas: o resultado é derivado dos status congelados dos técnicos, evitando manter um `teamResult` antigo calculado por pontos.

## Banco de dados

**Não há nova migração SQL na V2.29.4.**

Se a competência estiver fechada, a tela já passa a derivar o resultado correto a partir do snapshot dos técnicos. Ao reabrir/fechar ou salvar novamente a competência, o `team_result` também será persistido com a regra nova.
