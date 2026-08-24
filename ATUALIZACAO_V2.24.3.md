# Atualização V2.24.3

## Quadro geral — todas as métricas por competência

Corrigido o seletor de métricas da tela **Todos os técnicos em tela cheia**.

Antes, **Pontuação** usava o consolidado mensal, mas **Atendimentos**, **% de avaliação** e **Nota média** dependiam do consolidado diário. Em cenários onde o RPC diário não retornava a mesma base completa, a troca de métrica deixava o gráfico sem séries.

Agora as quatro métricas usam a mesma fonte mensal consolidada por técnico e competência:

- Pontuação
- Atendimentos
- % de avaliação
- Nota média

O filtro de calendário continua definindo quais competências entram no quadro.

## Meu desempenho — card % Avaliado

Ajustado o espaçamento abaixo da barra de qualidade para que o texto **Meta de avaliação atingida no período** não fique encoberto pelo bloco **Meta mensal completa**.

## Implantação

- Não há SQL novo.
- Não há alteração de Edge Functions.
- Preserve o `config.js` atual do ambiente.
- Após publicar, faça `Ctrl + F5`.
