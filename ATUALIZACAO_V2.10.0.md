# Atualização V2.10.0

## Gráficos

- Legendas visíveis com os nomes dos técnicos/Squads.
- Gráficos históricos maiores.
- Tooltip ao passar o mouse em linhas, pontos e barras.
- ACIMA x ABAIXO passou a ser uma matriz técnico por técnico e mês por mês.

## Cards da tela Indicadores

1. Atendimentos por hora.
2. Técnicos acima da referência.
3. Eficiência de excelência.
4. Status da equipe no período.

O status do período conta o resultado mensal da equipe dentro do filtro:
- mais meses/leituras `ACIMA` => **ACIMA**;
- mais meses/leituras `ABAIXO` => **ABAIXO**;
- mesma quantidade => **EMPATE**.

## Publicação

Não há migração SQL nem Edge Function nova. Preserve o `config.js` que já está configurado no GitHub/Supabase.
