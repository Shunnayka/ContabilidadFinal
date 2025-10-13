from datetime import datetime
import os
from flask import Flask, jsonify, render_template, request, redirect, url_for, session, flash
import hashlib
import re
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
from database import (
    add_employee, create_tables, delete_employee, get_all_employees, 
    get_db_connection, get_employee_by_id, get_user_by_username, update_employee, 
    verify_password, create_user_with_auto_role, 
    get_user_count, update_user_password, get_email_by_username,
    create_inventory_tables, get_all_unidades, add_unidad, update_unidad, delete_unidad,
    get_all_categorias, add_categoria, update_categoria, delete_categoria,
    get_all_productos, add_producto, update_producto, delete_producto,
    get_producto_by_id, get_productos_bajo_stock
)
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Cambia por una clave segura

# Configuración SMTP (actualiza con tus datos)
SMTP_CONFIG = {
    'server': 'smtp.gmail.com',
    'port': 587,
    'username': 'davidorbep@gmail.com',
    'password': 'adte shun dffa aqcr',
    'from_email': 'davidorbep@gmail.com',
    'from_name': 'Sistema Contalogic'
}

def is_smtp_configured():
    return SMTP_CONFIG['username'] != 'tucorreo@gmail.com' and SMTP_CONFIG['password'] != 'tucontraseña_de_aplicacion'

def send_recovery_email(to_email, recovery_code):
    """Enviar email de recuperación"""
    if not is_smtp_configured():
        print(f"SIMULACIÓN: Email enviado a {to_email} con código: {recovery_code}")
        return True
    
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{SMTP_CONFIG['from_name']} <{SMTP_CONFIG['from_email']}>"
        msg['To'] = to_email
        msg['Subject'] = "Código de Recuperación - Contalogic"
        
        body = f"""
        <h2>Recuperación de Contraseña - Contalogic</h2>
        <p>Tu código de verificación es: <strong>{recovery_code}</strong></p>
        <p><em>Este código expira en 10 minutos.</em></p>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_CONFIG['server'], SMTP_CONFIG['port'])
        server.starttls()
        server.login(SMTP_CONFIG['username'], SMTP_CONFIG['password'])
        server.send_message(msg)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Error enviando email: {e}")
        print(f"SIMULACIÓN: Código para {to_email}: {recovery_code}")
        return True


# Rutas de autenticación - CORREGIDA
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '').strip()
            
            print(f"Intento de login para usuario: {username}")  # Debug
            
            if not username or not password:
                flash('Usuario y contraseña son obligatorios', 'error')
                return render_template('login.html')
            
            user = get_user_by_username(username)
            
            if user and verify_password(user['contraseña'], password):
                # Determinar automáticamente el rol
                role = determine_user_role(user)
                print(f"Usuario {username} autenticado como: {role}")  # Debug
                
                session['logged_in'] = True
                session['user_id'] = user['id']
                session['username'] = user['usuario']
                session['user_role'] = role
                flash('Inicio de sesión exitoso', 'success')
                return redirect(url_for('home'))
            else:
                flash('Credenciales incorrectas', 'error')
        
        except Exception as e:
            print(f"Error en login: {str(e)}")  # Debug
            import traceback
            traceback.print_exc()  # Esto mostrará el error completo en la terminal
            flash('Error interno del servidor. Por favor, intenta nuevamente.', 'error')
    
    return render_template('login.html')

def determine_user_role(user):
    """
    Determina automáticamente el rol del usuario basado en:
    - Campos específicos en la base de datos
    - Lista de usuarios administradores
    - Patrones en el username
    - Permisos específicos
    """

    # Método 1: Si tienes un campo 'admin' en la base de datos
    if 'admin' in user.keys() and user['admin']:
        return 'Administrador'
    # Por defecto, es empleado
    return 'Empleado'

# Decorador para requerir inicio de sesión
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Decorador para requerir rol de administrador
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('user_role') != 'Administrador':
            flash('No tiene permisos para acceder a esta página', 'error')
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    if 'logged_in' in session:
        return redirect(url_for('home'))
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        try:
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '').strip()
            confirm_password = request.form.get('confirm_password', '').strip()
            email = request.form.get('email', '').strip()
            
            # Validaciones básicas
            if not all([username, password, confirm_password, email]):
                flash('Todos los campos son obligatorios', 'error')
                return render_template('register.html')
            
            if password != confirm_password:
                flash('Las contraseñas no coinciden', 'error')
                return render_template('register.html')
            
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                flash('Formato de correo electrónico inválido', 'error')
                return render_template('register.html')
            
            # Verificar fortaleza de contraseña
            if (len(password) < 8 or not re.search(r'[A-Z]', password) or 
                not re.search(r'[a-z]', password) or not re.search(r'[0-9]', password)):
                flash('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número', 'error')
                return render_template('register.html')
            
            # Crear usuario con rol automático
            success, role = create_user_with_auto_role(username, password, email)
            
            if success:
                flash(f'Usuario registrado correctamente como {role}', 'success')
                return redirect(url_for('login'))
            else:
                flash('El usuario o correo ya existen', 'error')
                
        except Exception as e:
            print(f"Error en registro: {str(e)}")
            import traceback
            traceback.print_exc()
            flash(f'Error al registrar usuario: {str(e)}', 'error')
    return render_template('register.html')

@app.route('/password_recovery', methods=['GET', 'POST'])
def password_recovery():
    if request.method == 'POST':
        step = request.form.get('step', '1')
        
        if step == '1':
            username = request.form['username']
            session['recovery_username'] = username
            
            # Buscar email del usuario
            user_email = get_email_by_username(username)
            
            if user_email:
                # Generar código de recuperación
                recovery_code = str(random.randint(100000, 999999))
                session['recovery_code'] = recovery_code
                
                # Enviar email
                def send_email():
                    send_recovery_email(user_email, recovery_code)
                
                threading.Thread(target=send_email, daemon=True).start()
                
                flash('Se ha enviado un código de verificación a su correo', 'info')
                return render_template('password_recovery.html', step=2, username=username, email=user_email)
            else:
                # Por seguridad, no revelamos si el usuario existe
                flash('Si el usuario existe, se ha enviado un código de verificación', 'info')
                return render_template('password_recovery.html', step=2, username=username, email='usuario@ejemplo.com')
        
        elif step == '2':
            code = request.form['code']
            if code == session.get('recovery_code'):
                return render_template('password_recovery.html', step=3, username=session.get('recovery_username'))
            else:
                flash('Código de verificación incorrecto', 'error')
                return render_template('password_recovery.html', step=2, username=session.get('recovery_username'))
        
        elif step == '3':
            password = request.form['password']
            confirm_password = request.form['confirm_password']
            username = session.get('recovery_username')
            
            if password != confirm_password:
                flash('Las contraseñas no coinciden', 'error')
                return render_template('password_recovery.html', step=3, username=username)
            
            # Validar fortaleza de contraseña
            if (len(password) < 8 or not re.search(r'[A-Z]', password) or 
                not re.search(r'[a-z]', password) or not re.search(r'[0-9]', password)):
                flash('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número', 'error')
                return render_template('password_recovery.html', step=3, username=username)
            
            # Actualizar contraseña
            from database import update_user_password
            if update_user_password(username, password):
                flash('Contraseña actualizada correctamente', 'success')
                return redirect(url_for('login'))
            else:
                flash('Error al actualizar contraseña', 'error')
    
    return render_template('password_recovery.html', step=1)

@app.route('/logout')
def logout():
    session.clear()
    flash('Sesión cerrada exitosamente', 'success')
    return redirect(url_for('login'))

@app.route('/home')
@login_required
def home():
    return render_template('home.html')

@app.route('/empleados')
@login_required
def empleados():
    employees = get_all_employees()
    return render_template('empleados.html', employees=employees)

@app.route('/empleados/datos/<int:empleado_id>')
def obtener_datos_empleado(empleado_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, nombres, apellidos, cedula, fecha_ingreso, salario 
            FROM empleados WHERE id = ?
        """, (empleado_id,))
        
        empleado = cursor.fetchone()
        conn.close()
        
        if empleado:
            return jsonify({
                'id': empleado['id'],
                'nombres': empleado['nombres'],
                'apellidos': empleado['apellidos'],
                'cedula': empleado['cedula'],
                'fecha_ingreso': empleado['fecha_ingreso'],
                'salario': empleado['salario']
            })
        else:
            return jsonify({'error': 'Empleado no encontrado'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/empleados/agregar', methods=['POST'])
@login_required
def agregar_empleado():
    if request.method == 'POST':
        nombres = request.form['nombres']
        apellidos = request.form['apellidos']
        cedula = request.form['cedula']
        correo = request.form['correo']
        cargo = request.form['cargo']
        salario = float(request.form['salario'])
        fecha_ingreso = request.form['fecha_ingreso']
        
        if add_employee(nombres, apellidos, cedula, correo, cargo, salario, fecha_ingreso):
            flash('Empleado agregado exitosamente', 'success')
        else:
            flash('Error al agregar empleado. La cédula podría ya existir.', 'error')
        
        return redirect(url_for('empleados'))

@app.route('/empleados/editar/<int:id>', methods=['POST'])
@login_required
def editar_empleado(id):
    if request.method == 'POST':
        nombres = request.form['nombres']
        apellidos = request.form['apellidos']
        cedula = request.form['cedula']
        correo = request.form['correo']
        cargo = request.form['cargo']
        salario = float(request.form['salario'])
        fecha_ingreso = request.form['fecha_ingreso']
        activo = 'activo' in request.form
        
        if update_employee(id, nombres, apellidos, cedula, correo, cargo, salario, fecha_ingreso, activo):
            flash('Empleado actualizado exitosamente', 'success')
        else:
            flash('Error al actualizar empleado', 'error')
        
        return redirect(url_for('empleados'))

@app.route('/empleados/eliminar/<int:id>')
@login_required
def eliminar_empleado(id):
    if delete_employee(id):
        flash('Empleado eliminado exitosamente', 'success')
    else:
        flash('Error al eliminar empleado', 'error')
    
    return redirect(url_for('empleados'))

@app.route('/rol_pagos')
@login_required
def rol_pagos():
    # Obtener parámetros de filtro
    empleado_id = request.args.get('empleado_id', '')
    mes = request.args.get('mes', '')
    ano = request.args.get('ano', '')
    
    # Construir consulta
    query = """
    SELECT rp.*, e.nombres || ' ' || e.apellidos as empleado_nombre, e.id as empleado_id
    FROM rol_pagos rp
    JOIN empleados e ON rp.empleado_id = e.id
    WHERE e.activo = 1
    """
    
    params = []
    
    if empleado_id:
        query += " AND rp.empleado_id = ?"
        params.append(int(empleado_id))
    
    if mes:
        query += " AND rp.mes = ?"
        params.append(int(mes))
    
    if ano:
        query += " AND rp.año = ?"
        params.append(int(ano))
    
    query += " ORDER BY rp.año DESC, rp.mes DESC, e.apellidos, e.nombres"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    roles = cursor.fetchall()
    
    # Obtener lista de empleados para el filtro
    cursor.execute("SELECT id, nombres, apellidos FROM empleados WHERE activo = 1 ORDER BY apellidos, nombres")
    empleados = cursor.fetchall()
    
    conn.close()
    
    # Fecha actual para valores por defecto
    now = datetime.now()
    
    return render_template('rol_pagos.html', 
                         roles=roles,
                         empleados=empleados,
                         current_day=now.day,
                         current_month=now.month,
                         current_year=now.year)

@app.route('/rol_pagos/crear', methods=['POST'])
@login_required
def crear_rol():
    if request.method == 'POST':
        try:
            # Obtener datos del formulario
            empleado_id = request.form['empleado_id']
            dia = request.form['dia']
            mes = request.form['mes']
            ano = request.form['ano']
            sueldo = float(request.form['sueldo'])
            dias_trabajo = float(request.form['dias_trabajo'])
            
            # Otros campos con valores por defecto
            bonificacion = float(request.form.get('bonificacion', 0))
            transporte = float(request.form.get('transporte', 0))
            alimentacion = float(request.form.get('alimentacion', 0))
            num_horas_extras = float(request.form.get('num_horas_extras', 0))
            tipo_horas_extras = request.form.get('tipo_horas_extras', 'Ordinarias')
            otros_ingresos = float(request.form.get('otros_ingresos', 0))
            prestamos_iess = float(request.form.get('prestamos_iess', 0))
            impuesto_renta = float(request.form.get('impuesto_renta', 0))
            seguro_privado = float(request.form.get('seguro_privado', 0))
            comisariato = float(request.form.get('comisariato', 0))
            
            # Cálculos
            salario_hora = sueldo / 240
            valor_horas_extras = num_horas_extras * salario_hora * (1.5 if tipo_horas_extras == 'Ordinarias' else 2.0)
            
            # Décimos (asumimos mensual)
            decimo_tercero = sueldo / 12
            decimo_cuarto = 470 / 12  # SBU 2024
            
            # IESS (9.45%)
            base_iess = sueldo + bonificacion + valor_horas_extras
            iess = base_iess * 0.0945
            
            # Aporte patronal (11.15%)
            aporte_patronal = sueldo * 0.1115
            
            # Totales
            total_ingresos = (sueldo + bonificacion + transporte + alimentacion + 
                             decimo_tercero + decimo_cuarto + valor_horas_extras + otros_ingresos)
            
            total_egresos = iess + prestamos_iess + impuesto_renta + seguro_privado + comisariato
            liquido_pagar = total_ingresos - total_egresos
            
            # Guardar en base de datos (usando la estructura real)
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO rol_pagos 
                (empleado_id, dia, mes, año, sueldo, dias_trabajo, bonificacion, 
                transporte, alimentacion, horas_extras, tipo_horas_extras, 
                valor_horas_extras, otros_ingresos, decimo_tercero, decimo_cuarto,
                iess, prestamos_iess, impuesto_renta, seguro_privado, comisariato, 
                aporte_patronal, total_ingresos, total_egresos, liquido_pagar)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                empleado_id, dia, mes, ano, sueldo, dias_trabajo, bonificacion, 
                transporte, alimentacion, num_horas_extras, tipo_horas_extras, 
                valor_horas_extras, otros_ingresos, decimo_tercero, decimo_cuarto,
                iess, prestamos_iess, impuesto_renta, seguro_privado, comisariato, 
                aporte_patronal, total_ingresos, total_egresos, liquido_pagar
            ))
            
            conn.commit()
            conn.close()
            
            flash('Rol de pagos creado exitosamente', 'success')
            return redirect(url_for('rol_pagos'))
            
        except Exception as e:
            flash(f'Error al crear rol de pagos: {str(e)}', 'error')
            import traceback
            traceback.print_exc()
            return redirect(url_for('rol_pagos'))

@app.route('/actualizar_rol', methods=['POST'])
def actualizar_rol():
    # Obtener el ID del formulario
    id = request.form.get('edit_rol_id')
    if not id:
        return jsonify({"error": "ID no proporcionado"}), 400
    
    id = int(id)

    try:
        # Obtener datos del formulario
        rol_id = id
        empleado_id = request.form.get('empleado_id')
        dia = request.form.get('dia')
        mes = request.form.get('mes')
        ano = request.form.get('ano')
        sueldo = float(request.form.get('sueldo', 0))
        dias_trabajo = float(request.form.get('dias_trabajo', 0))
        bonificacion = float(request.form.get('bonificacion', 0))
        transporte = float(request.form.get('transporte', 0))
        alimentacion = float(request.form.get('alimentacion', 0))
        num_horas_extras = int(request.form.get('num_horas_extras', 0))
        tipo_horas_extras = request.form.get('tipo_horas_extras')
        otros_ingresos = float(request.form.get('otros_ingresos', 0))
        prestamos_iess = float(request.form.get('prestamos_iess', 0))
        impuesto_renta = float(request.form.get('impuesto_renta', 0))
        seguro_privado = float(request.form.get('seguro_privado', 0))
        comisariato = float(request.form.get('comisariato', 0))
        
        # Calcular valores derivados
        salario_hora = sueldo / 240
        valor_horas_extras = 0
        
        if tipo_horas_extras == 'Ordinarias':
            valor_horas_extras = num_horas_extras * salario_hora * 1.5
        elif tipo_horas_extras == 'Extraordinarias':
            valor_horas_extras = num_horas_extras * salario_hora * 2.0
        
        # Calcular décimos (usamos valores fijos ya que no tenemos los campos de configuración)
        decimo_tercero = sueldo / 12  # Asumimos mensual
        decimo_cuarto = 470 / 12      # SBU 2024, asumimos mensual
        
        # Calcular IESS
        base_iess = sueldo + bonificacion + valor_horas_extras
        iess = base_iess * 0.0945
        
        # Aporte patronal (11.15%)
        aporte_patronal = sueldo * 0.1115
        
        # Calcular totales
        total_ingresos = (sueldo + bonificacion + transporte + alimentacion + 
                         decimo_tercero + decimo_cuarto + valor_horas_extras + otros_ingresos)
        
        total_egresos = iess + prestamos_iess + impuesto_renta + seguro_privado + comisariato
        liquido_pagar = total_ingresos - total_egresos
        
        # Actualizar en la base de datos SQLite (usando la estructura real de tu tabla)
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE rol_pagos 
            SET empleado_id = ?, dia = ?, mes = ?, año = ?, sueldo = ?,
                dias_trabajo = ?, bonificacion = ?, transporte = ?, alimentacion = ?,
                horas_extras = ?, tipo_horas_extras = ?, valor_horas_extras = ?,
                otros_ingresos = ?, decimo_tercero = ?, decimo_cuarto = ?, 
                iess = ?, prestamos_iess = ?, impuesto_renta = ?, seguro_privado = ?, 
                comisariato = ?, aporte_patronal = ?, total_ingresos = ?, 
                total_egresos = ?, liquido_pagar = ?
            WHERE id = ?
        """, (
            empleado_id, dia, mes, ano, sueldo, dias_trabajo, bonificacion, 
            transporte, alimentacion, num_horas_extras, tipo_horas_extras, 
            valor_horas_extras, otros_ingresos, decimo_tercero, decimo_cuarto, 
            iess, prestamos_iess, impuesto_renta, seguro_privado, comisariato, 
            aporte_patronal, total_ingresos, total_egresos, liquido_pagar, rol_id
        ))
        
        conn.commit()
        conn.close()
        print ('hello2')
        
        flash('Rol de pagos actualizado correctamente', 'success')
        return redirect(url_for('rol_pagos'))
        
    except Exception as e:
        print ('hello')
        print(f"Error al actualizar rol: {e}")
        import traceback
        traceback.print_exc()
        flash('Error al actualizar el rol de pagos', 'error')
        return redirect(url_for('rol_pagos'))

@app.route('/rol_pagos/detalles/<int:rol_id>', methods=['GET'])
def obtener_detalles_rol(rol_id):
    try:    
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT r.*, e.nombres, e.apellidos, e.cedula, e.fecha_ingreso, e.salario
            FROM rol_pagos r 
            JOIN empleados e ON r.empleado_id = e.id 
            WHERE r.id = ?
        """, (rol_id,))
        
        rol = cursor.fetchone()
        print(rol)  # Debugging line to check the fetched data
        conn.close()
        
        if rol:
            return jsonify({
                'id': rol['id'],
                'empleado_id': rol['empleado_id'],
                'dia': rol['dia'],
                'mes': rol['mes'],
                'ano': rol['año'],  # Este campo sabemos que existe
                'sueldo': rol['sueldo'],
                'dias_trabajo': rol['dias_trabajo'],
                'bonificacion': rol['bonificacion'] if 'bonificacion' in rol else 0,
                'transporte': rol['transporte'] if 'transporte' in rol else 0,
                'alimentacion': rol['alimentacion'] if 'alimentacion' in rol else 0,
                'horas_extras': rol['horas_extras'] if 'horas_extras' in rol else 0,
                'tipo_horas_extras': rol['tipo_horas_extras'] if 'tipo_horas_extras' in rol else 'Ordinarias',
                'otros_ingresos': rol['otros_ingresos'] if 'otros_ingresos' in rol else 0,
                'prestamos_iess': rol['prestamos_iess'] if 'prestamos_iess' in rol else 0,
                'impuesto_renta': rol['impuesto_renta'] if 'impuesto_renta' in rol else 0,
                'seguro_privado': rol['seguro_privado'] if 'seguro_privado' in rol else 0,
                'comisariato': rol['comisariato'] if 'comisariato' in rol else 0
            })
        else:
            return jsonify({'error': 'Rol no encontrado'}), 404
            
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

# Agrega esta ruta temporal para verificar la estructura
@app.route('/debug/rol_pagos')
def debug_rol_pagos():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
            SELECT r.*, e.nombres, e.apellidos, e.cedula, e.fecha_ingreso, e.salario
            FROM rol_pagos r 
            JOIN empleados e ON r.empleado_id = e.id 
            WHERE r.id = ?
        """, (9,))
    roles = cursor.fetchall()
    conn.close()
    return jsonify([dict(rol) for rol in roles])

@app.route('/rol_pagos/eliminar', methods=['POST'])
@login_required
def eliminar_rol():
    if request.method == 'POST':
        rol_id = request.form['rol_id']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM rol_pagos WHERE id = ?", (rol_id,))
            conn.commit()
            flash('Rol de pagos eliminado exitosamente', 'success')
        except Exception as e:
            flash(f'Error al eliminar rol de pagos: {str(e)}', 'error')
        finally:
            conn.close()
        
        return redirect(url_for('rol_pagos'))

@app.route('/contabilidad')
@login_required
def contabilidad():
    # Obtener parámetros de filtro
    mes = request.args.get('mes', '')
    ano = request.args.get('ano', '')
    
    # Construir consulta
    query = """
    SELECT e.cedula, 
           e.nombres || ' ' || e.apellidos as nombre, 
           e.cargo,
           SUM(r.total_ingresos) as total_ingresos,
           SUM(r.total_egresos) as total_egresos,
           SUM(r.liquido_pagar) as liquido_pagar
    FROM empleados e
    JOIN rol_pagos r ON e.id = r.empleado_id
    WHERE e.activo = 1
    """
    
    params = []
    
    if mes:
        query += " AND r.mes = ?"
        params.append(int(mes))
    
    if ano:
        query += " AND r.año = ?"
        params.append(int(ano))
    
    query += " GROUP BY e.id ORDER BY e.apellidos, e.nombres"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    contabilidad_data = cursor.fetchall()
    
    # Calcular totales generales
    total_ingresos = sum(item['total_ingresos'] or 0 for item in contabilidad_data)
    total_egresos = sum(item['total_egresos'] or 0 for item in contabilidad_data)
    total_liquido = sum(item['liquido_pagar'] or 0 for item in contabilidad_data)
    
    totales = {
        'total_ingresos': total_ingresos,
        'total_egresos': total_egresos,
        'total_liquido': total_liquido
    }
    
    conn.close()
    
    return render_template('contabilidad.html', 
                         contabilidad_data=contabilidad_data,
                         totales=totales,
                         mes=mes,
                         ano=ano)

@app.route('/contabilidad/exportar')
@login_required
def exportar_contabilidad():
    # Esta ruta generaría un PDF (requiere librerías como ReportLab o WeasyPrint)
    mes = request.args.get('mes', '')
    ano = request.args.get('ano', '')
    
    # Simular generación de PDF
    # En una implementación real, aquí se generaría el PDF
    
    return f"PDF generado para mes: {mes}, año: {ano}", 200

@app.route('/usuarios')
@login_required
@admin_required
def usuarios():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, usuario, correo, cargo, fecha_registro FROM usuarios ORDER BY usuario")
    users = cursor.fetchall()
    conn.close()
    return render_template('usuarios.html', users=users)

@app.route('/usuarios/datos/<int:user_id>')
@login_required
@admin_required
def datos_usuario(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, usuario, correo, cargo FROM usuarios WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return {
            'id': user['id'],
            'usuario': user['usuario'],
            'correo': user['correo'],
            'cargo': user['cargo']
        }
    return {'error': 'Usuario no encontrado'}, 404

@app.route('/usuarios/modificar', methods=['POST'])
@login_required
@admin_required
def modificar_usuario():
    if request.method == 'POST':
        user_id = request.form['user_id']
        correo = request.form['correo']
        cargo = request.form['cargo']
        
        # Validaciones
        if not all([user_id, correo, cargo]):
            flash('Todos los campos son obligatorios', 'error')
            return redirect(url_for('usuarios'))
        
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', correo):
            flash('Formato de correo electrónico inválido', 'error')
            return redirect(url_for('usuarios'))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Verificar si el correo ya existe en otro usuario
            cursor.execute("SELECT COUNT(*) FROM usuarios WHERE correo = ? AND id != ?", 
                          (correo, user_id))
            if cursor.fetchone()[0] > 0:
                flash('El correo electrónico ya está en uso por otro usuario', 'error')
                return redirect(url_for('usuarios'))
            
            # Actualizar usuario
            cursor.execute(
                "UPDATE usuarios SET correo = ?, cargo = ? WHERE id = ?",
                (correo, cargo, user_id)
            )
            conn.commit()
            flash('Usuario actualizado correctamente', 'success')
            
        except Exception as e:
            flash(f'Error al actualizar usuario: {str(e)}', 'error')
        finally:
            conn.close()
        
        return redirect(url_for('usuarios'))

@app.route('/usuarios/eliminar', methods=['POST'])
@login_required
@admin_required
def eliminar_usuario():
    if request.method == 'POST':
        user_id = request.form['user_id']
        
        # No permitir eliminar el propio usuario
        if int(user_id) == session['user_id']:
            flash('No puede eliminar su propio usuario', 'error')
            return redirect(url_for('usuarios'))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM usuarios WHERE id = ?", (user_id,))
            conn.commit()
            flash('Usuario eliminado correctamente', 'success')
        except Exception as e:
            flash(f'Error al eliminar usuario: {str(e)}', 'error')
        finally:
            conn.close()
        
        return redirect(url_for('usuarios'))
    
# Rutas para Inventario
@app.route('/inventario')
@login_required
def inventario():
    return redirect(url_for('productos'))

# Rutas para Unidades
@app.route('/inventario/unidades')
@login_required
def unidades():
    unidades_list = get_all_unidades()
    return render_template('unidades.html', unidades=unidades_list)

@app.route('/inventario/unidades/agregar', methods=['POST'])
@login_required
def agregar_unidad():
    if request.method == 'POST':
        nombre = request.form['nombre']
        abreviatura = request.form['abreviatura']
        
        if add_unidad(nombre, abreviatura):
            flash('Unidad agregada exitosamente', 'success')
        else:
            flash('Error al agregar unidad. El nombre o abreviatura podrían ya existir.', 'error')
        
        return redirect(url_for('unidades'))

@app.route('/inventario/unidades/editar/<int:id>', methods=['POST'])
@login_required
def editar_unidad(id):
    if request.method == 'POST':
        nombre = request.form['nombre']
        abreviatura = request.form['abreviatura']
        activo = 'activo' in request.form
        
        if update_unidad(id, nombre, abreviatura, activo):
            flash('Unidad actualizada exitosamente', 'success')
        else:
            flash('Error al actualizar unidad', 'error')
        
        return redirect(url_for('unidades'))

@app.route('/inventario/unidades/eliminar/<int:id>')
@login_required
def eliminar_unidad(id):
    if delete_unidad(id):
        flash('Unidad eliminada exitosamente', 'success')
    else:
        flash('Error al eliminar unidad', 'error')
    
    return redirect(url_for('unidades'))

# Rutas para Categorías
@app.route('/inventario/categorias')
@login_required
def categorias():
    categorias_list = get_all_categorias()
    return render_template('categorias.html', categorias=categorias_list)

@app.route('/inventario/categorias/agregar', methods=['POST'])
@login_required
def agregar_categoria():
    if request.method == 'POST':
        nombre = request.form['nombre']
        descripcion = request.form['descripcion']
        
        if add_categoria(nombre, descripcion):
            flash('Categoría agregada exitosamente', 'success')
        else:
            flash('Error al agregar categoría. El nombre podría ya existir.', 'error')
        
        return redirect(url_for('categorias'))

@app.route('/inventario/categorias/editar/<int:id>', methods=['POST'])
@login_required
def editar_categoria(id):
    if request.method == 'POST':
        nombre = request.form['nombre']
        descripcion = request.form['descripcion']
        activo = 'activo' in request.form
        
        if update_categoria(id, nombre, descripcion, activo):
            flash('Categoría actualizada exitosamente', 'success')
        else:
            flash('Error al actualizar categoría', 'error')
        
        return redirect(url_for('categorias'))

@app.route('/inventario/categorias/eliminar/<int:id>')
@login_required
def eliminar_categoria(id):
    if delete_categoria(id):
        flash('Categoría eliminada exitosamente', 'success')
    else:
        flash('Error al eliminar categoría', 'error')
    
    return redirect(url_for('categorias'))

# Rutas para Productos
@app.route('/inventario/productos')
@login_required
def productos():
    productos_list = get_all_productos()
    categorias_list = get_all_categorias()
    unidades_list = get_all_unidades()
    productos_bajo_stock = get_productos_bajo_stock()
    
    return render_template('productos.html', 
                         productos=productos_list,
                         categorias=categorias_list,
                         unidades=unidades_list,
                         productos_bajo_stock=productos_bajo_stock)

@app.route('/inventario/productos/agregar', methods=['POST'])
@login_required
def agregar_producto():
    if request.method == 'POST':
        codigo = request.form['codigo']
        nombre = request.form['nombre']
        descripcion = request.form['descripcion']
        categoria_id = request.form['categoria_id']
        unidad_id = request.form['unidad_id']
        precio_compra = float(request.form['precio_compra'])
        precio_venta = float(request.form['precio_venta'])
        stock_minimo = int(request.form['stock_minimo'])
        stock_actual = int(request.form['stock_actual'])
        
        if add_producto(codigo, nombre, descripcion, categoria_id, unidad_id, 
                       precio_compra, precio_venta, stock_minimo, stock_actual):
            flash('Producto agregado exitosamente', 'success')
        else:
            flash('Error al agregar producto. El código podría ya existir.', 'error')
        
        return redirect(url_for('productos'))
    
# Ruta para editar producto - DEBE estar ANTES de la ruta de eliminar
@app.route('/inventario/productos/editar/<int:id>', methods=['POST'])
@login_required
def editar_producto(id):
    if request.method == 'POST':
        try:
            print(f"=== EDITAR PRODUCTO LLAMADO ===")
            print(f"Producto ID: {id}")
            print(f"Datos del formulario: {request.form}")
            
            codigo = request.form['codigo']
            nombre = request.form['nombre']
            descripcion = request.form['descripcion']
            categoria_id = request.form['categoria_id'] or None
            unidad_id = request.form['unidad_id']
            precio_compra = float(request.form['precio_compra'])
            precio_venta = float(request.form['precio_venta'])
            stock_minimo = int(request.form['stock_minimo'])
            stock_actual = int(request.form['stock_actual'])
            activo = 'activo' in request.form  

            print(f"Activo: {activo}")  # Debug

            # Llamar a la función de actualización
            success = update_producto(id, codigo, nombre, descripcion, categoria_id, unidad_id,
                                    precio_compra, precio_venta, stock_minimo, stock_actual, activo)
            
            if success:
                print("Producto actualizado exitosamente")
                # Devolver JSON para AJAX
                return jsonify({
                    'success': True, 
                    'message': 'Producto actualizado exitosamente'
                })
            else:
                print("Error en update_producto")
                return jsonify({
                    'success': False, 
                    'error': 'Error al actualizar producto. El código podría ya existir.'
                }), 400
            
        except Exception as e:
            print(f"Error en editar_producto: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False, 
                'error': f'Error interno del servidor: {str(e)}'
            }), 500
        
# Ruta para eliminar producto - DEBE estar DESPUÉS de la ruta de editar
@app.route('/inventario/productos/eliminar/<int:id>', methods=['POST'])
def eliminar_producto(id):
    print(f"=== ELIMINAR PRODUCTO LLAMADO ===")
    print(f"Producto ID: {id}")
    try:
        print(f"Eliminando producto ID: {id}")  # Debug
        
        if delete_producto(id):
            return jsonify({'success': True, 'message': 'Producto eliminado exitosamente'})
        else:
            return jsonify({'success': False, 'error': 'Error al eliminar producto'}), 400
    except Exception as e:
        print(f"Error en eliminar_producto: {str(e)}")  # Debug
        return jsonify({'success': False, 'error': str(e)}), 500

# Rutas para obtener datos de categorías y unidades (JSON)
@app.route('/inventario/categorias/listar')
@login_required
def listar_categorias():
    try:
        categorias = get_all_categorias()
        # Convertir a formato JSON amigable
        categorias_list = []
        for cat in categorias:
            categorias_list.append({
                'id': cat['id'],
                'nombre': cat['nombre'],
                'descripcion': cat['descripcion'],
                'activo': bool(cat['activo'])
            })
        return jsonify(categorias_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/inventario/unidades/listar')
@login_required
def listar_unidades():
    try:
        unidades = get_all_unidades()
        # Convertir a formato JSON amigable
        unidades_list = []
        for und in unidades:
            unidades_list.append({
                'id': und['id'],
                'nombre': und['nombre'],
                'abreviatura': und['abreviatura'],
                'activo': bool(und['activo'])
            })
        return jsonify(unidades_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/inventario/productos/tabla')
@login_required
def productos_tabla():
    """Endpoint para cargar solo la tabla de productos via AJAX"""
    productos_list = get_all_productos()
    return render_template('partials/productos_table.html', productos=productos_list)
    
@app.route('/inventario/productos/datos/<int:producto_id>')
def obtener_datos_producto(producto_id):
    try:
        producto = get_producto_by_id(producto_id)
        
        if producto:
            return jsonify({
                'id': producto['id'],
                'codigo': producto['codigo'],
                'nombre': producto['nombre'],
                'descripcion': producto['descripcion'],
                'categoria_id': producto['categoria_id'],
                'unidad_id': producto['unidad_id'],
                'precio_compra': float(producto['precio_compra']),
                'precio_venta': float(producto['precio_venta']),
                'stock_minimo': producto['stock_minimo'],
                'stock_actual': producto['stock_actual'],
                'activo': bool(producto['activo'])
            })
        else:
            return jsonify({'error': 'Producto no encontrado'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    create_tables()
    create_inventory_tables()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
