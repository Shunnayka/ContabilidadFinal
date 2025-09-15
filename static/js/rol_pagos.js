// Variables globales
let empleadosData = [];
let currentRolId = null;

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos de empleados
    loadEmpleadosData();
    
    // Configurar ordenamiento
    setupSorting();
    
    // Configurar búsqueda
    setupSearch();
    
    // Configurar validación de formulario
    setupFormValidation();
});

// Cargar datos de empleados
async function loadEmpleadosData() {
    try {
        const response = await fetch('/empleados/datos');
        if (response.ok) {
            empleadosData = await response.json();
        }
    } catch (error) {
        console.error('Error cargando datos de empleados:', error);
    }
}

// Configurar ordenamiento de la tabla
function setupSorting() {
    const headers = document.querySelectorAll('#rolesTable th');
    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            sortTable(index);
        });
        
        // Agregar indicador visual
        header.innerHTML += ' <span class="sort-indicator">↕</span>';
    });
}

// Ordenar tabla
function sortTable(columnIndex) {
    const table = document.getElementById('rolesTable');
    const tbody = table.querySelector('tbody');
    const headers = table.querySelectorAll('th');
    const sortIndicator = headers[columnIndex].querySelector('.sort-indicator');
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Determinar dirección de ordenamiento
    const currentDirection = table.getAttribute('data-sort-direction') || 'asc';
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    
    // Ordenar filas
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent;
        const bValue = b.cells[columnIndex].textContent;
        
        let comparison = 0;
        
        // Verificar si son valores monetarios
        if (aValue.includes('$') && bValue.includes('$')) {
            const aNum = parseFloat(aValue.replace('$', '').replace(',', ''));
            const bNum = parseFloat(bValue.replace('$', '').replace(',', ''));
            comparison = aNum - bNum;
        } else if (!isNaN(aValue) && !isNaN(bValue)) {
            // Valores numéricos
            comparison = parseFloat(aValue) - parseFloat(bValue);
        } else {
            // Texto
            comparison = aValue.localeCompare(bValue);
        }
        
        return newDirection === 'asc' ? comparison : -comparison;
    });
    
    // Limpiar y reinsertar filas ordenadas
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    rows.forEach(row => tbody.appendChild(row));
    
    // Actualizar indicadores visuales
    headers.forEach(header => {
        const indicator = header.querySelector('.sort-indicator');
        if (indicator) {
            indicator.textContent = ' ↕';
        }
    });
    
    sortIndicator.textContent = newDirection === 'asc' ? ' ↑' : ' ↓';
    table.setAttribute('data-sort-direction', newDirection);
}

// Configurar búsqueda
function setupSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar en roles de pagos...';
    searchInput.style.marginBottom = '15px';
    searchInput.style.padding = '8px';
    searchInput.style.width = '100%';
    searchInput.style.border = '1px solid #ddd';
    searchInput.style.borderRadius = '4px';
    
    const tableContainer = document.querySelector('.table-container');
    const table = document.getElementById('rolesTable');
    
    if (table && tableContainer) {
        tableContainer.insertBefore(searchInput, table);
        
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const rowText = row.textContent.toLowerCase();
                row.style.display = rowText.includes(searchText) ? '' : 'none';
            });
        });
    }
}

// Configurar validación de formulario
function setupFormValidation() {
    const form = document.getElementById('newRolForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!validateRolForm()) {
                e.preventDefault();
            }
        });
    }
}

// Validar formulario de rol
function validateRolForm() {
    const requiredFields = [
        'empleado_id', 'dia', 'mes', 'ano', 'sueldo', 'dias_trabajo'
    ];
    
    for (const field of requiredFields) {
        const element = document.getElementById(field);
        if (!element || !element.value.trim()) {
            alert(`El campo ${field.replace('_', ' ')} es obligatorio`);
            element?.focus();
            return false;
        }
    }
    
    // Validar valores numéricos
    const numericFields = [
        'sueldo', 'dias_trabajo', 'bonificacion', 'transporte',
        'alimentacion', 'num_horas_extras', 'otros_ingresos',
        'prestamos_iess', 'impuesto_renta', 'seguro_privado', 'comisariato'
    ];
    
    for (const field of numericFields) {
        const element = document.getElementById(field);
        if (element && element.value) {
            const value = parseFloat(element.value);
            if (isNaN(value) || value < 0) {
                alert(`El campo ${field.replace('_', ' ')} debe ser un número válido mayor o igual a 0`);
                element.focus();
                return false;
            }
        }
    }
    
    return true;
}

// Filtrar por empleado
function filterByEmpleado() {
    const empleadoId = document.getElementById('empleado').value;
    const mes = document.getElementById('mes').value;
    const ano = document.getElementById('ano').value;
    
    applyFilters(empleadoId, mes, ano);
}

// Filtrar por período
function filterByPeriodo() {
    const empleadoId = document.getElementById('empleado').value;
    const mes = document.getElementById('mes').value;
    const ano = document.getElementById('ano').value;
    
    applyFilters(empleadoId, mes, ano);
}

// Aplicar filtros
function applyFilters(empleadoId, mes, ano) {
    const table = document.getElementById('rolesTable');
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const rowEmpleadoId = row.getAttribute('data-empleado');
        const rowMes = row.cells[2].textContent;
        const rowAno = row.cells[3].textContent;
        
        let show = true;
        
        if (empleadoId && rowEmpleadoId !== empleadoId) {
            show = false;
        }
        
        if (mes && rowMes !== mes) {
            show = false;
        }
        
        if (ano && rowAno !== ano) {
            show = false;
        }
        
        row.style.display = show ? '' : 'none';
    });
}

// Abrir modal para nuevo rol
function openNewRolModal() {
    openModal('newRolModal');
}

// Cargar datos del empleado seleccionado
async function loadEmpleadoData() {
    const empleadoId = document.getElementById('empleado_id').value;
    const empleadoInfo = document.getElementById('empleadoInfo');
    
    if (!empleadoId) {
        empleadoInfo.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`/empleados/datos/${empleadoId}`);
        if (response.ok) {
            const empleado = await response.json();
            
            document.getElementById('empleadoCedula').textContent = `Cédula: ${empleado.cedula}`;
            document.getElementById('empleadoIngreso').textContent = `Fecha de Ingreso: ${empleado.fecha_ingreso}`;
            document.getElementById('empleadoSalario').textContent = `Salario Base: $${empleado.salario.toFixed(2)}`;
            
            // Auto-completar sueldo
            document.getElementById('sueldo').value = empleado.salario.toFixed(2);
            
            empleadoInfo.style.display = 'block';
        }
    } catch (error) {
        console.error('Error cargando datos del empleado:', error);
    }
}

// Calcular totales
function calculateTotals() {
    // Obtener valores del formulario
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const diasTrabajo = parseFloat(document.getElementById('dias_trabajo').value) || 0;
    const bonificacion = parseFloat(document.getElementById('bonificacion').value) || 0;
    const transporte = parseFloat(document.getElementById('transporte').value) || 0;
    const alimentacion = parseFloat(document.getElementById('alimentacion').value) || 0;
    const horasExtras = parseFloat(document.getElementById('num_horas_extras').value) || 0;
    const tipoHoras = document.getElementById('tipo_horas_extras').value;
    const otrosIngresos = parseFloat(document.getElementById('otros_ingresos').value) || 0;
    
    // Calcular valor horas extras
    const salarioHora = sueldo / 240; // 240 horas mensuales
    let valorHorasExtras = 0;
    
    if (tipoHoras === 'Ordinarias') {
        valorHorasExtras = horasExtras * salarioHora * 1.5;
    } else if (tipoHoras === 'Extraordinarias') {
        valorHorasExtras = horasExtras * salarioHora * 2.0;
    }
    
    // Calcular décimos (simplificado)
    const decimoTercero = sueldo / 12;
    const decimoCuarto = 470 / 12; // SBU 2024
    
    // Calcular IESS (9.45%)
    const baseIess = sueldo + bonificacion + valorHorasExtras;
    const iess = baseIess * 0.0945;
    
    // Calcular total ingresos
    const totalIngresos = sueldo + bonificacion + transporte + alimentacion + 
                         decimoTercero + decimoCuarto + valorHorasExtras + otrosIngresos;
    
    // Obtener descuentos
    const prestamosIess = parseFloat(document.getElementById('prestamos_iess').value) || 0;
    const impuestoRenta = parseFloat(document.getElementById('impuesto_renta').value) || 0;
    const seguroPrivado = parseFloat(document.getElementById('seguro_privado').value) || 0;
    const comisariato = parseFloat(document.getElementById('comisariato').value) || 0;
    
    // Calcular total egresos
    const totalEgresos = iess + prestamosIess + impuestoRenta + seguroPrivado + comisariato;
    
    // Calcular líquido a pagar
    const liquidoPagar = totalIngresos - totalEgresos;
    
    // Mostrar resultados
    alert(`Totales calculados:\n
Total Ingresos: $${totalIngresos.toFixed(2)}
Total Egresos: $${totalEgresos.toFixed(2)}
Líquido a Pagar: $${liquidoPagar.toFixed(2)}`);
}

// Ver detalles del rol
async function viewRolDetails(rolId) {
    try {
        const response = await fetch(`/rol_pagos/detalles/${rolId}`);
        if (response.ok) {
            const detalles = await response.json();
            
            const content = document.getElementById('rolDetailsContent');
            content.innerHTML = `
                <div class="rol-details">
                    <h4>${detalles.empleado_nombre}</h4>
                    <p><strong>Período:</strong> ${detalles.mes}/${detalles.ano}</p>
                    
                    <div class="details-section">
                        <h5>Ingresos</h5>
                        <p>Sueldo Base: $${detalles.sueldo.toFixed(2)}</p>
                        <p>Bonificación: $${detalles.bonificacion.toFixed(2)}</p>
                        <p>Transporte: $${detalles.transporte.toFixed(2)}</p>
                        <p>Alimentación: $${detalles.alimentacion.toFixed(2)}</p>
                        <p>Décimo Tercero: $${detalles.decimo_tercero.toFixed(2)}</p>
                        <p>Décimo Cuarto: $${detalles.decimo_cuarto.toFixed(2)}</p>
                        <p>Horas Extras: $${detalles.valor_horas_extras.toFixed(2)}</p>
                        <p><strong>Total Ingresos: $${detalles.total_ingresos.toFixed(2)}</strong></p>
                    </div>
                    
                    <div class="details-section">
                        <h5>Egresos</h5>
                        <p>IESS: $${detalles.iess.toFixed(2)}</p>
                        <p>Préstamos IESS: $${detalles.prestamos_iess.toFixed(2)}</p>
                        <p>Impuesto Renta: $${detalles.impuesto_renta.toFixed(2)}</p>
                        <p>Seguro Privado: $${detalles.seguro_privado.toFixed(2)}</p>
                        <p>Comisariato: $${detalles.comisariato.toFixed(2)}</p>
                        <p><strong>Total Egresos: $${detalles.total_egresos.toFixed(2)}</strong></p>
                    </div>
                    
                    <div class="details-section highlight">
                        <h5>Líquido a Pagar: $${detalles.liquido_pagar.toFixed(2)}</h5>
                    </div>
                </div>
            `;
            
            openModal('viewRolModal');
        }
    } catch (error) {
        console.error('Error cargando detalles del rol:', error);
        alert('Error al cargar los detalles del rol');
    }
}


// Función para editar rol
async function editRol(rolId) {
    try {
        const response = await fetch(`/rol_pagos/detalles/${rolId}`);
        console.log("Respuesta de fetch:", response);
        if (response.ok) {
            const rol = await response.json();
            
            // Llenar el formulario con los datos del rol
            document.getElementById('edit_rol_id').value = rol.id;
            document.getElementById('edit_dia').value = rol.dia;
            document.getElementById('edit_mes').value = rol.mes;
            document.getElementById('edit_ano').value = rol.ano;
            document.getElementById('edit_empleado_id').value = rol.empleado_id;
            document.getElementById('edit_sueldo').value = rol.sueldo;
            document.getElementById('edit_dias_trabajo').value = rol.dias_trabajo;
            document.getElementById('edit_bonificacion').value = rol.bonificacion || 0;
            document.getElementById('edit_transporte').value = rol.transporte || 0;
            document.getElementById('edit_alimentacion').value = rol.alimentacion || 0;
            document.getElementById('edit_num_horas_extras').value = rol.num_horas_extras || 0;
            document.getElementById('edit_tipo_horas_extras').value = rol.tipo_horas_extras || 'Ordinarias';
            document.getElementById('edit_otros_ingresos').value = rol.otros_ingresos || 0;
            document.getElementById('edit_decimo_tercero_cobro').value = rol.decimo_tercero_cobro || 'Mensual';
            document.getElementById('edit_decimo_cuarto_cobro').value = rol.decimo_cuarto_cobro || 'Mensual';
            document.getElementById('edit_prestamos_iess').value = rol.prestamos_iess || 0;
            document.getElementById('edit_impuesto_renta').value = rol.impuesto_renta || 0;
            document.getElementById('edit_seguro_privado').value = rol.seguro_privado || 0;
            document.getElementById('edit_comisariato').value = rol.comisariato || 0;
            
            // Cargar información del empleado
            await loadEmpleadoData();
            
            // Abrir el modal de edición
            openModal('editRolModal');
        } else {
            alert('Error al cargar los datos del rol');
        }
    } catch (error) {
        console.error('Error cargando datos del rol:', error);
        alert('Error al cargar los datos del rol');
    }
}

// Confirmar eliminación de rol
function deleteRol(rolId) {
    document.getElementById('delete_rol_id').value = rolId;
    openModal('deleteConfirmModal');
}

// Exportar a PDF
function exportRolPDF(rolId) {
    // En una implementación real, esto abriría una nueva ventana o descargaría el PDF
    alert(`Generando PDF para el rol ${rolId}...\n\nEn un sistema real, se descargaría el reporte en formato PDF.`);
    
    // window.open(`/rol_pagos/exportar/${rolId}`, '_blank');
}

// Funciones auxiliares para modales
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Validar formulario de rol
function validateRolForm() {
    console.log("Validando formulario...");
    
    const requiredFields = [
        'empleado_id', 'dia', 'mes', 'ano', 'sueldo', 'dias_trabajo'
    ];
    
    for (const field of requiredFields) {
        const element = document.querySelector(`[name="${field}"]`);
        console.log(`Campo ${field}:`, element ? element.value : 'No encontrado');
        
        if (!element || !element.value.trim()) {
            alert(`El campo ${field.replace('_', ' ')} es obligatorio`);
            if (element) element.focus();
            return false;
        }
    }
    
    return true;
}

// Configurar validación de formulario
function setupFormValidation() {
    const form = document.getElementById('newRolForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            console.log("Formulario enviado, validando...");
            if (!validateRolForm()) {
                e.preventDefault();
                return false;
            }
            console.log("Formulario válido, enviando...");
            return true;
        });
    }
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    setupFormValidation();
    console.log("Validación de formulario configurada");
});

// Funciones auxiliares para modales
function openModal(modalId) {
    console.log("Abriendo modal:", modalId);
    document.getElementById(modalId).style.display = 'block';
    
    // Limpiar formulario al abrir el modal
    if (modalId === 'newRolModal') {
        document.getElementById('newRolForm').reset();
    }
}

function closeModal(modalId) {
    console.log("Cerrando modal:", modalId);
    document.getElementById(modalId).style.display = 'none';
    
    // Limpiar formulario al cerrar el modal
    if (modalId === 'newRolModal') {
        document.getElementById('newRolForm').reset();
    }
}

    // Cerrar modales al hacer clic fuera del contenido
    window.onclick = function(event) {
        const modals = document.getElementsByClassName('modal');
        for (let i = 0; i < modals.length; i++) {
            if (event.target == modals[i]) {
                modals[i].style.display = 'none';
            }
        }
    }

    function clearFilters() {
        document.getElementById('empleado').value = '';
        document.getElementById('mes').value = '';
        document.getElementById('ano').value = '';
        
        const rows = document.querySelectorAll('#rolesTable tbody tr');
        rows.forEach(row => {
            row.style.display = '';
        });
    }
