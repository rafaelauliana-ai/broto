# Broto 🌱

Organização financeira com o Brotinho. É um PWA: dá para instalar no celular.

## Arquivos
Todos ficam na raiz do repositório:
index.html, styles.css, app.js, data.js, brotinho.js, importer.js, firebase-config.js, sw.js, manifest.webmanifest, favicon.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png, firestore.rules, vercel.json

## Colocar no ar
1. **firebase-config.js**: já está com o firebaseConfig do projeto broto-206f3.
2. **Firebase > Authentication > Método de login**: ative E-mail/senha e, se quiser, Google.
3. **Firebase > Authentication > Configurações > Domínios autorizados**: adicione o domínio da Vercel (ex.: broto.vercel.app).
4. **Firebase > Firestore > Regras**: cole o conteúdo completo de firestore.rules e publique.
5. **GitHub**: suba todos os arquivos na raiz do repositório.
6. **Vercel**: importe o repositório (Framework: Other, sem build). Cada push publica de novo.

## Instalar no celular
- Android (Chrome): abrir o site > menu ⋮ > Instalar app.
- iPhone (Safari): Compartilhar > Adicionar à Tela de Início.
