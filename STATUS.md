# STATUS — TheLucas4kLab

Data: 2026-09-08 (America/Sao_Paulo, UTC-3)

## O que funciona

- Monorepo em /workspace/TheLucas4kLab com content/, apps/editor, apps/liga_app, scripts/.
- Editor Vite+React+TS: install e vite build OK.
- server.mjs: API draft/publish verificada via curl.
- scripts publish.mjs e sync-flutter.mjs OK.
- App Flutter: pub get OK; analyze sem issues; devices linux e chrome.
- Conteudo inicial minimo: tela Inicio vazia + disclaimer.
- README.md em pt-BR e .gitignore adequados (sem git init).


## Como rodar

Editor: cd apps/editor; bun install; bun run dev (porta 5173).

App: export PATH=/home/box/flutter-sdk/bin:$PATH; cd apps/liga_app; pub get; device linux ou chrome.

Publicacao: botao no editor ou scripts publish.mjs + sync-flutter.mjs.

## Notas

- Bun OK neste box.
- SDK em /home/box/flutter-sdk (fora do repo).
- Destino GitHub: lucasmedeiros4k/TheLucas4kLab.

## Criterios: pasta OK; editor OK; app le published OK; README pt-BR OK.

Extra: build web release do app OK (build/web).

## Midia / imagens (2026-09-08)

- backgroundImage por tela; elemento image (role logo|icon|photo); upload /api/media; sync assets/media no publish.
- Botao novo sem destino padrao.
