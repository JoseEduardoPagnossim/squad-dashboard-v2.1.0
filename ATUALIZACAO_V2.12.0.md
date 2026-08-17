# Atualização V2.12.0

## Nova tela Meu perfil

Todos os usuários autenticados passam a ter acesso à tela **Meu perfil** pelo menu lateral e pelo bloco com seu nome/avatar.

A tela mostra:

- Nome do usuário
- E-mail
- Perfil de acesso
- Squad
- Técnico vinculado, quando aplicável

## Alterar senha sem e-mail

O próprio usuário pode trocar a senha informando:

1. Senha atual
2. Nova senha
3. Confirmação da nova senha

A nova senha precisa ter no mínimo 8 caracteres e ser diferente da senha atual.

No modo Supabase, o sistema primeiro revalida as credenciais atuais e depois altera a senha da própria conta autenticada. Não é necessário enviar e-mail, executar SQL ou publicar Edge Function.

A opção **Esqueci minha senha** na tela de login continua disponível caso o usuário não se lembre da senha atual.

## Publicação

Mantenha o `config.js` já configurado no seu GitHub. Para atualizar a aplicação, substitua `index.html`, `app.js` e `styles.css`.
