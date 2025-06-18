#!/bin/bash

echo "🚀 Deploying AcademiChain to Netlify..."

# Build the project
echo "📦 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🌐 To deploy to Netlify:"
    echo "1. Go to https://app.netlify.com"
    echo "2. Click 'Add new site' > 'Deploy manually'"
    echo "3. Drag and drop the 'dist' folder"
    echo "4. Set your site name to 'academichain'"
    echo ""
    echo "🔗 Or use Netlify CLI:"
    echo "npm install -g netlify-cli"
    echo "netlify deploy --prod --dir=dist"
    echo ""
    echo "📁 Your built files are in the 'dist' directory"
else
    echo "❌ Build failed!"
    exit 1
fi 