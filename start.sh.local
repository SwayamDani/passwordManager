#!/bin/bash
echo "Starting Password Manager..."

# Start Frontend (Next.js)
osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'/frontend\" && echo \"Starting Frontend at http://localhost:3000\" && npm run dev"'

# Start Backend (FastAPI)
osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'/backend\" && echo \"Starting Backend at http://localhost:8000\" && python3 -m uvicorn main:app --reload"'

echo "Opening browser..."
sleep 5
open http://localhost:3000