import sqlite3
import shutil
import uuid
import datetime

db_path = r"c:\Users\User\Documents\1-2026\proto\2do_Parcial_SI_intento\diagramas\diagramas.qea"
backup_path = r"c:\Users\User\Documents\1-2026\proto\2do_Parcial_SI_intento\diagramas\diagramas_backup.qea"

# 1. Back up database
print("Backing up diagramas.qea to diagramas_backup.qea...")
shutil.copyfile(db_path, backup_path)
print("Backup created successfully.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def get_uuid():
    return "{" + str(uuid.uuid4()).upper() + "}"

def get_now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

try:
    # A) Class Diagram 223
    print("\n--- Modifying Class Diagram 223 ---")
    
    # 1. Add operation +RenderizarTablaNotas() to InterfazDashboard (1294)
    cursor.execute("""
        INSERT INTO t_operation (Object_ID, Name, Scope, Type, ea_guid, Pos, Pure, IsRoot, IsLeaf, IsQuery)
        VALUES (1294, 'RenderizarTablaNotas()', 'Public', 'void', ?, 0, 0, 0, 0, 0)
    """, (get_uuid(),))
    print("Added RenderizarTablaNotas() to InterfazDashboard")

    # 2. Add operation +getNotasIndividuales(postulanteId) to ControladorReportes (1295)
    cursor.execute("""
        INSERT INTO t_operation (Object_ID, Name, Scope, Type, ea_guid, Pos, Pure, IsRoot, IsLeaf, IsQuery)
        VALUES (1295, 'getNotasIndividuales(postulanteId)', 'Public', 'Collection', ?, 0, 0, 0, 0, 0)
    """, (get_uuid(),))
    print("Added getNotasIndividuales(postulanteId) to ControladorReportes")

    # 3. Create Actor 'Postulante' in Package 83
    guid_actor_postulante_83 = get_uuid()
    cursor.execute("""
        INSERT INTO t_object (Object_Type, Diagram_ID, Name, Version, Package_ID, ea_guid, CreatedDate, ModifiedDate, Status, Scope)
        VALUES ('Actor', 0, 'Postulante', '1.0', 83, ?, ?, ?, 'Proposed', 'Public')
    """, (guid_actor_postulante_83, get_now(), get_now()))
    actor_postulante_83_id = cursor.lastrowid
    print(f"Created Actor Postulante in Package 83, ID: {actor_postulante_83_id}")

    # 4. Create Class 'Examen' in Package 83
    guid_examen_class_83 = get_uuid()
    cursor.execute("""
        INSERT INTO t_object (Object_Type, Diagram_ID, Name, Version, Package_ID, Stereotype, ea_guid, CreatedDate, ModifiedDate, Status, Scope)
        VALUES ('Class', 0, 'Examen', '1.0', 83, 'Entity', ?, ?, ?, 'Proposed', 'Public')
    """, (guid_examen_class_83, get_now(), get_now()))
    examen_class_83_id = cursor.lastrowid
    print(f"Created Class Examen in Package 83, ID: {examen_class_83_id}")

    # 5. Add attributes to class Examen in t_attribute
    examen_attributes = [
        ('id', 'integer'),
        ('postulante_id', 'integer'),
        ('materia_id', 'integer'),
        ('numero_examen', 'integer'),
        ('nota', 'decimal')
    ]
    for name, attr_type in examen_attributes:
        cursor.execute("""
            INSERT INTO t_attribute (Object_ID, Name, Scope, IsStatic, IsCollection, IsOrdered, AllowDuplicates, Pos, Type, ea_guid)
            VALUES (?, ?, 'Public', 0, 0, 0, 0, 0, ?, ?)
        """, (examen_class_83_id, name, attr_type, get_uuid()))
    print("Added attributes to Class Examen")

    # 6. Put Postulante Actor on Diagram 223
    cursor.execute("""
        INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectLeft, RectTop, RectRight, RectBottom)
        VALUES (223, ?, 50, -300, 90, -380)
    """, (actor_postulante_83_id,))
    
    # 7. Put Examen Class on Diagram 223
    cursor.execute("""
        INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectLeft, RectTop, RectRight, RectBottom)
        VALUES (223, ?, 840, -550, 1060, -710)
    """, (examen_class_83_id,))
    print("Placed Actor Postulante and Class Examen on Diagram 223")

    # 8. Add connector of type 'Association' between Postulante Actor and InterfazDashboard (1294)
    cursor.execute("""
        INSERT INTO t_connector (Name, Direction, Connector_Type, SourceAccess, DestAccess, SourceIsAggregate, SourceIsOrdered, DestIsAggregate, DestIsOrdered, Start_Object_ID, End_Object_ID, DiagramID, ea_guid, SourceIsNavigable, DestIsNavigable, IsRoot, IsLeaf, SourceChangeable, DestChangeable, SourceStyle, DestStyle)
        VALUES ('', 'Source -> Destination', 'Association', 'Public', 'Public', 0, 0, 0, 0, ?, 1294, 223, ?, 0, 0, 0, 0, 'none', 'none', 'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;', 'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;')
    """, (actor_postulante_83_id, get_uuid()))

    # 9. Add connector of type 'Association' between ControladorReportes (1295) and Examen Class
    cursor.execute("""
        INSERT INTO t_connector (Name, Direction, Connector_Type, SourceAccess, DestAccess, SourceIsAggregate, SourceIsOrdered, DestIsAggregate, DestIsOrdered, Start_Object_ID, End_Object_ID, DiagramID, ea_guid, SourceIsNavigable, DestIsNavigable, IsRoot, IsLeaf, SourceChangeable, DestChangeable, SourceStyle, DestStyle)
        VALUES ('', 'Source -> Destination', 'Association', 'Public', 'Public', 0, 0, 0, 0, 1295, ?, 223, ?, 0, 0, 0, 0, 'none', 'none', 'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;', 'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;')
    """, (examen_class_83_id, get_uuid()))
    print("Added associations in Class Diagram 223")


    # B) Communication Diagram 213 (Com_CU22)
    print("\n--- Modifying Communication Diagram 213 ---")
    
    # 1. Create Actor 'Postulante' in Package 89
    guid_actor_postulante_89 = get_uuid()
    cursor.execute("""
        INSERT INTO t_object (Object_Type, Diagram_ID, Name, Version, Package_ID, ea_guid, CreatedDate, ModifiedDate, Status, Scope)
        VALUES ('Actor', 0, 'Postulante', '1.0', 89, ?, ?, ?, 'Proposed', 'Public')
    """, (guid_actor_postulante_89, get_now(), get_now()))
    actor_postulante_89_id = cursor.lastrowid
    print(f"Created Actor Postulante in Package 89, ID: {actor_postulante_89_id}")

    # 2. Create Object 'CE_Examen' in Package 89
    guid_examen_object_89 = get_uuid()
    cursor.execute("""
        INSERT INTO t_object (Object_Type, Diagram_ID, Name, Version, Package_ID, ea_guid, CreatedDate, ModifiedDate, Status, Scope)
        VALUES ('Object', 0, 'CE_Examen', '1.0', 89, ?, ?, ?, 'Proposed', 'Public')
    """, (guid_examen_object_89, get_now(), get_now()))
    examen_object_89_id = cursor.lastrowid
    print(f"Created Object CE_Examen in Package 89, ID: {examen_object_89_id}")

    # 3. Put Postulante Actor on Diagram 213
    cursor.execute("""
        INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectLeft, RectTop, RectRight, RectBottom)
        VALUES (213, ?, 100, -450, 140, -530)
    """, (actor_postulante_89_id,))
    
    # 4. Put CE_Examen Object on Diagram 213
    cursor.execute("""
        INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectLeft, RectTop, RectRight, RectBottom)
        VALUES (213, ?, 729, -60, 819, -160)
    """, (examen_object_89_id,))
    print("Placed Actor Postulante and Object CE_Examen on Diagram 213")

    # Helper function to add sequence connectors for Communication diagram
    def add_comm_seq(name, seq_no, start_id, end_id):
        cursor.execute("""
            INSERT INTO t_connector (Name, Direction, Connector_Type, SourceAccess, DestAccess, SourceIsAggregate, SourceIsOrdered, DestIsAggregate, DestIsOrdered, Start_Object_ID, End_Object_ID, SeqNo, DiagramID, ea_guid, SourceIsNavigable, DestIsNavigable, IsRoot, IsLeaf, SourceChangeable, DestChangeable, SourceStyle, DestStyle)
            VALUES (?, 'Source -> Destination', 'Sequence', 'Public', 'Public', 0, 0, 0, 0, ?, ?, ?, 213, ?, 0, 0, 0, 0, 'none', 'none', 'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;', 'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;')
        """, (name, start_id, end_id, seq_no, get_uuid()))

    # 5. Add communication sequence messages
    # IU_Dashboard ID is 1183, CTR_Reportes ID is 1184, CE_Postulante ID is 1185, CE_NotaFinal ID is 1186
    add_comm_seq('1.1: + AbrirDashboard()', 12, actor_postulante_89_id, 1183)
    add_comm_seq('2.1: + getNotasIndividuales(postulanteId)', 13, 1183, 1184)
    add_comm_seq('3.1: + find(postulanteId)', 14, 1184, 1185)
    add_comm_seq('4.1: + datosPostulante', 15, 1185, 1184)
    add_comm_seq('5.1: + getExamenes(postulanteId)', 16, 1184, examen_object_89_id)
    add_comm_seq('6.1: + notasExamenes', 17, examen_object_89_id, 1184)
    add_comm_seq('7.1: + getNotasFinales(postulanteId)', 18, 1184, 1186)
    add_comm_seq('8.1: + promediosFinales', 19, 1186, 1184)
    add_comm_seq('9.1: + EnviarNotasIndividuales()', 20, 1184, 1183)
    add_comm_seq('10.1: + RenderizarTablaNotas()', 21, 1183, actor_postulante_89_id)
    print("Added communication sequence messages on Diagram 213")


    # C) Sequence Diagram 272 (Seq_CU22)
    print("\n--- Modifying Sequence Diagram 272 ---")
    
    # 1. Create Actor 'Postulante' (Sequence lifeline) in Package 106
    guid_lifeline_postulante = get_uuid()
    cursor.execute("""
        INSERT INTO t_object (Object_Type, Diagram_ID, Name, Version, Package_ID, ea_guid, CreatedDate, ModifiedDate, Status, Scope)
        VALUES ('Sequence', 0, 'Postulante', '1.0', 106, ?, ?, ?, 'Proposed', 'Public')
    """, (guid_lifeline_postulante, get_now(), get_now()))
    lifeline_postulante_id = cursor.lastrowid
    print(f"Created Lifeline Postulante, ID: {lifeline_postulante_id}")

    # 2. Create Object 'CE_Examen' (Sequence lifeline) in Package 106
    guid_lifeline_examen = get_uuid()
    cursor.execute("""
        INSERT INTO t_object (Object_Type, Diagram_ID, Name, Version, Package_ID, ea_guid, CreatedDate, ModifiedDate, Status, Scope)
        VALUES ('Sequence', 0, 'CE_Examen', '1.0', 106, ?, ?, ?, 'Proposed', 'Public')
    """, (guid_lifeline_examen, get_now(), get_now()))
    lifeline_examen_id = cursor.lastrowid
    print(f"Created Lifeline CE_Examen, ID: {lifeline_examen_id}")

    # 3. Add them to Diagram 272
    cursor.execute("""
        INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectLeft, RectTop, RectRight, RectBottom)
        VALUES (272, ?, 1180, -50, 1300, -900)
    """, (lifeline_postulante_id,))
    
    cursor.execute("""
        INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectLeft, RectTop, RectRight, RectBottom)
        VALUES (272, ?, 1360, -50, 1480, -900)
    """, (lifeline_examen_id,))

    # Update existing lifelines on Diagram 272 to extend their length down to -900
    cursor.execute("""
        UPDATE t_diagramobjects
        SET RectBottom = -900
        WHERE Diagram_ID = 272 AND Object_ID IN (1573, 1574, 1575, 1576, 1577, 1578);
    """)
    print("Placed new lifelines and extended existing lifelines on Diagram 272 to Y = -900")

    # Helper function to add sequence connectors for Sequence diagram
    # IU_Dashboard ID is 1574, CTR_Reportes ID is 1575, CE_Postulante ID is 1576, CE_NotaFinal ID is 1577
    def add_seq_msg(name, seq_no, start_id, end_id, y_coord, is_return=False):
        pdata4 = '1' if is_return else None
        cursor.execute("""
            INSERT INTO t_connector (Name, Direction, Connector_Type, SourceAccess, DestAccess, SourceIsAggregate, SourceIsOrdered, DestIsAggregate, DestIsOrdered, Start_Object_ID, End_Object_ID, SeqNo, DiagramID, ea_guid, PtStartX, PtStartY, PtEndX, PtEndY, PDATA4, SourceIsNavigable, DestIsNavigable, IsRoot, IsLeaf, SourceChangeable, DestChangeable, SourceStyle, DestStyle)
            VALUES (?, 'Source -> Destination', 'Sequence', 'Public', 'Public', 0, 0, 0, 0, ?, ?, ?, 272, ?, 0, ?, 0, ?, ?, 0, 0, 0, 0, 'none', 'none', 'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;', 'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;')
        """, (name, start_id, end_id, seq_no, get_uuid(), y_coord, y_coord, pdata4))

    # 4. Add sequence messages for the Postulante flow
    add_seq_msg('1.1: + AbrirDashboard()', 12, lifeline_postulante_id, 1574, -530)
    add_seq_msg('2.1: + getNotasIndividuales(postulanteId)', 13, 1574, 1575, -565)
    add_seq_msg('3.1: + find(postulanteId)', 14, 1575, 1576, -600)
    add_seq_msg('4.1: + datosPostulante', 15, 1576, 1575, -635, is_return=True)
    add_seq_msg('5.1: + getExamenes(postulanteId)', 16, 1575, lifeline_examen_id, -670)
    add_seq_msg('6.1: + notasExamenes', 17, lifeline_examen_id, 1575, -705, is_return=True)
    add_seq_msg('7.1: + getNotasFinales(postulanteId)', 18, 1575, 1577, -740)
    add_seq_msg('8.1: + promediosFinales', 19, 1577, 1575, -775, is_return=True)
    add_seq_msg('9.1: + EnviarNotasIndividuales()', 20, 1575, 1574, -810, is_return=True)
    add_seq_msg('10.1: + RenderizarTablaNotas()', 21, 1574, lifeline_postulante_id, -845, is_return=True)
    print("Added sequence messages on Diagram 272")

    conn.commit()
    print("\nAll modifications committed successfully to diagramas.qea!")
except Exception as e:
    conn.rollback()
    print("\nError occurred, transaction rolled back:", e)
finally:
    conn.close()
