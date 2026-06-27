# Registro de Alterações (Changelog) 📜

Este arquivo documenta as versões, correções de bugs, refatorações e adições feitas ao projeto **MinerHub**.

---

## [1.0.0] - 2026-06-27

### Adicionado
- **Arquitetura Geral**: Solução unificada `MinerHub.sln` contendo 5 projetos isolados e modulares para distribuição corporativa de alta escalabilidade.
- **MinerHub.Shared**: Modelos orientados a objetos altamente tipados para persistência (`Computer`, `MiningStatus`, `LogEntry`, `Settings`).
- **MinerHub.Database**: Integração completa com **SQLite** e **Entity Framework Core**.
- **DbInitializer**: Sistema automático de migração de tabelas e preenchimento de massa de dados na inicialização inicial do servidor.
- **MinerHub.Server**:
  - Controladores REST (`DashboardController`, `ComputersController`, `LogsController`) expondo endpoints assíncronos em .NET 8.
  - Endpoint seguro de Autenticação JWT (`/api/auth/login`) com validações de login padrão.
  - Hub de comunicação bi-direcional em tempo real **SignalR** (`MiningHub`).
  - Serviço em segundo plano (`MiningService`) para monitorar o status dos Agents (timeout de ping e desconexões).
- **MinerHub.Agent**:
  - Estrutura de Windows Worker Service compatível com `.UseWindowsService()`.
  - Mecanismo `XMRigManager` para gerenciar a execução do subprocesso do minerador local e realizar parsing em tempo real do log do console para extrair o hashrate.
  - Consulta ao hardware nativo do Windows (uso de CPU, uso de RAM, temperaturas de núcleos) via consultas WMI (`System.Management`).
- **Scripts**:
  - Script PowerShell para instalação automática do Agent como Serviço do Windows (`install-agent.ps1`).
  - Script Bash para publicação compilada otimizada em modo Release (`publish.sh`).
  - Script Bash de backup automatizado para o banco de dados SQLite (`backup-db.sh`).
- **MinerHub.Web**: Painel de gerenciamento moderno construído em Next.js e Tailwind CSS.

### Segurança
- Enforçada autenticação baseada em JWT para todos os endpoints REST de controle administrativo.
- Implementação de canais SignalR seguros.
