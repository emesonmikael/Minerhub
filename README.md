# MinerHub - Sistema de Gestão de Mineração XMRig 🚀

Bem-vindo ao **MinerHub**!

Este repositório contém o sistema completo de monitoramento e controle remoto em tempo real para redes de computadores minerando com o **XMRig**.

Inspirado em soluções líderes como **HiveOS** e **NiceHash**, o sistema é composto por duas partes principais:

1. **Painel Web Interativo (Next.js & Tailwind CSS)**:
   * Um protótipo funcional de alta fidelidade que roda imediatamente no navegador.
   * Conectado a rotas de API REST locais para simular o comportamento real do servidor principal.
   * Permite interações completas: ligar/desligar mineradores, limitar CPU, ver telemetrias e analisar logs.
   * **Navegador de Código Fonte Integrado**: Uma aba especial que permite visualizar, copiar e baixar toda a solução em C#!

2. **Código Fonte de Produção C# (.NET 8 & SQLite)**:
   * Localizado no diretório `/csharp-src/`.
   * Contém a arquitetura limpa, profissional e modular completa do sistema para implantação real.
   * Inclui todos os projetos: `MinerHub.Shared`, `MinerHub.Database`, `MinerHub.Server`, `MinerHub.Agent` e scripts operacionais.

---

## 🛠️ Estrutura do Código C# (Localizado em `/csharp-src/`)

* **`MinerHub.sln`**: Arquivo de solução para abrir no Visual Studio 2022.
* **`MinerHub.Shared`**: Contém classes e DTOs de dados altamente tipados para telemetria.
* **`MinerHub.Database`**: Camada de persistência relacional usando **SQLite** e **Entity Framework Core**.
* **`MinerHub.Server`**: API Web REST em ASP.NET Core 8 protegida por **Autenticação JWT** e barramento de tempo real **SignalR**.
* **`MinerHub.Agent`**: Um Serviço Windows (Windows Worker Service) que roda em segundo plano em cada computador local, coletando métricas de hardware nativas (CPU, RAM, Temperatura) via WMI e controlando o processo minerador `xmrig.exe`.
* **`scripts/`**:
  * `install-agent.ps1`: Script PowerShell para instalar o Agent como Serviço Windows de inicialização automática.
  * `publish.sh`: Script para compilar e gerar pacotes Release otimizados.
  * `backup-db.sh`: Script de backup automatizado para o banco de dados SQLite.

---

## 📂 Visualização e Acesso

Você pode explorar todo o código fonte de produção C# de três formas:
1. **Pelo Painel Web**: Acesse a aba **"Código Fonte C#"** no painel em tempo real para navegar pelos arquivos do projeto com realce de sintaxe elegante.
2. **Pelo Explorador de Arquivos**: Abra o diretório `/csharp-src/` diretamente no workspace.
3. **Download**: Copie os arquivos de `/csharp-src/` ou baixe o repositório como um ZIP a partir do menu do AI Studio.

---

## 🔒 Credenciais do Painel de Controle

* **Usuário**: `admin`
* **Senha**: `admin123`

---

## 📖 Instruções de Instalação Real

Abra o arquivo `INSTALL.md` (na raiz do repositório ou em `/csharp-src/INSTALL.md`) para obter o guia detalhado passo a passo de como restaurar os pacotes NuGet, publicar e instalar o Servidor e o Windows Agent como Serviço.
