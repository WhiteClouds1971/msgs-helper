#!/bin/bash
set -e

MODE=${1:-production}

git pull
npm install
npm run build -- --mode "$MODE"
