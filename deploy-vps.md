# 🚀 Deploy na VPS com Docker

## 📋 Pré-requisitos

### Na sua VPS:
1. **Sistema Operacional**: Ubuntu 20.04+ ou CentOS 7+
2. **Docker**: Versão 20.0+
3. **Docker Compose**: Versão 2.0+
4. **Portas abertas**: 80, 443, 8080
5. **Domínio**: `agendamento.conect365.com` apontando para IP da VPS

## 🔧 Instalação do Docker na VPS

### Ubuntu/Debian:
```bash
# Atualizar sistema
sudo apt update

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

### CentOS/RHEL:
```bash
# Instalar Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 📦 Deploy do Projeto

### 1. Transferir arquivos para VPS

```bash
# Na sua máquina local, copiar projeto para VPS
scp -r . usuario@IP_DA_VPS:/home/usuario/agendamento-app

# Ou usar git clone na VPS
git clone https://github.com/seu-usuario/agendamento-app.git
cd agendamento-app
```

### 2. Configurar ambiente de produção

```bash
# Na VPS, ajustar configurações se necessário
nano docker-compose.yml

# Verificar se backend está configurado corretamente
nano nginx.conf
```

### 3. Executar deploy

```bash
# Na VPS
cd agendamento-app

# Dar permissão ao script (Linux/Mac)
chmod +x deploy.sh

# Executar deploy
./deploy.sh

# Ou executar comandos manualmente:
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 4. Verificar deploy

```bash
# Ver status dos containers
docker-compose ps

# Ver logs
docker-compose logs -f

# Verificar se está funcionando
curl http://localhost
curl http://localhost:8080/api/health
```

## 🌐 Configuração de Domínio e SSL

### 1. Nginx Proxy Manager (Recomendado)

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    restart: unless-stopped

  frontend:
    build: .
    container_name: agendamento-frontend
    ports:
      - "3000:80"  # Mudar porta para não conflitar
    networks:
      - agendamento-network
    restart: unless-stopped
```

### 2. Configurar SSL no Nginx Proxy Manager

1. Acesse `http://IP_DA_VPS:81`
2. Login padrão: `admin@example.com` / `changeme`
3. Adicionar Proxy Host:
   - Domain: `agendamento.conect365.com`
   - Forward to: `frontend:80`
   - SSL: Request Let's Encrypt Certificate

## 📊 Monitoramento

### Comandos úteis:

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver status dos containers
docker-compose ps

# Reiniciar um serviço específico
docker-compose restart frontend

# Parar tudo
docker-compose down

# Reconstruir e subir
docker-compose up -d --build

# Ver uso de recursos
docker stats

# Limpar sistema
docker system prune -f
```

## 🔧 Troubleshooting

### Problemas comuns:

1. **Container não inicia**:
   ```bash
   docker-compose logs nome-do-container
   ```

2. **Erro de permissão**:
   ```bash
   sudo chown -R $USER:$USER .
   ```

3. **Porta em uso**:
   ```bash
   sudo netstat -tulpn | grep :80
   sudo lsof -i :80
   ```

4. **Backend não conecta**:
   - Verificar se backend está no mesmo network
   - Conferir variáveis de ambiente
   - Testar conectividade: `docker exec frontend ping backend`

## 🔄 Atualizações

Para atualizar o projeto:

```bash
# Pull das mudanças
git pull origin main

# Reconstruir e subir
docker-compose up -d --build

# Ou usar o script
./deploy.sh
```

## 🔒 Backup

```bash
# Backup do banco de dados
docker exec agendamento-db pg_dump -U agendamento_user agendamento > backup.sql

# Backup dos volumes
docker run --rm -v agendamento_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/backup.tar.gz -C /data .
```
