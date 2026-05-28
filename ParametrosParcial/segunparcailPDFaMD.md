
SEGUNDO EXAMEN PARCIAL SITEMAS DE INFORMACION 1 - SA
DESARROLLO DE APLICACIÓN WEB EN PHP
APICACION WEB DE ADMISION UNIVERSITARIA (CUP) PARA LA FICCT
La Facultad de la FICCT (Facultad de Ingeniería de Ciencias de la Computación y
Telecomunicaciones) desea desarrollar un sistema web para administrar el proceso de
ingreso de estudiantes al curso preuniversitario.
Los postulantes deberán cumplir los requisitos: Titulo Bachiller y otros,......
Si cumplen los requisitos, entonces efectuaran el pago mediante alguna pasarela de
pagos y luego procederan a registrarse en el sistema, la facultad de acuerdo a la canƟdad
de alumnos inscritos, los organiza por grupo, les asignan los horarios, docentes, aula,
materias para la asistencia a clase. Tienen que rendir evaluaciones en las siguientes
áreas:
 Computación
 MatemáƟcas
 Inglés
 Física
Cada estudiante rendirá únicamente 3 exámenes por materia, definidos los
porcentajes por la administración académica.
Los postulantes que obtengan una nota final mayor o igual a 60 puntos serán
considerados APROBADOS.
Además, la facultad necesita calcular automáƟcamente cuántos grupos se habilitarán
para el curso preuniversitario, considerando que:
 Cada grupo admite máximo 70 estudiantes.
 El sistema debe calcular automáƟcamente la canƟdad de grupos necesarios
según la canƟdad total de inscritos.
La facultad también realiza la contratación de los docentes, si cumplen con los
requisitos de ser profesional en el área, maestría y diplomado en educación superior es
contratado para dar las clases en algún grupo de materias, podrán ser asignado desde
1 hasta 4 grupos.
OBJETIVO DEL EXAMEN
Los estudiantes deberán analizar, diseñar y desarrollar una aplicación web completa
que permita administrar el proceso de inscripción, evaluación y admisión universitaria.

2
REQUERIMIENTOS FUNCIONALES
1. MÓDULO DE AUTENTICACIÓN
El sistema deberá permiƟr:
Usuario Administrador
 Inicio de sesión seguro
 Cerrar sesión
 Recuperación básica de contraseña (opcional)
Validaciones
 Usuario obligatorio
 Contraseña obligatoria
 Control de sesiones
2. MÓDULO DE REGISTRO DE POSTULANTES
El sistema deberá permiƟr registrar postulantes con los siguientes datos:
Datos requeridos
 CI
 Nombres Apellidos
 Fecha de nacimiento
 Sexo
 Dirección
 Teléfono
 Correo electrónico
 Colegio de procedencia
 Ciudad
 Carrera a la que postula
 Título de bachiller
 Otros
Funcionalidades
 Registrar postulante

3
 Modificar datos
 Eliminar registro
 Buscar postulante
 Listar postulantes
Validaciones
 No permiƟr CI duplicado
 Validar correo electrónico
 Validar campos vacíos
3. MÓDULO DE EXÁMENES
El sistema deberá registrar las notas de:
 Computación
 MatemáƟcas
 Inglés
 Física
Reglas del negocio
 Solo se toman 3 exámenes por estudiante.
 Las notas deben estar entre 0 y 100.
 El sistema debe calcular automáƟcamente:
o Promedio final
o Estado del postulante
Estado del postulante
 APROBADO → promedio >= 60
 REPROBADO → promedio < 60
Cada carrera maneja un cupo de canƟdad alumnos admiƟdos por gesƟón, si los
cupos están se llenan en la primer carrera elegida por el alumno, entonces será
admiƟdo en su segunda opción de carrera.
Funcionalidades
 Registrar notas
 Editar notas
 Mostrar promedio

4
 Mostrar estado final
4. MÓDULO DE ASIGNACIÓN DE GRUPOS
La facultad necesita organizar grupos para el curso de nivelación.
Reglas
 Cada grupo tendrá máximo 70 estudiantes.
 El sistema debe calcular automáƟcamente:
o CanƟdad total de inscritos
o CanƟdad de grupos habilitados
Ejemplo
Inscritos Grupos
70 1
71 2
140 2
141 3
Funcionalidades
 Mostrar total de inscritos
 Mostrar canƟdad de grupos
 Mostrar estudiantes por grupo
5. REPORTES
El sistema deberá generar reportes de:
Reportes obligatorios
 Lista general de postulantes
 Postulantes aprobados
 Postulantes reprobados
 Promedios generales
 CanƟdad de grupos habilitados
 EstadísƟcas por materia
 Docentes por grupos
 Grupos con mayor canƟdad de aprobados

5
Opcional
 Exportar PDF
 Exportar Excel u otros
 Generación y consulta de reportes mediante comandos de voz.
(procesamiento de audio y reconocimiento de voz con IA)
6. PANEL ADMINISTRATIVO
Debe incluir:
 Menú de navegación
 Dashboard principal
 Indicadores estadísƟcos:
o Total inscritos
o Total aprobados
o Total reprobados
o Total grupos habilitados
REQUERIMIENTOS TÉCNICOS
Frontend HTML5, CSS3, JavaScript, React o Vue.js, Bootstrap/TailwindCSS.
Backend PHP (Laravel).
Base de datos PostgreSQL.
Despliegue En la nube (no localhost) AWS, Azure o Google cloude, otros
Generación de cuentas de usuarios:
El sistema debe generar automáticamente las cuentas para cada usuario a partir de
datos que se le entreguen al sistema en cada gestión académica que puede ser en lotes
(Excel /CSV) que entregara la administración de la facultad, para que sea cargada a la
base de datos de la aplicación desde una app web.
Cuentas individuales para docente, autoridades, coordinador y otros. Los docentes solo
pueden ver datos de su carga horaria, registrar asistencia, ....... y así asignaran los otros
privilegios para cada perfil a los usuarios de la app web.
Nota: Las funcionalidades descritas son las esenciales, cada grupo puede agregar otras
funcionalidades si ve conveniente como también la compresión de la temáƟca y la
solución a implementar es parte de la evaluación del presente examen
Se evaluará:

6
Backend
 Uso correcto de PHP
 Conexión a PostgreSQL.
 CRUD completo
 Validaciones
 Seguridad básica
Frontend
 Diseño responsive
 Interfaz amigable
 Formularios funcionales
Lógica de programación
 Cálculo de promedio
 Cálculo de grupos
 Validaciones de negocio
ALGORITMOS IMPORTANTES A IMPLEMENTAR
1. Cálculo de Promedio
Promedio = (Nota1 + Nota2 + Nota3) / 3
Condición
Si promedio >= 60
→ APROBADO
Caso contrario
→ REPROBADO
2. Cálculo de CanƟdad de Grupos
Fórmula
CanƟdadGrupos = CEIL(TotalInscritos / 80)
Ejemplo:
𝐺𝑟𝑢𝑝𝑜𝑠 = ඄𝑇𝑜𝑡𝑎𝑙 𝐼𝑛𝑠𝑐𝑟𝑖𝑡𝑜𝑠
80 ඈ
REQUERIMIENTOS ADICIONALES
El sistema deberá:
 Tener diseño profesional
 Usar validaciones JavaScript y PHP
 Manejar errores correctamente
 Tener comentarios en el código
 Aplicar buenas prácƟcas de programación
DOCUMENTACION
CARATULA: TITULO DE LA APP WEB, # GRUPO, INTEGRANTES,..........
TABLA DE CONTENIDO (INDICE ACTUALIZADO EN CADA PRESENTACION)
1) PERFIL
1.1 INTRODUCCION
1.2 OBJETITIVOS
ObjeƟvo General
ObjeƟvo Especifico
1.3 DESCRIPCION DEL PROBLEMA
1.4 ALCANCE
2) MARCO TEORICO
3) MODELO DE NEGOCIO
4) FT CAPTURA DE REQUISITOS
5) FT. ANALISIS
6) FT. DISEÑO
6.1) Diseño de Arquitectura (Física y Lógica)
6.2) Diseñar Caso de Uso (Diagrama de Secuencia)
6.2) Diseño de Datos (Lógico y İsico)
7) FT. IMPLEMENTACION
7.1) Herramientas de desarrollo de la aplicación WEB
7.2) Implementación de la Arquitectura del Sistema
7.3) Implementación de la Arquitectura del Subsistemas

8
CONCLUSION
RECOMENDACIÓN
BIBLIOGRAFIA
Código fuente organizado y comentado publicado Github y entregar URL + Código QR
para acceder a su repositorio
ANEXOS
SEGUNDO EXAMEN PARCIAL DEFENSA: JUEVES 11 DE JUNIO
ENVIAR DOCUMENTO A LA PLATAFORMA
PRESENTACION 1 DOMINGO 31/05/2026 23:59 (Avance >=50% Ciclo #1)
PRESENTACION 2 MARTES 09/06/2026 23:59 (Completo 100% Ciclo #2)
