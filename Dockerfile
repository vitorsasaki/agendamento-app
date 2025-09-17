# Estágio 1: Build da aplicação Angular
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli

# Copiar código fonte
COPY . .

# Build da aplicação para produção
RUN ng build --configuration=production

# Estágio 2: Servir com Nginx
FROM nginx:alpine

# Copiar arquivos buildados para o Nginx
COPY --from=build /app/dist/agendamento-front/browser /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
