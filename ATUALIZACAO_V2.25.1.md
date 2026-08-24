# Soften Performance Hub V2.25.1

## Regeneração segura de feedbacks

O botão principal de **Gestão → Feedbacks** agora se chama **Regerar Com Dados Atualizados**.

Ao clicar, o sistema sempre percorre todos os técnicos com produção na competência e recalcula os dados automáticos usando a importação mais recente. O comportamento é único: não existe mais uma ação separada apenas para pendentes.

### Preservação do trabalho do gestor

- **Observações do gestor** são sempre preservadas.
- Resumo, pontos positivos, pontos de desenvolvimento e compromissos que tenham sido editados manualmente também são preservados.
- Um campo que permaneceu igual ao texto automático anterior pode ser atualizado automaticamente com os novos números.
- O snapshot de métricas é sempre atualizado.
- Status de rascunho/finalizado, compartilhamento com o técnico e data de finalização não são alterados pela regeneração.
- Técnicos ainda sem registro recebem um novo rascunho normalmente.

## Produção

Esta versão **não exige SQL novo**. A tabela criada pela `MIGRACAO_V2.25.0.sql` já possui o campo JSON necessário para armazenar a referência do conteúdo automático.

1. Se ainda não publicou a V2.25.0, execute primeiro `MIGRACAO_V2.25.0.sql`.
2. Suba os arquivos da atualização V2.25.1 no repositório.
3. Preserve o `config.js` de produção.
4. Não é necessário republicar Edge Functions.
5. Faça `Ctrl + F5` após o GitHub Pages publicar.
