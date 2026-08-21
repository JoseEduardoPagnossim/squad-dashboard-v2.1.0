# Atualização V2.17.1 — correção da trilha ambiente

A trilha padrão incluída na V2.17.0 estava com ganho excessivamente baixo. A análise do arquivo anterior mostrou aproximadamente **-41,6 dB de volume médio** e **-24,2 dB de pico**. Como o player ainda iniciava em 18%, o resultado podia ficar praticamente inaudível.

Na V2.17.1:

- a trilha `assets/casa-do-dragao-ambient.mp3` foi normalizada para aproximadamente **-14 dB de volume médio** e **-1,2 dB de pico**;
- o volume padrão para novos temas foi elevado para **24%**;
- fade-in, loop, mute, play/pause e preferências do usuário foram preservados;
- nenhuma mudança de banco de dados é necessária.

## Atualização rápida

Se você já está na V2.17.0, o essencial é substituir:

- `assets/casa-do-dragao-ambient.mp3`
- `app.js`
- `index.html`

Mantenha o seu `config.js` atual.
