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
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    # En una aplicación real, deberías usar bcrypt o similar
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