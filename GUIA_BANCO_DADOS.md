# Soften Performance Hub V2.4.0 — Guia de implantação e operação

## 1. Atualização de uma base V2.3.0 existente

Você não precisa recriar o projeto Supabase nem cadastrar os usuários novamente.

Execute no **SQL Editor**:

```text
MIGRACAO_V2.4.0.sql
```

Depois atualize os arquivos do site e mantenha seu `config.js` atual.

## 2. Instalação nova

Em um projeto Supabase novo:

1. execute `supabase_schema.sql`;
2. crie o primeiro Admin geral em **Authentication > Users**;
3. execute `bootstrap_primeiro_admin.sql` com o UUID desse usuário;
4. publique a Edge Function `create-user`;
5. configure `config.js`;
6. configure a URL do GitHub Pages em **Authentication > URL Configuration**.

## 3. Usuários e Squads

Squads atuais:

```text
A
B
D
E
```

Perfis:

- `super_admin`: pode ver e administrar todos os Squads;
- `squad_admin`: administra somente o próprio Squad;
- `technician`: visualiza o próprio desempenho e o contexto autorizado do Squad.

Para técnico, o campo **Nome do técnico no CSV** precisa corresponder ao valor da coluna `Tecnico` do arquivo importado.

## 4. CSV operacional

Colunas esperadas:

```text
time
Tecnico
grupoAtendimento
Quantidade
Nota 5
Nota 4
Nota 3
Nota 2
Nota 1
```

O Admin geral pode importar um único arquivo contendo A, B, D e E. O sistema separa os registros pelo `grupoAtendimento`.

## 5. Como a reimportação funciona

A importação é de **estado atualizado**, não incremental.

Se Agosto já possui 93 atendimentos e o CSV do dia seguinte informa 105, Agosto passa a ter 105.

O sistema não soma 93 + 105.

Ao reimportar o mesmo Squad/mês:

- atendimentos e notas são substituídos pelo consolidado mais recente;
- histórico diário é reconstruído;
- metas individuais são mantidas;
- descontos e bônus são mantidos;
- parâmetros manuais de pontuação são mantidos;
- metas gerais do Squad são mantidas.

## 6. Pontuação automática

Fórmula:

```text
Pontos = Atendimentos × Média da avaliação
       + ±20 por atendimento
       + ±30 por total de avaliações
       + ±40 por média da avaliação
       + ±35 por percentual avaliado
```

As quatro referências usam a média do Squad quando o campo administrativo correspondente está vazio.

O sistema também calcula automaticamente:

- metas batidas;
- status;
- ranking mensal;
- pontuação acumulada.

## 7. Metas individuais por mês

As metas são armazenadas no registro mensal de cada técnico.

Exemplo:

```text
Rodolfo - Julho  : meta atend. 210 / meta notas 5 70
Rodolfo - Agosto : meta atend. 185 / meta notas 5 63
Rodolfo - Setembro: meta atend. 200 / meta notas 5 68
```

Alterar Setembro não altera Julho ou Agosto.

### Copiar metas do mês anterior

Em **Administração > Metas e bonificações do mês**, use:

**Copiar metas do mês anterior**

O sistema copia, por técnico correspondente:

- meta de atendimentos;
- meta de notas 5.

Desconto e bônus não são copiados automaticamente.

As metas gerais do Squad também não são copiadas, pois a meta de atendimento pode variar conforme os dias úteis do novo mês.

## 8. Fechamento mensal

Durante o mês, mantenha o registro **ABERTO**.

No encerramento:

1. confira a última importação;
2. confira metas individuais;
3. confira parâmetros de pontuação;
4. confira bônus e descontos;
5. em **Administração > Meses importados**, clique em **Fechar mês**.

Ao fechar, o sistema grava um snapshot contendo:

- referências efetivamente utilizadas na pontuação;
- pontuação de cada técnico;
- metas batidas;
- status;
- ranking;
- resultado da equipe;
- data/hora do fechamento.

O mês passa a ser exibido como **FECHADO**.

## 9. O que fica bloqueado em um mês fechado

Enquanto fechado, o painel impede:

- reimportar aquele mesmo Squad/mês;
- alterar metas individuais;
- alterar bônus ou descontos;
- alterar parâmetros da fórmula;
- alterar metas gerais do Squad;
- excluir o mês.

O tema do Squad continua sendo uma configuração geral e pode ser alterado independentemente do fechamento mensal.

## 10. Reabrir um mês

Se houver necessidade de corrigir um histórico:

1. abra **Administração > Meses importados**;
2. clique em **Reabrir**;
3. faça a correção/importação;
4. confira os cálculos;
5. clique novamente em **Fechar mês**.

Ao reabrir, o snapshot anterior é removido e o mês volta a calcular normalmente com seus parâmetros originais. Um novo snapshot é criado no próximo fechamento.

## 11. Pontuação acumulada

O acumulado considera:

- meses fechados;
- mais o mês aberto mais recente.

Isso mantém o histórico oficial e inclui o desempenho corrente.

## 12. Excluir importação incorreta

Somente meses abertos podem ser excluídos.

Se o mês estiver fechado, primeiro use **Reabrir**.

A exclusão remove os dados e configurações daquele Squad/mês, portanto deve ser usada apenas para importações realmente incorretas.

## 13. Metas do Squad

Em **Administração > Metas do mês selecionado**:

- Meta de atendimentos do Squad;
- Meta de % de avaliação.

A meta de atendimento pode ser calculada por:

```text
dias úteis × 10 atendimentos × quantidade de técnicos
```

## 14. Tema

O tema é definido por administradores e pode ser diferente em cada Squad.

É possível:

- escolher preset;
- alterar cores;
- trocar fundo;
- alterar campanha;
- importar/exportar tema JSON.

## 15. Rotina recomendada

### Diariamente

1. gerar o CSV atualizado;
2. importar o mês corrente;
3. conferir vínculos ignorados;
4. conferir dashboard e ranking.

### No início de um novo mês

1. importar o novo período;
2. copiar metas do mês anterior, se aplicável;
3. revisar metas individuais;
4. revisar metas gerais do Squad;
5. manter o mês aberto.

### No fechamento

1. fazer a última importação;
2. revisar parâmetros, metas, bônus e desconto;
3. fechar o mês;
4. consultar o histórico normalmente nos meses seguintes.

## 16. Segurança

- `service_role` permanece somente no servidor/Edge Function;
- o navegador usa apenas a chave pública do projeto;
- RLS limita os dados pelo perfil e Squad;
- criação de usuários ocorre pela Edge Function;
- controles administrativos são ocultos para técnicos;
- o fechamento mensal adiciona uma proteção operacional para evitar alterações acidentais no histórico.


## Gestão de usuários V2.6

Além da função `create-user`, publique também a Edge Function `manage-user`. Ela realiza edição e exclusão usando `service_role` apenas no servidor.

### Edição

A interface permite alterar nome, vínculo do técnico no CSV, status e, para Admin geral, perfil/Squad. E-mail e senha não são alterados.

### Exclusão

Ao excluir um usuário, o acesso no Supabase Auth é removido. O perfil é removido pela FK `profiles.user_id -> auth.users(id) on delete cascade`. Em `technician_monthly`, o campo `user_id` usa `on delete set null`, portanto o histórico mensal permanece salvo.


## V2.18.0 — Financeiro

Execute `MIGRACAO_V2.18.0.sql` antes de publicar a V2.18.0. A migração cria `technician_finance_monthly`, `super_admin_commissions` e adiciona `finance_settings` / `finance_month_data` em `squad_months`. O financeiro individual tem RLS próprio para não expor valores de outros técnicos ao usuário técnico.

O fechamento mensal passa a congelar também as regras e a composição financeira no `closed_snapshot`. Meses antigos fechados antes da V2.18.0 permanecem com o snapshot anterior; para recalculá-los com a regra nova, reabra, configure o financeiro, confira e feche novamente.
