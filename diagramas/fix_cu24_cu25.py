import sqlite3
import shutil
import os

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_fix_cu24_cu25.qea")

print(f"Backing up {db_path} -> {backup_path} ...")
shutil.copyfile(db_path, backup_path)
print("Backup created.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # =========================================================
    # FIX 1: Sequence diagrams 278 (Seq_CU24) & 279 (Seq_CU25)
    # Enable Focus Of Control (activation bars / lifecycle) by
    # copying the StyleEx + PDATA from the known-good Seq_CU22.
    # =========================================================
    cursor.execute("SELECT StyleEx, PDATA FROM t_diagram WHERE Diagram_ID=272")
    good_styleex, good_pdata = cursor.fetchone()
    assert 'SuppressFOC=0' in good_styleex, "Reference diagram does not have SuppressFOC=0"

    for did in (278, 279):
        cursor.execute("UPDATE t_diagram SET StyleEx=?, PDATA=? WHERE Diagram_ID=?",
                       (good_styleex, good_pdata, did))
        print(f"Diagram {did}: StyleEx/PDATA aligned with Seq_CU22 (SuppressFOC=0 -> activation bars ON)")

    # =========================================================
    # FIX 2: Communication diagram 275 (Com_CU24)
    # Re-layout objects to the project convention (same as Com_CU13):
    #   actor x=100, boundary x=300, control x=500, entities x=750 stacked.
    # =========================================================
    # (Object_ID, Top, Left, Right, Bottom)
    com_layout = [
        (1599, -300, 100, 140, -380),  # Actor "Aspirante a Docente"
        (1600, -290, 300, 390, -390),  # IU_PostulacionDocente (boundary)
        (1601, -290, 500, 590, -390),  # CTR_Docentes (control)
        (1602, -290, 750, 840, -390),  # CE_Docente (entity, middle)
        (1604, -160, 750, 840, -260),  # CE_Materia (entity, above)
        (1603, -420, 750, 840, -520),  # CE_Especialidad (entity, below)
    ]
    for oid, top, left, right, bottom in com_layout:
        cursor.execute("""
            UPDATE t_diagramobjects
            SET RectTop=?, RectLeft=?, RectRight=?, RectBottom=?
            WHERE Diagram_ID=275 AND Object_ID=?
        """, (top, left, right, bottom, oid))
    print("Com_CU24: objects repositioned to project convention.")

    # Recompute message label X anchors to the new object centers.
    centers = {1599: 120, 1600: 345, 1601: 545, 1602: 795, 1603: 795, 1604: 795}
    cursor.execute("SELECT Connector_ID, Start_Object_ID, End_Object_ID FROM t_connector WHERE DiagramID=275")
    for cid, s, e in cursor.fetchall():
        if s in centers and e in centers:
            cursor.execute("UPDATE t_connector SET PtStartX=?, PtEndX=? WHERE Connector_ID=?",
                           (centers[s], centers[e], cid))
    print("Com_CU24: message anchors realigned to new object centers.")

    conn.commit()
    print("\nDONE. Fixes committed.")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
