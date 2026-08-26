# ATUALIZAÇÃO V2.26.1

## 1. Correção das notas históricas de Serviço

O gráfico **Indicadores > Qualidade > Notas Serviço** agora usa o consolidado mensal oficial quando o filtro cobre toda a competência importada.

As colunas diárias Nota 1 a Nota 4 só passaram a existir no `daily_metrics` na V2.21. Por isso, meses históricos podiam ter as notas corretas no consolidado mensal e zero no detalhamento diário, fazendo a Nota 5 aparecer próxima de 100%.

Em recortes parciais dentro do mês, o painel continua usando os dados diários.

## 2. Importação Produto/Empresa visível

Foram adicionados dois acessos explícitos:

- **Gestão > Operação > Importar CSV Produto/Empresa**
- **Indicadores > Qualidade > Importar Produto/Empresa** para administradores

O CSV continua usando `Time`, `nomeApresentativo`, `NotaProduto` e `NotaEmpresa`. `NotaServico` é ignorada e não é necessária coluna de cliente.

## Banco de dados

Não há nova migração para a V2.26.1. Se a estrutura da V2.26 ainda não estiver criada, execute `MIGRACAO_V2.26.0.sql`.
