# Soften Performance Hub V2.23.2

## Correção dos gráficos da tela Indicadores

A V2.23.1 corrigiu o dimensionamento dos SVGs, porém a tela **Indicadores** ainda podia interromper a renderização depois dos cards iniciais.

### Causa encontrada

Durante a modernização dos gráficos da V2.23.0, a função `buildStatusMatrix()` foi removida acidentalmente do `app.js`, embora `renderTechnicianStatusMatrix()` continuasse chamando essa função.

Ao abrir **Indicadores**, o navegador gerava um `ReferenceError` justamente no primeiro gráfico da seção **Status oficial de cada técnico por competência**. Como a execução de `renderIndicators()` era interrompida naquele ponto, os gráficos seguintes permaneciam somente com os cards vazios.

### Correções

- Restaurada a função `buildStatusMatrix()` com a lógica anterior de status oficial por técnico, Squad e competência.
- Mantida a correção V2.23.1 de altura dos SVGs.
- Mantida a visão mensal dos gráficos executivos de quantidade de atendimentos e taxa média de avaliação por Squad.
- Adicionada proteção de renderização por bloco na tela Indicadores. Se futuramente um gráfico específico falhar, ele não interrompe os demais gráficos da página.
- Nenhuma regra de negócio, cálculo, banco de dados ou tema foi alterado.

## Atualização

1. Preserve o `config.js` atual do ambiente de produção.
2. Substitua os arquivos pelo pacote de atualização V2.23.2.
3. Aguarde o GitHub Pages publicar.
4. Faça `Ctrl + F5`.

Não há SQL novo e não é necessário republicar Edge Functions.
