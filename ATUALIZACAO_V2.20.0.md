# Atualização V2.20.0

## Antes de publicar

1. Faça backup do repositório atual e do `config.js` em produção.
2. Execute `MIGRACAO_V2.20.0.sql` no Supabase SQL Editor.
3. Confirme que a execução terminou sem erro.
4. Não republique `create-user` ou `manage-user`: não houve alteração de Edge Function nesta versão.

## Depois da migração

Publique o conteúdo de `squad-dashboard-v2.20.0-atualizacao-github.zip` no repositório, mantendo o `config.js` atual.

Depois faça logout/login e `Ctrl + F5`.

## Testes recomendados

- Gestão → Bonificação mostra o campo **Teto total do modelo Individual**, inicialmente R$ 7.000,00.
- Com Individual acima do teto, o gestor vê valor antes do teto, fator e ajuste; a soma final não ultrapassa R$ 7.000,00.
- Um técnico cujo Individual matemático fique negativo recebe R$ 0,00 no cenário Individual.
- Base do Squad não recebe o piso zero novo.
- Redistribuição continua somente para técnicos **ACIMA**.
- `Mostrar comparação ao técnico` desligado: técnico vê apenas o modelo oficial.
- `Mostrar comparação ao técnico` ligado: técnico vê o próprio oficial + simulação de transição, sem informações do teto.
- Técnico vê o ranking financeiro completo do próprio Squad.
- Indicadores mostra ranking por valor oficial acumulado no período.
- Tela de login não mostra mais contas de demonstração.
- Reimporte o CSV do mês e confira que o ranking financeiro permanece atualizado após recarregar a página.

## Segurança do ranking financeiro

A migração cria `get_my_squad_finance_ranking(year, month)`. Para técnicos, essa função retorna somente:

- nome do técnico;
- valor oficial final;
- posição;
- modelo oficial.

Bônus manual, comissão de vendas, desconto, redistribuição, férias, teto e demais componentes financeiros não são expostos pela função.
