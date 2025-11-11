"""
Security Toggle Script - Switch between development and production modes
Usage: python security_toggle.py [dev|prod]
"""
import os
import sys


def set_development_mode():
    """Enable development mode - disable security features"""
    print("🔓 Switching to DEVELOPMENT mode...")
    
    # Create development environment file
    with open('.env.local', 'w') as f:
        f.write("""FLASK_ENV=development
PRODUCTION_MODE=false
DEBUG=true
ENABLE_SECURITY_FEATURES=false
OBFUSCATE_CODE=false
MINIFY_ASSETS=false
REMOVE_DEBUG_INFO=false
""")
    
    print("✅ Development mode enabled")
    print("🔧 Security features disabled for debugging:")
    print("   - JavaScript obfuscation: OFF")
    print("   - Template processing: OFF") 
    print("   - API key protection: OFF")
    print("   - Debug removal: OFF")
    print("   - Console logs: VISIBLE")


def set_production_mode():
    """Enable production mode - enable all security features"""
    print("🔒 Switching to PRODUCTION mode...")
    
    # Create production environment file
    with open('.env.local', 'w') as f:
        f.write("""FLASK_ENV=production
PRODUCTION_MODE=true
DEBUG=false
ENABLE_SECURITY_FEATURES=true
OBFUSCATE_CODE=true
MINIFY_ASSETS=true
REMOVE_DEBUG_INFO=true
""")
    
    print("✅ Production mode enabled")
    print("🔒 Security features activated:")
    print("   - JavaScript obfuscation: ON")
    print("   - Template processing: ON")
    print("   - API key protection: ON") 
    print("   - Debug removal: ON")
    print("   - Console logs: STRIPPED")


def show_current_status():
    """Show current security status"""
    print("📊 Current Security Status:")
    
    # Check if .env.local exists
    if os.path.exists('.env.local'):
        with open('.env.local', 'r') as f:
            content = f.read()
            if 'PRODUCTION_MODE=true' in content:
                print("   Mode: 🔒 PRODUCTION (Secured)")
            else:
                print("   Mode: 🔓 DEVELOPMENT (Unsecured)")
    else:
        print("   Mode: ⚠️ UNDEFINED (Default settings)")
    
    print("")
    print("🔧 Available commands:")
    print("   python security_toggle.py dev   - Enable development mode")
    print("   python security_toggle.py prod  - Enable production mode")
    print("   python security_toggle.py status - Show current status")


def main():
    if len(sys.argv) < 2:
        show_current_status()
        return
    
    mode = sys.argv[1].lower()
    
    if mode in ['dev', 'development']:
        set_development_mode()
    elif mode in ['prod', 'production']:
        set_production_mode()
    elif mode in ['status', 'check']:
        show_current_status()
    else:
        print("❌ Invalid option. Use 'dev', 'prod', or 'status'")
        show_current_status()


if __name__ == "__main__":
    main()