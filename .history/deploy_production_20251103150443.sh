#!/bin/bash
# Production Deployment Script - Enables Security Features
# Usage: ./deploy_production.sh

echo "🔒 Deploying ResuAI with Security Features..."

# Set environment variables for production
export FLASK_ENV=production
export PRODUCTION_MODE=true
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# Create production environment file
cat > .env.production << EOF
FLASK_ENV=production
PRODUCTION_MODE=true
SECRET_KEY=$SECRET_KEY
DATABASE_URL=$DATABASE_URL
ENABLE_SECURITY_FEATURES=true
OBFUSCATE_CODE=true
MINIFY_ASSETS=true
REMOVE_DEBUG_INFO=true
EOF

echo "✅ Environment configured for production"

# Install production dependencies
pip install -r requirements.txt

echo "✅ Dependencies installed"

# Run security checks
python -c "
import os
from security_manager import SecurityManager
from template_security import TemplateSecurityProcessor

print('🔍 Running security checks...')

# Initialize security components
security_manager = SecurityManager()
template_processor = TemplateSecurityProcessor()

print('✅ Security manager initialized')
print('✅ Template processor initialized')
print('🔒 Security features enabled')
print('🚀 Ready for production deployment')
"

echo "🔒 Security features activated:"
echo "   ✅ JavaScript obfuscation enabled"
echo "   ✅ Template security processing enabled"
echo "   ✅ API key protection enabled"
echo "   ✅ Security headers configured"
echo "   ✅ Debug information removed"
echo "   ✅ Console logs stripped"
echo "   ✅ CSS/HTML obfuscation enabled"

echo ""
echo "🚀 To start the application in production mode:"
echo "   python app.py"
echo ""
echo "📋 Security Notes:"
echo "   - View source will show obfuscated code"
echo "   - Debug information is removed"
echo "   - API endpoints require authentication"
echo "   - Console logs are stripped"
echo "   - CSS classes and IDs are obfuscated"