#!/bin/bash
set -e

# 本地开发：一条命令起前后端，Ctrl-C 一次两个一起停
#
#   前端 http://localhost:9456   （Vite --mode dev → .env.dev，/api 代理到后端）
#   后端 http://127.0.0.1:8081/api （Spring Boot dev profile → 本机 MySQL msgs-helper）
#
# 生产部署不用这个脚本，见 ./build.sh

ROOT="$(cd "$(dirname "$0")" && pwd)"

pids=()

# Ctrl-C / 被 kill 时收摊：两个子进程都停掉再退出
stop() {
  trap - INT TERM EXIT
  echo
  echo "正在停止前后端…"
  for pid in "${pids[@]}"; do
    # Maven 底下还挂着 java，子进程一并收掉，避免只剩 java 占着 8081
    pkill -P "$pid" 2>/dev/null || true
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo "已停止"
}
trap stop INT TERM EXIT

# exec 是关键：子 shell 直接被 mvnw / npm 顶替，$! 就是真正的进程号，
# 否则 kill 掉的是中间那层 shell，java / vite 会变成孤儿继续占着端口
echo "启动后端…"
( cd "$ROOT/server" && exec ./mvnw -B spring-boot:run ) &
pids+=($!)

echo "启动前端…"
( cd "$ROOT" && exec npm run dev ) &
pids+=($!)

wait
