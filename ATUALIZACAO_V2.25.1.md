# Soften Performance Hub V2.25.1

## Feedback individual

A tela **Gestão → Feedbacks** agora deixa explícitas as duas formas de geração:

- **Gerar feedbacks pendentes**: cria de uma vez os rascunhos de todos os técnicos ainda sem feedback na competência.
- **Gerar individual**: cada técnico que ainda estiver como **NÃO GERADO** possui seu próprio botão. O sistema gera somente aquele feedback e já abre o editor para revisão.

Feedbacks já existentes continuam com o botão **Revisar**, evitando sobrescrever acidentalmente alterações feitas pelo gestor.

Esta versão também contém todas as entregas da V2.25.0: feedbacks mensais sem IA, tela Meus feedbacks do técnico, evolução diária em tela cheia e responsividade da legenda do gráfico por competência.

## Produção

1. Faça backup do repositório e preserve o `config.js` de produção.
2. No Supabase > SQL Editor, execute `MIGRACAO_V2.25.1.sql` (é idempotente; pode ser executada mesmo se a V2.25.0 já tiver sido aplicada).
3. Suba os arquivos do ZIP `squad-dashboard-v2.25.1-atualizacao-github.zip`.
4. Não substitua o `config.js`.
5. Não é necessário republicar Edge Functions.
6. Aguarde o GitHub Pages publicar, faça logout/login e `Ctrl + F5`.
