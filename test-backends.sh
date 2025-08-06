#!/bin/bash

echo "Testing backend service availability..."
echo

# Test .NET Auth Service
echo "Testing .NET Auth Service (port 5001):"
if curl -s -f http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ .NET Auth Service is running"
else
    echo "❌ .NET Auth Service is not accessible"
fi

# Test .NET Staff Service
echo "Testing .NET Staff Service (port 5002):"
if curl -s -f http://localhost:5002/health > /dev/null 2>&1; then
    echo "✅ .NET Staff Service is running"
else
    echo "❌ .NET Staff Service is not accessible"
fi

# Test Django Backend
echo "Testing Django Backend (port 8000):"
if curl -s -f http://localhost:8000/api/health/ > /dev/null 2>&1 || curl -s -f http://localhost:8000/admin/ > /dev/null 2>&1; then
    echo "✅ Django Backend is running"
else
    echo "❌ Django Backend is not accessible"
fi

echo
echo "Note: Make sure to start the backend services before testing the frontend."
echo
echo "To start .NET services:"
echo "  cd backend-dotnet && docker-compose up"
echo
echo "To start Django backend:"
echo "  cd backend && python manage.py runserver 8000"
