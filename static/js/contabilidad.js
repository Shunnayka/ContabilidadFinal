// Variables globales
let originalData = [];
let currentSort = { column: null, direction: 'asc' };

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Guardar datos originales
    const table = document.getElementById('contabilidadTable');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    originalData = rows.map(row => ({
        element: row,
        cedula: row.cells[0].textContent,
        nombre: row.cells[1].textContent,
        cargo: row.cells[2].textContent,
        ingresos: parseFloat(row.cells[3].textContent.replace('$', '')),
        egresos: parseFloat(row.cells[4].textContent.replace('$', '')),
        liquido: parseFloat(row.cells[5].textContent.replace('$', ''))
    }));

    // Configurar ordenamiento
    setupSorting();
    
    // Aplicar filtros de la URL si existen
    applyUrlFilters();
});

// Configurar ordenamiento de la tabla
function setupSorting() {
    const headers = document.querySelectorAll('#contabilidadTable th');
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
    const table = document.getElementById('contabilidadTable');
    const tbody = table.querySelector('tbody');
    const headers = table.querySelectorAll('th');
    const sortIndicator = headers[columnIndex].querySelector('.sort-indicator');
    
    // Determinar dirección de ordenamiento
    if (currentSort.column === columnIndex) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = columnIndex;
        currentSort.direction = 'asc';
    }
    
    // Ordenar datos
    const sortedData = [...originalData].sort((a, b) => {
        let valueA, valueB;
        
        switch(columnIndex) {
            case 0: // Cédula
                valueA = a.cedula;
                valueB = b.cedula;
                break;
            case 1: // Nombre
                valueA = a.nombre;
                valueB = b.nombre;
                break;
            case 2: // Cargo
                valueA = a.cargo;
                valueB = b.cargo;
                break;
            case 3: // Ingresos
                valueA = a.ingresos;
                valueB = b.ingresos;
                break;
            case 4: // Egresos
                valueA = a.egresos;
                valueB = b.egresos;
                break;
            case 5: // Líquido
                valueA = a.liquido;
                valueB = b.liquido;
                break;
            default:
                return 0;
        }
        
        let comparison = 0;
        if (typeof valueA === 'string') {
            comparison = valueA.localeCompare(valueB);
        } else {
            comparison = valueA - valueB;
        }
        
        return currentSort.direction === 'asc' ? comparison : -comparison;
    });
    
    // Limpiar tabla
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Agregar filas ordenadas
    sortedData.forEach(item => {
        tbody.appendChild(item.element);
    });
    
    // Actualizar indicadores visuales
    headers.forEach(header => {
        const indicator = header.querySelector('.sort-indicator');
        if (indicator) {
            indicator.textContent = ' ↕';
        }
    });
    
    sortIndicator.textContent = currentSort.direction === 'asc' ? ' ↑' : ' ↓';
}

// Aplicar filtros
function applyFilters() {
    const mes = document.getElementById('mes').value;
    const ano = document.getElementById('ano').value;
    
    // Actualizar URL con los filtros
    const params = new URLSearchParams();
    if (mes) params.set('mes', mes);
    if (ano) params.set('ano', ano);
    
    const url = new URL(window.location);
    url.search = params.toString();
    window.location.href = url.toString();
}

// Aplicar filtros de la URL
function applyUrlFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const mes = urlParams.get('mes');
    const ano = urlParams.get('ano');
    
    if (mes) document.getElementById('mes').value = mes;
    if (ano) document.getElementById('ano').value = ano;
}

// Limpiar filtros
function clearFilters() {
    document.getElementById('mes').value = '';
    document.getElementById('ano').value = '';
    
    // Redirigir sin parámetros de filtro
    const url = new URL(window.location);
    url.search = '';
    window.location.href = url.toString();
}

// Exportar a PDF (función simulada)
function exportToPDF() {
    // En una implementación real, esto haría una petición al servidor
    // para generar un PDF con los datos actuales
    
    const mes = document.getElementById('mes').value;
    const ano = document.getElementById('ano').value;
    
    let fileName = 'reporte_contabilidad';
    if (mes && ano) {
        fileName += `_${mes}_${ano}`;
    } else if (mes) {
        fileName += `_mes_${mes}`;
    } else if (ano) {
        fileName += `_ano_${ano}`;
    }
    
    // Simular descarga
    alert(`Generando PDF: ${fileName}.pdf\n\nEn un sistema real, se descargaría el reporte completo.`);
    
    // En una implementación real:
    // window.open(`/contabilidad/exportar?mes=${mes}&ano=${ano}`, '_blank');
}

// Búsqueda en la tabla
function setupSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar en contabilidad...';
    searchInput.style.marginBottom = '15px';
    searchInput.style.padding = '8px';
    searchInput.style.width = '100%';
    searchInput.style.border = '1px solid #ddd';
    searchInput.style.borderRadius = '4px';
    
    const tableContainer = document.querySelector('.table-container');
    const table = document.getElementById('contabilidadTable');
    
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

// Inicializar búsqueda
document.addEventListener('DOMContentLoaded', setupSearch);