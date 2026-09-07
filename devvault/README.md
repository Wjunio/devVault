# DevVault Manager

Salve suas extensões favoritas e organize conjuntos de extensões em perfis no VS Code. Exporte e importe arquivos JSON para compartilhar essas listas ou transferi-las entre ambientes.

O DevVault ajuda quem trabalha com diferentes projetos, prepara uma nova máquina ou compartilha uma seleção de ferramentas com a equipe. Cada favorito registra o identificador, o nome e a versão da extensão.

## Instalação

Quando a publicação estiver disponível no Marketplace, abra **Extensões** (`Ctrl+Shift+X`), procure por **DevVault Manager**, do publicador **ArtePrime**, e clique em **Instalar**.

Para instalar pelo arquivo VSIX:

1. Abra a Paleta de Comandos.
2. Execute `Extensions: Install from VSIX...`.
3. Selecione o arquivo `devvault-manager-<versão>.vsix`.
4. Procure por `DevVault` na Paleta de Comandos para começar.

A compatibilidade declarada no manifesto é VS Code `^1.136.0`.

## Funcionalidades

- Listar extensões instaladas e suas versões.
- Gerenciar e consultar favoritos.
- Criar, consultar e gerenciar perfis de extensões.
- Exportar e importar favoritos e perfis com as versões registradas.
- Instalar extensões ausentes ou atualizar versões antigas durante a importação, com opção de fazer isso depois.

Os dados são armazenados localmente pelo VS Code. A sincronização automática com o Google Drive ainda não está implementada.

## Como usar

Abra a Paleta de Comandos (`Ctrl+Shift+P` no Windows/Linux ou `Cmd+Shift+P` no macOS) e procure por `DevVault`.

Para compartilhar favoritos, execute **Gerenciar favoritos**, selecione as extensões e confirme. Depois use **Exportar favoritos** e envie o JSON gerado. No outro ambiente, use **Importar favoritos**, confira o resumo e escolha se deseja instalar as extensões agora.

Para separar ferramentas por projeto, use **Criar perfil**, informe nome e descrição e selecione as extensões. Você pode editar ou excluir esse conjunto em **Gerenciar perfis** e compartilhá-lo com **Exportar perfil**.

| Comando | Ação |
| --- | --- |
| DevVault: Listar extensões | Exibe as extensões instaladas. |
| DevVault: Gerenciar favoritos | Seleciona as extensões favoritas. |
| DevVault: Mostrar favoritos | Consulta os favoritos salvos. |
| DevVault: Exportar favoritos | Salva os favoritos em um arquivo `.devvault.json`. |
| DevVault: Importar favoritos | Adiciona favoritos de um arquivo à lista local. |
| DevVault: Criar perfil | Salva um conjunto de extensões com nome e descrição. |
| DevVault: Mostrar perfis | Consulta os perfis salvos. |
| DevVault: Gerenciar perfis | Gerencia os perfis existentes. |
| DevVault: Exportar perfil | Salva um perfil em um arquivo `.devvault.json`. |
| DevVault: Importar perfil | Importa um perfil e oferece a instalação das extensões. |

## Importação e versões

A importação apresenta um resumo antes de salvar os dados. Você pode escolher instalar as extensões naquele momento ou deixar para depois.

| Situação da extensão | Ao escolher instalar |
| --- | --- |
| Não instalada | Instala a versão registrada no arquivo. |
| Versão instalada menor | Atualiza para a versão do arquivo. |
| Mesma versão | Mantém a instalação atual. |
| Versão instalada maior | Mantém a versão maior, sem downgrade. |

Os favoritos importados são unidos aos existentes por identificador, mantendo a maior versão registrada. Ao importar um perfil com nome já existente, o DevVault solicita confirmação para substituí-lo.

A instalação depende de conexão à internet e da disponibilidade da versão solicitada. Os perfis do DevVault armazenam listas de extensões; não incluem configurações, atalhos ou arquivos do projeto.

## Perguntas frequentes

### Importar favoritos substitui minha lista?

Não. A importação combina as listas e mantém a maior versão registrada para cada identificador.

### Importar um perfil remove extensões já instaladas?

Não. A importação oferece instalar as extensões ausentes e atualizar as antigas. Ela não remove extensões do ambiente.

### O JSON contém as extensões completas?

Não. Ele contém os nomes, identificadores e versões. A instalação das extensões é feita pelo VS Code, separadamente.

### Uma instalação falhou. Perdi os favoritos ou o perfil?

Os dados são salvos antes da etapa de instalação. Se uma extensão falhar, o DevVault continua com as demais e informa o resultado. Você pode importar o arquivo novamente para tentar instalar as pendentes.

## Limitações atuais

- A sincronização automática com serviços de nuvem ainda não está disponível.
- Os perfis não substituem os perfis nativos do VS Code nem fazem backup completo do ambiente.
- O comparador atual considera as partes numéricas da versão; sufixos de pré-lançamento não têm ordenação SemVer completa.
- O DevVault não instala uma versão inferior à que já está instalada, portanto importar uma lista não garante um ambiente idêntico ao de origem.
