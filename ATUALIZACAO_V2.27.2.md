# Soften Performance Hub V2.27.2

## Correção — Indicadores > Por dias úteis

A V2.27.1 ficou excessivamente restritiva: se o total diário de Serviço não fechasse 100% com o consolidado mensal, a competência inteira era retirada dos gráficos de **Taxa de avaliação acumulada** e **Notas baixas acumuladas**. Por isso, após a atualização, somente Agosto podia permanecer visível.

A V2.27.2 corrige esse comportamento:

- todas as competências selecionadas continuam visíveis nos gráficos por dias úteis;
- nenhuma competência é descartada por uma pequena divergência entre detalhe diário e consolidado mensal;
- quando existir divergência, o mês recebe apenas um aviso `⚠ diário a conferir`;
- o CSV operacional mais recente passa a ser a fonte de verdade para a **distribuição diária das notas de Serviço** usada no comparativo por dias úteis;
- ao reimportar o CSV operacional, as Notas 1 a 5 dos meses históricos já existentes no mesmo escopo são sincronizadas mesmo quando o consolidado mensal antigo tiver alguma diferença;
- o consolidado mensal oficial, metas, financeiro e bonificação **não são alterados** por essa sincronização histórica.

## Por que isso é necessário

O CSV `Chamados Finalizados por Técnico por dia, dos últimos 12 meses` já contém a informação diária necessária para comparar competências no mesmo dia útil. Portanto, para esta tela, não faz sentido eliminar um mês inteiro somente porque o consolidado histórico salvo anteriormente difere em uma ou poucas avaliações.

## Depois de publicar

1. Publique `index.html` e `app.js` da V2.27.2.
2. Faça `Ctrl + F5`.
3. Reimporte **uma vez** o CSV operacional atual, no mesmo escopo usado normalmente.
4. Selecione Agosto normalmente para concluir a importação.
5. A importação sincronizará automaticamente o detalhe diário das competências anteriores presentes no mesmo CSV.
6. Abra **Indicadores > Por dias úteis**.

Não existe nova migração SQL nesta versão.

## Validação com o CSV de 26/08/2026

Considerando Todos os Squads e os primeiros 18 dias úteis, o arquivo enviado possui notas baixas de Serviço nos meses anteriores. Assim, após a sincronização, esses meses não podem aparecer zerados/ausentes no comparativo.
