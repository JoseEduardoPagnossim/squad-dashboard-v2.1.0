# Soften Performance Hub V2.3.0 — Guia de implantação e operação

Este guia cobre instalação nova e atualização de uma base V2.2.x.

## 1. Se você já está usando a V2.2.x

Antes de publicar a V2.3.0, abra **SQL Editor** no Supabase e execute:

```text
MIGRACAO_V2.3.0.sql
```

Essa migração adiciona apenas o campo `score_settings` em `squad_months` e preserva usuários, meses e métricas existentes.

Depois atualize os arquivos do GitHub Pages, mantendo seu `config.js` configurado.

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

Permissões:

- Admin geral: cria Admin geral, Admin do Squad e Técnico;
- Admin do Squad: cria somente Técnico do próprio Squad;
- Técnico: sem permissão de criação.

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

Crie os Admins dos Squads A, B, D e E e depois os técnicos.

Para técnico, informe:

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

Somente técnicos ativos cadastrados são considerados pela importação.

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

Grupos válidos:

```text
A
B
D
E
```

## 7. Importar o CSV

1. selecione um Squad específico ou **Todos os Squads** como Admin geral;
2. abra **Administração**;
3. clique em **Importar CSV de atendimentos**;
4. escolha o arquivo;
5. confira os técnicos reconhecidos e ignorados;
6. escolha o mês;
7. clique em **Importar mês**.

O modal fecha automaticamente depois de uma importação bem-sucedida.

### Reimportação diária

Reimportar o mesmo mês substitui os dados operacionais daquele mês:

- atendimentos;
- Nota 5 a Nota 1;
- total de avaliações;
- média;
- % avaliado;
- histórico diário.

São preservados:

- metas individuais;
- desconto;
- bônus;
- metas do Squad;
- parâmetros da pontuação.

Depois da importação, pontuação, metas batidas, status e ranking são recalculados automaticamente.

## 8. Pontuação automática

A V2.3.0 reproduz a fórmula original da planilha:

```text
Pontos = Atendimentos × Média da avaliação
       + SE(Atendimentos >= referência; +20; -20)
       + SE(Total avaliações >= referência; +30; -30)
       + SE(Média avaliação >= referência; +40; -40)
       + SE(% avaliado >= referência; +35; -35)
```

A média individual de avaliação é truncada em duas casas para manter compatibilidade com a lógica usada na planilha de referência.

### Referências

Se o administrador não preencher nada, o sistema usa automaticamente as médias dos técnicos ativos com atendimento no mês:

1. média de atendimentos;
2. média do total de avaliações;
3. média das médias de avaliação;
4. média do % avaliado.

Isso equivale à linha **Média Grupo** da planilha.

Em **Administração > Parâmetros da fórmula mensal**, cada referência pode ser preenchida manualmente. Campo vazio significa **usar a média automática**.

Os pesos da fórmula permanecem:

```text
Atendimentos       ±20
Total avaliações   ±30
Média avaliação    ±40
% avaliado         ±35
```

### Metas batidas e status

O sistema também calcula automaticamente:

```text
Metas batidas = quantidade de referências atingidas, de 0 a 4
Status ACIMA = 2, 3 ou 4 metas batidas
Status ABAIXO = 0 ou 1 meta batida
```

### Pontuação acumulada

Na tabela administrativa, **Acumulado** é a soma automática dos pontos do técnico em todos os meses importados no mesmo Squad.

## 9. Metas e bonificações individuais

Em **Administração > Metas e bonificações do mês**, o administrador preenche somente:

- Meta atend.;
- Meta notas 5;
- Desconto (R$);
- Bônus (R$).

São somente leitura/calculados automaticamente:

- atendimentos;
- avaliações;
- média;
- % avaliado;
- status;
- metas batidas;
- pontos do mês;
- pontuação acumulada;
- ranking.

## 10. Metas do Squad

Configure:

- Meta de atendimentos do Squad;
- Meta de percentual de avaliação.

A sugestão automática de atendimentos utiliza:

```text
dias úteis do mês × 10 × número de técnicos importados
```

## 11. Excluir um mês importado incorretamente

Em **Administração > Meses importados**, clique em **Excluir** e confirme.

A exclusão remove o mês inteiro, incluindo dados diários, metas e bonificações manuais daquele mês.

## 12. Tema

Cada Squad possui seu próprio tema. Somente administradores podem alterar cores, campanha, frase, imagem de fundo e tema JSON.

## 13. Permissões esperadas

### Técnico

- próprio Squad;
- próprio desempenho;
- Visão do Squad;
- sem Administração;
- sem importação;
- sem edição de métricas.

### Admin do Squad

- somente o próprio Squad;
- cria técnicos;
- importa CSV;
- configura metas, parâmetros de pontuação, bônus e tema;
- exclui meses.

### Admin geral

- vê Todos os Squads;
- administra A, B, D e E;
- cria admins e técnicos;
- importa e administra qualquer Squad.

## 14. Recuperação de senha

Em **Authentication > URL Configuration**, a URL publicada no GitHub Pages deve estar configurada como Site URL e/ou Redirect URL autorizado.

O usuário pode usar **Esqueci minha senha** e definir uma nova senha ao retornar ao Performance Hub.

## 15. Rotina recomendada

### Uma vez por técnico

Cadastrar o usuário e garantir que **Nome do técnico no CSV** esteja correto.

### Diariamente

Importar o CSV atualizado. O sistema recalcula a pontuação automaticamente.

### Mensalmente

Revisar metas individuais, descontos, bônus, metas do Squad e, se necessário, sobrescrever alguma referência da fórmula de pontuação.
