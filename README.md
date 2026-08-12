# Soften Performance Hub V2.1.0

Painel multi-Squad de desempenho, metas, ranking e gamificação para os Squads **A, B, D e E**.

## Novidades da V2.1.0

- Novo módulo **Usuários** dentro do sistema.
- Criação de login e senha pela própria interface.
- **Admin geral** pode cadastrar Admin de Squad e Técnico em qualquer Squad.
- **Admin do Squad** pode cadastrar somente Técnicos do próprio Squad.
- A criação de usuários em produção usa uma **Supabase Edge Function**, mantendo a chave `service_role` fora do navegador.
- Novo módulo **Como usar**, disponível dentro do sistema, com instruções, indicadores, permissões e rotina recomendada.
- A importação XLSX continua disponível somente para administradores.
- Estrutura continua isolada por Squad: A, B, D e E.
- README e guia de implantação revisados.

## Perfis e escopos

### Admin geral — `super_admin`

- pode selecionar **Todos os Squads**;
- pode acessar A, B, D e E individualmente;
- importa XLSX em qualquer Squad;
- altera metas e temas;
- cria Admin de Squad e Técnico;
- vê a gestão de usuários em todos os Squads.

### Admin do Squad — `squad_admin`

- fica limitado ao próprio Squad;
- importa XLSX do próprio Squad;
- altera metas e tema do próprio Squad;
- vê os usuários do próprio Squad;
- pode criar **somente Técnicos** no próprio Squad.

### Técnico — `technician`

- vê o próprio desempenho;
- vê a visão geral/ranking do próprio Squad;
- não vê Administração;
- não vê Gestão de Usuários;
- não importa XLSX;
- não troca de técnico.

## Teste rápido sem banco

O pacote sai com `config.js` em modo demonstração:

```js
mode: 'demo'
```

Abra `index.html` no navegador.

### Contas demo

**Admin geral**

- E-mail: `admin.geral@soften.local`
- Senha: `Admin123!`

**Admin Squad D**

- E-mail: `admin.squadd@soften.local`
- Senha: `SquadD123!`

**Técnico Rodolfo**

- E-mail: `rodolfo.donda@soften.local`
- Senha: `Tecnico123!`

No modo demo, novos usuários criados pela interface ficam salvos no `localStorage` do navegador apenas para testes.

## Fluxo normal de uso em produção

1. Administrador entra no sistema.
2. Se for Admin geral, seleciona o Squad desejado.
3. Em **Administração**, importa o XLSX atualizado.
4. Em **Usuários**, cria ou consulta acessos.
5. Em **Administração**, ajusta metas e tema quando necessário.
6. Técnicos acessam o painel com login e senha e visualizam somente o escopo permitido.
7. O módulo **Como usar** fica disponível para consulta dentro do próprio sistema.

## Estrutura dos arquivos

```text
index.html                         Interface principal
styles.css                        Estilos e responsividade
app.js                            Regras do painel e integração
config.js                         Modo demo / Supabase
default-data.js                   Dados de demonstração
assets/vermithor.png              Fundo da campanha demo
supabase_schema.sql               Tabelas, RLS e estrutura dos Squads
bootstrap_primeiro_admin.sql      Bootstrap único do primeiro Admin geral
GUIA_BANCO_DADOS.md               Passo a passo de implantação
supabase/config.toml              Configuração da Edge Function
supabase/functions/create-user/   Função segura para criação de usuários
modelo-tema-squad-para-ia.json    Modelo de tema importável
CONTAS_DEMO.txt                   Credenciais do protótipo local
```

## Configuração de produção

Leia **`GUIA_BANCO_DADOS.md`**. Em resumo:

1. criar o projeto no Supabase;
2. executar `supabase_schema.sql`;
3. criar uma única conta inicial de Admin geral no Supabase Auth;
4. executar `bootstrap_primeiro_admin.sql` com o UUID dessa conta;
5. publicar a Edge Function `create-user`;
6. preencher `config.js` com URL e chave pública do projeto;
7. alterar `mode` para `supabase`;
8. publicar a pasta em HTTPS;
9. a partir daí, criar todos os demais usuários dentro do próprio sistema.

## Segurança importante

A aplicação web usa apenas a chave pública/publishable do Supabase. A chave `service_role` é necessária para operações administrativas do Supabase Auth e fica somente na Edge Function, nunca no `config.js` nem no navegador.

O banco também usa Row Level Security para limitar os dados por organização, Squad e perfil.

## Associação do técnico com a planilha

Ao criar um técnico, o campo **Nome do técnico na planilha** deve corresponder ao nome utilizado no XLSX, por exemplo:

```text
RODOLFO DONDA
```

Isso permite associar o login aos indicadores mensais e ao histórico diário. A Edge Function também tenta vincular o usuário aos meses que já haviam sido importados antes da criação do login.

## Próximas evoluções sugeridas

- edição/desativação de usuários pela interface;
- redefinição de senha pelo administrador;
- obrigar troca da senha temporária no primeiro acesso;
- auditoria de importações e alterações administrativas;
- notificações e conquistas adicionais.
