# ==============================================================================
# MinerHub - Script de Instalação do Agent como Serviço Windows
# Execute este script em um PowerShell como Administrador
# ==============================================================================

$serviceName = "MinerHubAgent"
$displayName = "MinerHub Background Mining Agent"
$description = "Serviço MinerHub para monitoramento em tempo real do hardware e gestão do XMRig."
$binaryPath = Join-Path $PSScriptRoot "MinerHub.Agent.exe"

# Verifica se está rodando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "ERRO CRÍTICO: Este script deve ser executado como Administrador!"
    Write-Host "Por favor, reabra o PowerShell como Administrador e tente novamente."
    Exit
}

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "   Iniciando Configuração do MinerHub Agent Service" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# Verifica se o executável do Agent existe no diretório atual
if (-not (Test-Path $binaryPath)) {
    Write-Warning "AVISO: Executável 'MinerHub.Agent.exe' não encontrado na pasta atual!"
    Write-Host "Buscando na pasta de publicação padrão..."
    $binaryPath = Join-Path $PSScriptRoot "..\MinerHub.Agent\bin\Release\net8.0\publish\MinerHub.Agent.exe"
    if (-not (Test-Path $binaryPath)) {
        Write-Error "ERRO: MinerHub.Agent.exe não foi encontrado. Por favor, publique o projeto primeiro usando 'dotnet publish'."
        Exit
    }
}

# Verifica se o serviço já existe
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Serviço já existe. Interrompendo e removendo serviço antigo..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $serviceName | Out-Null
    Start-Sleep -Seconds 2
}

# Cria o novo serviço Windows usando sc.exe ou New-Service
Write-Host "Criando serviço Windows '$serviceName'..." -ForegroundColor Green
New-Service -Name $serviceName `
            -BinaryPathName $binaryPath `
            -DisplayName $displayName `
            -Description $description `
            -StartupType Automatic

# Configura ações de recuperação em caso de falha (Reiniciar o serviço automaticamente)
Write-Host "Configurando políticas de recuperação em falha..." -ForegroundColor Green
sc.exe failure $serviceName reset= 86400 actions= restart/60000/restart/60000/restart/60000

# Copia diretório XMRig para a pasta executável se disponível
$xmrigSource = Join-Path $PSScriptRoot "..\xmrig"
$xmrigDest = Join-Path (Split-Path $binaryPath) "xmrig"
if (Test-Path $xmrigSource) {
    if (-not (Test-Path $xmrigDest)) {
        Write-Host "Copiando binários do XMRig para a pasta de publicação..." -ForegroundColor Green
        Copy-Item -Path $xmrigSource -Destination $xmrigDest -Recurse -Force
    }
} else {
    Write-Warning "XMRig não encontrado em '$xmrigSource'. Lembre-se de baixar o XMRig e salvá-lo na pasta '$xmrigDest\xmrig.exe'!"
}

# Inicia o serviço
Write-Host "Iniciando o serviço '$serviceName'..." -ForegroundColor Green
Start-Service -Name $serviceName

$status = (Get-Service -Name $serviceName).Status
if ($status -eq "Running") {
    Write-Host "--------------------------------------------------------" -ForegroundColor Green
    Write-Host " SUCESSO: MinerHub Agent instalado e rodando!" -ForegroundColor Green
    Write-Host " Nome do Serviço: $serviceName" -ForegroundColor Green
    Write-Host " Status Atual: $status" -ForegroundColor Green
    Write-Host "--------------------------------------------------------" -ForegroundColor Green
} else {
    Write-Warning "O serviço foi instalado, mas seu status atual é: $status."
    Write-Warning "Verifique os logs do Windows Event Viewer em 'Application' para conferir eventuais falhas de inicialização."
}
