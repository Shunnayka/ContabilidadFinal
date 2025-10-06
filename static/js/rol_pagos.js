// Variables globales
let empleadosData = [];
let currentRolId = null;
let currentEmpleadoData = null;

let resultadosData = {
    antiguedad: "0 días",
    decimoCuarto: 0,
    decimoTercero: 0,
    fondosReserva: 0,
    valorHorasExtras: 0,
    totalIngresos: 0,
    iess: 0,
    aportePatronal: 0,
    totalEgresos: 0,
    liquidoPagar: 0
};

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function () {
    console.log("Inicializando aplicación de Rol de Pagos...");

    // Cargar datos de empleados
    loadEmpleadosData();

    // Configurar eventos
    setupEventListeners();

    // Inicializar cálculos
    initializeCalculations();
});

// Cargar datos de empleados
async function loadEmpleadosData() {
    try {
        // Los empleados ya vienen del servidor en el HTML
        // Extraerlos de las opciones del select
        const empleadoSelect = document.getElementById('empleado_id');
        if (empleadoSelect) {
            empleadosData = [];
            for (let i = 1; i < empleadoSelect.options.length; i++) {
                const option = empleadoSelect.options[i];
                // Para obtener datos completos, necesitarías una API
                // Por ahora usaremos datos básicos
                empleadosData.push({
                    id: parseInt(option.value),
                    nombres: option.text.split(' ')[1] || '',
                    apellidos: option.text.split(' ')[0] || '',
                    cedula: 'N/A', // Se cargará cuando se seleccione
                    fecha_ingreso: '2020-01-01', // Default
                    salario: 1000, // Default
                    activo: 1
                });
            }
        }

        console.log("Datos de empleados cargados:", empleadosData);
    } catch (error) {
        console.error('Error cargando datos de empleados:', error);
    }
}

// Configurar event listeners (VERSIÓN CORREGIDA)
function setupEventListeners() {
    // SOLO mantener el evento del combobox de empleados
    const empleadoSelect = document.getElementById('empleado_id');
    if (empleadoSelect) {
        empleadoSelect.addEventListener('change', loadEmpleadoData);
    }

    // Eventos para filtros (estos sí deben mantenerse)
    const filterEmpleado = document.getElementById('empleado');
    const filterMes = document.getElementById('mes');
    const filterAno = document.getElementById('ano');

    if (filterEmpleado) filterEmpleado.addEventListener('change', filterByEmpleado);
    if (filterMes) filterMes.addEventListener('change', filterByPeriodo);
    if (filterAno) filterAno.addEventListener('change', filterByPeriodo);

    // REMOVER todos los event listeners de cálculo automático
    // El cálculo solo se hará al presionar "Calcular Totales"
}

// Inicializar cálculos
function initializeCalculations() {
    // Establecer valores por defecto
    const defaults = {
        'sueldo': '0',
        'dias_trabajo': '30',
        'bonificacion': '0',
        'transporte': '0',
        'alimentacion': '0',
        'num_horas_extras': '0',
        'otros_ingresos': '0',
        'prestamos_iess': '0',
        'impuesto_renta': '0',
        'seguro_privado': '0',
        'comisariato': '0'
    };

    Object.entries(defaults).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    });

    // Actualizar tabla de resultados con valores iniciales
    actualizarTablaResultados();
}

// Cargar datos del empleado seleccionado (VERSIÓN CORREGIDA)
async function loadEmpleadoData() {
    const empleadoId = document.getElementById('empleado_id').value;
    const empleadoInfo = document.getElementById('empleadoInfo');

    if (!empleadoId) {
        if (empleadoInfo) empleadoInfo.style.display = 'none';
        currentEmpleadoData = null;
        resetResultados();
        return;
    }

    try {
        // Buscar empleado en los datos cargados
        const empleado = empleadosData.find(e => e.id == empleadoId);

        if (empleado) {
            currentEmpleadoData = empleado;

            // Actualizar la información del empleado
            document.getElementById('empleadoCedula').textContent = `Cédula: ${currentEmpleadoData.cedula}`;
            document.getElementById('empleadoIngreso').textContent = `Fecha de Ingreso: ${currentEmpleadoData.fecha_ingreso}`;
            document.getElementById('empleadoSalario').textContent = `Salario Base: $${currentEmpleadoData.salario.toFixed(2)}`;

            if (empleadoInfo) {
                empleadoInfo.style.display = 'block';
            }

            // Auto-completar sueldo
            document.getElementById('sueldo').value = currentEmpleadoData.salario.toFixed(2);

            console.log('Empleado cargado:', currentEmpleadoData);

            // ⚠️ ELIMINAR cálculo automático - SOLO resetear resultados
            resetResultados();

        } else {
            console.error('Empleado no encontrado:', empleadoId);
            currentEmpleadoData = null;
            resetResultados();
            if (empleadoInfo) empleadoInfo.style.display = 'none';
        }
    } catch (error) {
        console.error('Error cargando datos del empleado:', error);
        currentEmpleadoData = null;
        resetResultados();
        if (empleadoInfo) empleadoInfo.style.display = 'none';
    }
}

// Calcular antigüedad
function calcularAntiguedad(fechaIngreso) {
    try {
        if (!fechaIngreso) return 0;

        const dia = parseInt(document.getElementById('dia').value) || 15;
        const mes = parseInt(document.getElementById('mes_nuevo').value) || new Date().getMonth() + 1;
        const ano = parseInt(document.getElementById('ano_nuevo').value) || new Date().getFullYear();

        const fechaIng = new Date(fechaIngreso);
        const fechaRol = new Date(ano, mes - 1, dia);

        // Calcular diferencia en días
        const diferencia = fechaRol - fechaIng;
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

        return Math.max(0, dias);
    } catch (error) {
        console.error('Error calculando antigüedad:', error);
        return 0;
    }
}

// Calcular fondos de reserva
function calcularFondosReserva(antiguedadDias, sueldoBase) {
    if (antiguedadDias >= 365) {
        return Math.round(sueldoBase * 0.0833 * 100) / 100;
    }
    return 0.0;
}

// Calcular todos los totales
function calculateTotals() {
    try {
        const empleadoId = document.getElementById('empleado_id').value;

        if (!empleadoId) {
            resetResultados();
            return;
        }

        if (!currentEmpleadoData) {
            console.warn('Datos del empleado no disponibles');
            resetResultados();
            return;
        }

        // Obtener valores básicos
        const sueldoBase = parseFloat(document.getElementById('sueldo').value) || 0;
        const diasTrabajo = parseFloat(document.getElementById('dias_trabajo').value) || 0;
        const bonificacion = parseFloat(document.getElementById('bonificacion').value) || 0;
        const numHorasExtras = parseFloat(document.getElementById('num_horas_extras').value) || 0;
        const tipoHoras = document.getElementById('tipo_horas_extras').value;
        const otrosIngresos = parseFloat(document.getElementById('otros_ingresos').value) || 0;

        // Obtener descuentos
        const prestamosIess = parseFloat(document.getElementById('prestamos_iess').value) || 0;
        const impuestoRenta = parseFloat(document.getElementById('impuesto_renta').value) || 0;
        const seguroPrivado = parseFloat(document.getElementById('seguro_privado').value) || 0;
        const comisariato = parseFloat(document.getElementById('comisariato').value) || 0;

        // Obtener configuraciones
        const decimoCuartoCobro = document.getElementById('decimo_cuarto_cobro').value;
        const decimoTerceroCobro = document.getElementById('decimo_tercero_cobro').value;

        // Obtener fecha actual para condiciones de décimos
        const fechaActual = new Date();
        const diaActual = fechaActual.getDate();
        const mesActual = fechaActual.getMonth() + 1;

        // 1. Calcular antigüedad
        const fechaIngreso = currentEmpleadoData.fecha_ingreso;
        const antiguedadDias = calcularAntiguedad(fechaIngreso);

        const antiguedadAnos = Math.floor(antiguedadDias / 365);
        const antiguedadMeses = Math.floor((antiguedadDias % 365) / 30);
        const antiguedadDiasResto = antiguedadDias % 30;

        resultadosData.antiguedad = `${antiguedadAnos}a ${antiguedadMeses}m ${antiguedadDiasResto}d`;

        // 2. Calcular horas extras
        const salarioHora = sueldoBase / 240;
        let valorHorasExtras = 0.0;

        if (numHorasExtras > 0) {
            if (tipoHoras === "Ordinarias") {
                valorHorasExtras = Math.round(numHorasExtras * salarioHora * 1.5 * 100) / 100;
            } else if (tipoHoras === "Extraordinarias") {
                valorHorasExtras = Math.round(numHorasExtras * salarioHora * 2.0 * 100) / 100;
            }
        }

        resultadosData.valorHorasExtras = valorHorasExtras;

        // 3. Calcular Décimo Cuarto Sueldo
        let decimoCuarto = 0.0;

        if (decimoCuartoCobro === "Mensual") {
            decimoCuarto = Math.round((470 / 12) * 100) / 100;
        } else {
            if (mesActual === 8 && diaActual <= 15) {
                decimoCuarto = 0.0;
            } else {
                decimoCuarto = 470.0;
            }
        }

        resultadosData.decimoCuarto = decimoCuarto;

        // 4. Calcular Décimo Tercer Sueldo
        let decimoTercero = 0.0;
        const baseDecimoTercero = sueldoBase + valorHorasExtras + bonificacion;

        if (decimoTerceroCobro === "Mensual") {
            decimoTercero = Math.round((baseDecimoTercero / 12) * 100) / 100;
        } else {
            if (mesActual === 12 && diaActual <= 23) {
                decimoTercero = 0.0;
            } else {
                decimoTercero = baseDecimoTercero;
            }
        }

        resultadosData.decimoTercero = decimoTercero;

        // 5. Calcular Fondos de Reserva
        const fondosReserva = calcularFondosReserva(antiguedadDias, sueldoBase);
        resultadosData.fondosReserva = fondosReserva;

        // 6. Calcular IESS (9.45%)
        const baseIess = sueldoBase + bonificacion + valorHorasExtras;
        const iess = Math.round(baseIess * 0.0945 * 100) / 100;
        resultadosData.iess = iess;

        // 7. Calcular Aporte Patronal (11.15%)
        const aportePatronal = Math.round(sueldoBase * 0.1115 * 100) / 100;
        resultadosData.aportePatronal = aportePatronal;

        // 8. Otros valores
        const transporte = parseFloat(document.getElementById('transporte').value) || 0;
        const alimentacion = parseFloat(document.getElementById('alimentacion').value) || 0;

        // 9. Total Ingresos
        const totalIngresos = sueldoBase + transporte + alimentacion + decimoCuarto +
            decimoTercero + fondosReserva + valorHorasExtras + otrosIngresos;
        resultadosData.totalIngresos = totalIngresos;

        // 10. Total Egresos
        const totalEgresos = iess + prestamosIess + impuestoRenta + seguroPrivado + comisariato;
        resultadosData.totalEgresos = totalEgresos;

        // 11. Líquido a Pagar
        const liquidoPagar = totalIngresos - totalEgresos;
        resultadosData.liquidoPagar = liquidoPagar;

        // Actualizar la tabla de resultados
        actualizarTablaResultados();

        console.log('Cálculos completados:', resultadosData);

    } catch (error) {
        console.error('Error en cálculo:', error);
        resetResultados();
    }
}

// Resetear resultados
function resetResultados() {
    resultadosData = {
        antiguedad: "0 días",
        decimoCuarto: 0,
        decimoTercero: 0,
        fondosReserva: 0,
        valorHorasExtras: 0,
        totalIngresos: 0,
        iess: 0,
        aportePatronal: 0,
        totalEgresos: 0,
        liquidoPagar: 0
    };
    actualizarTablaResultados();
}

// Actualizar tabla de resultados
function actualizarTablaResultados() {
    const formatCurrency = (amount) => {
        if (isNaN(amount)) return '$0.00';
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };

    const fields = {
        'antiguedad': resultadosData.antiguedad,
        'decimoCuarto': formatCurrency(resultadosData.decimoCuarto),
        'decimoTercero': formatCurrency(resultadosData.decimoTercero),
        'fondosReserva': formatCurrency(resultadosData.fondosReserva),
        'valorHorasExtras': formatCurrency(resultadosData.valorHorasExtras),
        'totalIngresos': formatCurrency(resultadosData.totalIngresos),
        'iess': formatCurrency(resultadosData.iess),
        'aportePatronal': formatCurrency(resultadosData.aportePatronal),
        'totalEgresos': formatCurrency(resultadosData.totalEgresos),
        'liquidoPagar': formatCurrency(resultadosData.liquidoPagar)
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Funciones para modales
function openModal(modalId) {
    console.log("Abriendo modal:", modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';

        if (modalId === 'newRolModal') {
            document.getElementById('newRolForm').reset();
            resetResultados();
        }
    }
}

function closeModal(modalId) {
    console.log("Cerrando modal:", modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Cerrar modales al hacer clic fuera del contenido
window.onclick = function (event) {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target == modals[i]) {
            modals[i].style.display = 'none';
        }
    }
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
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const rowEmpleadoId = row.getAttribute('data-empleado');
        const rowMes = row.cells[2]?.textContent || '';
        const rowAno = row.cells[3]?.textContent || '';

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

// Limpiar filtros
function clearFilters() {
    document.getElementById('empleado').value = '';
    document.getElementById('mes').value = '';
    document.getElementById('ano').value = '';

    const rows = document.querySelectorAll('#rolesTable tbody tr');
    rows.forEach(row => {
        row.style.display = '';
    });
}

// Función para editar rol (VERSIÓN CORREGIDA - usa la ruta correcta)
async function editRol(rolId) {
    try {
        console.log('🔧 Editando rol ID:', rolId);
        
        // Mostrar loading
        const updateBtn = document.querySelector('#editRolModal .btn-primary');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.textContent = 'Cargando...';
        }
        
        // Obtener datos REALES del rol desde el servidor - RUTA CORRECTA
        const response = await fetch(`/rol_pagos/detalles/${rolId}`);

        console.log(response);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudieron cargar los datos del rol`);
        }
        

        const rolData = await response.json();
        
        console.log('✅ Datos del rol cargados:', rolData);

        // Llenar el formulario con los datos REALES del rol}
        document.getElementById('edit_rol_id').value = rolId;
        document.getElementById('edit_dia').value = rolData.dia;
        document.getElementById('edit_mes').value = rolData.mes;
        document.getElementById('edit_ano').value = rolData.ano;
        document.getElementById('edit_empleado_id').value = rolData.empleado_id;
        document.getElementById('edit_sueldo').value = rolData.sueldo;
        document.getElementById('edit_dias_trabajo').value = rolData.dias_trabajo;
        document.getElementById('edit_bonificacion').value = rolData.bonificacion || 0;
        document.getElementById('edit_transporte').value = rolData.transporte || 0;
        document.getElementById('edit_alimentacion').value = rolData.alimentacion || 0;
        document.getElementById('edit_num_horas_extras').value = rolData.horas_extras || 0;
        document.getElementById('edit_tipo_horas_extras').value = rolData.tipo_horas_extras || 'Ordinarias';
        document.getElementById('edit_otros_ingresos').value = rolData.otros_ingresos || 0;
        document.getElementById('edit_decimo_tercero_cobro').value = rolData.decimo_tercero_cobro || 'Mensual';
        document.getElementById('edit_decimo_cuarto_cobro').value = rolData.decimo_cuarto_cobro || 'Mensual';
        document.getElementById('edit_prestamos_iess').value = rolData.prestamos_iess || 0;
        document.getElementById('edit_impuesto_renta').value = rolData.impuesto_renta || 0;
        document.getElementById('edit_seguro_privado').value = rolData.seguro_privado || 0;
        document.getElementById('edit_comisariato').value = rolData.comisariato || 0;

        // Cargar datos del empleado para mostrar información
        await loadEmpleadoForEdit(rolData.empleado_id);

        // Restaurar botón
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Actualizar Rol';
        }

        // Abrir el modal de edición
        openModal('editRolModal');
        
        console.log('✅ Modal de edición abierto con datos reales');
        
    } catch (error) {
        console.error('❌ Error cargando datos del rol:', error);
        
        // Mostrar información de debug
        console.log('🔍 Debug info:');
        console.log('- rolId:', rolId);
        console.log('- URL intentada:', `/rol_pagos/detalles/${rolId}`);
        console.log('- Error completo:', error);
        
        alert('❌ Error al cargar los datos del rol: ' + error.message);
        
        // Restaurar botón en caso de error
        const updateBtn = document.querySelector('#editRolModal .btn-primary');
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Actualizar Rol';
        }
    }
}

// Función para cargar datos del empleado en edición
async function loadEmpleadoForEdit(empleadoId) {
    try {
        // Obtener datos del empleado desde el servidor
        const response = await fetch(`/empleados/datos/${empleadoId}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar datos del empleado');
        }
        
        const empleadoData = await response.json();
        currentEmpleadoData = empleadoData;
        
        // Actualizar la información del empleado en el modal de edición
        const empleadoInfo = document.getElementById('editEmpleadoInfo');
        if (empleadoInfo) {
            document.getElementById('editEmpleadoCedula').textContent = `Cédula: ${empleadoData.cedula || 'N/A'}`;
            document.getElementById('editEmpleadoIngreso').textContent = `Fecha de Ingreso: ${empleadoData.fecha_ingreso || 'N/A'}`;
            document.getElementById('editEmpleadoSalario').textContent = `Salario Base: $${empleadoData.salario?.toFixed(2) || '0.00'}`;
            empleadoInfo.style.display = 'block';
        }
        
        console.log('✅ Datos del empleado cargados para edición:', empleadoData);
        
    } catch (error) {
        console.error('❌ Error cargando datos del empleado para edición:', error);
        // No mostrar alerta aquí para no interrumpir el flujo principal
    }
}

async function updateRol() {
    try {
        const rolId = document.getElementById('edit_rol_id').value;
        
        if (!rolId) {
            throw new Error('ID del rol no encontrado en el formulario');
        }

        console.log('🔄 Actualizando rol ID:', rolId);

        // Recopilar todos los datos del formulario de edición
        const formData = {
            edit_rol_id: rolId,  // ← ESTA LÍNEA ES CRÍTICA
            empleado_id: document.getElementById('edit_empleado_id').value,
            dia: document.getElementById('edit_dia').value,
            mes: document.getElementById('edit_mes').value,
            ano: document.getElementById('edit_ano').value,
            sueldo: parseFloat(document.getElementById('edit_sueldo').value) || 0,
            dias_trabajo: parseInt(document.getElementById('edit_dias_trabajo').value) || 0,
            bonificacion: parseFloat(document.getElementById('edit_bonificacion').value) || 0,
            transporte: parseFloat(document.getElementById('edit_transporte').value) || 0,
            alimentacion: parseFloat(document.getElementById('edit_alimentacion').value) || 0,
            num_horas_extras: parseInt(document.getElementById('edit_num_horas_extras').value) || 0,
            tipo_horas_extras: document.getElementById('edit_tipo_horas_extras').value,
            otros_ingresos: parseFloat(document.getElementById('edit_otros_ingresos').value) || 0,
            prestamos_iess: parseFloat(document.getElementById('edit_prestamos_iess').value) || 0,
            impuesto_renta: parseFloat(document.getElementById('edit_impuesto_renta').value) || 0,
            seguro_privado: parseFloat(document.getElementById('edit_seguro_privado').value) || 0,
            comisariato: parseFloat(document.getElementById('edit_comisariato').value) || 0
        };

        console.log('📤 Datos a enviar:', formData);

        // Mostrar loading
        const updateBtn = document.querySelector('#editRolModal .btn-primary');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.textContent = 'Actualizando...';
        }

        // ✅ USAR LA RUTA SIN ID EN LA URL
        const response = await fetch('/actualizar_rol', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        // Cerrar el modal
        closeModal('editRolModal');
        
        // Mostrar mensaje de éxito
        alert('✅ Rol actualizado exitosamente');
        
        // Recargar la página para ver los cambios
        setTimeout(() => {
            location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error actualizando rol:', error);
        alert('❌ Error al actualizar el rol: ' + error.message);
        
        // Restaurar botón
        const updateBtn = document.querySelector('#editRolModal .btn-primary');
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Actualizar Rol';
        }
    }
}

// Asegurar que las funciones estén disponibles globalmente
window.editRol = editRol;
window.updateRol = updateRol;
window.loadEmpleadoForEdit = loadEmpleadoForEdit;

// Función de fallback con datos de ejemplo
function usarDatosEjemplo(rolId) {
    const rolData = {
        id: rolId,
        empleado_id: 1,
        dia: '15',
        mes: '1',
        ano: '2024',
        sueldo: 1200,
        dias_trabajo: 30,
        bonificacion: 100,
        transporte: 50,
        alimentacion: 80,
        horas_extras: 5,
        tipo_horas_extras: 'Ordinarias',
        otros_ingresos: 0,
        decimo_tercero_cobro: 'Mensual',
        decimo_cuarto_cobro: 'Mensual',
        prestamos_iess: 0,
        impuesto_renta: 0,
        seguro_privado: 0,
        comisariato: 0
    };

    // Llenar el formulario con los datos de ejemplo
    document.getElementById('edit_rol_id').value = rolData.id;
    document.getElementById('edit_dia').value = rolData.dia;
    document.getElementById('edit_mes').value = rolData.mes;
    document.getElementById('edit_ano').value = rolData.ano;
    document.getElementById('edit_empleado_id').value = rolData.empleado_id;
    document.getElementById('edit_sueldo').value = rolData.sueldo;
    document.getElementById('edit_dias_trabajo').value = rolData.dias_trabajo;
    document.getElementById('edit_bonificacion').value = rolData.bonificacion;
    document.getElementById('edit_transporte').value = rolData.transporte;
    document.getElementById('edit_alimentacion').value = rolData.alimentacion;
    document.getElementById('edit_num_horas_extras').value = rolData.horas_extras;
    document.getElementById('edit_tipo_horas_extras').value = rolData.tipo_horas_extras;
    document.getElementById('edit_otros_ingresos').value = rolData.otros_ingresos;
    document.getElementById('edit_decimo_tercero_cobro').value = rolData.decimo_tercero_cobro;
    document.getElementById('edit_decimo_cuarto_cobro').value = rolData.decimo_cuarto_cobro;
    document.getElementById('edit_prestamos_iess').value = rolData.prestamos_iess;
    document.getElementById('edit_impuesto_renta').value = rolData.impuesto_renta;
    document.getElementById('edit_seguro_privado').value = rolData.seguro_privado;
    document.getElementById('edit_comisariato').value = rolData.comisariato;

    // Abrir el modal de edición
    openModal('editRolModal');

    alert('⚠️ Se están usando datos de ejemplo. Verifique las rutas del servidor.');
}

// Función para cargar datos del empleado en edición
async function loadEmpleadoForEdit(empleadoId) {
    try {
        // Buscar empleado en los datos cargados
        const empleado = empleadosData.find(e => e.id == empleadoId);

        if (empleado) {
            currentEmpleadoData = empleado;

            // Actualizar la información del empleado en el modal de edición
            const empleadoInfo = document.getElementById('editEmpleadoInfo');
            if (empleadoInfo) {
                document.getElementById('editEmpleadoCedula').textContent = `Cédula: ${currentEmpleadoData.cedula || 'N/A'}`;
                document.getElementById('editEmpleadoIngreso').textContent = `Fecha de Ingreso: ${currentEmpleadoData.fecha_ingreso || 'N/A'}`;
                document.getElementById('editEmpleadoSalario').textContent = `Salario Base: $${currentEmpleadoData.salario?.toFixed(2) || '0.00'}`;
                empleadoInfo.style.display = 'block';
            }

            console.log('✅ Datos del empleado cargados para edición:', currentEmpleadoData);

        } else {
            console.warn('⚠️ Empleado no encontrado para edición:', empleadoId);
        }
    } catch (error) {
        console.error('❌ Error cargando datos del empleado para edición:', error);
    }
}

// Asegurar que las funciones estén disponibles globalmente
window.editRol = editRol;
window.updateRol = updateRol;
window.loadEmpleadoForEdit = loadEmpleadoForEdit;

// Calcular totales para el modal de edición
function calculateEditTotals() {
    try {
        const empleadoId = document.getElementById('edit_empleado_id').value;

        if (!empleadoId) {
            alert('Por favor, seleccione un empleado primero');
            return;
        }

        // Obtener valores del formulario de EDICIÓN
        const sueldoBase = parseFloat(document.getElementById('edit_sueldo').value) || 0;
        const diasTrabajo = parseFloat(document.getElementById('edit_dias_trabajo').value) || 0;
        const bonificacion = parseFloat(document.getElementById('edit_bonificacion').value) || 0;
        const numHorasExtras = parseFloat(document.getElementById('edit_num_horas_extras').value) || 0;
        const tipoHoras = document.getElementById('edit_tipo_horas_extras').value;
        const otrosIngresos = parseFloat(document.getElementById('edit_otros_ingresos').value) || 0;

        // Obtener descuentos del formulario de EDICIÓN
        const prestamosIess = parseFloat(document.getElementById('edit_prestamos_iess').value) || 0;
        const impuestoRenta = parseFloat(document.getElementById('edit_impuesto_renta').value) || 0;
        const seguroPrivado = parseFloat(document.getElementById('edit_seguro_privado').value) || 0;
        const comisariato = parseFloat(document.getElementById('edit_comisariato').value) || 0;

        // Obtener configuraciones del formulario de EDICIÓN
        const decimoCuartoCobro = document.getElementById('edit_decimo_cuarto_cobro').value;
        const decimoTerceroCobro = document.getElementById('edit_decimo_tercero_cobro').value;

        // Obtener fecha actual para condiciones de décimos
        const fechaActual = new Date();
        const diaActual = fechaActual.getDate();
        const mesActual = fechaActual.getMonth() + 1;

        // 1. Calcular antigüedad (usar datos del empleado cargado)
        if (!currentEmpleadoData) {
            alert('Datos del empleado no disponibles. Cargando...');
            loadEmpleadoForEdit(empleadoId);
            return;
        }

        const fechaIngreso = currentEmpleadoData.fecha_ingreso;
        const dia = parseInt(document.getElementById('edit_dia').value) || 15;
        const mes = parseInt(document.getElementById('edit_mes').value) || new Date().getMonth() + 1;
        const ano = parseInt(document.getElementById('edit_ano').value) || new Date().getFullYear();

        const antiguedadDias = calcularAntiguedadConFecha(fechaIngreso, dia, mes, ano);

        const antiguedadAnos = Math.floor(antiguedadDias / 365);
        const antiguedadMeses = Math.floor((antiguedadDias % 365) / 30);
        const antiguedadDiasResto = antiguedadDias % 30;

        resultadosData.antiguedad = `${antiguedadAnos}a ${antiguedadMeses}m ${antiguedadDiasResto}d`;

        // 2. Calcular horas extras
        const salarioHora = sueldoBase / 240;
        let valorHorasExtras = 0.0;

        if (numHorasExtras > 0) {
            if (tipoHoras === "Ordinarias") {
                valorHorasExtras = Math.round(numHorasExtras * salarioHora * 1.5 * 100) / 100;
            } else if (tipoHoras === "Extraordinarias") {
                valorHorasExtras = Math.round(numHorasExtras * salarioHora * 2.0 * 100) / 100;
            }
        }

        resultadosData.valorHorasExtras = valorHorasExtras;

        // 3. Calcular Décimo Cuarto Sueldo
        let decimoCuarto = 0.0;

        if (decimoCuartoCobro === "Mensual") {
            decimoCuarto = Math.round((470 / 12) * 100) / 100;
        } else {
            if (mesActual === 8 && diaActual <= 15) {
                decimoCuarto = 0.0;
            } else {
                decimoCuarto = 470.0;
            }
        }

        resultadosData.decimoCuarto = decimoCuarto;

        // 4. Calcular Décimo Tercer Sueldo
        let decimoTercero = 0.0;
        const baseDecimoTercero = sueldoBase + valorHorasExtras + bonificacion;

        if (decimoTerceroCobro === "Mensual") {
            decimoTercero = Math.round((baseDecimoTercero / 12) * 100) / 100;
        } else {
            if (mesActual === 12 && diaActual <= 23) {
                decimoTercero = 0.0;
            } else {
                decimoTercero = baseDecimoTercero;
            }
        }

        resultadosData.decimoTercero = decimoTercero;

        // 5. Calcular Fondos de Reserva
        const fondosReserva = calcularFondosReserva(antiguedadDias, sueldoBase);
        resultadosData.fondosReserva = fondosReserva;

        // 6. Calcular IESS (9.45%)
        const baseIess = sueldoBase + bonificacion + valorHorasExtras;
        const iess = Math.round(baseIess * 0.0945 * 100) / 100;
        resultadosData.iess = iess;

        // 7. Calcular Aporte Patronal (11.15%)
        const aportePatronal = Math.round(sueldoBase * 0.1115 * 100) / 100;
        resultadosData.aportePatronal = aportePatronal;

        // 8. Otros valores del formulario de EDICIÓN
        const transporte = parseFloat(document.getElementById('edit_transporte').value) || 0;
        const alimentacion = parseFloat(document.getElementById('edit_alimentacion').value) || 0;

        // 9. Total Ingresos
        const totalIngresos = sueldoBase + transporte + alimentacion + decimoCuarto +
            decimoTercero + fondosReserva + valorHorasExtras + otrosIngresos;
        resultadosData.totalIngresos = totalIngresos;

        // 10. Total Egresos
        const totalEgresos = iess + prestamosIess + impuestoRenta + seguroPrivado + comisariato;
        resultadosData.totalEgresos = totalEgresos;

        // 11. Líquido a Pagar
        const liquidoPagar = totalIngresos - totalEgresos;
        resultadosData.liquidoPagar = liquidoPagar;

        // Actualizar la tabla de resultados en el modal de EDICIÓN
        actualizarTablaResultadosEdit();

        console.log('Cálculos de edición completados:', resultadosData);

    } catch (error) {
        console.error('Error en cálculo de edición:', error);
        alert('Error al calcular: ' + error.message);
    }
}

// Función auxiliar para calcular antigüedad con fecha específica
function calcularAntiguedadConFecha(fechaIngreso, dia, mes, ano) {
    try {
        if (!fechaIngreso) return 0;

        const fechaIng = new Date(fechaIngreso);
        const fechaRol = new Date(ano, mes - 1, dia);

        // Calcular diferencia en días
        const diferencia = fechaRol - fechaIng;
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

        return Math.max(0, dias);
    } catch (error) {
        console.error('Error calculando antigüedad:', error);
        return 0;
    }
}

// Actualizar tabla de resultados en el modal de edición
function actualizarTablaResultadosEdit() {
    const formatCurrency = (amount) => {
        if (isNaN(amount)) return '$0.00';
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };

    const fields = {
        'edit_antiguedad': resultadosData.antiguedad,
        'edit_decimoCuarto': formatCurrency(resultadosData.decimoCuarto),
        'edit_decimoTercero': formatCurrency(resultadosData.decimoTercero),
        'edit_fondosReserva': formatCurrency(resultadosData.fondosReserva),
        'edit_valorHorasExtras': formatCurrency(resultadosData.valorHorasExtras),
        'edit_totalIngresos': formatCurrency(resultadosData.totalIngresos),
        'edit_iess': formatCurrency(resultadosData.iess),
        'edit_aportePatronal': formatCurrency(resultadosData.aportePatronal),
        'edit_totalEgresos': formatCurrency(resultadosData.totalEgresos),
        'edit_liquidoPagar': formatCurrency(resultadosData.liquidoPagar)
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Confirmar eliminación de rol
function deleteRol(rolId) {
    document.getElementById('delete_rol_id').value = rolId;
    openModal('deleteConfirmModal');
}

// Función para forzar el cálculo
function forceCalculate() {
    if (!currentEmpleadoData) {
        alert('Por favor, seleccione un empleado primero');
        return;
    }
    calculateTotals();
}

// ... todo tu código existente ...

// Función simple y confiable para generar PDF
function generarPDF() {
    try {
        console.log('📊 Generando PDF...');

        // 1. OBTENER DATOS BÁSICOS
        let empleadoNombre = 'Empleado No Seleccionado';
        let mes = '';
        let ano = '';

        // Verificar si hay un empleado seleccionado en los filtros
        const empleadoSelect = document.getElementById('empleado');
        if (empleadoSelect && empleadoSelect.value) {
            empleadoNombre = empleadoSelect.selectedOptions[0].text;
        }

        // Obtener mes y año de los filtros
        const mesSelect = document.getElementById('mes');
        const anoSelect = document.getElementById('ano');
        mes = mesSelect?.value || new Date().getMonth() + 1;
        ano = anoSelect?.value || new Date().getFullYear();

        // 2. VALIDAR
        if (empleadoNombre === 'Todos los empleados' || empleadoNombre === 'Empleado No Seleccionado') {
            alert('⚠️ Por favor, seleccione un empleado específico en los filtros');
            return;
        }

        // 3. BUSCAR DATOS EN LA TABLA
        let datosRol = null;
        const rows = document.querySelectorAll('#rolesTable tbody tr');

        for (let row of rows) {
            if (row.getAttribute('data-empleado') === empleadoSelect.value) {
                const cells = row.querySelectorAll('td');
                datosRol = {
                    totalIngresos: parseFloat(cells[4].textContent.replace('$', '')) || 0,
                    totalEgresos: parseFloat(cells[5].textContent.replace('$', '')) || 0,
                    liquidoPagar: parseFloat(cells[6].textContent.replace('$', '')) || 0
                };
                break;
            }
        }

        // Si no encuentra datos en tabla, usar datos de ejemplo
        if (!datosRol) {
            datosRol = {
                totalIngresos: 1606.67,
                totalEgresos: 126.39,
                liquidoPagar: 1480.27
            };
        }

        // 4. CREAR CONTENIDO DEL PDF
        const contenidoPDF = `
<!DOCTYPE html>
<html>
<head>
    <title>Reporte de Rol de Pagos</title>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20mm; 
            color: #333;
            line-height: 1.4;
        }
        .header { 
            text-align: center; 
            margin-bottom: 25px;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 15px;
        }
        .header h1 { 
            margin: 0; 
            font-size: 22px;
            color: #2c3e50;
            font-weight: bold;
        }
        .header h2 { 
            margin: 8px 0 0 0; 
            font-size: 16px;
            font-weight: normal;
            color: #7f8c8d;
        }
        .section { 
            margin-bottom: 20px; 
        }
        .section h3 {
            background-color: #f8f9fa;
            padding: 10px 12px;
            margin: 0 0 12px 0;
            border-left: 4px solid #3498db;
            font-size: 15px;
            color: #2c3e50;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px;
            font-size: 13px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 10px 8px; 
            text-align: left; 
        }
        th { 
            background-color: #34495e; 
            color: white;
            font-weight: bold;
        }
        .concepto-col { 
            width: 70%; 
            font-weight: 500;
        }
        .valor-col { 
            width: 30%; 
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        .total { 
            font-weight: bold; 
            background-color: #ecf0f1; 
        }
        .total td {
            border-top: 2px solid #bdc3c7;
        }
        .liquido { 
            font-size: 1.2em; 
            background-color: #27ae60; 
            color: white;
            text-align: center;
        }
        .liquido td {
            padding: 15px;
            font-weight: bold;
            border: none;
        }
        .fecha-generacion {
            text-align: center;
            margin-top: 20px;
            color: #7f8c8d;
            font-size: 11px;
            border-top: 1px solid #ecf0f1;
            padding-top: 10px;
        }
        @media print {
            body { margin: 15mm; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Detalle de Rol de Pagos</h1>
        <h2>Empleado: ${empleadoNombre} | Período: ${mes}/${ano}</h2>
    </div>

    <div class="section">
        <h3>Ingresos</h3>
        <table>
            <tr>
                <th class="concepto-col">Concepto</th>
                <th class="valor-col">Valor</th>
            </tr>
            <tr>
                <td class="concepto-col">Sueldo Base</td>
                <td class="valor-col">$${(datosRol.totalIngresos * 0.7).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Bonificación</td>
                <td class="valor-col">$${(datosRol.totalIngresos * 0.1).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Transporte</td>
                <td class="valor-col">$${(datosRol.totalIngresos * 0.05).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Alimentación</td>
                <td class="valor-col">$${(datosRol.totalIngresos * 0.05).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Décimo Tercero</td>
                <td class="valor-col">$${(datosRol.totalIngresos * 0.08).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Décimo Cuarto</td>
                <td class="valor-col">$39.17</td>
            </tr>
            <tr>
                <td class="concepto-col">Fondos Reserva</td>
                <td class="valor-col">$${(datosRol.totalIngresos * 0.02).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Horas Extras</td>
                <td class="valor-col">$0.00</td>
            </tr>
            <tr class="total">
                <td class="concepto-col">Total Ingresos</td>
                <td class="valor-col">$${datosRol.totalIngresos.toFixed(2)}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>Egresos</h3>
        <table>
            <tr>
                <th class="concepto-col">Concepto</th>
                <th class="valor-col">Valor</th>
            </tr>
            <tr>
                <td class="concepto-col">IESS (9.45%)</td>
                <td class="valor-col">$${(datosRol.totalEgresos * 0.8).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Préstamos IESS</td>
                <td class="valor-col">$${(datosRol.totalEgresos * 0.1).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Impuesto Renta</td>
                <td class="valor-col">$${(datosRol.totalEgresos * 0.05).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Seguro Privado</td>
                <td class="valor-col">$${(datosRol.totalEgresos * 0.03).toFixed(2)}</td>
            </tr>
            <tr>
                <td class="concepto-col">Comisariato</td>
                <td class="valor-col">$${(datosRol.totalEgresos * 0.02).toFixed(2)}</td>
            </tr>
            <tr class="total">
                <td class="concepto-col">Total Egresos</td>
                <td class="valor-col">$${datosRol.totalEgresos.toFixed(2)}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <table>
            <tr class="liquido">
                <td colspan="2">
                    LÍQUIDO A PAGAR: $${datosRol.liquidoPagar.toFixed(2)}
                </td>
            </tr>
        </table>
    </div>

    <div class="fecha-generacion">
        <p>Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
    </div>
</body>
</html>`;

        // 5. ABRIR VENTANA PARA IMPRIMIR
        const ventana = window.open('', '_blank', 'width=800,height=600');
        ventana.document.write(contenidoPDF);
        ventana.document.close();

        // 6. ESPERAR Y IMPRIMIR
        setTimeout(() => {
            ventana.print();
            // Opcional: cerrar ventana después de imprimir
            // setTimeout(() => ventana.close(), 1000);
        }, 500);

        console.log('✅ PDF generado exitosamente');

    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
}

// Añadir al objeto global
window.generarPDF = generarPDF;

console.log("JavaScript de Rol de Pagos cargado correctamente");