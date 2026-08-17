# Atualização V2.11.0

## Antes de publicar
Execute uma única vez no **Supabase → SQL Editor** o arquivo `MIGRACAO_V2.11.0.sql`.

A migração cria somente uma função de leitura agregada. Ela não altera nem apaga usuários, meses, metas ou resultados.

## Novidades
1. **Meu desempenho** ganhou uma Visão do Setor com:
   - Quantidade de atendimentos por Squad / mês.
   - Taxa de avaliação mensal por Squad.
2. **Indicadores** ganhou os mesmos dois gráficos, respeitando o período De/Até.
3. **Admin geral** ganhou **Todos os técnicos em tela cheia**.
   - Usa o período atual da tela Indicadores.
   - Métricas selecionáveis: Pontuação, Atendimentos, % de avaliação e Nota média.
   - Linhas identificadas por `Squad • Técnico` e tooltip em cada ponto.
4. A visão disponibilizada a técnicos de outros Squads contém somente agregados por equipe; detalhes individuais continuam protegidos pelas regras atuais do banco.

## Publicação no GitHub
Mantenha o seu `config.js` atual. Substitua `index.html`, `app.js` e `styles.css`.
