#!/bin/bash

echo "🚀 Iniciando deploy do Agendamento App..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para logs coloridos
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado!"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose não está instalado!"
    exit 1
fi

# Parar containers existentes
log_info "Parando containers existentes..."
docker-compose down

# Remover imagens antigas (opcional)
read -p "Deseja remover imagens antigas? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Removendo imagens antigas..."
    docker system prune -f
fi

# Build das imagens
log_info "Fazendo build das imagens..."
docker-compose build --no-cache

# Subir os containers
log_info "Subindo os containers..."
docker-compose up -d

# Verificar status
log_info "Verificando status dos containers..."
docker-compose ps

# Aguardar containers ficarem prontos
log_info "Aguardando containers ficarem prontos..."
sleep 10

# Verificar logs
log_info "Logs do frontend:"
docker-compose logs frontend --tail=10

log_info "Logs do backend:"
docker-compose logs backend --tail=10

log_info "✅ Deploy concluído!"
log_info "🌐 Frontend disponível em: http://localhost"
log_info "🔧 Backend disponível em: http://localhost:8080"
log_info "📊 Para ver logs: docker-compose logs -f"
log_info "⛔ Para parar: docker-compose down"
