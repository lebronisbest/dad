#!/bin/bash

echo "========================================"
echo "안전기술보고서 관리 시스템 시작"
echo "========================================"
echo ""

echo "React 앱과 백엔드 서버를 동시에 시작합니다..."
echo ""

# React 개발 서버 시작
echo "[1/2] React 개발 서버 시작 중..."
gnome-terminal --title="React Dev Server" -- bash -c "npm run react:dev; exec bash" 2>/dev/null || \
xterm -title "React Dev Server" -e "npm run react:dev; exec bash" 2>/dev/null || \
konsole --title "React Dev Server" -e bash -c "npm run react:dev; exec bash" 2>/dev/null || \
echo "터미널 에뮬레이터를 찾을 수 없습니다. 수동으로 실행해주세요."

# 잠시 대기
sleep 2

# 백엔드 서버 시작
echo "[2/2] 백엔드 서버 시작 중..."
gnome-terminal --title="Backend Server" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -title "Backend Server" -e "npm run dev; exec bash" 2>/dev/null || \
konsole --title "Backend Server" -e bash -c "npm run dev; exec bash" 2>/dev/null || \
echo "터미널 에뮬레이터를 찾을 수 없습니다. 수동으로 실행해주세요."

echo ""
echo "========================================"
echo "서버 시작 완료!"
echo "========================================"
echo ""
echo "React 앱: http://localhost:3000"
echo "백엔드 서버: http://localhost:5000"
echo ""
echo "각 서버를 중지하려면 해당 터미널 창을 닫으세요."
echo ""
read -p "아무 키나 누르면 이 창이 닫힙니다..."
