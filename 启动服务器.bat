@echo off
chcp 65001 >nul
cd /d %~dp0
echo 本地服务器已启动：http://localhost:8770/
echo 旋转展示台： http://localhost:8770/showcase.html
echo 校园角标：   http://localhost:8770/campus.html
echo 太阳系场景： http://localhost:8770/my-scene/index.html
echo 性能实验：   http://localhost:8770/my-scene/perf.html
py -m http.server 8770
pause
