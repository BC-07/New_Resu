"""
Security Manager - Handles application security and obfuscation
"""
import hashlib
import base64
import json
import random
import string
from datetime import datetime, timedelta
from functools import wraps
from flask import request, session, current_app, g


class SecurityManager:
    """Manages application security and code obfuscation"""
    
    def __init__(self):
        self.obfuscation_salt = self._generate_salt()
        self.api_keys = {}
        self.session_tokens = {}
        
    def _generate_salt(self):
        """Generate a random salt for obfuscation"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    
    def obfuscate_js_variables(self, js_content):
        """Obfuscate JavaScript variable names"""
        # Map of original names to obfuscated names
        obfuscation_map = {
            'UploadModule': self._obfuscate_name('UploadModule'),
            'NavigationModule': self._obfuscate_name('NavigationModule'),
            'CandidatesModule': self._obfuscate_name('CandidatesModule'),
            'DashboardModule': self._obfuscate_name('DashboardModule'),
            'loadJobPostings': self._obfuscate_name('loadJobPostings'),
            'selectedJobId': self._obfuscate_name('selectedJobId'),
            'uploadFiles': self._obfuscate_name('uploadFiles'),
            'processResults': self._obfuscate_name('processResults'),
            'console.log': 'void 0;//',  # Remove debug logs in production
            'console.error': 'void 0;//',
            'console.warn': 'void 0;//',
            'debugCheckElements': self._obfuscate_name('debugCheckElements')
        }
        
        obfuscated_content = js_content
        for original, obfuscated in obfuscation_map.items():
            obfuscated_content = obfuscated_content.replace(original, obfuscated)
        
        return obfuscated_content
    
    def _obfuscate_name(self, name):
        """Generate an obfuscated name for a variable/function"""
        # Create a hash-based obfuscated name
        hash_input = f"{name}{self.obfuscation_salt}".encode()
        hash_obj = hashlib.md5(hash_input)
        hash_hex = hash_obj.hexdigest()
        
        # Generate a valid JavaScript identifier
        obfuscated = '_' + ''.join(c for c in hash_hex[:8] if c.isalnum())
        return obfuscated
    
    def minify_js(self, js_content):
        """Basic JavaScript minification"""
        # Remove comments
        lines = js_content.split('\n')
        minified_lines = []
        
        for line in lines:
            # Remove single-line comments (but keep URLs)
            if '//' in line and 'http' not in line.lower():
                line = line.split('//')[0]
            
            # Remove extra whitespace
            line = line.strip()
            if line:
                minified_lines.append(line)
        
        # Join with minimal spacing
        return ' '.join(minified_lines)
    
    def generate_dynamic_api_key(self, user_id=None):
        """Generate a temporary API key for secure requests"""
        timestamp = datetime.now().timestamp()
        key_data = f"{user_id or 'anonymous'}:{timestamp}:{self.obfuscation_salt}"
        api_key = base64.b64encode(key_data.encode()).decode()
        
        # Store with expiration
        self.api_keys[api_key] = {
            'user_id': user_id,
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=1)
        }
        
        return api_key
    
    def validate_api_key(self, api_key):
        """Validate an API key"""
        if api_key not in self.api_keys:
            return False
        
        key_info = self.api_keys[api_key]
        if datetime.now() > key_info['expires']:
            del self.api_keys[api_key]
            return False
        
        return True
    
    def create_secure_session_token(self):
        """Create a secure session token"""
        token = ''.join(random.choices(string.ascii_letters + string.digits, k=64))
        self.session_tokens[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }
        return token
    
    def clean_html_comments(self, html_content):
        """Remove HTML comments that might expose system information"""
        import re
        # Remove HTML comments
        html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)
        
        # Remove data attributes that might expose internal info
        html_content = re.sub(r'data-debug="[^"]*"', '', html_content)
        html_content = re.sub(r'data-internal="[^"]*"', '', html_content)
        
        return html_content
    
    def add_security_headers(self, response):
        """Add security headers to responses"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdnjs.cloudflare.com; "
            "font-src 'self' cdnjs.cloudflare.com; "
            "img-src 'self' data:; "
            "connect-src 'self';"
        )
        
        # Remove server information
        if 'Server' in response.headers:
            del response.headers['Server']
        
        # Add custom headers to confuse automated scanners
        response.headers['X-Powered-By'] = 'Unknown'
        response.headers['X-Technology'] = 'Proprietary'
        
        return response


# Decorator for API endpoint protection
def require_api_key(f):
    """Decorator to require API key for endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
        
        if not api_key:
            return jsonify({'error': 'API key required', 'code': 'AUTH_001'}), 401
        
        security_manager = getattr(g, 'security_manager', None)
        if not security_manager or not security_manager.validate_api_key(api_key):
            return jsonify({'error': 'Invalid API key', 'code': 'AUTH_002'}), 401
        
        return f(*args, **kwargs)
    return decorated_function


def obfuscate_response_data(data):
    """Obfuscate sensitive data in API responses"""
    if isinstance(data, dict):
        obfuscated = {}
        for key, value in data.items():
            # Obfuscate sensitive field names
            if key in ['password', 'secret', 'key', 'token']:
                continue  # Skip sensitive fields
            
            # Obfuscate database field names
            new_key = key
            if key in ['id', 'user_id', 'created_at', 'updated_at']:
                new_key = f"_{hashlib.md5(key.encode()).hexdigest()[:6]}"
            
            obfuscated[new_key] = obfuscate_response_data(value)
        return obfuscated
    
    elif isinstance(data, list):
        return [obfuscate_response_data(item) for item in data]
    
    return data


# Global security manager instance
security_manager = SecurityManager()