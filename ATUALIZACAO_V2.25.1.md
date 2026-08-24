# Atualização V2.25.1

## Feedbacks — regeneração restaurada

- Adicionado o botão **Regerar em lote** na tela Gestão → Feedbacks.
- A regeneração em lote atualiza apenas feedbacks não finalizados e também gera os pendentes; feedbacks finalizados permanecem intactos.
- Adicionado o botão **Regerar** em cada técnico que já possui feedback.
- Adicionado **Regerar conteúdo** dentro do editor individual.
- As **Observações do gestor** são preservadas durante a regeneração.
- Ao regerar individualmente um feedback finalizado, ele volta para **Rascunho**, deixa de ser exibido ao técnico e deverá ser finalizado novamente.

## Publicação
Não há nova migração SQL nem alteração em Edge Functions. Substitua `index.html`, `app.js`, `styles.css` e mantenha o `config.js` atual.
