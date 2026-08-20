# Soften Performance Hub V2.18.1

Painel multi-Squad para acompanhamento diário/mensal, gamificação, indicadores executivos e fechamento financeiro dos técnicos da Soften Sistemas.

## Novidades da V2.18.1

- **Bonificação financeira separada da gamificação**. Pontos/ranking não são usados como valor financeiro.
- Status do técnico corrigido para reproduzir a planilha: 4 critérios comparados sempre com as **médias atuais do Squad**; 2+ = ACIMA; 0/1 = ABAIXO; sem atendimento = sem status.
- Comissão por **média de atendimentos/dia útil** e por **% de Notas 5 = Notas 5 / atendimentos**.
- Multiplicador de cancelamento por competência.
- Bônus automático de R$ 100 para maior atendimento e R$ 100 para maior Notas 5, dividido em caso de empate.
- Bônus manual e comissão de vendas por técnico.
- Desconto padrão de R$ 200 para técnico ABAIXO e redistribuição do total descontado entre os técnicos ACIMA do mesmo Squad.
- Marcação de **férias**: aplica 50% sobre o total final calculado.
- Comissão mensal do **Admin Geral** informada manualmente como valor total.
- Fechamento mensal congela também todas as regras e componentes financeiros.
- Relatórios de bonificação em **Excel (.xlsx)** e **PDF**.
- Menu lateral simplificado: gestão de usuários é acessada por dentro de **Gestão**.

## Ordem do cálculo financeiro

1. Sem atendimento e sem avaliações: bonificação = R$ 0.
2. Calcula atendimentos/dia útil e encontra a faixa de comissão.
3. Calcula % de Notas 5 (Notas 5 / atendimentos) e encontra a faixa.
4. Soma as duas comissões.
5. Aplica o multiplicador de cancelamento (faixa com multiplicador 0 equivale a 1, seguindo a fórmula da planilha).
6. Soma bônus manual, prêmio de maior atendimento, prêmio de maior Notas 5 e comissão de vendas.
7. Desconta o valor configurado dos técnicos ABAIXO.
8. Redistribui o total descontado igualmente entre os técnicos ACIMA do mesmo Squad.
9. Se o técnico esteve de férias no mês, aplica 50% ao total final.

## Atualização de uma instalação V2.17.1

1. Faça backup do `config.js` atualmente publicado.
2. No Supabase, abra **SQL Editor** e execute `MIGRACAO_V2.18.1.sql` uma única vez.
3. Substitua no GitHub os arquivos do pacote `squad-dashboard-v2.18.0-atualizacao-github.zip`.
4. **Não substitua o seu `config.js` configurado**. O ZIP de atualização não contém esse arquivo.
5. Aguarde o GitHub Pages publicar e faça `Ctrl + F5`.
6. Abra um Squad/mês em **Gestão**, confira as referências automáticas e configure o financeiro.
7. Preencha clientes no início do mês, cancelamentos, bônus manual, comissão de vendas e férias.
8. No fim do mês, gere Excel/PDF para conferência e depois clique em **Fechar mês**.

## Relatórios

Os botões **Relatório Excel** e **Relatório PDF** ficam no bloco de bonificação por técnico em Gestão. O Excel possui uma aba de técnicos e, quando houver, uma aba de Admin Geral. O PDF traz a composição resumida por técnico. As bibliotecas de exportação são carregadas sob demanda pela internet.

## Segurança financeira

Os dados financeiros individuais ficam na tabela `technician_finance_monthly`, com RLS: o técnico pode ler somente o próprio financeiro; Admin do Squad lê o Squad que administra; Admin Geral administra conforme seu escopo. A comissão de Admin Geral fica em tabela separada.

## Observação sobre importação diária

Reimportar o CSV do mesmo mês **substitui os números operacionais**, não soma com a importação anterior. Metas e valores manuais financeiros já preenchidos são preservados.


## Correção V2.18.1
A criação de usuários agora renova a sessão antes da Edge Function e exibe o erro real retornado pelo servidor. Republique `create-user` usando `supabase/functions/create-user/index.ts`. Não há migração SQL adicional.
