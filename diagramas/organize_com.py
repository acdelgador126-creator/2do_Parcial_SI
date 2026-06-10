import sqlite3
import shutil
import uuid
import datetime
import os

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_organize_com.qea")

print(f"Backing up {db_path} -> {backup_path} ...")
shutil.copyfile(db_path, backup_path)
print("Backup created.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def guid():
    return "{" + str(uuid.uuid4()).upper() + "}"

def now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

PARENT_PKG = 87  # Realizaciones_Analisis
NEW_PKG_NAME = "Diagramas de Comunicacion"

# Layout constants (single horizontal row)
TOP = -300
OBJ_BOTTOM = -400
ACTOR_BOTTOM = -380
FIRST_CENTER = 130
STEP = 240
OBJ_HALF = 45
ACTOR_HALF = 20
MSG_Y_START = -150
MSG_Y_STEP = -35

try:
    # ---------------------------------------------------------
    # 1. Create (or reuse) the consolidation package
    # ---------------------------------------------------------
    cursor.execute("SELECT Package_ID FROM t_package WHERE Name=? AND Parent_ID=?", (NEW_PKG_NAME, PARENT_PKG))
    row = cursor.fetchone()
    if row:
        new_pkg = row[0]
        print(f"Package '{NEW_PKG_NAME}' already exists (ID={new_pkg}); reusing.")
    else:
        g = guid()
        cursor.execute("""
            INSERT INTO t_package (Name, Parent_ID, CreatedDate, ModifiedDate, ea_guid, Version)
            VALUES (?, ?, ?, ?, ?, '1.0')
        """, (NEW_PKG_NAME, PARENT_PKG, now(), now(), g))
        new_pkg = cursor.lastrowid
        # Matching t_object node (Object_Type='Package'): Package_ID=parent, PDATA1=own id, same guid
        cursor.execute("""
            INSERT INTO t_object (Object_Type, Diagram_ID, Name, Package_ID, PDATA1, ea_guid,
                                  CreatedDate, ModifiedDate, Scope, Status)
            VALUES ('Package', 0, ?, ?, ?, ?, ?, ?, 'Public', 'Proposed')
        """, (NEW_PKG_NAME, PARENT_PKG, str(new_pkg), g, now(), now()))
        print(f"Created package '{NEW_PKG_NAME}' (ID={new_pkg}) under parent {PARENT_PKG}.")

    # ---------------------------------------------------------
    # 2. Move all communication diagrams into the new package
    # ---------------------------------------------------------
    cursor.execute("SELECT Diagram_ID, Name FROM t_diagram WHERE Diagram_Type='Collaboration' ORDER BY Name")
    diagrams = cursor.fetchall()
    for did, dname in diagrams:
        cursor.execute("UPDATE t_diagram SET Package_ID=? WHERE Diagram_ID=?", (new_pkg, did))
    print(f"Moved {len(diagrams)} communication diagrams into package {new_pkg}.")

    # ---------------------------------------------------------
    # 3. Re-apply the single-row horizontal layout to each
    # ---------------------------------------------------------
    for did, dname in diagrams:
        cursor.execute("""
            SELECT do.Object_ID, o.Object_Type, do.RectLeft
            FROM t_diagramobjects do JOIN t_object o ON o.Object_ID = do.Object_ID
            WHERE do.Diagram_ID = ?
        """, (did,))
        placed = {}
        rectleft = {}
        otype = {}
        for oid, ot, left in cursor.fetchall():
            otype[oid] = ot
            rectleft[oid] = left if left is not None else 0
            if ot in ('Actor', 'Object'):
                placed[oid] = ot
        if not placed:
            continue

        cursor.execute("""
            SELECT Connector_ID, Start_Object_ID, End_Object_ID, SeqNo
            FROM t_connector WHERE DiagramID = ? ORDER BY SeqNo, Connector_ID
        """, (did,))
        msgs = cursor.fetchall()

        order, seen = [], set()
        for _cid, s, e, _sq in msgs:
            for oid in (s, e):
                if oid in placed and oid not in seen:
                    order.append(oid); seen.add(oid)
        for oid in sorted(placed, key=lambda o: rectleft[o]):
            if oid not in seen:
                order.append(oid); seen.add(oid)

        centers = {}
        for i, oid in enumerate(order):
            center = FIRST_CENTER + i * STEP
            half = ACTOR_HALF if otype[oid] == 'Actor' else OBJ_HALF
            bottom = ACTOR_BOTTOM if otype[oid] == 'Actor' else OBJ_BOTTOM
            cursor.execute("""
                UPDATE t_diagramobjects SET RectTop=?, RectLeft=?, RectRight=?, RectBottom=?
                WHERE Diagram_ID=? AND Object_ID=?
            """, (TOP, center - half, center + half, bottom, did, oid))
            centers[oid] = center

        y = MSG_Y_START
        for cid, s, e, _sq in msgs:
            sx, ex = centers.get(s), centers.get(e)
            if sx is None or ex is None:
                continue
            if s == e:
                ex = sx + 60
            cursor.execute("UPDATE t_connector SET PtStartX=?, PtStartY=?, PtEndX=?, PtEndY=? WHERE Connector_ID=?",
                           (sx, y, ex, y, cid))
            y += MSG_Y_STEP

    print("Re-applied horizontal layout to all communication diagrams.")

    conn.commit()
    print(f"\nDONE. All communication diagrams consolidated in package {new_pkg} ('{NEW_PKG_NAME}'), horizontal.")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
