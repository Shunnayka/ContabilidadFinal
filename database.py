import sqlite3
import hashlib
from datetime import datetime

def create_tables():
    conn = sqlite3.connect('contalogic.db')
    cursor = conn.cursor()
    
    # Tabla de usuarios
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        contraseña TEXT NOT NULL,
        cargo TEXT NOT NULL,
        correo TEXT NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        admin INTEGER DEFAULT 0
    )
    ''')
    
    # Tabla de empleados
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS empleados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombres TEXT NOT NULL,
        apellidos TEXT NOT NULL,
        cedula TEXT UNIQUE NOT NULL,
        correo TEXT NOT NULL,
        cargo TEXT NOT NULL,
        salario REAL NOT NULL,
        fecha_ingreso DATE NOT NULL,
        activo BOOLEAN DEFAULT 1
    )
    ''')
    
    # Tabla de rol de pagos (estructura básica)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS rol_pagos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empleado_id INTEGER NOT NULL,
        dia INTEGER DEFAULT 1,
        mes INTEGER NOT NULL,
        año INTEGER NOT NULL,
        sueldo REAL NOT NULL,
        dias_trabajo REAL DEFAULT 0,
        bonificacion REAL DEFAULT 0,
        transporte REAL DEFAULT 0,
        alimentacion REAL DEFAULT 0,
        horas_extras REAL DEFAULT 0,
        tipo_horas_extras TEXT DEFAULT 'Ordinarias',
        valor_horas_extras REAL DEFAULT 0,
        decimo_tercero REAL DEFAULT 0,
        decimo_cuarto REAL DEFAULT 0,
        fondos_reserva REAL DEFAULT 0,
        otros_ingresos REAL DEFAULT 0,
        iess REAL DEFAULT 0,
        prestamos_iess REAL DEFAULT 0,
        impuesto_renta REAL DEFAULT 0,
        seguro_privado REAL DEFAULT 0,
        comisariato REAL DEFAULT 0,
        aporte_patronal REAL DEFAULT 0,
        total_ingresos REAL DEFAULT 0,
        total_egresos REAL DEFAULT 0,
        liquido_pagar REAL DEFAULT 0,
        fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empleado_id) REFERENCES empleados (id)
    )
    ''')
    
    # Insertar usuario administrador por defecto si no existe
    cursor.execute("SELECT COUNT(*) FROM usuarios WHERE cargo='Administrador'")
    if cursor.fetchone()[0] == 0:
        hashed_password = hashlib.sha256("Admin123".encode()).hexdigest()
        cursor.execute(
            "INSERT INTO usuarios (usuario, contraseña, cargo, correo) VALUES (?, ?, ?, ?)",
            ("admin", hashed_password, "Administrador", "admin@corporacionalfa.com")
        )
    
    conn.commit()
    conn.close()
    
    # Actualizar tabla si es necesario
    actualizar_tabla_rol_pagos()

def get_db_connection():
    conn = sqlite3.connect('contalogic.db')
    conn.row_factory = sqlite3.Row
    return conn

def actualizar_tabla_rol_pagos():
    """Actualizar la tabla rol_pagos para agregar columnas faltantes"""
    try:
        conn = sqlite3.connect('contalogic.db')
        cursor = conn.cursor()
        
        # Verificar estructura actual
        cursor.execute("PRAGMA table_info(rol_pagos)")
        columnas_existentes = [col[1] for col in cursor.fetchall()]
        
        # Columnas que deberían existir
        columnas_necesarias = [
            'dia', 'dias_trabajo', 'tipo_horas_extras', 
            'otros_ingresos', 'aporte_patronal', 'prestamos_iess'
        ]
        
        # Agregar columnas faltantes
        for columna in columnas_necesarias:
            if columna not in columnas_existentes:
                if columna == 'tipo_horas_extras':
                    cursor.execute(f"ALTER TABLE rol_pagos ADD COLUMN {columna} TEXT DEFAULT 'Ordinarias'")
                else:
                    cursor.execute(f"ALTER TABLE rol_pagos ADD COLUMN {columna} REAL DEFAULT 0")
                print(f"✓ Columna '{columna}' agregada")
        
        conn.commit()
        conn.close()
        print("✓ Tabla rol_pagos actualizada correctamente")
        
    except Exception as e:
        print(f"Error al actualizar tabla: {e}")

# Funciones adicionales para la aplicación Flask
def get_user_by_username(username):
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM usuarios WHERE usuario = ?', (username,)).fetchone()
    conn.close()
    return user

def verify_password(stored_password, provided_password):
    hashed_password = hashlib.sha256(provided_password.encode()).hexdigest()
    return stored_password == hashed_password

def get_all_employees():
    conn = get_db_connection()
    employees = conn.execute('SELECT * FROM empleados ORDER BY apellidos, nombres').fetchall()
    conn.close()
    return employees

def get_employee_by_id(employee_id):
    conn = get_db_connection()
    employee = conn.execute('SELECT * FROM empleados WHERE id = ?', (employee_id,)).fetchone()
    conn.close()
    return employee

def add_employee(nombres, apellidos, cedula, correo, cargo, salario, fecha_ingreso):
    conn = get_db_connection()
    try:
        conn.execute(
            'INSERT INTO empleados (nombres, apellidos, cedula, correo, cargo, salario, fecha_ingreso) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (nombres, apellidos, cedula, correo, cargo, salario, fecha_ingreso)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def update_employee(employee_id, nombres, apellidos, cedula, correo, cargo, salario, fecha_ingreso, activo):
    conn = get_db_connection()
    try:
        conn.execute(
            '''UPDATE empleados 
            SET nombres = ?, apellidos = ?, cedula = ?, correo = ?, cargo = ?, salario = ?, fecha_ingreso = ?, activo = ?
            WHERE id = ?''',
            (nombres, apellidos, cedula, correo, cargo, salario, fecha_ingreso, activo, employee_id)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating employee: {e}")
        return False
    finally:
        conn.close()

def delete_employee(employee_id):
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM empleados WHERE id = ?', (employee_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error deleting employee: {e}")
        return False
    finally:
        conn.close()

# NUEVAS FUNCIONES PARA DETECCIÓN AUTOMÁTICA DE ROLES
def get_user_count():
    """Obtener el número total de usuarios registrados"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM usuarios")
    count = cursor.fetchone()['count']
    conn.close()
    return count

def create_user_with_auto_role(username, password, email):
    """Crear usuario con rol automático"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Determinar rol automáticamente
        user_count = get_user_count()
        
        if user_count == 0:
            # Primer usuario será Administrador
            role = "Administrador"
        else:
            # Usuarios siguientes serán Empleado por defecto
            role = "Empleado"
        
        # Hash de la contraseña
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # Insertar usuario
        cursor.execute(
            "INSERT INTO usuarios (usuario, contraseña, cargo, correo) VALUES (?, ?, ?, ?)",
            (username, hashed_password, role, email)
        )
        conn.commit()
        return True, role
        
    except sqlite3.IntegrityError:
        return False, None
    except Exception as e:
        print(f"Error creating user: {e}")
        return False, None
    finally:
        conn.close()

def determine_user_role(user):
    """
    Determina automáticamente el rol del usuario basado en diferentes criterios
    """
    try:
        # Si user es None, retornar Empleado por defecto
        if user is None:
            return 'Empleado'
            
        # Método 1: Si el usuario tiene un campo 'cargo' en la base de datos
        if 'cargo' in user and user['cargo']:
            return user['cargo']
        
        # Método 2: Por nombre de usuario (administradores comunes)
        admin_usernames = ['admin', 'administrador', 'superuser', 'alfa_admin', 'davidorbep']
        if user['usuario'].lower() in admin_usernames:
            return 'Administrador'
        
        # Método 3: Por prefijo en el username
        if user['usuario'].lower().startswith(('admin_', 'adm_', 'super_')):
            return 'Administrador'
        
        # Método 4: Por ID (primer usuario suele ser admin)
        if user['id'] == 1:
            return 'Administrador'
        
        # Por defecto, es empleado
        return 'Empleado'
        
    except Exception as e:
        print(f"Error en determine_user_role: {e}")
        return 'Empleado'  # Por defecto seguro

def get_email_by_username(username):
    """Obtener email de usuario"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT correo FROM usuarios WHERE usuario = ?", (username,))
        result = cursor.fetchone()
        return result['correo'] if result else None
    except Exception as e:
        print(f"Error buscando email: {e}")
        return None
    finally:
        conn.close()

def update_user_password(username, new_password):
    """Actualizar contraseña de usuario"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        hashed_password = hashlib.sha256(new_password.encode()).hexdigest()
        cursor.execute(
            "UPDATE usuarios SET contraseña = ? WHERE usuario = ?",
            (hashed_password, username)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating password: {e}")
        return False
    finally:
        conn.close()

# Agrega estas funciones al archivo database.py

def create_inventory_tables():
    """Crear tablas para el inventario"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tabla de unidades de medida
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS unidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            abreviatura TEXT NOT NULL UNIQUE,
            activo BOOLEAN DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de categorías
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            descripcion TEXT,
            activo BOOLEAN DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de productos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT UNIQUE NOT NULL,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            categoria_id INTEGER,
            unidad_id INTEGER,
            precio_compra DECIMAL(10,2) DEFAULT 0,
            precio_venta DECIMAL(10,2) DEFAULT 0,
            stock_minimo INTEGER DEFAULT 0,
            stock_actual INTEGER DEFAULT 0,
            activo BOOLEAN DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias (id),
            FOREIGN KEY (unidad_id) REFERENCES unidades (id)
        )
    ''')
    
    # Insertar unidades por defecto
    unidades_default = [
        ('Unidad', 'UND'),
        ('Kilogramo', 'KG'),
        ('Gramo', 'G'),
        ('Litro', 'LT'),
        ('Mililitro', 'ML'),
        ('Metro', 'M'),
        ('Centímetro', 'CM')
    ]
    
    cursor.executemany(
        'INSERT OR IGNORE INTO unidades (nombre, abreviatura) VALUES (?, ?)',
        unidades_default
    )
    
    # Insertar categorías por defecto
    categorias_default = [
        ('Materia Prima', 'Materiales básicos para producción'),
        ('Producto Terminado', 'Productos listos para la venta'),
        ('Suministros', 'Materiales de oficina y limpieza'),
        ('Herramientas', 'Equipos y herramientas de trabajo')
    ]
    
    cursor.executemany(
        'INSERT OR IGNORE INTO categorias (nombre, descripcion) VALUES (?, ?)',
        categorias_default
    )
    
    conn.commit()
    conn.close()

# Funciones para unidades
def get_all_unidades():
    """Obtener todas las unidades"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM unidades WHERE activo = 1 ORDER BY nombre')
    unidades = cursor.fetchall()
    conn.close()
    return unidades

def add_unidad(nombre, abreviatura):
    """Agregar nueva unidad"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO unidades (nombre, abreviatura) VALUES (?, ?)',
            (nombre, abreviatura)
        )
        conn.commit()
        conn.close()
        return True
    except:
        conn.close()
        return False

def update_unidad(id, nombre, abreviatura, activo):
    """Actualizar unidad"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'UPDATE unidades SET nombre = ?, abreviatura = ?, activo = ? WHERE id = ?',
            (nombre, abreviatura, activo, id)
        )
        conn.commit()
        conn.close()
        return True
    except:
        conn.close()
        return False

def delete_unidad(id):
    """Eliminar unidad (eliminación lógica)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('UPDATE unidades SET activo = 0 WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return True
    except:
        conn.close()
        return False

# Funciones para categorías
def get_all_categorias():
    """Obtener todas las categorías"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre')
    categorias = cursor.fetchall()
    conn.close()
    return categorias

def add_categoria(nombre, descripcion):
    """Agregar nueva categoría"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
            (nombre, descripcion)
        )
        conn.commit()
        conn.close()
        return True
    except:
        conn.close()
        return False

def update_categoria(id, nombre, descripcion, activo):
    """Actualizar categoría"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'UPDATE categorias SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
            (nombre, descripcion, activo, id)
        )
        conn.commit()
        conn.close()
        return True
    except:
        conn.close()
        return False

def delete_categoria(id):
    """Eliminar categoría (eliminación lógica)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('UPDATE categorias SET activo = 0 WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return True
    except:
        conn.close()
        return False

# Funciones para productos
def get_all_productos():
    """Obtener todos los productos con información de categoría y unidad"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.*, c.nombre as categoria_nombre, u.nombre as unidad_nombre, u.abreviatura
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN unidades u ON p.unidad_id = u.id
        ORDER BY p.nombre
    ''')
    productos = cursor.fetchall()
    conn.close()
    return productos

def add_producto(codigo, nombre, descripcion, categoria_id, unidad_id, precio_compra, precio_venta, stock_minimo, stock_actual):
    """Agregar nuevo producto"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO productos 
            (codigo, nombre, descripcion, categoria_id, unidad_id, precio_compra, precio_venta, stock_minimo, stock_actual)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (codigo, nombre, descripcion, categoria_id, unidad_id, precio_compra, precio_venta, stock_minimo, stock_actual))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error al agregar producto: {e}")
        conn.close()
        return False

def update_producto(id, codigo, nombre, descripcion, categoria_id, unidad_id, precio_compra, precio_venta, stock_minimo, stock_actual, activo):
    """Actualizar producto"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        print(f"Actualizando producto en BD - ID: {id}")
        print(f"Valores: codigo={codigo}, activo={activo}")
        
        cursor.execute('''
            UPDATE productos 
            SET codigo = ?, nombre = ?, descripcion = ?, categoria_id = ?, unidad_id = ?, 
                precio_compra = ?, precio_venta = ?, stock_minimo = ?, stock_actual = ?, activo = ?
            WHERE id = ?
        ''', (codigo, nombre, descripcion, categoria_id, unidad_id, precio_compra, precio_venta, stock_minimo, stock_actual, activo, id))
        
        conn.commit()
        print("Producto actualizado en BD exitosamente")
        conn.close()
        return True
    except Exception as e:
        print(f"Error en update_producto: {e}")
        conn.close()
        return False

def delete_producto(id):
    """Eliminar producto (eliminación lógica)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE from productos WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return True
    except:
        conn.close()
        return False

def get_producto_by_id(id):
    """Obtener producto por ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.*, c.nombre as categoria_nombre, u.nombre as unidad_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN unidades u ON p.unidad_id = u.id
        WHERE p.id = ?
    ''', (id,))
    producto = cursor.fetchone()
    conn.close()
    return producto

def get_productos_bajo_stock():
    """Obtener productos con stock por debajo del mínimo"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.*, c.nombre as categoria_nombre, u.nombre as unidad_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN unidades u ON p.unidad_id = u.id
        WHERE p.stock_actual <= p.stock_minimo AND p.activo = 1
        ORDER BY p.stock_actual ASC
    ''')
    productos = cursor.fetchall()
    conn.close()
    return productos