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

// Exportar rol individual a PDF - Implementación Real
async function exportRolPDF(rolId) {
    try {
        // Mostrar indicador de carga
        showLoading('Generando PDF del rol...');
        
        // Obtener datos del rol
        const rolData = await getRolData(rolId);
        if (!rolData) {
            throw new Error('No se pudieron obtener los datos del rol');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración del documento
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        
        // Logo y cabecera
        await addHeader(doc, pageWidth, margin);
        
        // Información del rol
        addRolInfo(doc, rolData, margin);
        
        // Detalles del empleado
        addEmployeeInfo(doc, rolData, margin);
        
        // Tabla de ingresos
        const ingresosY = addIncomeTable(doc, rolData, margin);
        
        // Tabla de egresos
        const egresosY = addExpenseTable(doc, rolData, ingresosY + 10);
        
        // Resumen final
        addSummary(doc, rolData, egresosY + 10, pageWidth);
        
        // Pie de página
        addFooter(doc, pageWidth);
        
        // Generar nombre del archivo
        const fileName = `rol_pago_${rolData.empleado_nombre.replace(/\s+/g, '_')}_${rolData.mes}_${rolData.ano}.pdf`;
        
        // Guardar PDF
        doc.save(fileName);
        
        // Ocultar loading
        hideLoading();
        
        // Mostrar confirmación
        showSuccess('PDF del rol generado exitosamente');
        
    } catch (error) {
        console.error('Error generando PDF del rol:', error);
        hideLoading();
        showError('Error al generar el PDF: ' + error.message);
    }
}

// Obtener datos del rol desde el servidor
async function getRolData(rolId) {
    try {
        const response = await fetch(`/rol_pagos/detalles/${rolId}`);
        if (!response.ok) {
            throw new Error('Error al obtener datos del rol');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        // Si falla la petición, intentar obtener datos de la tabla
        return getRolDataFromTable(rolId);
    }
}

// Fallback: obtener datos de la tabla HTML
function getRolDataFromTable(rolId) {
    const row = document.querySelector(`tr[data-rol-id="${rolId}"]`);
    if (!row) return null;
    
    const cells = row.cells;
    return {
        empleado_nombre: cells[1]?.textContent || '',
        mes: cells[2]?.textContent || '',
        ano: cells[3]?.textContent || '',
        total_ingresos: parseFloat(cells[4]?.textContent?.replace(/[^\d.-]/g, '') || 0),
        total_egresos: parseFloat(cells[5]?.textContent?.replace(/[^\d.-]/g, '') || 0),
        liquido_pagar: parseFloat(cells[6]?.textContent?.replace(/[^\d.-]/g, '') || 0)
    };
}

// Agregar cabecera con logo
async function addHeader(doc, pageWidth, margin) {
    // Título principal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ROL DE PAGOS', pageWidth / 2, margin, { align: 'center' });
    
    // Información de la empresa
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('CORPORACIÓN ALFA', pageWidth / 2, margin + 8, { align: 'center' });
    doc.text('Sistema Contalogic', pageWidth / 2, margin + 13, { align: 'center' });
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, margin + 18, pageWidth - margin, margin + 18);
}

// Agregar información del rol
function addRolInfo(doc, rolData, margin) {
    const startY = margin + 30;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL PERÍODO', margin, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const rolInfo = [
        `Mes: ${rolData.mes}`,
        `Año: ${rolData.ano}`,
        `Día de pago: ${rolData.dia || 15}`,
        `Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`
    ];
    
    rolInfo.forEach((info, index) => {
        doc.text(info, margin, startY + 10 + (index * 5));
    });
    
    return startY + 10 + (rolInfo.length * 5);
}

// Agregar información del empleado
function addEmployeeInfo(doc, rolData, margin) {
    const startY = margin + 65;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EMPLEADO', margin, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const employeeInfo = [
        `Nombre: ${rolData.empleado_nombre || 'N/A'}`,
        `Cédula: ${rolData.empleado_cedula || 'N/A'}`,
        `Cargo: ${rolData.empleado_cargo || 'N/A'}`,
        `Días trabajados: ${rolData.dias_trabajo || 30}`
    ];
    
    employeeInfo.forEach((info, index) => {
        doc.text(info, margin, startY + 10 + (index * 5));
    });
    
    return startY + 10 + (employeeInfo.length * 5);
}

// Agregar tabla de ingresos
function addIncomeTable(doc, rolData, startY) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INGRESOS', margin, startY);
    
    // Configurar tabla de ingresos
    const ingresos = [
        { concepto: 'Sueldo básico', valor: rolData.sueldo || 0 },
        { concepto: 'Bonificación', valor: rolData.bonificacion || 0 },
        { concepto: 'Transporte', valor: rolData.transporte || 0 },
        { concepto: 'Alimentación', valor: rolData.alimentacion || 0 },
        { concepto: 'Décimo tercero', valor: rolData.decimo_tercero || 0 },
        { concepto: 'Décimo cuarto', valor: rolData.decimo_cuarto || 0 },
        { concepto: 'Horas extras', valor: rolData.valor_horas_extras || 0 },
        { concepto: 'Otros ingresos', valor: rolData.otros_ingresos || 0 }
    ];
    
    let currentY = startY + 10;
    
    // Encabezado de la tabla
    doc.setFillColor(44, 62, 80);
    doc.setTextColor(255);
    doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'F');
    doc.text('CONCEPTO', margin + 2, currentY + 6);
    doc.text('VALOR', pageWidth - margin - 25, currentY + 6);
    
    currentY += 8;
    
    // Filas de ingresos
    doc.setTextColor(0);
    let totalIngresos = 0;
    
    ingresos.forEach((item, index) => {
        if (item.valor > 0) {
            // Fondo alternado
            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'F');
            }
            
            doc.text(item.concepto, margin + 2, currentY + 6);
            doc.text(formatCurrency(item.valor), pageWidth - margin - 25, currentY + 6, { align: 'right' });
            
            totalIngresos += item.valor;
            currentY += 8;
        }
    });
    
    // Total ingresos
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL INGRESOS', margin + 2, currentY + 6);
    doc.text(formatCurrency(totalIngresos), pageWidth - margin - 25, currentY + 6, { align: 'right' });
    
    return currentY + 8;
}

// Agregar tabla de egresos
function addExpenseTable(doc, rolData, startY) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // Verificar si hay espacio suficiente
    if (startY > 200) {
        doc.addPage();
        startY = margin;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EGRESOS', margin, startY);
    
    // Configurar tabla de egresos
    const egresos = [
        { concepto: 'Aporte IESS', valor: rolData.iess || 0 },
        { concepto: 'Préstamos IESS', valor: rolData.prestamos_iess || 0 },
        { concepto: 'Impuesto a la renta', valor: rolData.impuesto_renta || 0 },
        { concepto: 'Seguro privado', valor: rolData.seguro_privado || 0 },
        { concepto: 'Comisariato', valor: rolData.comisariato || 0 }
    ];
    
    let currentY = startY + 10;
    
    // Encabezado de la tabla
    doc.setFillColor(44, 62, 80);
    doc.setTextColor(255);
    doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'F');
    doc.text('CONCEPTO', margin + 2, currentY + 6);
    doc.text('VALOR', pageWidth - margin - 25, currentY + 6);
    
    currentY += 8;
    
    // Filas de egresos
    doc.setTextColor(0);
    let totalEgresos = 0;
    
    egresos.forEach((item, index) => {
        if (item.valor > 0) {
            // Fondo alternado
            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'F');
            }
            
            doc.text(item.concepto, margin + 2, currentY + 6);
            doc.text(formatCurrency(item.valor), pageWidth - margin - 25, currentY + 6, { align: 'right' });
            
            totalEgresos += item.valor;
            currentY += 8;
        }
    });
    
    // Total egresos
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL EGRESOS', margin + 2, currentY + 6);
    doc.text(formatCurrency(totalEgresos), pageWidth - margin - 25, currentY + 6, { align: 'right' });
    
    return currentY + 8;
}

// Agregar resumen final
function addSummary(doc, rolData, startY, pageWidth) {
    const margin = 15;
    
    // Verificar si hay espacio suficiente
    if (startY > 250) {
        doc.addPage();
        startY = margin;
    }
    
    const liquidoPagar = rolData.liquido_pagar || (rolData.total_ingresos - rolData.total_egresos);
    
    // Caja de resumen
    doc.setFillColor(44, 62, 80);
    doc.rect(margin, startY, pageWidth - (2 * margin), 25, 'F');
    
    doc.setTextColor(255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LIQUIDO A PAGAR', pageWidth / 2, startY + 10, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text(formatCurrency(liquidoPagar), pageWidth / 2, startY + 20, { align: 'center' });
}

// Agregar pie de página
function addFooter(doc, pageWidth) {
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
    
    // Texto del pie
    doc.text('Documento generado automáticamente por el Sistema Contalogic', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text('Corporación Alfa - Todos los derechos reservados', pageWidth / 2, pageHeight - 10, { align: 'center' });
}

// Formatear moneda
function formatCurrency(amount) {
    if (isNaN(amount)) return '$0.00';
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Función SIMPLE alternativa si falla la compleja
async function exportRolPDFSimple(rolId) {
    try {
        showLoading('Generando PDF...');
        
        const rolData = await getRolData(rolId);
        if (!rolData) {
            throw new Error('No se encontraron datos del rol');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Contenido simple pero efectivo
        doc.setFontSize(16);
        doc.text('ROL DE PAGOS - CORPORACIÓN ALFA', 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Empleado: ${rolData.empleado_nombre || 'N/A'}`, 20, 35);
        doc.text(`Período: ${rolData.mes}/${rolData.ano}`, 20, 42);
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, 20, 49);
        
        doc.setFontSize(12);
        doc.text('RESUMEN DE PAGO:', 20, 65);
        
        doc.setFontSize(10);
        doc.text(`Total Ingresos: ${formatCurrency(rolData.total_ingresos)}`, 20, 75);
        doc.text(`Total Egresos: ${formatCurrency(rolData.total_egresos)}`, 20, 82);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`LÍQUIDO A PAGAR: ${formatCurrency(rolData.liquido_pagar)}`, 20, 95);
        
        const fileName = `rol_pago_${rolData.empleado_nombre?.replace(/\s+/g, '_') || 'empleado'}_${rolData.mes}_${rolData.ano}.pdf`;
        doc.save(fileName);
        
        hideLoading();
        showSuccess('PDF generado exitosamente');
        
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showError('Error al generar PDF: ' + error.message);
    }
}

// Funciones de UI (las mismas que antes)
function showLoading(message) {
    let loading = document.getElementById('pdf-loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'pdf-loading';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(loading);
    }
    
    loading.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
            <p>${message}</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('pdf-loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 10000;
        transition: all 0.3s ease;
        ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
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
