# Soften Performance Hub V2.23.1

## Correções

- Corrigida a altura real dos SVGs dos gráficos premium. A regra antiga de `height:auto !important` fazia gráficos com muitos pontos ficarem comprimidos em poucos pixels, deixando o restante do card aparentemente vazio.
- A correção vale para Visão do Squad, Indicadores, históricos e gráfico em tela cheia.
- Os dois gráficos executivos do comparativo por Squad agora trabalham por **competência mensal consolidada**, e não por dia:
  - Quantidade de atendimentos por Squad.
  - Taxa média de avaliação mensal por Squad.
- O gráfico **Atendimentos diários consolidados x média do período** continua diário, pois sua finalidade é mostrar ritmo operacional.
- Os dois cards executivos foram reduzidos para uma altura mais proporcional ao número de competências exibidas.

## Publicação

Não há migração SQL nem Edge Function nova. Preserve o `config.js` de produção e substitua apenas os arquivos da atualização. Depois faça Ctrl+F5.
