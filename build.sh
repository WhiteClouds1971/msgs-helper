#!/bin/bash
set -e

# 部署脚本（prod）—— 前端出 dist，后端打 jar 并交给 systemd 常驻
#
#   ./build.sh
#
# 本项目只有 dev / prod 两套环境：dev 是本地调试，走 ./start-dev.sh；
# 这里一律按 prod 来（前端 --mode prod → .env.prod，后端 --spring.profiles.active=prod）。
# 重复执行即重新部署：systemd 会先停掉上一次的进程再起新的。
#
# 部署机上的一次性准备（JDK 21 / Node ≥ 22 / application-prod.yml / systemd 单元 / sudoers），
# 见 README「五、快速开始 → 生产部署」。

cd "$(dirname "$0")"

git pull
npm install
npm run build -- --mode prod

# 后端：打成可执行 jar。跳过单测——这是部署脚本，不等测试跑完
./server/mvnw -f server/pom.xml -B -DskipTests clean package
JAR=$(ls server/target/*.jar | head -1)

# 固定入口软链：systemd 单元里写死 server/app.jar，pom 里改版本号也不用动 unit。
# 链接必须放在 target/ 外面 —— 下次 clean 会把 target 整个删掉。
ln -sfn "target/$(basename "$JAR")" server/app.jar
mkdir -p server/logs

# 重启后端：交给 systemd（开机自启、崩了自动拉起、日志仍写 server/logs/server.log）。
# sudoers 里给了一条窄规则，只允许本账号对本单元做 start / stop / restart / status。
sudo systemctl restart msgs-helper

echo "前端产物: dist/"
echo "后端已由 systemd 拉起（systemctl status msgs-helper），日志 server/logs/server.log"
