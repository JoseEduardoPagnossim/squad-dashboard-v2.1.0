# Atualização V2.13.0

## Visão do Squad para todos os perfis

A tela **Visão do Squad** agora exibe para técnicos, Admin de Squad e Admin Geral:

- **Quantidade de atendimentos por Squad / mês**;
- **Taxa média de avaliação mensal por Squad**;
- botão **Todos os técnicos**, abrindo o comparativo de todos os técnicos de todos os Squads em tela cheia.

O gráfico em tela cheia permite alternar entre:

- Pontuação;
- Atendimentos;
- % de avaliação;
- Nota média.

A comparação usa até os 12 meses mais recentes ao ser aberta pela Visão do Squad.

## Supabase

Execute uma vez `MIGRACAO_V2.13.0.sql` no SQL Editor. A função retorna somente métricas operacionais necessárias ao comparativo. Não expõe e-mail, senha, bônus, desconto ou dados de autenticação.

Depois, publique `index.html`, `app.js` e `styles.css`, mantendo o `config.js` atual.
