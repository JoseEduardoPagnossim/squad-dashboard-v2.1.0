# Soften Performance Hub V2.1.1 — Implantação com Supabase

Este guia prepara o sistema para os Squads **A, B, D e E**, com autenticação, isolamento por Squad e criação de usuários pela interface.

## Antes de começar

Você precisará de:

- um projeto Supabase;
- acesso ao SQL Editor;
- acesso ao Authentication;
- acesso a Edge Functions;
- a pasta desta V2.1.1.

A aplicação usa a chave pública no navegador. A chave administrativa `service_role` fica somente no ambiente seguro da Edge Function.

---

## 1. Criar o projeto Supabase

1. Crie um projeto novo no Supabase.
2. Use um nome como `soften-performance-hub`.
3. Guarde a senha do banco em local seguro.
4. Aguarde o projeto finalizar a criação.

## 2. Criar tabelas, Squads e políticas de segurança

1. Abra **SQL Editor**.
2. Crie uma nova query.
3. Copie todo o conteúdo de `supabase_schema.sql`.
4. Execute.

O script cria:

- `organizations`
- `squads`
- `profiles`
- `squad_months`
- `technician_monthly`
- `daily_metrics`
- `squad_themes`

Também cria a organização **Soften Sistemas**, os Squads **A, B, D e E** e as políticas RLS.

Se você já tinha executado a V2.0.x, pode executar o `supabase_schema.sql` desta versão novamente. Ele contém a atualização necessária para o campo de e-mail do perfil.

## 3. Criar somente o primeiro Admin geral

Esta é a única criação de usuário que precisa ser feita fora da interface, porque ainda não existe um administrador autenticado para criar o primeiro acesso.

1. Abra **Authentication > Users**.
2. Crie o primeiro Admin geral com e-mail e senha e deixe o e-mail **confirmado/auto-confirmado**. Usuário com e-mail não confirmado não consegue entrar.
3. Copie o **User UID**.
4. Abra `bootstrap_primeiro_admin.sql`.
5. Troque `UUID_DO_PRIMEIRO_ADMIN` pelo UUID real.
6. Execute o SQL no SQL Editor.

Depois desse bootstrap, **não é necessário criar os demais usuários manualmente no Supabase**. Eles serão cadastrados em **Usuários > Criar usuário** dentro do Performance Hub.

## 4. Publicar a Edge Function `create-user`

A pasta já contém:

```text
supabase/functions/create-user/index.ts
supabase/config.toml
```

A função valida quem está logado antes de criar o acesso:

- Admin geral pode criar `super_admin`, `squad_admin` e `technician`;
- Admin do Squad pode criar somente `technician` do próprio Squad;
- Técnico não pode criar usuários.

### Opção A — Supabase CLI

No terminal, dentro da pasta do projeto:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy create-user
```

O arquivo `supabase/config.toml` mantém `verify_jwt = true`, portanto a função espera um usuário autenticado.

### Opção B — Dashboard do Supabase

Você também pode criar/publicar uma Edge Function pelo painel do Supabase e copiar o conteúdo de `supabase/functions/create-user/index.ts` para ela. O nome precisa ser:

```text
create-user
```

## 5. Conectar o site ao Supabase

### 5.1 Configurar a URL pública de autenticação

Antes de testar login ou recuperação de senha, abra **Authentication > URL Configuration** no Supabase.

Defina:

- **Site URL:** a URL pública exata do Performance Hub;
- **Redirect URLs:** adicione a mesma URL.

Para GitHub Pages, um exemplo é:

```text
https://SEU-USUARIO.github.io/SEU-REPOSITORIO/
```

Isso é necessário para que confirmação de e-mail e recuperação de senha retornem ao Performance Hub em vez de `localhost`.

### 5.2 Project URL e chave pública

No painel do Supabase, copie:

- Project URL;
- chave pública/publishable do projeto.

Abra `config.js` e altere:

```js
window.APP_CONFIG = {
  mode: 'supabase',
  supabaseUrl: 'SUA_PROJECT_URL',
  supabaseAnonKey: 'SUA_CHAVE_PUBLICA'
};
```

Nunca coloque `service_role` neste arquivo.

## 6. Publicar o site

Publique os arquivos em um endereço HTTPS, por exemplo em servidor interno, Vercel, Netlify ou hospedagem estática equivalente.

Para teste local:

```bash
python -m http.server 8080
```

Depois acesse:

```text
http://localhost:8080
```

## 7. Entrar com o primeiro Admin geral

Faça login com a conta criada na etapa 3.

O Admin geral deverá enxergar:

- seletor **Todos os Squads**;
- Squad A;
- Squad B;
- Squad D;
- Squad E;
- módulo **Usuários**;
- módulo **Administração**;
- módulo **Como usar**.

## 8. Criar os administradores dos Squads pela interface

1. Abra **Usuários**.
2. Clique em **Criar usuário**.
3. Informe nome, e-mail e senha temporária.
4. Escolha **Admin do Squad**.
5. Selecione A, B, D ou E.
6. Clique em **Criar usuário**.

Repita para cada equipe.

## 9. Criar técnicos pela interface

O Admin geral pode criar técnico em qualquer Squad. O Admin do Squad cria somente no próprio.

Preencha:

- nome completo;
- e-mail;
- senha temporária;
- perfil `Técnico`;
- Squad;
- **Nome do técnico na planilha**.

Exemplo:

```text
Nome completo: Rodolfo Donda
Nome do técnico na planilha: RODOLFO DONDA
```

Esse último campo deve acompanhar o nome usado no XLSX.

Quando o técnico é criado depois de um mês já importado, a Edge Function tenta vincular automaticamente os resultados históricos que tiverem o mesmo nome.

## 10. Importar a planilha

Somente administradores veem esta função.

1. Se for Admin geral, selecione o Squad correto.
2. Abra **Administração**.
3. Clique em **Importar planilha XLSX**.
4. Selecione o arquivo do mês.
5. Confira mês, quantidade de técnicos e data atualizada.

Novas importações do mesmo mês atualizam o registro existente daquele Squad/mês.

## 11. Configurar metas e tema

Em **Administração**:

- ajuste a meta mensal de atendimentos;
- ajuste a meta de percentual de avaliação;
- aplique o cálculo automático quando desejar;
- altere campanha, cores e fundo do Squad;
- importe/exporte tema JSON.

As configurações afetam somente o Squad selecionado.

## 12. Validar permissões

### Técnico

Deve:

- ver apenas o próprio Squad;
- ver apenas o próprio painel individual;
- não ver Usuários;
- não ver Administração;
- não importar XLSX.

### Admin do Squad

Deve:

- ficar limitado ao próprio Squad;
- ver os técnicos da equipe;
- criar somente técnicos do próprio Squad;
- importar XLSX;
- alterar metas e tema.

### Admin geral

Deve:

- ver Todos os Squads;
- entrar em A, B, D ou E;
- criar Admin de Squad ou Técnico;
- administrar dados, metas e temas de qualquer equipe.

## 13. Módulo Como usar

Todos os perfis têm acesso a **Como usar** no menu lateral.

Ele explica:

- Meu desempenho;
- Visão do Squad;
- atualização de XLSX;
- criação de usuários;
- metas e temas;
- indicadores;
- matriz de permissões;
- rotina de operação recomendada.

Os cards administrativos são ocultados para técnicos.

## Observação de segurança

A criação de usuários do Supabase Auth não é executada diretamente pelo JavaScript do navegador. O site chama a Edge Function `create-user`, que faz a operação administrativa no servidor. Isso evita expor credenciais privilegiadas no cliente.
