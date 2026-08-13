# Soften Performance Hub V2.4.0

Painel web multi-Squad para acompanhamento diário e mensal de desempenho dos técnicos da Soften Sistemas.

Squads atuais: **A, B, D e E**.

## Novidades da V2.4.0

A V2.4.0 adiciona **fechamento mensal com histórico protegido**.

Enquanto o mês estiver **ABERTO**:

- o Admin pode reimportar o CSV diariamente;
- os dados do mesmo mês são **substituídos**, nunca somados à importação anterior;
- metas, bônus, desconto e parâmetros já preenchidos daquele mês são preservados;
- pontuação, metas batidas, status e ranking são recalculados automaticamente.

Ao clicar em **Fechar mês**:

- o mês passa para **FECHADO**;
- novas importações para aquele Squad/mês são bloqueadas;
- metas individuais e do Squad ficam bloqueadas;
- parâmetros da fórmula ficam bloqueados;
- bônus e descontos ficam bloqueados;
- a pontuação, status, metas batidas e ranking são armazenados em um snapshot histórico;
- as referências automáticas usadas na pontuação ficam registradas no snapshot do fechamento.

Se for necessário corrigir um histórico, o Admin usa **Reabrir**, faz a correção e fecha novamente.

## Metas por mês

Cada técnico possui metas próprias em cada registro mensal. Julho, Agosto e Setembro não compartilham o mesmo campo de meta.

No início de um novo mês existe o botão:

**Copiar metas do mês anterior**

Ele copia somente:

- Meta de atendimentos do técnico;
- Meta de notas 5 do técnico.

As metas gerais do Squad continuam sendo configuradas no próprio mês, pois a meta de atendimento pode variar conforme a quantidade de dias úteis.

## Reimportação diária

Exemplo:

- 13/08: CSV mostra 93 atendimentos;
- 14/08: novo CSV mostra 105 atendimentos.

Após importar novamente Agosto, o sistema fica com **105 atendimentos**, não 198.

O mesmo vale para notas e histórico diário: o mês é reconstruído com o conteúdo atualizado do CSV e mantém as configurações administrativas daquele mês.

## Pontuação automática

A fórmula continua equivalente à planilha original:

```text
Pontos = Atendimentos × Média da avaliação
       + (Atendimentos >= referência ? +20 : -20)
       + (Total de avaliações >= referência ? +30 : -30)
       + (Média da avaliação >= referência ? +40 : -40)
       + (% avaliado >= referência ? +35 : -35)
```

Por padrão, as referências são as médias do próprio Squad no mês. O Admin pode substituir qualquer referência em **Administração > Parâmetros da fórmula mensal**.

Quando o mês é fechado, a referência efetivamente usada naquele momento é registrada no snapshot histórico.

## Pontuação acumulada

O acumulado considera:

- todos os meses **fechados**;
- mais o mês aberto mais recente do Squad.

Isso evita que um mês histórico deixado aberto por engano entre duas vezes no conceito de temporada corrente.

## Fonte de dados

A atualização operacional usa CSV com as colunas:

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

Somente técnicos ativos cadastrados no Performance Hub e vinculados ao nome do CSV são considerados.

## Atualização da V2.3.0

Antes de publicar o novo site, execute no **SQL Editor do Supabase**:

```text
MIGRACAO_V2.4.0.sql
```

Essa migração apenas adiciona os campos de fechamento mensal. Ela não apaga usuários ou dados existentes.

Depois:

1. preserve o seu `config.js` atual;
2. substitua os arquivos do GitHub Pages pelos arquivos da V2.4.0;
3. recoloque/mantenha o `config.js` configurado com seu Supabase;
4. publique;
5. abra o site e faça `Ctrl + F5`.

Veja também `ATUALIZACAO_V2.4.0.md`.

## Instalação nova

Para uma instalação nova, execute `supabase_schema.sql`. Ele já contém:

- organizações;
- Squads A, B, D e E;
- perfis e permissões;
- meses;
- métricas mensais e diárias;
- parâmetros de pontuação;
- fechamento e snapshot mensal;
- temas;
- RLS.

Depois publique a Edge Function `create-user` e configure `config.js`.

## Arquivos principais

```text
index.html                         Interface
styles.css                        Estilos
app.js                            Regras, importação e cálculos
config.js                         Credenciais públicas do Supabase
supabase_schema.sql               Banco completo para instalação nova
MIGRACAO_V2.3.0.sql               Migração antiga: parâmetros de pontuação
MIGRACAO_V2.4.0.sql               Migração: fechamento mensal
ATUALIZACAO_V2.4.0.md             Passo a passo de atualização
GUIA_BANCO_DADOS.md               Guia completo de implantação e operação
supabase/functions/create-user/   Criação segura de usuários
```

## Segurança

- `service_role` não deve ficar no navegador;
- criação de usuários continua pela Edge Function;
- técnicos veem somente o próprio contexto autorizado;
- Admin de Squad fica limitado ao próprio Squad;
- Admin geral pode administrar A, B, D e E;
- importação e alterações mensais são ações exclusivas de Admin;
- mês fechado precisa ser reaberto antes de qualquer correção pelo painel.


## V2.5.0
- Nova tela **Indicadores** exclusiva para **Admin geral**.
- Filtros por período (de/até) para análises executivas.
- Gráfico mensal de técnicos **ACIMA x ABAIXO**.
- Gráfico de **% de avaliação mensal por grupo**.
- Gráfico semanal com **proxy operacional de avaliação** por grupo (notas 5 / atendimentos).
- Cards de **atendimentos por hora e por minuto trabalhado** considerando **8 horas por dia**.
- Cards extras com aproveitamento da campanha, eficiência de excelência e média de pontos.
- Ajuste visual da sidebar: card da campanha alterado para **Casa do Dragão** com GIF de dragão soltando fumaça.
- Não exige nova migração de banco; atualização somente de frontend.
