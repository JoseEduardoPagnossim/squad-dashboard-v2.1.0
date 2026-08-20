# Atualização V2.18.0

## Antes de publicar

Execute **uma vez** `MIGRACAO_V2.18.0.sql` no SQL Editor do Supabase. A migração adiciona as estruturas financeiras e não apaga dados existentes.

## Publicação

1. Preserve o `config.js` já configurado no GitHub.
2. Envie os arquivos do ZIP `squad-dashboard-v2.18.0-atualizacao-github.zip`.
3. Aguarde o GitHub Pages concluir o deploy.
4. Faça `Ctrl + F5`.
5. Entre em um Squad específico e abra **Gestão**.
6. No bloco financeiro, confira faixas e informe clientes/cancelamentos.
7. Preencha bônus manual, comissão de vendas e férias por técnico.
8. Admin Geral informa a própria comissão mensal no bloco exclusivo.
9. Gere Excel/PDF para validar.
10. Feche o mês somente depois da conferência.

## Regra de status corrigida

As referências são sempre as médias atuais do Squad: atendimentos, total de avaliações, nota média e % avaliado. Técnico com 2 ou mais critérios fica ACIMA; com 0 ou 1 fica ABAIXO; sem atendimento fica sem status.

## Regra de férias

O sistema calcula toda a bonificação normalmente e, no último passo, multiplica o total por 50%.

## Sem Edge Function nova

A V2.18.0 exige apenas a migração SQL e os arquivos de frontend. As Edge Functions atuais de usuários continuam as mesmas.
