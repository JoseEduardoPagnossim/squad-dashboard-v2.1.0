# Soften Performance Hub V2.27.4

## Correção

A importação de Produto/Empresa consolidava somente a competência escolhida no seletor. Como o CSV atual contém julho e agosto, confirmar agosto deixava julho sem dados diários de qualidade no monitor, enquanto o CSV operacional já possuía uma sincronização histórica própria.

A V2.27.4 iguala esse comportamento:

- a competência selecionada continua sendo a principal importação;
- as demais competências presentes no mesmo CSV e já cadastradas no mesmo escopo são sincronizadas automaticamente;
- Produto e Empresa continuam separados do Serviço;
- `NotaServico` do CSV de qualidade continua ignorada;
- técnicos inativos/históricos continuam sendo vinculados pela lógica da V2.27;
- o gráfico **Notas baixas acumuladas** permanece na tela Por dias úteis; a V2.27.3 deve ser desconsiderada.

## Limite da base atual

O CSV `Avaliações dos atendimentos-data-2026-08-26 10_35_36.csv` contém 2.746 avaliações de julho/2026 e 2.592 de agosto/2026. Ele não possui março, abril, maio ou junho. Por isso, Produto/Empresa não podem ser reconstruídos nesses meses sem importar um CSV que contenha essas competências.

## Implantação

1. Publique `index.html` e `app.js` desta versão.
2. Faça Ctrl + F5.
3. Reimporte o CSV Produto/Empresa atual e confirme agosto/2026.
4. O sistema importará agosto e sincronizará julho automaticamente, desde que julho já exista como competência operacional no escopo.

Não há nova migração SQL.
