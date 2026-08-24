# Soften Performance Hub V2.25.0

## 1. Feedbacks mensais

Nova tela **Gestão → Feedbacks**, por Squad e competência. O gestor pode gerar todos os feedbacks pendentes de uma vez, revisar o texto, salvar como rascunho, finalizar e opcionalmente disponibilizar ao técnico.

A geração é determinística e sem IA externa. Ela utiliza: atendimentos, avaliações, taxa de avaliação, nota média, pontuação, ranking, status, metas, referências do Squad e comparação com a competência anterior.

O técnico recebe a nova tela **Meus feedbacks** e somente enxerga registros finalizados que o gestor marcou como visíveis.

## 2. Evolução diária dos técnicos

Em **Indicadores** foi adicionado **Evolução diária dos técnicos**, em tela cheia, com as métricas:

- Pontuação diária simulada;
- Atendimentos;
- % de avaliação;
- Nota média.

A pontuação diária usa a mesma estrutura de pontuação, mas referências calculadas para os técnicos com produção no Squad em cada dia. Ela é apenas analítica e não altera pontuação/status oficiais da competência.

O quadro **Todos os técnicos por competência** permanece mensal.

## 3. Responsividade da legenda

A área do gráfico e a legenda em tela cheia passaram a usar layout flexível. A legenda fica em uma faixa própria com rolagem interna quando necessário, evitando desaparecer em notebooks ou resoluções com pouca altura.

## 4. Produção

1. Faça backup do repositório e preserve o `config.js` de produção.
2. No Supabase > SQL Editor, execute `MIGRACAO_V2.25.0.sql`.
3. Suba os arquivos do ZIP `squad-dashboard-v2.25.0-atualizacao-github.zip` no repositório.
4. Não substitua o `config.js`.
5. Não é necessário republicar Edge Functions.
6. Aguarde o GitHub Pages publicar.
7. Faça logout/login e `Ctrl + F5`.
8. Teste com Admin Geral, Admin do Squad e um Técnico com feedback finalizado/compartilhado.
