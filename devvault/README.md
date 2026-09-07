# DevVault Manager

**Suas extensões favoritas. Um perfil para cada projeto. Uma lista pronta para levar.**

Organize as extensões do VS Code em favoritos e perfis, registre suas versões e compartilhe suas seleções por arquivos JSON. Útil para preparar outra máquina, retomar um projeto ou dividir as ferramentas da equipe.

[Primeiros passos](#primeiros-passos) · [Compartilhamento](#leve-sua-seleção-para-outro-ambiente) · [Comandos](#comandos-de-referência) · [Dúvidas](#dúvidas-frequentes)

## Primeiros passos

Tudo começa na **Paleta de Comandos**: pressione `Ctrl+Shift+P` no Windows/Linux ou `Cmd+Shift+P` no macOS e digite `DevVault`.

### Guarde as extensões que você sempre usa

1. Execute **DevVault: Gerenciar favoritos**.
2. Marque as extensões instaladas que deseja guardar e confirme com `Enter`.
3. Execute **DevVault: Mostrar favoritos** para consultar sua seleção.

Cada item guarda o nome, o identificador e a versão da extensão no momento da seleção.

### Monte um conjunto para cada tipo de projeto

1. Execute **DevVault: Criar perfil**.
2. Dê um nome ao conjunto, como `Frontend`, `Python` ou `Ferramentas da equipe`.
3. Adicione uma descrição, se quiser, e selecione as extensões instaladas que farão parte dele.
4. Consulte o resultado em **DevVault: Mostrar perfis**.

Para mudar o nome, a descrição ou as extensões, use **DevVault: Gerenciar perfis**. Nesse comando, você também pode excluir um perfil.

| Sua intenção | Use |
| --- | --- |
| Manter uma lista das ferramentas que usa com frequência | **Favoritos** |
| Separar seleções por projeto, linguagem ou equipe | **Perfis** |
| Levar uma seleção para outra máquina ou pessoa | **Exportação e importação** |

> Um perfil do DevVault é uma lista de extensões com versões registradas. Criá-lo não alterna o ambiente ativo do VS Code.

## Leve sua seleção para outro ambiente

**Selecione → Exporte → Compartilhe → Importe.**

Por exemplo: crie o perfil `Ferramentas da equipe`, exporte o arquivo e compartilhe com quem está chegando ao projeto. Essa pessoa poderá conferir a seleção e escolher se deseja instalar as extensões.

### No ambiente de origem

1. Execute **DevVault: Exportar favoritos** ou **DevVault: Exportar perfil**.
2. Para um perfil, escolha qual conjunto deseja compartilhar.
3. Salve o arquivo `.devvault.json` e transfira-o para o destino.

### No ambiente de destino

1. Instale o DevVault Manager no VS Code.
2. Execute **DevVault: Importar favoritos** ou **DevVault: Importar perfil**, conforme o conteúdo exportado.
3. Selecione o arquivo e confira o resumo de extensões e versões.
4. Confirme a importação. Se houver extensões ausentes ou antigas, escolha **Instalar agora** ou **Fazer depois**.

Os dados da seleção são salvos antes da instalação. Se escolher **Fazer depois**, importe o mesmo arquivo novamente quando quiser instalar as extensões pendentes.

## Você decide o que instalar

Antes de confirmar a importação, o DevVault compara as versões do arquivo com as do ambiente:

| No seu VS Code | Ao escolher **Instalar agora** |
| --- | --- |
| A extensão ainda não está instalada | Solicita a instalação da versão registrada no arquivo. |
| A versão instalada é menor | Solicita a atualização para a versão do arquivo. |
| A versão instalada é igual | Mantém a instalação atual. |
| A versão instalada é maior | Mantém a versão mais recente, sem voltar à anterior. |

**Favoritos são combinados:** itens com o mesmo identificador mantêm a maior versão registrada entre as listas. **Perfis com o mesmo nome pedem confirmação** antes de serem substituídos.

A instalação requer internet e depende da disponibilidade da versão solicitada. Como versões superiores são mantidas, a importação não garante um ambiente idêntico ao de origem.

## Comandos de referência

Abra a Paleta de Comandos e pesquise pelo nome abaixo.

| Comando | O que você pode fazer |
| --- | --- |
| `DevVault: Listar extensões` | Consultar extensões instaladas e suas versões. |
| `DevVault: Gerenciar favoritos` | Selecionar e salvar suas favoritas. |
| `DevVault: Mostrar favoritos` | Consultar a lista de favoritos salva. |
| `DevVault: Exportar favoritos` | Salvar a lista em um arquivo `.devvault.json`. |
| `DevVault: Importar favoritos` | Combinar uma lista recebida com seus favoritos e, se desejar, instalar as extensões. |
| `DevVault: Criar perfil` | Montar um conjunto com nome, descrição e extensões. |
| `DevVault: Mostrar perfis` | Consultar os perfis salvos. |
| `DevVault: Gerenciar perfis` | Editar ou excluir um perfil. |
| `DevVault: Exportar perfil` | Salvar um perfil em um arquivo `.devvault.json`. |
| `DevVault: Importar perfil` | Salvar um perfil recebido e, se desejar, instalar suas extensões. |

## Dúvidas frequentes

### Onde ficam meus dados? Existe sincronização automática?

Favoritos e perfis ficam armazenados localmente pelo VS Code. A transferência entre ambientes é feita por exportação e importação; a sincronização automática com serviços de nuvem ainda não está disponível.

### O arquivo leva as extensões completas?

O JSON contém a seleção, com nomes, identificadores e versões. O VS Code instala as extensões separadamente quando você escolhe **Instalar agora**.

### Importar remove extensões que já uso?

A importação mantém as extensões existentes. Ela oferece instalar as ausentes e atualizar as que estão em uma versão inferior à registrada no arquivo.

### Uma instalação falhou. Perdi minha seleção?

Se uma extensão falhar durante a instalação, seus favoritos ou o perfil já estarão salvos. O DevVault continua com as demais e informa o resultado. Confira a conexão e a disponibilidade da versão; depois, importe o arquivo novamente para tentar instalar as pendentes.

### O arquivo foi recusado. Como resolver?

Confira se ele foi exportado pelo DevVault e se você usou o comando correspondente: **Importar favoritos** para favoritos ou **Importar perfil** para um perfil. Um JSON de outra ferramenta não é necessariamente compatível.

### O perfil inclui configurações e atalhos do VS Code?

Os perfis guardam listas de extensões. Configurações, atalhos e arquivos do projeto ficam fora da exportação; os perfis do DevVault não substituem os perfis nativos nem um backup completo do ambiente.

### Como são comparadas as versões de pré-lançamento?

O comparador atual considera as partes numéricas da versão. Sufixos de pré-lançamento ainda não seguem a ordenação SemVer completa.

### Qual versão do VS Code é necessária?

VS Code 1.136.0 ou versão posterior da série 1.x, conforme a compatibilidade declarada pela extensão.
