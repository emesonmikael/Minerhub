# Guia de Instalação e Implantação do MinerHub (.NET 8) 🛠

Este guia detalha como compilar, configurar e implantar o sistema **MinerHub** real em sua rede de computadores locais.

---

## ⚡ Pré-requisitos
* **.NET 8.0 SDK**: [Download .NET 8](https://dotnet.microsoft.com/download/dotnet/8.0)
* **Visual Studio 2022** (com suporte a ASP.NET) ou **VS Code**.
* **XMRig**: Binários salvos em `MinerHub.Agent/xmrig/xmrig.exe`.

---

## 🚀 Como Rodar em Desenvolvimento

1. Abra a solução `csharp-src/MinerHub.sln` no Visual Studio 2022.
2. Defina os projetos `MinerHub.Server` e `MinerHub.Agent` para inicializarem simultaneamente.
3. Execute o projeto (F5).
4. O banco de dados SQLite `minerhub.db` será criado e preenchido automaticamente na pasta raiz de execução.

---

## 📦 Como Publicar para Produção

Execute os comandos a seguir para gerar os pacotes compilados otimizados em modo Release:

```bash
# Publicar API do Servidor Principal
dotnet publish csharp-src/MinerHub.Server/MinerHub.Server.csproj -c Release -o publish/Server --self-contained false

# Publicar Agent para Máquinas Windows
dotnet publish csharp-src/MinerHub.Agent/MinerHub.Agent.csproj -c Release -r win-x64 -o publish/Agent --self-contained false -p:PublishSingleFile=true -p:PublishReadyToRun=true
```

---

## ⚙ Configuração do Windows Agent como Serviço

Em cada computador que participará da mineração em sua rede:

1. Transfira o conteúdo da pasta `publish/Agent` para uma pasta local segura (ex: `C:\MinerHubAgent\`).
2. Certifique-se de salvar o executável do XMRig em `C:\MinerHubAgent\xmrig\xmrig.exe`.
3. Edite o arquivo `appsettings.json` na pasta do Agent:
   * Coloque o IP do seu servidor em `"ServerUrl"` (ex: `http://192.168.1.107:5000`).
   * Forneça um nome único para este computador em `"ComputerId"`.
4. Abra o **PowerShell como Administrador**.
5. Navegue até o diretório e execute o script de registro:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   .\install-agent.ps1
   ```
6. O Agent será instalado, configurado com políticas automáticas de reinicialização e ativado como Serviço de Segundo Plano do Windows!
