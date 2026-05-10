@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo [교과서 바로가기] 서버를 시작합니다...
start "교과서서버" python -m http.server 8080
timeout /t 2 /nobreak > nul
start "" http://localhost:8080
echo.
echo 브라우저가 열렸습니다!
echo 앱을 끝내려면 "교과서서버" 창을 닫으세요.
timeout /t 5 /nobreak > nul
exit
