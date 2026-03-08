#!/bin/bash

# Script to toggle authentication on/off

if [ -f "src/app/layout.tsx.with-auth" ]; then
    echo "Enabling authentication..."
    mv src/app/layout.tsx src/app/layout.tsx.no-auth
    mv src/app/layout.tsx.with-auth src/app/layout.tsx
    echo "✅ Authentication enabled"
else
    echo "Disabling authentication..."
    mv src/app/layout.tsx src/app/layout.tsx.with-auth
    mv src/app/layout-temp-no-auth.tsx src/app/layout.tsx
    echo "✅ Authentication disabled (temporary)"
    echo "⚠️  Remember to enable it after setting up Clerk!"
fi
