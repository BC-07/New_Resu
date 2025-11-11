"""
Template Security Processor - Secures and obfuscates template output
"""
import re
import hashlib
import random
import string
from flask import current_app


class TemplateSecurityProcessor:
    """Processes templates to remove sensitive information and obfuscate code"""
    
    def __init__(self):
        self.class_map = {}
        self.id_map = {}
        self.js_var_map = {}
        
    def process_template(self, html_content, production_mode=True):
        """Process template for security and obfuscation"""
        if not production_mode:
            return html_content
        
        # Remove debug information
        html_content = self._remove_debug_info(html_content)
        
        # Obfuscate CSS classes and IDs
        html_content = self._obfuscate_selectors(html_content)
        
        # Remove sensitive comments
        html_content = self._remove_sensitive_comments(html_content)
        
        # Minify inline JavaScript
        html_content = self._process_inline_js(html_content)
        
        # Add decoy elements
        html_content = self._add_decoy_elements(html_content)
        
        return html_content
    
    def _remove_debug_info(self, html_content):
        """Remove debug information from HTML"""
        # Remove data-debug attributes
        html_content = re.sub(r'\s*data-debug="[^"]*"', '', html_content)
        
        # Remove data-section attributes that expose internal structure
        html_content = re.sub(r'\s*data-section="([^"]*)"', r' data-s="\1"', html_content)
        
        # Remove data-help attributes
        html_content = re.sub(r'\s*data-help="[^"]*"', '', html_content)
        
        # Remove console.log statements from inline scripts
        html_content = re.sub(
            r'console\.(log|error|warn|debug)\([^)]*\);?',
            '',
            html_content,
            flags=re.IGNORECASE
        )
        
        return html_content
    
    def _obfuscate_selectors(self, html_content):
        """Obfuscate CSS classes and IDs"""
        # Find all class names
        class_pattern = r'class="([^"]*)"'
        classes = re.findall(class_pattern, html_content)
        
        for class_list in classes:
            for class_name in class_list.split():
                if class_name not in self.class_map and not self._is_framework_class(class_name):
                    self.class_map[class_name] = self._generate_obfuscated_name('c')
        
        # Find all IDs
        id_pattern = r'id="([^"]*)"'
        ids = re.findall(id_pattern, html_content)
        
        for id_name in ids:
            if id_name not in self.id_map and not self._is_framework_id(id_name):
                self.id_map[id_name] = self._generate_obfuscated_name('i')
        
        # Replace classes
        for original, obfuscated in self.class_map.items():
            html_content = html_content.replace(f'class="{original}"', f'class="{obfuscated}"')
            html_content = html_content.replace(f'class="{original} ', f'class="{obfuscated} ')
            html_content = html_content.replace(f' {original}"', f' {obfuscated}"')
            html_content = html_content.replace(f' {original} ', f' {obfuscated} ')
        
        # Replace IDs (more carefully to avoid breaking JavaScript)
        for original, obfuscated in self.id_map.items():
            # Only replace in HTML attributes, not in JavaScript
            html_content = re.sub(
                f'id="{re.escape(original)}"',
                f'id="{obfuscated}"',
                html_content
            )
        
        return html_content
    
    def _is_framework_class(self, class_name):
        """Check if a class name belongs to a CSS framework (don't obfuscate)"""
        framework_prefixes = [
            'btn', 'col', 'row', 'container', 'navbar', 'nav-', 'card',
            'form', 'input', 'alert', 'badge', 'modal', 'dropdown',
            'fa-', 'fas', 'far', 'fab', 'text-', 'bg-', 'd-', 'p-', 'm-',
            'border', 'rounded', 'shadow', 'position-', 'w-', 'h-'
        ]
        
        return any(class_name.startswith(prefix) for prefix in framework_prefixes)
    
    def _is_framework_id(self, id_name):
        """Check if an ID belongs to a framework or should not be obfuscated"""
        # Don't obfuscate common framework IDs or those needed by external libraries
        framework_ids = [
            'navbarNav', 'offcanvasNav', 'toast-container'
        ]
        
        return id_name in framework_ids
    
    def _generate_obfuscated_name(self, prefix='x'):
        """Generate an obfuscated name"""
        # Generate a short, random identifier
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        return f"{prefix}{suffix}"
    
    def _remove_sensitive_comments(self, html_content):
        """Remove comments that might expose system architecture"""
        # Remove HTML comments
        html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)
        
        # Remove specific comment patterns that expose structure
        sensitive_patterns = [
            r'//.*?module',
            r'//.*?section',
            r'//.*?API',
            r'//.*?endpoint',
            r'/\*.*?\*/',
        ]
        
        for pattern in sensitive_patterns:
            html_content = re.sub(pattern, '', html_content, flags=re.DOTALL | re.IGNORECASE)
        
        return html_content
    
    def _process_inline_js(self, html_content):
        """Process inline JavaScript for security"""
        # Find script tags and process their content
        script_pattern = r'<script(?:[^>]*)>(.*?)</script>'
        
        def process_script(match):
            script_content = match.group(1)
            
            # Remove debug statements
            script_content = re.sub(
                r'console\.(log|error|warn|debug)\([^)]*\);?',
                '',
                script_content,
                flags=re.IGNORECASE
            )
            
            # Obfuscate variable names in inline scripts
            script_content = self._obfuscate_inline_variables(script_content)
            
            # Basic minification
            script_content = self._minify_js(script_content)
            
            return f'<script{match.group(0)[7:match.group(0).find(">")]}>{script_content}</script>'
        
        return re.sub(script_pattern, process_script, html_content, flags=re.DOTALL)
    
    def _obfuscate_inline_variables(self, js_content):
        """Obfuscate variable names in inline JavaScript"""
        # Common variable names to obfuscate
        var_patterns = {
            'selectedJobId': self._generate_obfuscated_name('v'),
            'uploadModule': self._generate_obfuscated_name('m'),
            'jobPostings': self._generate_obfuscated_name('j'),
            'candidateData': self._generate_obfuscated_name('c'),
        }
        
        for original, obfuscated in var_patterns.items():
            js_content = js_content.replace(original, obfuscated)
        
        return js_content
    
    def _minify_js(self, js_content):
        """Basic JavaScript minification"""
        # Remove extra whitespace
        js_content = re.sub(r'\s+', ' ', js_content)
        
        # Remove unnecessary semicolons
        js_content = re.sub(r';\s*}', '}', js_content)
        
        return js_content.strip()
    
    def _add_decoy_elements(self, html_content):
        """Add decoy elements to confuse automated analysis"""
        decoys = [
            '<!-- Generated with Advanced Security Framework -->',
            '<meta name="generator" content="Custom Enterprise Solution">',
            '<!-- Security: Level 5 Obfuscation Active -->',
        ]
        
        # Insert decoys in head section
        head_end = html_content.find('</head>')
        if head_end != -1:
            decoy_html = '\n    '.join(decoys)
            html_content = html_content[:head_end] + f'\n    {decoy_html}\n' + html_content[head_end:]
        
        return html_content


# Global template processor instance
template_processor = TemplateSecurityProcessor()