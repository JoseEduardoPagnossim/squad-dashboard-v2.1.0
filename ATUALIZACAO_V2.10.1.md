# Atualização V2.10.1

## Correção aplicada

A V2.10.0 podia exibir o mesmo técnico duas vezes no histórico quando os meses antigos estavam sem `user_id` e um mês mais recente já estava vinculado ao usuário.

Antes, a identidade histórica alternava entre:

- `user_id`, quando disponível;
- nome normalizado, quando o registro ainda não possuía `user_id`.

Isso fazia, por exemplo, `Arthur Santos` de janeiro a julho e `Arthur Santos` de agosto serem tratados como duas séries distintas.

Na V2.10.1, gráficos históricos, legendas e matriz **ACIMA x ABAIXO** usam uma única identidade histórica baseada no nome normalizado do técnico. A normalização remove diferenças de espaços, espaços especiais e acentuação.

## Precisa alterar o banco?

Não. A correção é somente no frontend. Não apague nem reimporte os meses anteriores.

## Arquivos que precisam ser atualizados

- `app.js`
- `index.html`

O `README.md` e este arquivo são apenas documentação. Mantenha seu `config.js` atual.
