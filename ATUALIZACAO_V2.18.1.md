# Soften Performance Hub V2.18.1

Correção focada na criação de usuários via Supabase Edge Function.

## O que mudou

- A sessão do administrador é renovada imediatamente antes de chamar `create-user`.
- A chamada envia explicitamente o `Authorization: Bearer <token>` atualizado.
- O frontend agora lê a resposta real da Edge Function em erros HTTP e mostra o motivo correto, em vez de transformar qualquer erro em "função não publicada".
- A função `create-user` passou a registrar etapas importantes nos Logs do Supabase e retornar códigos de erro consistentes.
- O vínculo histórico do técnico usa normalização forte de nome (espaços, caracteres invisíveis e acentos) ao associar registros anteriores ao novo usuário.

## Necessário no Supabase

Não há SQL novo.

É recomendado republicar a Edge Function `create-user` usando o arquivo:

`supabase/functions/create-user/index.ts`

Mantenha **Verify JWT / verify_jwt ativado**.

Depois, publique os arquivos de frontend da V2.18.1 e mantenha o `config.js` que já está funcionando no ambiente.
