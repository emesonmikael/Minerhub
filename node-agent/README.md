# MinerHub - Agente Node.js (Mineração Real com XMRig + Simulação)

Este é o agente de telemetria oficial do **MinerHub**, reescrito 100% em **Node.js** para ser extremamente simples, leve e sem dependências externas!

Com ele, você pode rodar em **qualquer computador** (Windows, macOS ou Linux), monitorar o hardware real da máquina e **controlar o XMRig real** direto pelo seu painel central em tempo real!

---

## 🔥 Como Ativar a Mineração Real no seu Computador (Hardware XMRig)

Por padrão, se o arquivo do XMRig não for encontrado, o agente roda no **Modo de Simulação** (ótimo para testar os pings e a interface do painel sem gastar CPU).

Para ativar o **Modo de Mineração Real** no seu computador, siga os 2 passos abaixo:

### 1. Baixe o XMRig Oficial
1. Acesse o site oficial de download do XMRig: [https://xmrig.com/download](https://xmrig.com/download)
2. Baixe a versão para o seu sistema (Windows, Linux ou macOS).
3. Extraia o arquivo executável (`xmrig.exe` no Windows ou `xmrig` no Linux/Mac) e coloque-o **na mesma pasta** onde está o arquivo `agent.js`!

### 2. Execute o Agente
Abra o terminal na pasta e rode o agente passando o **Token da Máquina**:

```bash
# Formato padrão:
node agent.js [TOKEN_DA_MAQUINA] [URL_DO_PAINEL] [CAMINHO_DO_XMRIG_OPCIONAL]

# Exemplo prático apontando para o servidor e com XMRig na mesma pasta:
node agent.js tok_ryzen_88123 http://localhost:3000

# Ou no Windows, se preferir passar o caminho explícito do xmrig.exe:
node agent.js tok_intel_99382 http://localhost:3000 ./xmrig.exe
```

Quando o agente rodar, você verá no terminal a mensagem verde:
`[★] MINERAÇÃO REAL (HARDWARE XMRIG ATIVO) - XMRig Detectado!`

---

## 🛠️ Como Funciona o Controle Remoto

1. **Detecção Automática:** O script `agent.js` verifica automaticamente se o `xmrig.exe` (ou `xmrig`) está na pasta. Se estiver, ele se conecta a ele; se não, opera no modo simulação.
2. **Coleta do Sistema Real:** Lê o Hostname real, o IP da rede local, o Sistema Operacional e o uso de Memória RAM através do Node.js.
3. **Pings de Telemetria:** A cada 5 segundos ele envia as métricas para o painel e recebe os comandos de controle.
4. **Acionamento do Hardware:** Quando você clica no botão **INICIAR** no painel web:
   * O agente dispara o processo do XMRig nos bastidores conectando automaticamente na **Pool**, na **Carteira (Wallet)** e com o **Algoritmo** configurados no painel!
   * O limite de CPU do slider (`--cpu-max-threads-hint`) é aplicado instantaneamente no hardware!
   * O hashrate real reportado no terminal é capturado via API HTTP local do XMRig (porta 16000) e enviado ao painel em tempo real.
5. **Parada Imediata:** Ao clicar em **PARAR** no painel, o processo do XMRig é finalizado com segurança.
