// ========== FUNCIONES DE UTILIDAD ==========

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} custom-alert alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Insertar al inicio del contenido principal
    const mainContent = document.querySelector('.main-content');
    const firstChild = mainContent.firstChild;
    mainContent.insertBefore(alertDiv, firstChild);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Función auxiliar para escapar HTML (seguridad)
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========== FUNCIONES DE MANEJO DE FORMULARIOS ==========

// Función para manejar el envío del formulario de edición
function handleEditarProducto(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const productoId = form.action.split('/').pop();

    console.log('Enviando formulario de edición para producto ID:', productoId);
    console.log('Datos del formulario:', Object.fromEntries(formData));

    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    submitBtn.disabled = true;

    fetch(form.action, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Respuesta recibida, status:', response.status);
        
        // Intentar parsear como JSON primero
        return response.json().then(data => {
            console.log('Datos de respuesta:', data);
            
            if (!response.ok) {
                // Si la respuesta no es OK, lanzar error con el mensaje del servidor
                throw new Error(data.error || `Error HTTP: ${response.status}`);
            }
            
            return data;
        });
    })
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarProductoModal'));
            if (modal) {
                modal.hide();
            }
            
            // Mostrar mensaje de éxito
            showAlert(data.message, 'success');
            
            // Recargar la página después de un breve delay
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    })
    .catch(error => {
        console.error('Error completo:', error);
        
        let errorMessage = 'Error al actualizar el producto';
        if (error.message.includes('JSON')) {
            errorMessage = 'Error en la respuesta del servidor. El producto puede haberse actualizado correctamente.';
            // Recargar por si acaso
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            errorMessage = 'Error al actualizar el producto: ' + error.message;
        }
        
        showAlert(errorMessage, 'error');
        
        // Restaurar botón
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ========== FUNCIONES AUXILIARES PARA DATOS ==========

// Funciones auxiliares para generar opciones de categorías y unidades
async function generateCategoriasOptions(categoriaIdSeleccionada) {
    try {
        const response = await fetch('/inventario/categorias/listar');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categorias = await response.json();

        if (categorias.error) {
            console.error('Error al cargar categorías:', categorias.error);
            return '';
        }

        return categorias.map(categoria =>
            `<option value="${categoria.id}" ${categoriaIdSeleccionada == categoria.id ? 'selected' : ''}>
                ${escapeHtml(categoria.nombre)}
            </option>`
        ).join('');
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        return '';
    }
}

async function generateUnidadesOptions(unidadIdSeleccionada) {
    try {
        const response = await fetch('/inventario/unidades/listar');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const unidades = await response.json();

        if (unidades.error) {
            console.error('Error al cargar unidades:', unidades.error);
            return '';
        }

        return unidades.map(unidad =>
            `<option value="${unidad.id}" ${unidadIdSeleccionada == unidad.id ? 'selected' : ''}>
                ${escapeHtml(unidad.nombre)} (${escapeHtml(unidad.abreviatura)})
            </option>`
        ).join('');
    } catch (error) {
        console.error('Error al cargar unidades:', error);
        return '';
    }
}

// ========== FUNCIONES PRINCIPALES ==========

async function editarProducto(productoId) {
    console.log('Editando producto ID:', productoId);

    try {
        const response = await fetch(`/inventario/productos/datos/${productoId}`);
        console.log('Respuesta de datos del producto:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const producto = await response.json();
        console.log('Datos del producto recibidos:', producto);

        if (producto.error) {
            showAlert('Error: ' + producto.error, 'error');
            return;
        }

        // Cargar categorías y unidades en paralelo
        const [categoriasOptions, unidadesOptions] = await Promise.all([
            generateCategoriasOptions(producto.categoria_id),
            generateUnidadesOptions(producto.unidad_id)
        ]);

        const formContent = `
    <form id="formEditarProducto" method="POST">
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Código *</label>
                    <input type="text" class="form-control" name="codigo" value="${escapeHtml(producto.codigo)}" required />
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Nombre *</label>
                    <input type="text" class="form-control" name="nombre" value="${escapeHtml(producto.nombre)}" required />
                </div>
            </div>
        </div>
        
        <div class="mb-3">
            <label class="form-label">Descripción</label>
            <textarea class="form-control" name="descripcion" rows="2">${escapeHtml(producto.descripcion || '')}</textarea>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Categoría</label>
                    <select class="form-select" name="categoria_id">
                        <option value="">Seleccionar categoría</option>
                        ${categoriasOptions}
                    </select>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Unidad *</label>
                    <select class="form-select" name="unidad_id" required>
                        <option value="">Seleccionar unidad</option>
                        ${unidadesOptions}
                    </select>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Precio de Compra *</label>
                    <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" class="form-control" name="precio_compra" value="${producto.precio_compra}" step="0.01" min="0" required />
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Precio de Venta *</label>
                    <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" class="form-control" name="precio_venta" value="${producto.precio_venta}" step="0.01" min="0" required />
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Stock Actual *</label>
                    <input type="number" class="form-control" name="stock_actual" value="${producto.stock_actual}" min="0" required />
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Stock Mínimo *</label>
                    <input type="number" class="form-control" name="stock_minimo" value="${producto.stock_minimo}" min="0" required />
                </div>
            </div>
        </div>
        
        <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" name="activo" id="editProductoActivo" ${producto.activo ? 'checked' : ''} />
            <label class="form-check-label" for="editProductoActivo">Producto activo</label>
        </div>
        
        <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save me-1"></i>Actualizar Producto
            </button>
        </div>
    </form>

        `;

        document.getElementById('editarProductoContent').innerHTML = formContent;

        // Agregar event listener al formulario
        const form = document.getElementById('formEditarProducto');
        form.action = "/inventario/productos/editar/" + productoId;
        form.onsubmit = handleEditarProducto;

        new bootstrap.Modal(document.getElementById('editarProductoModal')).show();

    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al cargar los datos del producto: ' + error.message, 'error');
    }
}

async function verProducto(productoId) {
    try {
        const response = await fetch(`/inventario/productos/datos/${productoId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const producto = await response.json();

        if (producto.error) {
            showAlert('Error: ' + producto.error, 'error');
            return;
        }

        const detallesContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información Básica</h6>
                    <p><strong>Código:</strong> ${producto.codigo}</p>
                    <p><strong>Nombre:</strong> ${producto.nombre}</p>
                    <p><strong>Descripción:</strong> ${producto.descripcion || 'No especificada'}</p>
                </div>
                <div class="col-md-6">
                    <h6>Precios y Stock</h6>
                    <p><strong>Precio Compra:</strong> $${parseFloat(producto.precio_compra).toFixed(2)}</p>
                    <p><strong>Precio Venta:</strong> $${parseFloat(producto.precio_venta).toFixed(2)}</p>
                    <p><strong>Stock Actual:</strong> <span class="badge bg-${producto.stock_actual <= producto.stock_minimo ? 'danger' : 'success'}">${producto.stock_actual}</span></p>
                    <p><strong>Stock Mínimo:</strong> ${producto.stock_minimo}</p>
                </div>
            </div>
        `;

        document.getElementById('verProductoContent').innerHTML = detallesContent;
        new bootstrap.Modal(document.getElementById('verProductoModal')).show();

    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al cargar los detalles del producto', 'error');
    }
}

// Función para eliminar producto con confirmación
async function eliminarProducto(productoId, productoNombre) {
    if (confirm(`¿Está seguro de que desea eliminar el producto "${productoNombre}"? Esta acción no se puede deshacer.`)) {
        try {
            const response = await fetch(`/inventario/productos/eliminar/${productoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                showAlert('Producto eliminado correctamente', 'success');
                // Recargar la tabla después de eliminar
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                showAlert('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error al eliminar el producto', 'error');
        }
    }
}

// ========== FUNCIONES DE VALIDACIÓN ==========

// Función para validar el formulario antes de enviar
function validarFormularioProducto(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });

    // Validar que el precio de venta sea mayor que el de compra
    const precioCompra = parseFloat(form.querySelector('input[name="precio_compra"]')?.value || 0);
    const precioVenta = parseFloat(form.querySelector('input[name="precio_venta"]')?.value || 0);

    if (precioVenta <= precioCompra) {
        showAlert('El precio de venta debe ser mayor que el precio de compra', 'error');
        isValid = false;
    }

    return isValid;
}

function validarPrecios() {
    const form = this.closest('form');
    if (!form) return;

    const precioCompra = parseFloat(form.querySelector('input[name="precio_compra"]')?.value || 0);
    const precioVenta = parseFloat(form.querySelector('input[name="precio_venta"]')?.value || 0);

    if (precioVenta > 0 && precioCompra > 0 && precioVenta <= precioCompra) {
        form.querySelector('input[name="precio_venta"]').classList.add('is-invalid');
    } else {
        form.querySelector('input[name="precio_venta"]').classList.remove('is-invalid');
    }
}

// ========== EVENT LISTENERS ==========

// Event listeners para validación en tiempo real
document.addEventListener('DOMContentLoaded', function () {
    // Validación de precios
    const precioCompraInputs = document.querySelectorAll('input[name="precio_compra"]');
    const precioVentaInputs = document.querySelectorAll('input[name="precio_venta"]');

    precioCompraInputs.forEach(input => {
        input.addEventListener('change', validarPrecios);
    });

    precioVentaInputs.forEach(input => {
        input.addEventListener('change', validarPrecios);
    });
});