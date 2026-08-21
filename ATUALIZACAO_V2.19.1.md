# Atualização V2.19.1

Patch de privacidade da comparação financeira no acesso de técnico.

## Alteração

- Técnicos veem somente o **modelo financeiro oficial** escolhido pelo Admin.
- A simulação do modelo alternativo não aparece no card de bonificação do Meu desempenho.
- Admin Geral e Admin de Squad continuam com o comparador administrativo em Gestão → Bonificação.
- A regra de redistribuição não mudou: o total descontado dos técnicos **ABAIXO** é dividido somente entre técnicos **ACIMA** do mesmo Squad. Se não houver técnico ACIMA, não há redistribuição.

## Implantação

Não há SQL nem Edge Function nova. Preserve o `config.js` atual e substitua os arquivos do frontend.
