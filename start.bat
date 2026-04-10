@echo off
echo Starting GTFS-RT Inspector...
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
pause
