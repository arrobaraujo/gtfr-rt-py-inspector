@echo off
echo Iniciando o GTFS-RT Inspector...
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
pause
