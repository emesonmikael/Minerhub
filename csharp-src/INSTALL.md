# Guia de Instalação e Implantação 🛠️

Este guia ensina como configurar, compilar, publicar e implantar o ecossistema **MinerHub** do zero em seus computadores.

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina ou servidor:
1. **.NET 8.0 SDK** (Essencial para compilação e execução): [Download .NET 8](https://dotnet.microsoft.com/download/dotnet/8.0)
2. **Visual Studio 2022** (com a carga de trabalho *Desenvolvimento Web*) ou **VS Code** com extensão C# ativa.
3. **XMRig** (O minerador de CPU de código aberto): Baixe a versão para Windows e salve os arquivos na pasta `MinerHub.Agent/xmrig/` para empacotamento automático.

---

## ⚡ Inicialização Rápida em Desenvolvimento

1. Abra a solução `MinerHub.sln` no Visual Studio 2022.
2. Defina os projetos de inicialização múltipla:
   * **MinerHub.Server** (Executará na porta `5000` / `5001`)
   * **MinerHub.Agent** (Conversará automaticamente com o Server)
3. Clique em **Iniciar / Depurar (F5)**.
4. O Entity Framework Core detectará a ausência do banco e criará automaticamente o banco de dados `minerhub.db` (SQLite) com dados de exemplo semeados.
5. Acesse o console interativo local.

---

## 🚀 Publicação e Instalação em Produção

### Passo 1: Publicar a Solução
Para gerar executáveis otimizados prontos para rodar em produção, use nosso script ou execute os comandos manuais:

```bash
# Via script (Linux / macOS / Git Bash)
./scripts/publish.sh
```

**Comandos Manuais:**
```bash
# Publicar Servidor
dotnet publish MinerHub.Server/MinerHub.Server.csproj -c Release -o publish/Server

# Publicar Agent Windows (Gerará executável independente)
dotnet publish MinerHub.Agent/MinerHub.Agent.csproj -c Release -r win-x64 -o publish/Agent --self-contained false
```

---

### Passo 2: Configurar e Rodar o Servidor
1. Copie o conteúdo da pasta `publish/Server` para o seu servidor principal (IP fixo recomendado: `192.168.1.107`).
2. Ajuste o arquivo `appsettings.json` se desejar usar outra porta ou chave de criptografia JWT.
3. Execute o servidor:
   ```bash
   dotnet MinerHub.Server.dll
   ```
4. O servidor iniciará escutando conexões REST e SignalR.

---

### Passo 3: Configurar e Instalar o Windows Agent
Em cada computador minerador da rede:

1. Baixe o executável oficial do **XMRig** (versão `xmrig.exe`).
2. Copie a pasta `publish/Agent` para um diretório seguro (ex: `C:\MinerHubAgent\`).
3. Certifique-se de que o `xmrig.exe` está localizado na subpasta `C:\MinerHubAgent\xmrig\xmrig.exe`.
4. Abra o arquivo `appsettings.json` e configure:
   * `"ServerUrl"`: Coloque o IP do seu servidor MinerHub (ex: `http://192.168.1.107:5000`).
   * `"ComputerId"`: Dê um nome exclusivo para este computador na rede (ex: `PC-01-Intel`).
   * `"WorkerName"`: O identificador que aparecerá na pool de mineração.
5. Abra o **PowerShell como Administrador** e navegue até a pasta do Agent.
6. Execute o script de instalação automática:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   .\install-agent.ps1
   ```
7. O script irá:
   * Registrar o Agent como um **Serviço do Windows** chamado `MinerHubAgent`.
   * Configurar a inicialização como automática (iniciará junto com a máquina).
   * Configurar tentativas de autorrecuperação em caso de desligamentos inesperados.
   * Iniciar o serviço.

---

## 🔒 Considerações de Firewall e Rede

Para que as máquinas da rede conversem com o Servidor Principal (`192.168.1.107`):
1. **No Servidor (192.168.1.107)**: Abra as portas `5000` (HTTP) ou `5001` (HTTPS) de entrada nas configurações do Firewall do Windows Defender.
2. **Nas Máquinas Locais (Agents)**: Nenhuma porta de entrada precisa ser aberta, já que as conexões SignalR de telemetria e polling são feitas via saída TCP de longa duração direcionadas ao Servidor.
