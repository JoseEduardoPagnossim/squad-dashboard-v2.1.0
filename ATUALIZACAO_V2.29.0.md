# V2.29.0 — Impacto financeiro da qualidade

## Objetivo
Criar a primeira leitura financeira de **Indicadores > Qualidade** sem carregar ou armazenar clientes individualmente.

A nova aba **Indicadores > Impacto financeiro** usa três elementos por competência:

1. **Total de clientes ativos** informado manualmente;
2. **Ticket médio mensal** informado manualmente;
3. **CSV previamente deduplicado**, onde cada linha válida representa um cliente único que avaliou naquela competência.

## CSV suportado
A versão foi construída sobre o arquivo real enviado para validação, com as colunas:

- `DataAvaliacao`
- `NotaServico`
- `NotaProduto`
- `NotaEmpresa`

O separador `;` é aceito normalmente. A data pode conter horário, por exemplo `01/08/2026 04:00`.

### Regra de privacidade
O frontend lê as linhas do CSV, consolida os dados por competência e grava somente totais agregados. **Nome, CNPJ, ID ou cadastro de cliente não são necessários nem armazenados.**

A deduplicação deve acontecer antes da exportação, pois o CSV não contém um identificador que permita ao monitor descobrir se duas linhas pertencem ao mesmo cliente.

## Indicadores calculados
- MRR estimado da carteira = clientes ativos × ticket médio;
- clientes únicos ouvidos;
- cobertura da base = clientes ouvidos ÷ clientes ativos;
- receita representada = clientes ouvidos × ticket médio;
- clientes sob sinal de risco = clientes com pelo menos uma nota 1, 2 ou 3 em Serviço, Produto ou Empresa;
- receita mensal sob sinal de risco = clientes sob sinal × ticket médio;
- exposição anual equivalente = receita mensal sob sinal × 12.

Também há uma decomposição separada de **Serviço, Produto e Empresa**, com respostas válidas, quantidade e percentual de notas 1 a 3, receita mensal associada e exposição anual equivalente.

## Regra importante
**Receita sob sinal de risco não é receita perdida e não é previsão de churn.** É uma estimativa de receita associada aos clientes que manifestaram algum sinal de insatisfação no período.

## Histórico
Cada competência preserva seus próprios:

- total de clientes ativos;
- ticket médio;
- quantidade de clientes ouvidos;
- distribuições de notas;
- quantidade de clientes com algum sinal de risco;
- arquivo e data da última importação.

A tabela histórica permite comparar as competências sem armazenar linhas de clientes.

## Escopo
Esta primeira versão é **corporativa para o Suporte técnico completo**. O CSV fornecido não possui Squad ou técnico, portanto a análise não é segmentada por equipe.

## Banco de dados
Executar `MIGRACAO_V2.29.0.sql` antes de publicar o frontend. A migração cria `quality_financial_monthly`, com RLS restrita ao **Admin Geral** da organização.

## Validação com o CSV recebido
No arquivo usado para construir a versão foram reconhecidas **1.649 linhas válidas em agosto/2026**. Como o arquivo não contém identificador do cliente, o monitor confia que essas linhas já estejam deduplicadas na origem.

Na amostra recebida:

- Serviço: 8 clientes com nota 1 a 3;
- Produto: 51 clientes com nota 1 a 3;
- Empresa: 50 clientes com nota 1 a 3;
- 66 clientes possuem pelo menos um sinal de risco em uma ou mais das três dimensões.

Esses números são apenas uma conferência do importador; os valores monetários dependem do total de clientes ativos e do ticket médio informado para a competência.
