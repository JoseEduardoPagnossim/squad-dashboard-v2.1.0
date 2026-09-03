# Soften Performance Hub V2.29.6

## Consolidação de status e bonificação

Esta versão consolida as regras após a auditoria do projeto atual contra a planilha `DESEMPENHO SQUAD D AGOSTO_2026 (3).xlsx`.

### 1. Status operacional

A referência do status volta a reproduzir a planilha:

- todos os técnicos com produção entram nas médias;
- Atendimento = média dos atendimentos;
- Avaliações = média do total de avaliações;
- Nota média = média das notas médias, truncada em 2 casas;
- % Avaliação = média dos percentuais ajustados por técnico;
- foi corrigida a precisão do truncamento em 2 casas para evitar `4,95` virar `4,94` por ponto flutuante no JavaScript;
- 2, 3 ou 4 critérios atendidos = `ACIMA`;
- 0 ou 1 critério = `ABAIXO`.

O checkbox `Desconsiderar na quantidade do Squad` não altera mais essas referências.

### 2. Competência parcial / regra financeira

O checkbox existente passa a ter uma função única e clara:

- mantém atendimentos, avaliações, status, pontos, ranking e histórico;
- mantém o técnico recebendo a Base do Squad caso tenha produção;
- retira o técnico somente do divisor usado para calcular a Base do Squad;
- isenta o técnico do desconto por status `ABAIXO`;
- exclui o técnico do grupo que recebe redistribuição quando estiver `ACIMA`.

Isso reproduz o tratamento aplicado ao Diego em agosto: a produção permanece, ele não entra no divisor financeiro e não gera desconto/redistribuição.

### 3. Resultado da equipe

O resultado do Squad continua derivado dos status individuais, e não da média de pontos:

- 50% ou mais dos técnicos com produção em `ACIMA` => equipe `ACIMA`;
- abaixo de 50% => equipe `ABAIXO`.

Competência parcial continua contando para a leitura operacional do time, porque o status dela permanece válido.

### 4. Atendimentos sem avaliação

A V2.29.5 continua válida:

`Base elegível = Atendimentos - Atendimentos sem avaliação`

A V2.29.6 também atualiza a RPC do ranking acessado pelo técnico para usar essa mesma base quando o intervalo cobre a competência completa. Em intervalos parciais o ajuste mensal não é rateado por dia.

### 5. Validação com agosto / Squad D

Com os dados da planilha auditada, as referências esperadas são aproximadamente:

- Atendimento: `237`
- Avaliações: `88`
- Nota média: `4,95`
- % Avaliação: `37,13%`

Status esperados:

- Arthur Santos: `ACIMA` — 3/4
- Diego Martins: `ABAIXO` — 1/4
- Felipe Okamoto: `ACIMA` — 2/4
- Guilherme Pereira: `ABAIXO` — 1/4
- Guilherme Tofoletti: `ACIMA` — 4/4
- Mykael Keven: `ACIMA` — 2/4
- Olavo Duarte: `ACIMA` — 3/4
- Rodolfo Donda: `ACIMA` — 3/4

Na bonificação, com Diego marcado como competência parcial, somente Guilherme Pereira gera o desconto de R$ 200. O pool fica em R$ 200 e é dividido entre os 6 técnicos `ACIMA` elegíveis, aproximadamente R$ 33,33 para cada um.

### 6. Banco

Execute `MIGRACAO_V2.29.6.sql` depois das migrações anteriores. Não há coluna ou tabela nova.

### 7. Competências já fechadas

Snapshots antigos permanecem congelados. Para aplicar a regra consolidada a agosto já fechado:

1. reabra agosto;
2. confirme `Atend. sem avaliação` e o checkbox de competência parcial do Diego;
3. salve a bonificação;
4. confira status e valores;
5. feche agosto novamente.

O novo fechamento grava snapshot versão 8.
