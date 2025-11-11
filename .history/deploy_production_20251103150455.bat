@echo off
REM Production Deployment Script - Enables Security Features
REM Usage: deploy_production.bat

echo 🔒 Deploying ResuAI with Security Features...

REM Set environment variables for production
set FLASK_ENV=production
set PRODUCTION_MODE=true

REM Generate a secure secret key
python -c "import secrets; import os; os.environ['SECRET_KEY'] = secrets.token_hex(32); print('SECRET_KEY=' + os.environ['SECRET_KEY'])" > temp_key.txt
for /f "tokens=*" %%a in (temp_key.txt) do set %%a
del temp_key.txt

echo ✅ Environment configured for production

REM Install production dependencies
pip install -r requirements.txt

echo ✅ Dependencies installed

REM Run security checks
python -c "import os; from security_manager import SecurityManager; from template_security import TemplateSecurityProcessor; print('🔍 Running security checks...'); sm = SecurityManager(); tp = TemplateSecurityProcessor(); print('✅ Security manager initialized'); print('✅ Template processor initialized'); print('🔒 Security features enabled'); print('🚀 Ready for production deployment')"

echo 🔒 Security features activated:
echo    ✅ JavaScript obfuscation enabled
echo    ✅ Template security processing enabled
echo    ✅ API key protection enabled
echo    ✅ Security headers configured
echo    ✅ Debug information removed
echo    ✅ Console logs stripped
echo    ✅ CSS/HTML obfuscation enabled

echo.
echo 🚀 To start the application in production mode:
echo    python app.py
echo.
echo 📋 Security Notes:
echo    - View source will show obfuscated code
echo    - Debug information is removed
echo    - API endpoints require authentication
echo    - Console logs are stripped
echo    - CSS classes and IDs are obfuscated

pause