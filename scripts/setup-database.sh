#!/bin/bash

echo "Setting up LINE to Google Drive Database..."

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
    echo "Error: PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Database configuration
DB_NAME="line_drive_db"
DB_USER=${DB_USER:-"postgres"}

# Check if database exists
if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Database $DB_NAME already exists."
    read -p "Do you want to drop and recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
    else
        echo "Applying schema to existing database..."
    fi
fi

# Create database if it doesn't exist
echo "Creating database..."
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

# Apply schema
echo "Applying database schema..."
psql -U $DB_USER -d $DB_NAME < database/schema.sql

echo "Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and update with your database credentials"
echo "2. Update the following in .env:"
echo "   - DB_NAME=$DB_NAME"
echo "   - DB_USER=$DB_USER"
echo "   - DB_PASSWORD=<your password>"