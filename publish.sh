ssh root@v2ray "cd nomisma-backend && \
git pull origin master && \
docker rm -f nomisma || true && \
docker rmi nomisma || true && \
docker build -t nomisma . && \
docker run -d --name nomisma  -e NODE_ENV=production -v /root/logs/nomisma:/app/logs -v /root/tasks.json:/app/schedule/tasks.json -p 3007:3000 nomisma"
