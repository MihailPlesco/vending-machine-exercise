FROM node:17

# Redis
RUN apt-get update && apt-get install -y redis-server
EXPOSE 6379

WORKDIR '/var/www/app'
COPY . /var/www/app
RUN npm install