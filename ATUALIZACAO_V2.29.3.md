# Atualização V2.29.3 — Importação operacional mais robusta

## Motivo

Foi identificado um caso em que um técnico existente no CSV operacional não entrava na competência mesmo após o usuário ser reativado. O status ativo/inativo já não era usado como filtro; o ponto sensível era o vínculo pelo nome cadastrado.

## Correção

A importação operacional agora reconhece o técnico pelo mesmo Squad usando três fontes:

1. **Nome do técnico** (`technician_name`) do cadastro de usuário;
2. **Nome completo** (`full_name`) do cadastro de usuário;
3. Nome já existente no histórico de competências do Squad.

Quando uma dessas formas encontra o técnico, o nome é normalizado para uma única identidade antes da consolidação do mês. Isso evita que diferenças entre o Nome completo e o Nome do técnico façam uma linha válida do CSV ser descartada.

A gravação no banco também passa a resolver o `user_id` por Nome completo como fallback.

## O que não mudou

- Usuário ativo ou inativo não define se o histórico pode ser importado.
- Não muda a fórmula ACIMA/ABAIXO da V2.29.2.
- Não muda pontuação, bonificação, férias ou exclusão do divisor.
- Não muda Serviço, Produto/Empresa ou Impacto Financeiro além do vínculo operacional do técnico.

## Banco de dados

**Não há SQL novo nesta versão.**

Mantenha `MIGRACAO_V2.29.2.sql` executada, pois ela continua sendo necessária para o ranking/status consistente.

## Diagnóstico no importador

O resumo da importação passa a informar que o vínculo considera Nome do técnico, Nome completo e histórico. Se um nome continuar na lista de **vínculos não encontrados**, confira principalmente o Squad do usuário e o nome presente no CSV.
