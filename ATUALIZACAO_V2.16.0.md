# Atualização V2.16.0

## Gráficos de linha

- Visual mais leve e contemporâneo.
- Linhas e pontos menos pesados para reduzir poluição em comparativos com muitas séries.
- Grade horizontal discreta e tipografia numérica mais clara.
- Régua vertical de leitura por período.
- Tooltip compartilhado: ao posicionar o mouse em um mês/dia, o sistema mostra **todas as séries daquele período**. Isso resolve pontos sobrepostos de técnicos ou Squads.
- Tooltip ordena os valores do maior para o menor e usa duas colunas quando há muitas séries.
- Legenda interativa: hover destaca uma série e clique fixa o destaque; clique novamente remove o foco.
- O mesmo comportamento foi aplicado ao gráfico em tela cheia de todos os técnicos e ao histórico combinado de atendimentos.

## Atualização

Não há nova migração SQL nem Edge Function. Mantenha o `config.js` já configurado e substitua os arquivos de frontend.
