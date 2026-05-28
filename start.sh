#!/bin/bash
DIR="/Users/ignacioarbesu/Documents/swapwear"
echo "🚀 SwapWear - Iniciando..."

if ! command -v node &> /dev/null; then
  echo "❌ Node.js no está instalado."
  exit 1
fi
echo "✅ Node.js $(node -v)"

if [ ! -d "$DIR/backend/node_modules" ]; then
  echo "📦 Instalando dependencias del backend..."
  npm install --prefix "$DIR/backend"
fi

if [ ! -d "$DIR/frontend/node_modules" ]; then
  echo "📦 Instalando dependencias del frontend..."
  (cd "$DIR/frontend" && npm install)
fi

echo ""
echo "🌐 Backend:  http://localhost:3001"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Presiona Ctrl+C para detener."
echo "────────────────────────────────"

trap "kill 0" EXIT
node "$DIR/backend/server.js" &
(cd "$DIR/frontend" && npx vite) &
wait
