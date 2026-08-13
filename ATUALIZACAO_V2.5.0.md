# Atualização V2.5.0

## Novidades entregues

1. **Tela nova para Admin geral: Indicadores**
   - Filtro por período (mês inicial e mês final).
   - Gráfico mensal de técnicos **ACIMA** x **ABAIXO**.
   - Gráfico de **% de avaliação mensal por grupo**.
   - Gráfico semanal por grupo com **proxy operacional** usando **notas 5 / atendimentos**.
   - Card de **atendimentos por hora** e **por minuto** trabalhado, considerando **8 horas por dia**.
   - Cards adicionais com **aproveitamento da campanha**, **eficiência de excelência** e **média de pontos por técnico**.
   - Bloco de **insights** com destaque de squad, técnico e pontos de atenção do período.

2. **Ajuste de frontend na sidebar**
   - Removido o card com o nome do dragão do grupo.
   - Inserido o card da campanha **Casa do Dragão**.
   - Adicionado um GIF local (`assets/dragon-smoke.gif`) com dragão soltando fumaça.

## Banco de dados

- **Sem alterações de schema** nesta versão.
- **Não é necessário rodar nova migração SQL**.

## Arquivos principais alterados

- `index.html`
- `styles.css`
- `app.js`
- `assets/dragon-smoke.gif`

