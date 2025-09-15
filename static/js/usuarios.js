// Variables globales
let currentUserData = null;

// Funciones para modales
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        const modals = document.getElementsByClassName('modal');
        for (let modal of modals) {
            modal.style.display = 'none';
        }
    }
}

// Función para abrir modal de edición
async function openEditModal(userId) {
    try {
        const response = await fetch(`/usuarios/datos/${userId}`);
        if (!response.ok) {
            throw new Error('Error al obtener datos del usuario');
        }
        
        const user = await response.json();
        
        if (user.error) {
            alert(user.error);
            return;
        }
        
        // Llenar el formulario de edición
        document.getElementById('edit_user_id').value = user.id;
        document.getElementById('edit_usuario').value = user.usuario;
        document.getElementById('edit_correo').value = user.correo;
        document.getElementById('edit_cargo').value = user.cargo;
        
        // Abrir modal
        openModal('editUserModal');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos del usuario');
    }
}

// Función para confirmar eliminación
function confirmDelete(userId, username) {
    // No permitir eliminar el propio usuario
    if (userId === parseInt(document.body.getAttribute('data-user-id'))) {
        alert('No puede eliminar su propio usuario');
        return;
    }
    
    document.getElementById('delete_user_id').value = userId;
    document.getElementById('deleteConfirmMessage').textContent = 
        `¿Está seguro de que desea eliminar al usuario "${username}"?`;
    
    openModal('deleteConfirmModal');
}

// Validación del formulario de edición
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editUserForm');
    
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            if (!validateEditForm(this)) {
                e.preventDefault();
            }
        });
    }
    
    // Configurar búsqueda
    setupSearch();
    
    // Auto-ocultar mensajes flash
    const flashMessages = document.querySelectorAll('.flash');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transition = 'opacity 0.5s';
            setTimeout(() => message.remove(), 500);
        }, 5000);
    });
});

function validateEditForm(form) {
    const correo = form.querySelector('[name="correo"]').value.trim();
    const cargo = form.querySelector('[name="cargo"]').value;
    
    // Validar campos obligatorios
    if (!correo || !cargo) {
        alert('Todos los campos son obligatorios');
        return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        alert('Por favor, ingrese un correo electrónico válido');
        return false;
    }
    
    return true;
}

// Funcionalidad de búsqueda
function setupSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar usuarios...';
    searchInput.style.marginBottom = '15px';
    searchInput.style.padding = '8px';
    searchInput.style.width = '100%';
    searchInput.style.border = '1px solid #ddd';
    searchInput.style.borderRadius = '4px';
    
    const tableContainer = document.querySelector('.table-container');
    const table = document.getElementById('usersTable');
    
    if (table && tableContainer) {
        tableContainer.insertBefore(searchInput, table);
        
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchText) ? '' : 'none';
            });
        });
    }
}

// Ordenamiento de tabla
function setupSorting() {
    const table = document.getElementById('usersTable');
    if (!table) return;
    
    const headers = table.querySelectorAll('th');
    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            sortTable(index);
        });
    });
}

function sortTable(columnIndex) {
    const table = document.getElementById('usersTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const isAscending = table.getAttribute('data-sort-direction') === 'asc';
    const newDirection = isAscending ? 'desc' : 'asc';
    
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        // Verificar si son números
        const aNum = !isNaN(aValue) && aValue !== '' ? parseFloat(aValue) : null;
        const bNum = !isNaN(bValue) && bValue !== '' ? parseFloat(bValue) : null;
        
        let comparison = 0;
        
        if (aNum !== null && bNum !== null) {
            comparison = aNum - bNum;
        } else {
            // Comparación de texto
            comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
        }
        
        return isAscending ? comparison : -comparison;
    });
    
    // Remover filas existentes
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Agregar filas ordenadas
    rows.forEach(row => tbody.appendChild(row));
    
    // Actualizar indicador de dirección
    table.setAttribute('data-sort-direction', newDirection);
    
    // Actualizar indicadores visuales en los headers
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
        header.textContent = header.textContent.replace(' ↑', '').replace(' ↓', '');
    });
    
    const currentHeader = headers[columnIndex];
    currentHeader.textContent += newDirection === 'asc' ? ' ↑' : ' ↓';
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    setupSorting();
    
    // Agregar atributo de ID de usuario al body para referencia
    document.body.setAttribute('data-user-id', '{{ session.user_id }}');
});