# Atualização V2.14.0

## Alterações

- Os gráficos **Quantidade de atendimentos por Squad** e **Taxa média de avaliação mensal por Squad** foram removidos de **Meu desempenho**. Eles permanecem em **Visão do Squad**, evitando repetição de conteúdo no painel individual.
- Adicionado o indicador **Atendimentos diários consolidados x média do período** em **Visão do Squad**.
- O gráfico soma diariamente os atendimentos dos Squads A, B, D e E.
- Na Visão do Squad, a linha tracejada mostra a média diária do próprio mês selecionado.
- Em Indicadores, o gráfico mostra os dias do mês final do filtro e compara com a média diária de todo o período selecionado.
- Tooltips e legenda seguem o padrão dos demais gráficos.

## Supabase

Execute uma vez `MIGRACAO_V2.14.0.sql`. Ela cria a RPC `get_org_daily_attendance_overview`, que retorna somente totais agregados por Squad/dia para usuários autenticados da mesma organização. Nenhum dado individual é exposto por essa função.

## Publicação

Mantenha o `config.js` que já está configurado no ambiente publicado e substitua os demais arquivos do pacote de atualização.
