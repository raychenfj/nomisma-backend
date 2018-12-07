FROM node:latest

RUN mkdir -p /app
WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN echo > /app/schedule/tasks.json

EXPOSE 3000

CMD ["node", "./bin/www"]
