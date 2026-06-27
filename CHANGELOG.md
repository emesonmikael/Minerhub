# Changelog do MinerHub 📜

Todas as alterações notáveis, correções e novos recursos implementados neste projeto estão documentados abaixo.

---

## [1.0.0] - 2026-06-27

### Lançamento Inicial
* **Arquitetura C# Completa**: Lançamento da solução `MinerHub.sln` contendo os projetos `Shared`, `Database`, `Server` e `Agent` em .NET 8.
* **Persistência SQLite**: Configurado Entity Framework Core com SQLite e semeador de banco automático.
* **Barramento SignalR**: Hub em tempo real para transmissão bi-direcional de comandos e telemetria.
* **Segurança JWT**: Endpoints REST administrativos totalmente protegidos por JSON Web Tokens.
* **Windows Agent Service**: Implementado agente nativo Windows Worker Service com leituras WMI (CPU, RAM, Temperatura) e controle direto do subprocesso do minerador XMRig.
* **PowerShell Install Utility**: Script PowerShell automatizado para deploy do Agent como Serviço do Windows.
* **Publish & Backup Utilities**: Utilitários bash para automação de builds de produção e cópias de segurança de bancos de dados SQLite.
* **Painel Web Next.js**: Painel dinâmico mobile-friendly com gráficos de telemetria integrados e um navegador interativo para inspecionar todo o código fonte C# gerado.
