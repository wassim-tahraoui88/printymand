#!/bin/bash

echo "Starting frontend..."
cd ../frontend && npm install && npm run build && npm run start