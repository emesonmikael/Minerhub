#!/bin/bash

# ==============================================================================
# MinerHub - Script de Publicação Automática do Sistema
# Compila o Servidor e o Agent em modo Release otimizado.
# ==============================================================================

set -e # Aborta em caso de erro

# Cores do terminal
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================================${NC}"
echo -e "${CYAN}         Iniciando Publicação do MinerHub (.NET 8)      ${NC}"
echo -e "${CYAN}========================================================${NC}"

# Navega para a raiz da solução
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."

# 1. Restaura pacotes NuGet
echo -e "\n${YELLOW}1. Restaurando dependências NuGet da solução...${NC}"
dotnet restore MinerHub.sln

# 2. Limpa publicações antigas
echo -e "\n${YELLOW}2. Limpando compilações anteriores...${NC}"
dotnet clean MinerHub.sln -c Release

# 3. Compila e publica o Servidor (Linux/Windows)
echo -e "\n${YELLOW}3. Compilando e publicando MinerHub.Server...${NC}"
PUBLISH_SERVER_DIR="publish/Server"
rm -rf "$PUBLISH_SERVER_DIR"

dotnet publish MinerHub.Server/MinerHub.Server.csproj \
    -c Release \
    -o "$PUBLISH_SERVER_DIR" \
    --self-contained false

# 4. Compila e publica o Agent para Windows (Runtime win-x64 ou portátil)
echo -e "\n${YELLOW}4. Compilando e publicando MinerHub.Agent para Windows x64...${NC}"
PUBLISH_AGENT_DIR="publish/Agent-Windows"
rm -rf "$PUBLISH_AGENT_DIR"

dotnet publish MinerHub.Agent/MinerHub.Agent.csproj \
    -c Release \
    -r win-x64 \
    -o "$PUBLISH_AGENT_DIR" \
    --self-contained false \
    -p:PublishSingleFile=true \
    -p:PublishReadyToRun=true

# 5. Criando arquivos adicionais
echo -e "\n${YELLOW}5. Copiando scripts auxiliares de instalação para as pastas de publicação...${NC}"
cp scripts/install-agent.ps1 "$PUBLISH_AGENT_DIR/"

echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN} SUCESSO: Sistema MinerHub publicado com sucesso!       ${NC}"
echo -e "${CYAN} Pasta do Servidor:  $(pwd)/$PUBLISH_SERVER_DIR         ${NC}"
echo -e "${CYAN} Pasta do Agent:     $(pwd)/$PUBLISH_AGENT_DIR          ${NC}"
echo -e "${GREEN}========================================================${NC}"
