// Exportar a PDF - Implementación Real
async function exportToPDF() {
    try {
        // Mostrar indicador de carga
        showLoading('Generando PDF...');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        
        // Obtener datos para el título
        const mes = document.getElementById('mes')?.value || '';
        const ano = document.getElementById('ano')?.value || '';
        
        // Configuración del documento
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Título del reporte
        let titulo = 'Reporte de Contabilidad - Contalogic';
        if (mes && ano) {
            titulo += ` - Mes: ${mes}, Año: ${ano}`;
        } else if (mes) {
            titulo += ` - Mes: ${mes}`;
        } else if (ano) {
            titulo += ` - Año: ${ano}`;
        }
        
        // Cabecera del PDF
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(titulo, pageWidth / 2, 20, { align: 'center' });
        
        // Información de la empresa
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Corporación Alfa', pageWidth / 2, 30, { align: 'center' });
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 35, { align: 'center' });
        
        // Obtener los datos de la tabla
        const tableData = getTableDataForPDF();
        
        // Configurar columnas para la tabla en PDF
        const headers = [['Cédula', 'Empleado', 'Cargo', 'Total Ingresos', 'Total Egresos', 'Líquido a Pagar']];
        
        // Preparar datos para la tabla
        const data = tableData.map(row => [
            row.cedula,
            row.nombre,
            row.cargo,
            formatCurrency(row.ingresos),
            formatCurrency(row.egresos),
            formatCurrency(row.liquido)
        ]);
        
        // Agregar totales
        const totales = calculateTotals(tableData);
        data.push(['', '', 'TOTALES:', formatCurrency(totales.ingresos), formatCurrency(totales.egresos), formatCurrency(totales.liquido)]);
        
        // Configurar la tabla
        doc.autoTable({
            head: headers,
            body: data,
            startY: 45,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [44, 62, 80], // Color del sidebar
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' }
            },
            margin: { top: 45 },
            didDrawPage: function(data) {
                // Pie de página
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(
                    `Página ${doc.internal.getNumberOfPages()}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
        });
        
        // Agregar resumen estadístico
        const finalY = doc.lastAutoTable.finalY + 10;
        if (finalY < pageHeight - 30) {
            addStatisticalSummary(doc, tableData, finalY, pageWidth);
        }
        
        // Generar nombre del archivo
        let fileName = 'reporte_contabilidad';
        if (mes && ano) fileName += `_${mes}_${ano}`;
        else if (mes) fileName += `_mes_${mes}`;
        else if (ano) fileName += `_ano_${ano}`;
        fileName += '.pdf';
        
        // Guardar PDF
        doc.save(fileName);
        
        // Ocultar loading
        hideLoading();
        
        // Mostrar confirmación
        showSuccess('PDF generado exitosamente');
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        hideLoading();
        showError('Error al generar el PDF: ' + error.message);
    }
}

// Obtener datos de la tabla para PDF
function getTableDataForPDF() {
    const table = document.getElementById('contabilidadTable');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    
    return rows.map(row => ({
        cedula: row.cells[0].textContent.trim(),
        nombre: row.cells[1].textContent.trim(),
        cargo: row.cells[2].textContent.trim(),
        ingresos: parseFloat(row.cells[3].textContent.replace(/[^\d.-]/g, '') || 0),
        egresos: parseFloat(row.cells[4].textContent.replace(/[^\d.-]/g, '') || 0),
        liquido: parseFloat(row.cells[5].textContent.replace(/[^\d.-]/g, '') || 0)
    }));
}

// Calcular totales
function calculateTotals(data) {
    return {
        ingresos: data.reduce((sum, row) => sum + row.ingresos, 0),
        egresos: data.reduce((sum, row) => sum + row.egresos, 0),
        liquido: data.reduce((sum, row) => sum + row.liquido, 0)
    };
}

// Formatear moneda
function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Agregar resumen estadístico
function addStatisticalSummary(doc, data, startY, pageWidth) {
    const totales = calculateTotals(data);
    const promedioIngresos = totales.ingresos / data.length;
    const promedioEgresos = totales.egresos / data.length;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN ESTADÍSTICO', 14, startY);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const summaryLines = [
        `Total de empleados: ${data.length}`,
        `Promedio de ingresos: ${formatCurrency(promedioIngresos)}`,
        `Promedio de egresos: ${formatCurrency(promedioEgresos)}`,
        `Diferencia total: ${formatCurrency(totales.ingresos - totales.egresos)}`
    ];
    
    summaryLines.forEach((line, index) => {
        doc.text(line, 14, startY + 8 + (index * 5));
    });
}

// Funciones de utilidad para UI
function showLoading(message) {
    // Crear o mostrar overlay de loading
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
        document.body.appendChild(loading);
    }
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

// Alternativa: Exportar usando html2canvas (para capturar exactamente como se ve en pantalla)
function exportToPDFAsImage() {
    showLoading('Capturando pantalla...');
    
    const element = document.getElementById('contabilidadTable').closest('.table-container');
    
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        
        const imgWidth = doc.internal.pageSize.getWidth() - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        const mes = document.getElementById('mes')?.value || '';
        const ano = document.getElementById('ano')?.value || '';
        
        let fileName = 'reporte_contabilidad_imagen';
        if (mes && ano) fileName += `_${mes}_${ano}`;
        else if (mes) fileName += `_mes_${mes}`;
        else if (ano) fileName += `_ano_${ano}`;
        fileName += '.pdf';
        
        doc.save(fileName);
        hideLoading();
        showSuccess('PDF generado exitosamente');
    }).catch(error => {
        console.error('Error capturando pantalla:', error);
        hideLoading();
        showError('Error al generar el PDF: ' + error.message);
    });
}