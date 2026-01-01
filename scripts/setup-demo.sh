#!/bin/bash
# Demo Setup Script
# Run this script to set up the demo environment

set -e

echo "================================="
echo "Deye LLM Ops - Demo Setup"
echo "================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.demo.example..."
    cp .env.demo.example .env
    echo "Please edit .env with your database credentials before continuing."
    echo ""
    echo "Required settings:"
    echo "  - DATABASE_URL: PostgreSQL connection string"
    echo "  - AUTH_SECRET: Generate with: openssl rand -base64 32"
    echo ""
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Push database schema
echo ""
echo "Pushing database schema..."
pnpm db:push

# Seed demo data
echo ""
echo "Seeding demo data..."
pnpm db:seed:demo

echo ""
echo "================================="
echo "Demo setup complete!"
echo "================================="
echo ""
echo "Start the development server with:"
echo "  pnpm dev"
echo ""
echo "Then open http://localhost:12138"
echo ""
echo "Demo credentials:"
echo "  Admin:  demo@example.com / DemoPassword123!"
echo "  Viewer: viewer@example.com / ViewerPass123!"
echo ""
