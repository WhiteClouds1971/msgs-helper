#!/bin/bash
set -e

# 部署脚本（prod）—— 前端出 dist，后端打 jar 并以 prod profile 常驻后台
#
#   ./build.sh
#
# 本项目只有 dev / prod 两套环境：dev 是本地调试，走 ./start-dev.sh；
# 这里一律按 prod 来（前端 --mode prod → .env.prod，后端 --spring.profiles.active=prod）。
# 重复执行即重启后端：先停掉上一次拉起的进程，再起新的。

cd "$(dirname "$0")"

PID_FILE=server/server.pid
LOG_FILE=server/logs/server.log

git pull
npm install
npm run build -- --mode prod

# 后端：打成可执行 jar。跳过单测——这是部署脚本，不等测试跑完
./server/mvnw -f server/pom.xml -B -DskipTests clean package
JAR=$(ls server/target/*.jar | head -1)

# 停掉上一次由本脚本拉起的进程（没有 pid 文件 / 进程已不在，就跳过）
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  OLD_PID=$(cat "$PID_FILE")
  echo "停止上一次的后端进程 $OLD_PID"
  kill "$OLD_PID"
  # 给它最多 10 秒优雅退出（Tomcat 要释放 8081），超时就强杀
  for _ in $(seq 10); do
    kill -0 "$OLD_PID" 2>/dev/null || break
    sleep 1
  done
  kill -9 "$OLD_PID" 2>/dev/null || true
fi

mkdir -p server/logs
nohup java -jar "$JAR" --spring.profiles.active=prod > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "前端产物: dist/"
echo "后端已启动: pid $(cat "$PID_FILE")，profile=prod，日志 $LOG_FILE"
echo "停止后端: kill \$(cat $PID_FILE)"
