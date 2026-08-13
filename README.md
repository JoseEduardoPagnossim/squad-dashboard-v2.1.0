# Soften Performance Hub V2.3.0

Painel web multi-Squad para acompanhamento diário e mensal de desempenho dos técnicos da Soften Sistemas.

Squads atuais: **A, B, D e E**.

## O que mudou na V2.3.0

A pontuação mensal deixou de ser digitada manualmente e passou a ser calculada automaticamente com a mesma lógica da planilha original.

Fórmula equivalente:

```text
Pontos = Atendimentos × Média da avaliação
       + (Atendimentos >= referência ? +20 : -20)
       + (Total de avaliações >= referência ? +30 : -30)
       + (Média da avaliação >= referência ? +40 : -40)
       + (% avaliado >= referência ? +35 : -35)
```

Se o técnico não tiver atendimentos no mês, a pontuação fica zerada.

Também são calculados automaticamente:

- **Metas batidas**: quantidade de referências atingidas, de 0 a 4;
- **Status**: `ACIMA` quando bate 2 ou mais referências e `ABAIXO` quando bate 0 ou 1;
- **Ranking mensal**: ordenado pela pontuação;
- **Pontuação acumulada**: soma dos pontos do técnico em todos os meses importados no Squad.

### Referências automáticas

Por padrão, as quatro referências são as médias do próprio Squad no mês, reproduzindo a linha **Média Grupo** da planilha:

- média de atendimentos por técnico;
- média do total de avaliações por técnico;
- média das médias de avaliação dos técnicos;
- média do percentual avaliado dos técnicos.

Em **Administração > Parâmetros da fórmula mensal**, o administrador pode sobrescrever qualquer referência. Campo vazio = usa a média automática do Squad.

Os bônus/penalidades permanecem iguais à fórmula original: **±20, ±30, ±40 e ±35**.

## Fonte diária dos dados

A atualização continua sendo feita pelo CSV padronizado com as colunas:

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

O sistema calcula automaticamente:

- atendimentos;
- Nota 5 a Nota 1;
- total de avaliações;
- média de avaliação;
- % avaliado;
- pontuação;
- metas batidas;
- status;
- ranking.

O administrador preenche apenas as métricas que realmente variam por regra de gestão:

- meta individual de atendimentos;
- meta individual de notas 5;
- desconto;
- bônus.

## Importação

- somente técnicos ativos cadastrados no sistema são importados;
- o Admin geral pode importar A, B, D e E de uma vez usando `grupoAtendimento`;
- reimportar o mesmo mês atualiza os dados operacionais e mantém metas, desconto, bônus e parâmetros de pontuação;
- o modal fecha automaticamente após sucesso;
- meses importados incorretamente podem ser excluídos em **Administração > Meses importados**.

## Atualização da V2.2.x para V2.3.0

A V2.3.0 adiciona um campo ao banco para armazenar os parâmetros opcionais da pontuação.

Antes de publicar os novos arquivos do site, execute no **SQL Editor do Supabase**:

```text
MIGRACAO_V2.3.0.sql
```

Depois:

1. preserve seu `config.js` atual;
2. substitua os arquivos do site pelos da V2.3.0;
3. recoloque o `config.js` configurado;
4. publique no GitHub Pages;
5. use `Ctrl + F5`.

Não execute novamente o `supabase_schema.sql` em uma base já existente.

## Instalação nova

Para uma instalação do zero, use:

- `supabase_schema.sql`;
- `bootstrap_primeiro_admin.sql`;
- `supabase/functions/create-user/index.ts`;
- `GUIA_BANCO_DADOS.md`.

O `supabase_schema.sql` da V2.3.0 já contém o campo `score_settings`.

## Arquivos principais

```text
index.html                         Interface
styles.css                        Estilos e responsividade
app.js                            Regras, CSV, pontuação e Supabase
config.js                         Configuração do Supabase
default-data.js                   Dados de demonstração
supabase_schema.sql               Banco para instalação nova
MIGRACAO_V2.3.0.sql               Atualização de banco da V2.2.x
bootstrap_primeiro_admin.sql      Primeiro Admin geral
supabase/functions/create-user/   Criação segura de usuários
GUIA_BANCO_DADOS.md               Guia de implantação e operação
ATUALIZACAO_V2.3.0.md             Passo a passo de atualização
```

## Segurança

Nunca coloque a chave `service_role` ou Secret key no `config.js` ou no GitHub Pages. O navegador deve usar somente a Publishable key. A criação administrativa de usuários continua sendo feita pela Edge Function `create-user`.
