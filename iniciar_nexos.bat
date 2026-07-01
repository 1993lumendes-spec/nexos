@echo off
title Nexos RS - Inicializador de Investigacao
echo ====================================================
echo   INICIANDO BANCO DE DADOS E INTERFACE DO NEXOS RS
echo ====================================================
echo.
echo 1. Iniciando Servidor de Banco de Dados Local (Porta 5181)...
start "Servidor Nexos - Banco Local" cmd /c "node server.js"
echo.
echo 2. Iniciando Interface de Usuario Vite (Porta 5180)...
start "Vite Frontend - Nexos" cmd /c "npm.cmd run dev"
echo.
echo ====================================================
echo   SISTEMA PRONTO. ACESSE NO NAVEGADOR:
echo   http://localhost:5180
echo ====================================================
echo.
timeout /t 5
