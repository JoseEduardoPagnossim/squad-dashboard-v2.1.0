# Atualização V2.29.2 — Consistência de status e referências

## O que foi corrigido

A regra **ACIMA / ABAIXO** continua exatamente como a planilha oficial:

- sem atendimento: sem status;
- 2, 3 ou 4 dos 4 critérios atingidos: **ACIMA**;
- 0 ou 1 critério: **ABAIXO**.

O ajuste está na formação das referências quando existe técnico marcado em **Desconsiderar na quantidade de técnicos do grupo**.

### Nova regra do checkbox

O técnico desconsiderado:

- continua com seus atendimentos e avaliações nos totais do Squad;
- continua aparecendo no ranking e no histórico;
- continua recebendo pontos e status individual;
- não entra na quantidade usada como divisor das referências do grupo;
- continua fora do divisor financeiro da Base do Squad.

As referências passam a ser calculadas assim:

- **Atendimentos:** total de atendimentos de todos ÷ técnicos considerados;
- **Total de avaliações:** total de avaliações de todos ÷ técnicos considerados;
- **Nota média:** média das notas médias somente dos técnicos considerados;
- **% avaliado:** média dos percentuais somente dos técnicos considerados.

Com o exemplo validado do Squad D, mantendo Diego nos totais mas fora do divisor, as referências ficam aproximadamente:

- Atendimentos: **271**;
- Avaliações: **101**;
- Nota média: **4,94**;
- % avaliado: **37,02%**.

Isso mantém, por exemplo, **Arthur ACIMA com 2/4 critérios**, enquanto Felipe e Mykael ficam ABAIXO com 1/4 — exatamente pela fórmula informada.

## Consistência mensal x diário

Quando o filtro cobre uma competência inteira, o ranking passa a priorizar o **consolidado mensal oficial** para atendimentos e composição N1–N5. O detalhe diário continua sendo usado nos gráficos e em intervalos parciais.

Isso evita que uma pequena divergência histórica em `daily_metrics` altere a pontuação/ranking do mês completo em relação à planilha consolidada.

## Persistência

Ao salvar o checkbox na Bonificação, a competência aberta recalcula e grava novamente:

- pontos;
- quantidade de critérios atingidos;
- status;
- ranking;
- resultado da equipe.

## Banco de dados

Execute `MIGRACAO_V2.29.2.sql`.

A migração não cria tabelas nem colunas; apenas atualiza o RPC `get_my_squad_game_ranking(date,date)` para que o acesso dos técnicos use a mesma regra do frontend.

Competências já **fechadas** permanecem congeladas. Para recalcular uma competência fechada com a nova regra, reabra o mês e feche novamente após a conferência.
