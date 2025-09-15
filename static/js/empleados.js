// Variables globales
let currentEmployeeId = null;
let deleteEmployeeId = null;

// Funciones para modales
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'addEmployeeModal') {
        document.getElementById('addEmployeeForm').reset();
    }
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

// Función para editar empleado
async function editEmployee(id) {
    try {
        const response = await fetch(`/empleados/datos/${id}`);
        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }
        
        // Llenar el formulario de edición
        document.getElementById('edit_id').value = data.id;
        document.getElementById('edit_nombres').value = data.nombres;
        document.getElementById('edit_apellidos').value = data.apellidos;
        document.getElementById('edit_cedula').value = data.cedula;
        document.getElementById('edit_correo').value = data.correo;
        document.getElementById('edit_cargo').value = data.cargo;
        document.getElementById('edit_salario').value = data.salario;
        document.getElementById('edit_fecha_ingreso').value = data.fecha_ingreso;
        document.getElementById('edit_activo').checked = data.activo;
        
        // Actualizar la acción del formulario
        document.getElementById('editEmployeeForm').action = `/empleados/editar/${data.id}`;
        
        // Abrir modal
        openModal('editEmployeeModal');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos del empleado');
    }
}

// Función para eliminar empleado
function deleteEmployee(id) {
    deleteEmployeeId = id;
    openModal('deleteConfirmModal');
}

// Confirmar eliminación
async function confirmDelete() {
    if (!deleteEmployeeId) return;
    
    try {
        const response = await fetch(`/empleados/eliminar/${deleteEmployeeId}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            // Recargar la página para ver los cambios
            location.reload();
        } else {
            alert('Error al eliminar el empleado');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el empleado');
    } finally {
        closeModal('deleteConfirmModal');
        deleteEmployeeId = null;
    }
}

// Validación del formulario
document.addEventListener('DOMContentLoaded', function() {
    const addForm = document.getElementById('addEmployeeForm');
    const editForm = document.getElementById('editEmployeeForm');
    
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
    }
    
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
    }
});

function validateForm(form) {
    const nombres = form.querySelector('[name="nombres"]').value.trim();
    const apellidos = form.querySelector('[name="apellidos"]').value.trim();
    const cedula = form.querySelector('[name="cedula"]').value.trim();
    const correo = form.querySelector('[name="correo"]').value.trim();
    const cargo = form.querySelector('[name="cargo"]').value;
    const salario = form.querySelector('[name="salario"]').value;
    const fechaIngreso = form.querySelector('[name="fecha_ingreso"]').value;
    
    // Validar campos obligatorios
    if (!nombres || !apellidos || !cedula || !correo || !cargo || !salario || !fechaIngreso) {
        alert('Todos los campos son obligatorios');
        return false;
    }
    
    // Validar salario
    if (parseFloat(salario) <= 0) {
        alert('El salario debe ser mayor a 0');
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

// Funcionalidad de búsqueda (opcional)
function setupSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar empleados...';
    searchInput.style.marginBottom = '15px';
    searchInput.style.padding = '8px';
    searchInput.style.width = '100%';
    searchInput.style.border = '1px solid #ddd';
    searchInput.style.borderRadius = '4px';
    
    const tableContainer = document.querySelector('.table-container');
    const table = document.getElementById('employeesTable');
    
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

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    setupSearch();
    
    // Mostrar mensajes flash automáticamente
    const flashMessages = document.querySelectorAll('.flash');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transition = 'opacity 0.5s';
            setTimeout(() => message.remove(), 500);
        }, 5000);
    });
});