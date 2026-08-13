# Soften Performance Hub V2.2.0

Painel web multi-Squad para acompanhamento diário de desempenho dos técnicos da Soften Sistemas.

Squads atuais: **A, B, D e E**.

## O que mudou na V2.2.0

A V2.2.0 remove a dependência das planilhas de desempenho dos Squads para atualização diária.

Agora o fluxo é dividido em duas fontes:

1. **CSV padronizado**: atendimentos e avaliações realizadas no dia a dia.
2. **Administração do painel**: metas, pontuação, desconto e bônus mensais de cada técnico.

Isso evita a necessidade de manter quatro planilhas com o mesmo formato.

Também foram adicionados:

- importação de **CSV** no lugar de XLSX;
- seleção do mês a importar quando o CSV contém vários meses;
- filtro automático pelo Squad selecionado;
- Admin geral pode selecionar **Todos os Squads** e atualizar A, B, D e E com o mesmo CSV em uma única operação;
- importação somente dos **técnicos ativos cadastrados no sistema**;
- nomes do CSV sem usuário correspondente são informados e ignorados;
- fechamento automático da janela após uma importação bem-sucedida;
- módulo **Metas e bonificações do mês** por técnico;
- exclusão de um mês importado incorretamente;
- preservação das métricas manuais ao atualizar novamente o CSV do mesmo mês;
- recálculo do ranking por pontuação ao salvar as métricas mensais.

## Formato esperado do CSV

O importador espera as colunas:

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

Exemplo:

```csv
time,Tecnico,grupoAtendimento,Quantidade,Nota 5,Nota 4,Nota 3,Nota 2,Nota 1
2026-08-13 08:00:00.000,RODOLFO DONDA,D,7,1,0,0,0,0
2026-08-13 08:00:00.000,OLAVO DUARTE,D,9,2,0,0,0,0
```

O arquivo pode conter os últimos 12 meses e todos os Squads. Ao importar, o administrador escolhe o mês encontrado no arquivo. Se estiver em um Squad específico, somente aquele grupo é processado. Se o Admin geral estiver em **Todos os Squads**, o arquivo é distribuído automaticamente entre A, B, D e E.

### Regras de importação

- `grupoAtendimento` é normalizado para maiúsculo.
- Somente **A, B, D e E** são aceitos.
- Linhas sem grupo válido são ignoradas.
- O nome do técnico é normalizado para comparação.
- Somente técnicos ativos cadastrados no Squad são importados.
- Um nome existente no CSV, mas não cadastrado no painel, não entra no ranking e aparece no resumo como ignorado.
- Reimportar o mesmo Squad/mês substitui atendimentos e avaliações daquele mês, mas mantém as metas e bonificações manuais que já estavam preenchidas.

## Cadastre os técnicos antes de importar

Em **Usuários > Criar usuário**, para um técnico informe:

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

O campo deve corresponder ao valor da coluna `Tecnico` do CSV.

## Atualização diária

1. Entre como Admin geral ou Admin do Squad.
2. Selecione o Squad. O Admin geral também pode usar **Todos os Squads** para uma atualização geral.
3. Abra **Administração**.
4. Clique em **Importar CSV de atendimentos**.
5. Escolha o CSV.
6. O painel mostra os meses disponíveis para aquele Squad.
7. Selecione o mês.
8. Clique em **Importar mês**.

Depois da gravação, a janela de importação fecha automaticamente e o dashboard é atualizado.

## Métricas mensais por técnico

Na Administração existe a tabela **Metas e bonificações do mês**.

Atendimentos, Notas 5 e demais avaliações são calculados automaticamente pelo CSV. O administrador preenche:

- **Meta atend.**;
- **Meta notas 5**;
- **Status**;
- **Metas batidas**;
- **Pontos**;
- **Desconto (R$)**;
- **Bônus (R$)**.

Ao clicar em **Salvar métricas dos técnicos**, o sistema recalcula:

- ranking por pontuação;
- totais e indicadores consolidados;
- resultado consolidado do Squad.

## Excluir importação incorreta

Em **Administração > Meses importados**, cada mês possui a ação **Excluir**.

A exclusão remove:

- dados importados do mês;
- histórico diário do mês;
- métricas manuais daquele mês.

A operação pede confirmação antes de executar.

## Perfis e permissões

### Admin geral

- vê todos os Squads;
- administra A, B, D e E;
- cria Admins de Squad e técnicos;
- importa CSV de qualquer Squad;
- preenche métricas mensais;
- exclui meses importados;
- configura metas e temas.

### Admin do Squad

- vê somente o próprio Squad;
- cria técnicos do próprio Squad;
- importa CSV do próprio Squad;
- preenche métricas mensais;
- exclui meses do próprio Squad;
- configura metas e tema do próprio Squad.

### Técnico

- vê seu desempenho;
- vê a Visão do próprio Squad;
- não acessa Administração;
- não importa CSV;
- não altera métricas;
- não gerencia usuários.

## Atualizando a partir da V2.1.1

**Não há alteração obrigatória na estrutura do banco.** As tabelas e políticas da V2.1.1 já suportam a V2.2.0.

Para atualizar o site:

1. faça backup do repositório atual;
2. mantenha uma cópia do seu `config.js` atual, pois ele contém a URL e a chave pública do Supabase;
3. substitua os arquivos do site pelos da V2.2.0;
4. recoloque seu `config.js` configurado, se necessário;
5. publique no GitHub Pages;
6. use `Ctrl + F5` no navegador.

Não é necessário recriar usuários nem executar novamente `supabase_schema.sql` em uma base V2.1.1 já funcionando.

## Instalação nova

Para uma instalação do zero, use:

- `supabase_schema.sql`;
- `bootstrap_primeiro_admin.sql`;
- `supabase/functions/create-user/index.ts`;
- `GUIA_BANCO_DADOS.md`.

## Arquivos principais

```text
index.html                         Interface
styles.css                        Estilos e responsividade
app.js                            Regras, CSV, Supabase e dashboard
config.js                         Configuração do Supabase
default-data.js                   Dados apenas para demonstração
supabase_schema.sql               Banco para instalação nova
bootstrap_primeiro_admin.sql      Primeiro Admin geral
supabase/functions/create-user/   Criação segura de usuários
GUIA_BANCO_DADOS.md               Guia de implantação
ATUALIZACAO_V2.2.0.md             Atualização da V2.1.1
```

## Segurança

Nunca coloque a chave `service_role` ou Secret key no `config.js` ou em qualquer arquivo publicado no GitHub Pages.

O navegador deve usar somente a chave pública/publishable. A criação administrativa de usuários continua na Edge Function `create-user`.
