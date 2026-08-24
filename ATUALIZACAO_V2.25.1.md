# Soften Performance Hub V2.25.1

## Correção — Evolução diária dos técnicos

Foi corrigido o aviso **“Não há dados diários de técnicos no período selecionado”** exibido ao abrir o novo gráfico diário em Indicadores.

### Causa
O botão de evolução diária consultava primeiro o consolidado organizacional carregado por RPC. No Admin Geral isso podia ficar vazio ou incompleto mesmo com os `daily_metrics` já disponíveis dentro das competências — os mesmos dados que alimentavam normalmente os demais indicadores diários da tela.

### Correção
Para o **Admin Geral**, o gráfico agora prioriza diretamente os dados diários já carregados em `squad_months → technician_monthly → daily_metrics`.

Com isso:
- o período `De → Até` continua sendo respeitado;
- o filtro por Squad continua sendo respeitado;
- Pontuação diária simulada, Atendimentos, % de avaliação e Nota média usam os dados diários existentes;
- o RPC permanece como fallback;
- não há alteração nas regras mensais oficiais.

## Produção

1. Suba os arquivos da atualização no GitHub.
2. Preserve o `config.js` atual.
3. Não execute SQL novo.
4. Não é necessário republicar Edge Functions.
5. Após o GitHub Pages publicar, faça logout/login e `Ctrl + F5`.
