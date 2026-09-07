# DevVault

Extensão para VS Code que organiza extensões favoritas e perfis, preserva suas versões registradas e permite compartilhar listas por arquivos JSON.

Consulte o [guia de uso da extensão](devvault/README.md) para instalação, comandos e regras de importação. Esse é o README incluído no VSIX e exibido na página da extensão.

## Desenvolvimento

Execute na raiz do repositório:

```sh
cd devvault
npm install
npm run compile
npm run test:unit
```

Para depurar, abra o repositório no VS Code e execute a configuração **Run Extension** com `F5`.

## Gerar o instalador

Na pasta `devvault`, execute:

```sh
npm run package:vsix
```

O comando executa a checagem de tipos, o lint e o build de produção antes de gerar o VSIX. `npm run package` executa apenas essas etapas de build.

### Gerar uma nova versão

Na pasta `devvault`, execute:

```sh
npm run release
```

O comando incrementa a versão de correção (`patch`) no `package.json` e no `package-lock.json` e gera o VSIX. Por exemplo, `0.0.1` passa para `0.0.2`, gerando `devvault-manager-0.0.2.vsix`. Nenhum commit ou tag Git é criado automaticamente.

| Comando | Exemplo a partir de `0.0.1` | Quando usar |
| --- | --- | --- |
| `npm run release` ou `npm run release:patch` | `0.0.2` | Correções e ajustes de documentação. |
| `npm run release:minor` | `0.1.0` | Novas funcionalidades. |
| `npm run release:major` | `1.0.0` | Uma nova versão principal. |

Atualize o `devvault/CHANGELOG.md` com as mudanças antes de gerar a versão. Se o empacotamento falhar, a versão já terá sido incrementada: corrija o problema e execute `npm run package:vsix` para tentar novamente com o mesmo número.

Para disponibilizar a atualização aos usuários, envie o VSIX gerado pela opção de atualização da extensão no painel do publicador no Marketplace. Os scripts acima geram o arquivo localmente; a publicação é uma etapa separada.

Para testar o pacote localmente no VS Code:

1. Abra a Paleta de Comandos.
2. Execute `Extensions: Install from VSIX...`.
3. Selecione o arquivo gerado `devvault-manager-<versão>.vsix`.
4. Procure por `DevVault` na Paleta de Comandos para começar.

## Ícone da extensão

Salve a imagem em `devvault/images/icon.png`. Use um PNG quadrado com pelo menos 128 × 128 pixels; 256 × 256 é indicado para telas de alta densidade.

Depois que o arquivo existir, adicione esta propriedade no nível principal de `devvault/package.json`, junto de `displayName` e `description`:

```json
"icon": "images/icon.png"
```

O caminho é relativo ao manifesto da extensão. A pasta `images` não está excluída pelo `.vscodeignore`, portanto a imagem será incluída no pacote. Gere um novo VSIX e reinstale-o para conferir o ícone na lista de extensões. Esse campo não cria um botão na barra lateral.

Referência: [manifesto de extensões do VS Code](https://code.visualstudio.com/api/references/extension-manifest).

## Documentação e publicação

- `devvault/README.md`: apresentação e guia para usuários.
- `devvault/CHANGELOG.md`: histórico de alterações.
- `devvault/package.json`: manifesto, comandos e scripts.
- `devvault/.vscodeignore`: arquivos excluídos do VSIX.

Antes de publicar no Marketplace, configure a identidade do publicador (`publisher`), o repositório (`repository`) e a licença escolhida pelo responsável pelo projeto.
