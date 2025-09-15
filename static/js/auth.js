// Funciones para autenticación
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.parentElement.querySelector('.toggle-password');
    
    if (field.type === 'password') {
        field.type = 'text';
        button.style.backgroundColor = '#e0e0e0';
    } else {
        field.type = 'password';
        button.style.backgroundColor = 'transparent';
    }
}

// Validación de formulario de registro
function validateForm() {
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const role = document.getElementById('role');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const registerBtn = document.getElementById('registerBtn');
    
    const allFieldsFilled = username.value && email.value && role.value && password.value && confirmPassword.value;
    const passwordValid = validatePassword();
    
    registerBtn.disabled = !(allFieldsFilled && passwordValid);
}

// Validación de contraseña
function validatePassword() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const strengthIndicator = document.getElementById('passwordStrength');
    const matchIndicator = document.getElementById('passwordMatch');
    const registerBtn = document.getElementById('registerBtn');
    const recoveryBtn = document.getElementById('recoveryBtn');
    
    if (!password) return false;
    
    const passValue = password.value;
    const confirmValue = confirmPassword ? confirmPassword.value : '';
    
    // Validar requisitos
    const hasLength = passValue.length >= 8;
    const hasUppercase = /[A-Z]/.test(passValue);
    const hasLowercase = /[a-z]/.test(passValue);
    const hasNumber = /[0-9]/.test(passValue);
    
    // Actualizar indicadores visuales
    updateRequirement('reqLength', hasLength);
    updateRequirement('reqUppercase', hasUppercase);
    updateRequirement('reqLowercase', hasLowercase);
    updateRequirement('reqNumber', hasNumber);
    
    // Validar fortaleza
    let strength = 0;
    let strengthText = '';
    let strengthClass = '';
    
    if (hasLength) strength++;
    if (hasUppercase) strength++;
    if (hasLowercase) strength++;
    if (hasNumber) strength++;
    
    if (strength === 0) {
        strengthText = '';
        strengthClass = '';
    } else if (strength === 1) {
        strengthText = 'Muy débil';
        strengthClass = 'weak';
    } else if (strength === 2) {
        strengthText = 'Débil';
        strengthClass = 'weak';
    } else if (strength === 3) {
        strengthText = 'Moderada';
        strengthClass = 'moderate';
    } else {
        strengthText = 'Fuerte';
        strengthClass = 'strong';
    }
    
    if (strengthIndicator) {
        strengthIndicator.textContent = strengthText;
        strengthIndicator.className = `password-strength ${strengthClass}`;
    }
    
    // Validar coincidencia
    let passwordsMatch = true;
    if (confirmPassword) {
        passwordsMatch = passValue === confirmValue && passValue !== '';
        if (matchIndicator) {
            if (passValue && confirmValue) {
                matchIndicator.textContent = passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden';
                matchIndicator.className = `password-match ${passwordsMatch ? 'match' : 'mismatch'}`;
            } else {
                matchIndicator.textContent = '';
            }
        }
    }
    
    // Habilitar/deshabilitar botones
    const isValid = hasLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;
    
    if (registerBtn) {
        registerBtn.disabled = !isValid;
    }
    
    if (recoveryBtn) {
        recoveryBtn.disabled = !isValid;
    }
    
    return isValid;
}

function updateRequirement(elementId, isValid) {
    const element = document.getElementById(elementId);
    if (element) {
        element.className = isValid ? 'valid' : 'invalid';
    }
}

// Reenviar código de recuperación
function resendCode() {
    // Esta función necesitaría una implementación backend específica
    alert('Solicitando nuevo código de verificación...');
    // En una implementación real, harías una petición AJAX al servidor
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar validación en tiempo real
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        field.addEventListener('input', validatePassword);
    });
    
    // Configurar validación para otros campos
    const textFields = document.querySelectorAll('input[type="text"], input[type="email"], select');
    textFields.forEach(field => {
        field.addEventListener('input', validateForm);
    });
    
    // Auto-ocultar mensajes flash después de 5 segundos
    const flashMessages = document.querySelectorAll('.flash');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transition = 'opacity 0.5s';
            setTimeout(() => message.remove(), 500);
        }, 5000);
    });
});