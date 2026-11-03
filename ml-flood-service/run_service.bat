@echo off
echo ========================================================
echo Starting ResQLink AI Flood Prediction Microservice...
echo FastAPI Server on http://127.0.0.1:8000
echo ========================================================
cd "%~dp0service"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
