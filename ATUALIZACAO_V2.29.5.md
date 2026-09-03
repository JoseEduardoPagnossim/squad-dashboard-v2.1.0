# Soften Performance Hub V2.29.5

## Atendimentos sem envio de avaliação

Foi criado um ajuste mensal por técnico para atendimentos cujo tipo não dispara e-mail de avaliação.

### Regra

- **Atendimentos totais** continuam inalterados e contam normalmente para produção, metas de volume, média de atendimentos e ranking.
- **Base elegível de avaliação** = `Atendimentos totais - Atend. sem avaliação`.
- **% Avaliação** = `Total de avaliações / Base elegível`.
- **% Notas 5 da bonificação** também passa a usar a Base elegível, tanto no modelo Individual quanto na Base do Squad.
- Nota média, total de avaliações e quantidade de Notas 5 não são alterados.
- O valor informado é limitado para que a base elegível nunca fique abaixo da quantidade de avaliações já recebidas.

### Onde informar

O mesmo valor pode ser editado em:

- **Gestão > Operação > Métricas individuais** — coluna `Atend. sem avaliação`;
- **Gestão > Bonificação > Técnicos do Squad** — campo `Atend. sem avaliação`.

Salvar em qualquer uma das telas recalcula % de avaliação, referências, status, ranking e bonificação.

### Histórico e reimportação

- O ajuste é salvo por **técnico + competência**.
- Reimportar o CSV operacional preserva o valor manual já informado.
- Ao fechar a competência, o ajuste entra no snapshot e fica congelado junto com os demais dados.

### Recortes por período

Como o ajuste informado é mensal e não possui data/dia, ele é aplicado somente quando o intervalo cobre a competência completa (inclusive o mês em andamento até `latest_day`). Em recortes parciais, a taxa permanece bruta para não distribuir artificialmente o desconto entre dias.

### Banco de dados

Execute `MIGRACAO_V2.29.5.sql` antes de publicar a versão.

A migração:

1. adiciona `technician_monthly.evaluation_excluded_att`;
2. atualiza `get_org_squad_monthly_overview()` para usar base elegível na taxa mensal;
3. atualiza `get_my_squad_game_ranking(date,date)` para aplicar o ajuste nas competências completas do intervalo.

Nenhuma tabela existente é removida e nenhuma regra de férias ou `exclude_from_group_count` é alterada.
