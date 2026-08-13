# Soften Performance Hub V2.2.0 — Guia de implantação e operação

Este guia cobre tanto uma instalação nova quanto a continuidade de uma base V2.1.1.

## 1. Se você já está usando a V2.1.1

A V2.2.0 é compatível com o banco existente. **Não é necessário executar uma migração de banco.**

Atualize os arquivos do GitHub Pages e mantenha seu `config.js` configurado.

Veja também `ATUALIZACAO_V2.2.0.md`.

## 2. Se for uma instalação nova

No projeto do Supabase:

1. abra **SQL Editor**;
2. execute `supabase_schema.sql`;
3. crie o primeiro usuário em **Authentication > Users**;
4. copie o User UID;
5. troque `UUID_DO_PRIMEIRO_ADMIN` em `bootstrap_primeiro_admin.sql`;
6. execute o bootstrap;
7. publique a Edge Function `create-user`;
8. configure `config.js` com Project URL e Publishable key;
9. configure a URL do GitHub Pages em **Authentication > URL Configuration**.

## 3. Publicar a Edge Function create-user

A função está em:

```text
supabase/functions/create-user/index.ts
```

Ela permite que a criação cotidiana dos usuários seja feita dentro do Performance Hub.

- Admin geral: Admin geral, Admin do Squad e Técnico.
- Admin do Squad: somente Técnico do próprio Squad.
- Técnico: sem permissão.

## 4. Configurar o site

Em `config.js`:

```js
window.APP_CONFIG = {
  mode: 'supabase',
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'SUA_CHAVE_PUBLICA'
};
```

Não utilize Secret key nem `service_role` no site.

## 5. Cadastrar usuários

Depois de entrar como Admin geral, abra **Usuários**.

Crie primeiro os Admins dos Squads A, B, D e E.

Depois crie os técnicos.

Para técnico, preencha:

- nome completo;
- e-mail;
- senha temporária;
- perfil Técnico;
- Squad;
- **Nome do técnico no CSV**.

Exemplo:

```text
Nome completo: Rodolfo Donda
Nome do técnico no CSV: RODOLFO DONDA
```

O vínculo é feito com a coluna `Tecnico` do relatório CSV.

### Importante

Na V2.2.0, o importador aceita somente técnicos ativos já cadastrados no sistema. Isso evita que linhas de total, nomes temporários, erros de digitação ou pessoas de outro Squad apareçam no ranking.

## 6. Formato do CSV

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

O CSV pode conter os últimos 12 meses e todos os Squads.

Os grupos válidos são:

```text
A
B
D
E
```

Linhas sem grupo ou com grupo diferente são ignoradas.

## 7. Importar o CSV

1. Selecione um Squad específico. Se for Admin geral, também é possível selecionar **Todos os Squads** para importar A, B, D e E de uma vez.
2. Abra **Administração**.
3. Clique em **Importar CSV de atendimentos**.
4. Escolha o arquivo.
5. O sistema cruza os nomes do CSV com os técnicos ativos cadastrados e, no modo Todos os Squads, separa os dados pelo campo `grupoAtendimento`.
6. Confira o resumo de nomes reconhecidos/ignorados.
7. Escolha o mês que deseja importar.
8. Clique em **Importar mês**.

O modal fecha automaticamente após sucesso.

### Reimportação diária

Você pode importar o mesmo mês todos os dias.

A nova importação substitui:

- atendimentos;
- Nota 5;
- Nota 4;
- Nota 3;
- Nota 2;
- Nota 1;
- totais e médias calculadas;
- histórico diário.

As métricas mensais preenchidas manualmente são preservadas.

## 8. Preencher métricas mensais

Depois da primeira importação do mês, ainda em **Administração**, localize **Metas e bonificações do mês**.

Para cada técnico, preencha:

- Meta atend.;
- Meta notas 5;
- Status;
- Metas batidas;
- Pontos;
- Desconto (R$);
- Bônus (R$).

Clique em **Salvar métricas dos técnicos**.

O sistema recalcula automaticamente:

- ranking por pontuação;
- totais consolidados;
- resultado do Squad.

## 9. Metas do Squad

No card **Metas do Squad**, configure:

- Meta de atendimentos do Squad;
- Meta de percentual de avaliação.

A sugestão de atendimentos utiliza:

```text
dias úteis do mês × 10 × número de técnicos importados
```

## 10. Excluir um mês importado incorretamente

Abra **Administração > Meses importados**.

Clique em **Excluir** no mês desejado e confirme.

A exclusão remove o mês inteiro e os registros vinculados a ele, inclusive as métricas manuais mensais.

Depois você pode importar novamente o CSV correto.

## 11. Tema

Cada Squad possui seu próprio tema.

Somente administradores podem alterar:

- cores;
- nome da campanha;
- frase;
- imagem de fundo;
- tema JSON.

## 12. Permissões esperadas

### Técnico

- somente o próprio Squad;
- próprio desempenho;
- Visão do Squad;
- sem Administração;
- sem importação;
- sem edição de métricas.

### Admin do Squad

- somente o próprio Squad;
- técnicos do Squad;
- criação de técnicos;
- importação de CSV;
- métricas mensais;
- exclusão de meses;
- metas e tema.

### Admin geral

- Todos os Squads;
- A, B, D e E;
- criação de admins e técnicos;
- importação e administração de qualquer Squad.

## 13. Recuperação de senha

Em **Authentication > URL Configuration**, a URL publicada no GitHub Pages deve estar configurada como Site URL e/ou Redirect URL autorizado.

O usuário pode usar **Esqueci minha senha** na tela de login e definir uma nova senha ao retornar ao Performance Hub.

## 14. Rotina recomendada

### Uma vez por técnico

Cadastrar usuário e garantir que **Nome do técnico no CSV** esteja correto.

### Diariamente

Importar o CSV atualizado do mês corrente.

### Mensalmente

Preencher metas e bonificações individuais e revisar as metas do Squad.
