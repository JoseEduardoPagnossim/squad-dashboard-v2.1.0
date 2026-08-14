# Atualização V2.9.0

## O que mudou

### Visão do Squad
Foram adicionados três gráficos históricos baseados nos meses já importados:

1. **Total de atendimentos por técnico / mês**
   - barras: total de atendimentos do Squad;
   - linhas: cada técnico;
   - dois eixos para manter legibilidade entre total geral e volume individual.

2. **Média de atendimentos por dia útil**
   - cálculo: atendimentos do técnico ÷ dias úteis transcorridos no mês importado;
   - permite comparar meses em andamento com meses fechados sem dividir sempre pelo mês inteiro; inclui uma linha tracejada com a média geral do Squad.

3. **% de avaliação por técnico**
   - cálculo: total de avaliações ÷ atendimentos;
   - usa o percentual já consolidado de cada técnico em cada mês e inclui uma linha tracejada com o percentual geral do Squad.

Na Visão do Squad são considerados até os 12 meses importados mais recentes.

### Indicadores — Admin geral
As mesmas três análises foram adicionadas ao painel executivo e respeitam o filtro **De / Até**.

- Com um Squad selecionado: linhas por técnico.
- Com **Todos os Squads**: linhas por Squad para manter o gráfico legível.

### Layout de cards
Os grupos principais de cards ficam em **4 colunas no desktop**. Não existe mais o layout de 3 cards que deixava o quarto card sozinho na linha de baixo. Em telas menores o layout continua responsivo.

## Banco de dados
Nenhuma migração SQL é necessária. Os gráficos usam os meses e métricas já armazenados.

## Atualização
Mantenha o seu `config.js` atual e substitua os demais arquivos do frontend pelos desta versão.
