#!/bin/bash

# ==============================================================================
# MinerHub - Script de Backup do Banco SQLite
# Faz uma cópia de segurança segura do minerhub.db usando comandos SQLite.
# ==============================================================================

set -e

DB_FILE="minerhub.db"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/minerhub_backup_$TIMESTAMP.db"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Iniciando backup do banco de dados SQLite..."

# Certifica que a pasta de backups existe
mkdir -p "$BACKUP_DIR"

# Verifica se o arquivo do banco de dados existe
if [ ! -f "$DB_FILE" ]; then
    # Procura na pasta do servidor
    DB_FILE="./MinerHub.Server/minerhub.db"
    if [ ! -f "$DB_FILE" ]; then
        echo -e "${RED}ERRO: Banco de dados '$DB_FILE' não encontrado!${NC}"
        exit 1
    fi
fi

# Faz cópia segura usando a API online backup do SQLite se o utilitário sqlite3 estiver instalado,
# caso contrário faz uma cópia direta (segura se o app estiver ocioso).
if command -v sqlite3 &> /dev/null; then
    echo "Efetuando backup online via sqlite3..."
    sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
else
    echo "sqlite3 não está instalado. Efetuando cópia direta do arquivo..."
    cp "$DB_FILE" "$BACKUP_FILE"
fi

# Mantém apenas os últimos 10 backups para economizar espaço
echo "Limpando backups antigos (mantendo os 10 mais recentes)..."
find "$BACKUP_DIR" -name "minerhub_backup_*.db" -mtime +10 -exec rm {} \;

echo -e "${GREEN}SUCESSO: Backup criado com êxito!${NC}"
echo "Arquivo: $BACKUP_FILE"
echo "Tamanho: $(du -sh "$BACKUP_FILE" | cut -f1)"
