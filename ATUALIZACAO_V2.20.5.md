# Atualização V2.20.5

## O que mudou

Foi adicionado, em **Gestão → Bonificação → Técnicos do Squad**, o checkbox:

**Desconsiderar na quantidade de técnicos do grupo**

A regra é específica do financeiro e afeta somente o cálculo **Base do Squad**.

Quando marcado para um técnico:

- os atendimentos dele continuam somando no total do Squad;
- as Notas 5 e demais avaliações continuam nos totais do mês;
- o percentual de Notas 5 do grupo continua usando todos os dados;
- o técnico deixa de compor apenas o **denominador da quantidade de técnicos** usado em `média de atendimentos/técnico/dia`;
- o modelo **Individual** continua usando os próprios dados normalmente;
- a gamificação, pontuação, ranking e status não são alterados por este checkbox.

Exemplo: 1.289 atendimentos, 8 técnicos com produção e 1 marcado para desconsiderar. A Base do Squad usa os 1.289 atendimentos, mas divide a produção por **7 técnicos** na média financeira.

O quadro de auditoria da bonificação passa a mostrar **Técnicos considerados: X de Y**.

A configuração é salva por **técnico + competência**, é preservada nas reimportações e entra no snapshot do fechamento mensal. Excel também informa se o técnico contou ou não na quantidade do Squad.

## Como atualizar

1. Faça backup do projeto atual e preserve seu `config.js`.
2. No Supabase, abra **SQL Editor**.
3. Execute `MIGRACAO_V2.20.5.sql` uma única vez.
4. Depois publique os arquivos da V2.20.5 no GitHub Pages.
5. Não substitua seu `config.js` de produção.
6. Aguarde a publicação e faça `Ctrl + F5`.
7. Entre em **Gestão → Bonificação**, marque o técnico desejado e clique em **Salvar valores individuais**.

Não é necessário republicar Edge Functions.
