# Soften Performance Hub V2.27.1

## Correção — Indicadores > Por dias úteis

Foi corrigido o histórico de **Notas baixas de Serviço** no comparativo por dias úteis.

### Causa

Algumas competências antigas foram importadas antes de o `daily_metrics` armazenar Nota 1, Nota 2, Nota 3 e Nota 4. O consolidado mensal (`technician_monthly`) possuía as notas corretamente, por isso a tela **Qualidade** mensal mostrava o histórico, mas a nova tela **Por dias úteis** dependia do detalhamento diário e interpretava esses campos antigos como zero.

Como o comparativo por dias úteis precisa saber em qual dia a nota aconteceu, não é correto ratear o total mensal nem estimar a distribuição.

### Correção aplicada

- A tela **Por dias úteis** agora valida a integridade do Serviço diário comparando o total diário de Nota 1 a 5 com o consolidado mensal.
- Se a competência estiver com histórico diário incompleto, o sistema não exibe `0%` falsamente. O valor fica indisponível até a sincronização correta.
- Ao reimportar o CSV operacional atual, além de atualizar a competência escolhida, o sistema usa os demais meses presentes no mesmo CSV para **sincronizar somente o detalhamento diário de Nota 1 a 5 das competências históricas já existentes no mesmo escopo**.
- A sincronização só ocorre quando os totais de Nota 1 a 5 do CSV conferem exatamente com os totais mensais já gravados para o técnico. Se houver divergência, o histórico daquele técnico não é alterado automaticamente.
- Dados financeiros, metas, bonificação, exclusão da contagem, Produto/Empresa e consolidados mensais históricos não são alterados por essa sincronização.
- A regra de escopo permanece igual à importação normal: ao importar um Squad, corrige somente aquele Squad; em Todos os Squads, usa o mesmo escopo corporativo já existente.

## Como corrigir o histórico existente

1. Publicar `index.html` e `app.js` da V2.27.1.
2. Fazer `Ctrl + F5`.
3. Importar novamente o **CSV operacional/Serviço atual**, que contém os últimos 12 meses.
4. Selecionar a competência atual normalmente (ex.: Agosto/2026) e concluir a importação.
5. O sistema atualizará Agosto e, em seguida, sincronizará automaticamente as notas diárias dos meses anteriores que já estiverem cadastrados.
6. Abrir **Indicadores > Por dias úteis** e conferir as competências anteriores.

## Banco de dados

**Não existe nova migração SQL nesta versão.**

A V2.27.1 utiliza as colunas de Nota 1 a 4 em `daily_metrics` já adicionadas nas versões anteriores.
