# Soften Performance Hub V2.26.0 — Banco, segurança e operação

## Atualização V2.26.0 — Qualidade Produto/Empresa

Antes de publicar o frontend, execute `MIGRACAO_V2.26.0.sql`. A migração cria `quality_daily_metrics`, usada exclusivamente para as avaliações de **Produto** e **Empresa**.

O CSV atual de Qualidade não precisa conter cliente. O vínculo é feito pelo `nomeApresentativo`, competência operacional já importada e Squad histórico do técnico. `NotaServico` deste arquivo é ignorada: Serviço permanece exclusivamente em `daily_metrics`.

Cada linha do CSV representa uma avaliação individual. Na importação, as notas válidas de 1 a 5 são consolidadas por técnico + dia + tipo (`product`/`company`). Zero, vazio e valores fora de 1–5 não viram nota.

A reimportação operacional preserva a base de Qualidade; a reimportação de Qualidade não altera Serviço, atendimentos, pontuação, status ou financeiro.

## Atualização V2.21.0 — filtros diários

Antes de publicar o frontend, execute `MIGRACAO_V2.21.0.sql`. A migração adiciona as notas 4, 3, 2 e 1 em `daily_metrics` e recria os RPCs agregados diários usados nas análises.

Após a migração, reimporte os meses que deseja consultar por intervalos parciais. Os dados mensais antigos continuam válidos, mas a composição diária de notas 4 a 1 só passa a existir após uma nova importação do CSV.

Pontuação, status oficial, bonificação e fechamento permanecem mensais; o calendário diário é uma camada analítica.

## V2.20.5 — Técnico fora do denominador financeiro

A configuração `exclude_from_group_count` continua válida e independente do calendário diário. Ela afeta somente o denominador financeiro da Base do Squad.

## 1. Arquitetura

O projeto usa Supabase Postgres + Authentication + RLS. Os principais blocos são:

- `organizations`: organização;
- `squads`: Squads A, B, D e E;
- `profiles`: perfil atual do usuário;
- `profile_squad_history`: vigência histórica do usuário em cada Squad;
- `squad_months`: competência do Squad, metas, regras, fechamento e snapshots;
- `technician_monthly`: desempenho mensal;
- `daily_metrics`: histórico diário de atendimentos e Serviço;
- `quality_daily_metrics`: histórico diário consolidado de Produto e Empresa;
- `technician_finance_monthly`: campos financeiros manuais e cálculo persistido;
- `super_admin_commissions`: comissão mensal manual do Admin Geral;
- `squad_themes`: tema/ambientação.

## 2. Perfis

```text
super_admin  → todos os Squads, indicadores, movimentações e gestão geral
squad_admin  → administração do próprio Squad
technician   → próprio desempenho e visões consolidadas autorizadas
```

O `profiles.squad_id` representa o vínculo **atual**. A partir da V2.19, o passado é preservado em `profile_squad_history`.

## 3. Histórico de movimentação

`profile_squad_history` possui:

```text
organization_id
user_id
squad_id
technician_name
valid_from_year / valid_from_month
valid_to_year / valid_to_month
created_by / created_at / note
```

Uma linha sem `valid_to_*` é o vínculo aberto atual. A Edge Function `manage-user` fecha o vínculo anterior e abre o novo quando o Admin Geral move o técnico.

Reimportações históricas consultam esse histórico antes do `profiles.squad_id`, evitando deslocar meses antigos para o Squad atual.

## 4. Importação operacional

CSV esperado:

```text
time
Tecnico
grupoAtendimento
Quantidade
Nota 5
Nota 4
Nota 3
Nota 2
Nota 1
```

A reimportação é substitutiva, não incremental. O sistema reconstrói os números operacionais da competência com o estado mais recente do CSV e preserva parâmetros manuais.

A chave de nome normaliza Unicode, espaços invisíveis, espaços duplicados e acentos para vínculo.

## 5. Gamificação

Status individual usa as médias atuais do Squad para:

- atendimentos;
- total de avaliações;
- nota média;
- % avaliado = total de avaliações / atendimentos.

```text
2+ critérios => ACIMA
0/1          => ABAIXO
sem produção => sem status
```

A pontuação e o ranking são independentes da bonificação financeira.

## 6. Financeiro

### Tabelas

`squad_months` armazena:

```text
finance_settings
finance_month_data
finance_model                  -- squad | individual
finance_compare                -- exibir comparação
finance_comparison_snapshot    -- resumo dos dois cenários
```

`technician_finance_monthly` armazena:

```text
manual_bonus
sales_commission
vacation
calculated
```

`calculated` contém os componentes auditáveis e, na V2.19, os dois modelos por técnico.

### Modelo Base do Squad

```text
group_avg_per_day = total_att / dias_uteis / tecnicos_com_producao
group_notes5_pct  = total_notes5 / total_att
```

As duas métricas procuram suas faixas, somam as comissões e recebem o multiplicador de cancelamento. Essa base é compartilhada pelos técnicos com produção.

### Modelo Individual

Cada técnico usa `att / dias_uteis` e `notes5 / att` para encontrar suas próprias faixas.

### Ajustes comuns

Depois da base:

```text
+ bônus manual
+ prêmio maior atendimento
+ prêmio maior Notas 5
+ comissão de vendas
- desconto ABAIXO
+ redistribuição entre ACIMA do mesmo Squad
```

Férias aplica 50% sobre o total final. Admin Geral possui comissão manual separada.

## 7. Fechamento

O snapshot V3 do mês congela:

- referências e resultado da gamificação;
- modelo financeiro oficial;
- opção de comparação;
- regras financeiras;
- dados de cancelamento;
- resumo dos dois modelos;
- composição completa dos dois modelos por técnico.

Meses fechados ficam bloqueados para reimportação/alterações até serem reabertos.

## 8. RLS e Edge Functions

### Dados financeiros

O técnico pode ler apenas o próprio financeiro. Admin do Squad pode administrar o próprio Squad. Admin Geral possui escopo geral autorizado.

### `profile_squad_history`

Usuários autenticados podem ler conforme escopo. INSERT/UPDATE/DELETE são revogados do papel `authenticated`; alterações são feitas pela Edge Function com `service_role`.

### `create-user`

Usa `service_role` no servidor para:

- criar o Auth user;
- criar `profiles`;
- criar histórico inicial de Squad;
- vincular linhas mensais pelo nome normalizado;
- fazer rollback do Auth se o perfil falhar.

### `manage-user`

Usa `service_role` para:

- editar perfil;
- registrar movimentação;
- inativar/reativar e bloquear/liberar Auth;
- excluir quando permitido.

Nunca exponha a `SUPABASE_SERVICE_ROLE_KEY` no frontend ou no GitHub.

## 9. Atualização V2.18.1 → V2.19.0

Execute nesta ordem:

1. `MIGRACAO_V2.19.0.sql`;
2. deploy da `manage-user` V2.19;
3. deploy da `create-user` V2.19;
4. frontend V2.19;
5. logout/login e hard refresh.

Não recrie banco nem rode `supabase_schema.sql` sobre uma produção já existente. O schema completo é para instalação nova.

## 10. Instalação nova

1. execute `supabase_schema.sql`;
2. crie o primeiro Admin Geral no Authentication;
3. execute `bootstrap_primeiro_admin.sql` com o UUID;
4. publique `create-user` e `manage-user`;
5. configure `config.js` com URL e anon/publishable key;
6. configure as URLs de autenticação do domínio publicado.

## 11. Backup e auditoria

Para competências oficiais, recomenda-se:

- gerar Excel/PDF antes do fechamento;
- manter o mês fechado depois da conferência;
- reabrir somente para correção controlada;
- usar Inativar, não Excluir, para pessoas que deixam a operação;
- informar competência ao movimentar técnicos entre Squads.


## 10. Atualização V2.20.0

Execute `MIGRACAO_V2.20.0.sql` após a V2.19.0.

Novas colunas em `squad_months`:

- `finance_technician_compare`: controla se o técnico pode ver a simulação de transição.
- `finance_individual_cap`: teto global do modelo Individual; padrão R$ 7.000,00.

A função `get_my_squad_finance_ranking(year, month)` é `SECURITY DEFINER` e entrega a técnicos/Admin de Squad somente nome e valor financeiro oficial dos técnicos do próprio Squad. Ela não amplia a política de leitura de `technician_finance_monthly`, portanto os componentes financeiros privados continuam protegidos.

O frontend V2.20.0 também persiste `technician_finance_monthly.calculated` a cada reimportação CSV, mantendo a classificação financeira consistente depois das atualizações diárias.


## V2.20.2 — equivalência da pontuação e dialogs

A pontuação automática usa as mesmas referências da planilha oficial: `ROUND(AVERAGE(atendimentos),0)`, `ROUND(AVERAGE(total avaliações),0)`, `ROUNDDOWN(AVERAGE(nota média),2)` e `ROUND(AVERAGE(% avaliado),4)`. O percentual individual também é arredondado em quatro casas antes da comparação. As confirmações de ações críticas são dialogs internos do sistema; não há `window.confirm` no frontend. Esta versão não exige migração de banco.

### Inativação e reimportação histórica

A partir da V2.20.3, o status `active=false` controla o **acesso** do usuário, não a existência dos dados operacionais. Se um técnico inativado possui registros no CSV de uma competência, ele continua sendo reconhecido na reimportação daquele mês e participa normalmente das médias, status e pontuação.



## V2.20.4 — composição da média da competência

Ao reimportar uma competência aberta, o sistema atualiza os técnicos presentes no CSV e preserva o último consolidado dos técnicos que já possuíam produção naquele mesmo mês, mas deixaram de aparecer na extração posterior por inativação ou movimentação. Esses técnicos continuam compondo as referências de pontuação do mês. Linhas-resumo não são preservadas. A mudança é apenas de frontend/importação e não exige SQL ou Edge Function.

## V2.22.0 — atualização somente de frontend

A V2.22.0 altera somente HTML, JavaScript de interação do seletor de data e CSS visual. Não cria colunas, tabelas, políticas ou funções novas no Supabase. Se a `MIGRACAO_V2.21.0.sql` já foi executada, não existe SQL adicional para esta versão.


## V2.25.1 — Feedbacks mensais

Execute `MIGRACAO_V2.25.1.sql` antes de publicar o frontend. A migração cria/valida `technician_feedbacks` e pode ser executada novamente com segurança.

Permissões:

- Admin Geral: cria, lê e edita feedbacks de qualquer Squad da organização.
- Admin do Squad: cria, lê e edita apenas feedbacks do próprio Squad.
- Técnico: lê somente feedbacks próprios que estejam `finalized` e com `visible_to_technician = true`.

O conteúdo inicial é gerado no frontend por regras objetivas a partir de atendimentos, avaliações, nota média, pontuação, ranking, status, metas e comparação com a competência anterior. Não há chamada a IA externa.

O JSON `generated_snapshot` preserva os indicadores usados na geração inicial, enquanto os campos textuais permanecem editáveis pelo gestor.

## V2.27.0 — Qualidade independente e novas análises

Antes de publicar a V2.27.0, execute no SQL Editor do Supabase:

```sql
-- conteúdo do arquivo MIGRACAO_V2.27.0.sql
```

A migração cria `quality_person_daily_metrics`, usada para Produto/Empresa por técnico e dia sem exigir uma linha correspondente em `technician_monthly`. Isso é necessário para preservar avaliações de técnicos inativos/desligados que não aparecem no CSV operacional da competência.

Depois da migração e da publicação do frontend, reimporte o CSV Produto/Empresa da competência atual para aproveitar a recuperação de vínculo por histórico/cadastro.
