# TheLucas4kLab — Sandbox visual LAUEM

Monorepo da **Liga Acadêmica de Urgência e Emergência Médica (LAUEM)**.

Arquitetura (estilo The Sims / app-builder):

- **Editor web externo** (`apps/editor`): monta telas, botões, vídeos, checklists e textos (pt-BR).
- **App Flutter somente leitura** (`apps/liga_app`): carrega apenas `content/published.json` (via asset).
- **Conteúdo** em `content/`: `draft.json` (editável) e `published.json` (publicado).

O repositório começa **quase vazio** (só uma tela "Início" sem elementos). Nenhum conteúdo clínico de emergência/AVC vem pré-preenchido — você constrói tudo no editor.

## Pré-requisitos

- Node.js 18+ e npm (ou Bun)
- Flutter 3.22+ (stable) no PATH

## Como rodar o editor

```bash
cd apps/editor
npm install
npm run dev
```

Abra `http://localhost:5173`.

O servidor (`server.mjs`) serve a UI (Vite em modo middleware) e a API:

- `GET/PUT /api/draft` — ler/salvar `content/draft.json`
- `POST /api/publish` — copia draft → published e sincroniza o asset do Flutter
- `GET /api/published` — lê o publicado

### UX do editor

- Esquerda: lista de telas + **Adicionar tela**
- Centro: canvas da tela + botões para adicionar elementos
- Direita: inspetor de propriedades
- Topo: **Salvar rascunho**, **Publicar**, **Preview**

## Publicar sem a UI

Na raiz do monorepo:

```bash
npm run publish
npm run sync-flutter
npm run publish:sync
```

(Equivale a `node scripts/publish.mjs` e `node scripts/sync-flutter.mjs`.)

## Como rodar o Flutter

Depois de publicar (o asset já vem espelhado na primeira vez):

```bash
cd apps/liga_app
flutter pub get
flutter run -d linux
# ou: flutter run -d chrome
```

O app:

- Renderiza telas do JSON publicado
- Navega com pilha em botões `navigate`
- Abre URLs com `url_launcher`
- Checklist com estado local efêmero
- Mostra o `disclaimer` em banner
- Estado vazio se não houver telas/elementos

## Schema do conteúdo (JSON)

```json
{
  "version": 1,
  "disclaimer": "string",
  "homeScreenId": "home",
  "screens": [
    {
      "id": "home",
      "title": "Início",
      "elements": [
        { "id": "btn1", "type": "button", "label": "Ir", "action": { "type": "navigate", "target": "outra" } },
        { "id": "vid1", "type": "video", "url": "https://example.com", "title": "Opcional" },
        { "id": "chk1", "type": "checklist", "title": "Lista", "items": [{ "id": "i1", "label": "Item" }] },
        { "id": "txt1", "type": "text", "content": "Parágrafo" }
      ]
    }
  ]
}
```

## Estrutura

```
TheLucas4kLab/
  README.md
  STATUS.md
  content/draft.json
  content/published.json
  scripts/publish.mjs
  scripts/sync-flutter.mjs
  apps/editor/
  apps/liga_app/
```

## Plataformas

MVP focado em editor web + Flutter (linux/chrome). Desktop/Play Store/App Store ficam para depois — o projeto Flutter já inclui pastas android/ios/macos/windows/linux/web.

## Licença / uso

Conteúdo educacional da LAUEM. O disclaimer do JSON deve permanecer visível no app.
