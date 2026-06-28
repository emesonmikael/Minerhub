# MinerHub - Agente Node.js Simples

Este é o agente de telemetria oficial do **MinerHub**, reescrito 100% em **Node.js** para ser extremamente simples, leve e fácil de usar! Ele substitui por completo o agente anterior em C# (que exigia compilador, Visual Studio e configurações complexas).

Com este agente em Node.js, você pode rodar em **qualquer computador** (Windows, macOS ou Linux) com um único comando, monitorar o hardware real da máquina e interagir com o seu painel central em tempo real!

---

## 🚀 Como Executar

### 1. Pré-requisitos
Você precisa apenas do **Node.js** instalado na sua máquina (versão 18 ou superior recomendada).

### 2. Passo a Passo para Iniciar
1. Acesse o terminal/prompt de comando do seu computador.
2. Navegue até a pasta deste projeto.
3. Execute o script passando o **Token da Máquina** que você cadastrou no painel:

```bash
node agent.js [TOKEN_DA_MAQUINA] [URL_DO_PAINEL]
```

#### Exemplos práticos:
* **Com os valores padrões (local):**
  ```bash
  node agent.js tok_ryzen_88123 http://localhost:3000
  ```
* **Usando o token padrão criado no painel:**
  ```bash
  node agent.js tok_intel_99382
  ```

---

## 🛠️ Como Funciona (Apenas 1 arquivo!)

O script `agent.js` faz tudo sozinho sem precisar de nenhuma biblioteca do `npm install` (zero dependências!):
1. **Coleta Informações Reais:** Ele lê o Hostname do computador, o IP local da rede, a versão e nome do Sistema Operacional, e a quantidade de Memória RAM usada de verdade através do módulo nativo `os` do Node.js.
2. **Ping Periódico:** A cada 5 segundos ele envia um POST para o endpoint `/api/agent/ping` do seu painel Next.js contendo as métricas de telemetria.
3. **Recebe Comandos em Tempo Real:** No retorno de cada ping, o servidor informa o estado desejado da mineração (`online` ou `offline`) e o limite de CPU configurado.
4. **Métricas de Mineração:** Caso o painel envie o comando para **INICIAR**, o agente simula o processamento do XMRig baseado no limite de CPU real que você configurou no slider, atualizando a temperatura e o hashrate proporcionalmente! Ao clicar em **PARAR**, o agente encerra a simulação imediatamente.
