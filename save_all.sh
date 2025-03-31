#!/bin/bash

# Make the script executable
chmod +x "$0"

# Save all files
echo "Saving all files..."
git add .
git commit -m "Save all files"
git push

echo "Files saved successfully!" 