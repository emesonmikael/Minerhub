# MinerHub 🚀

MinerHub é um ecossistema completo de monitoramento e controle remoto em tempo real para redes de computadores minerando criptomoedas com o **XMRig**.

Inspirado em soluções líderes como **HiveOS** e **NiceHash**, o MinerHub centraliza a telemetria do hardware, o hashrate e o status operacional de dezenas de computadores (Agents) em um painel web dinâmico, moderno e de alta performance.

---

## 🛠️ Tecnologias Utilizadas

### Servidor Principal (MinerHub.Server)
* **ASP.NET Core 8**: REST API e barramento em tempo real.
* **SignalR**: Atualizações bilaterais instantâneas entre Agents, Servidor e Dashboard Web.
* **Entity Framework Core**: Abstração de banco de dados robusta e limpa.
* **SQLite**: Banco de dados relacional leve e confiável pré-configurado.
* **JWT (JSON Web Token)**: Autenticação de usuários e endpoints administrativos.
* **Swagger (OpenAPI)**: Documentação e experimentação direta de rotas da API.

### Windows Agent (MinerHub.Agent)
* **Worker Service (.NET 8)**: Executável como Serviço do Windows que inicia com o sistema operacional.
* **System.Management (WMI)**: Consulta nativa ao hardware Windows para monitoramento de CPU, RAM e temperatura.
* **Process Management**: Controle de subprocesso nativo do `xmrig.exe` com throttling dinâmico de CPU.

### Painel Web (MinerHub.Web / Next.js)
* **Bootstrap 5 & Tailwind CSS**: Estilização rica, ágil e responsiva (Mobile-First).
* **SignalR Client / WebSockets**: Sincronização automática sem necessidade de recarregar a página.
* **Chart.js / SVG Vectors**: Gráficos analíticos e informativos sobre hashrate acumulado e temperaturas.

---

## 📐 Estrutura do Projeto

O MinerHub adota os princípios de arquitetura modular e limpa (DDD/SOLID), divididos na solução `MinerHub.sln`:

1. **MinerHub.Shared**: Contém as definições de modelos, enums de status e DTOs compartilhados entre o Servidor e o Agent.
2. **MinerHub.Database**: Projeto dedicado à infraestrutura de dados. Inclui o `MinerHubDbContext` do Entity Framework Core e o semeador `DbInitializer`.
3. **MinerHub.Server**: A API Web principal do ecossistema. Hospeda os controladores REST, os endpoints JWT e os Hubs de transmissão SignalR.
4. **MinerHub.Agent**: Serviço que roda em segundo plano em cada máquina mineradora. Coleta métricas locais e escuta os comandos do servidor.
5. **MinerHub.Web**: Painel web de interface de usuário de monitoramento e gerenciamento.

---

## 🔒 Login Padrão Administrativo

* **Usuário**: `admin`
* **Senha**: `admin123`

*Nota: Recomenda-se a alteração das credenciais no banco de dados SQLite (`Users` ou tabela `Settings`) para garantir segurança operacional em produção.*

---

## 📊 Principais Funcionalidades

- **Monitoramento em Tempo Real**: Veja temperatura de CPU, hashrate (H/s), memória RAM ativa e status (Online/Offline) atualizando-se sozinhos.
- **Controle Operacional Remoto**: Comande o início, a pausa ou o reinício do XMRig em qualquer máquina do parque com apenas um clique.
- **Throttling de CPU Dinâmico**: Limite a porcentagem de processamento alocada à mineração diretamente pelo painel para poupar recursos em horários de trabalho.
- **Gerenciador de Logs Centralizado**: Histórico detalhado de conexão de máquinas, comandos de mineração e alertas do sistema.
- **Painel de Configurações Amigável**: Adicione novos mineradores, altere IPs, Tokens e nomes diretamente na UI, sem encostar em arquivos de texto JSON.

---

## 📄 Licença

Este projeto é desenvolvido sob os padrões mais elevados de qualidade de engenharia de software e arquitetura C#. Sinta-se livre para customizar pools de mineração, wallets e algoritmos segundo as necessidades de sua infraestrutura.
