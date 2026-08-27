# Atualização V2.29.1 — Leitura estratégica do impacto financeiro

## O que mudou

A tela **Indicadores > Impacto financeiro** passa a trazer uma segunda camada de leitura executiva sem exigir novo CSV ou novos dados de clientes.

### Novos indicadores
- **Cobertura financeira:** receita representada pelas avaliações ÷ MRR estimado da carteira.
- **Exposição entre clientes ouvidos:** receita sob sinal ÷ receita representada.
- **Principal origem do risco:** Serviço, Produto ou Empresa com maior participação entre os sinais de notas 1 a 3.
- **Receita sem feedback:** parcela do MRR estimado ainda não representada pelos clientes únicos ouvidos.

### Nova evolução financeira
Foi incluído o gráfico **Receita representada x receita sob sinal** por competência. Cada mês usa o ticket médio salvo para aquela competência.

### Origem do sinal
A tabela de Serviço, Produto e Empresa ganhou a coluna **Participação nos sinais** e destaca visualmente a dimensão com maior concentração. Como um mesmo cliente pode ter nota baixa em mais de uma dimensão, a participação usa como denominador a soma dos sinais nas três dimensões.

## Banco de dados
**Não há nova migração SQL.** A V2.29.1 usa exclusivamente os dados já armazenados pela `MIGRACAO_V2.29.0.sql`.

## Regra de interpretação
Os valores continuam sendo estimativas baseadas em clientes únicos e ticket médio. `Receita sob sinal` não significa receita perdida, churn confirmado ou previsão de cancelamento.
