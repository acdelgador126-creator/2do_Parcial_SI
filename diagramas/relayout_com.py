import sqlite3
import shutil
import os

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_relayout_com.qea")

print(f"Backing up {db_path} -> {backup_path} ...")
shutil.copyfile(db_path, backup_path)
print("Backup created.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Layout constants
TOP = -300
OBJ_BOTTOM = -400      # circle/object height 100
ACTOR_BOTTOM = -380    # actor height 80
FIRST_CENTER = 130
STEP = 240             # center-to-center spacing
OBJ_HALF = 45          # object half width (90 wide)
ACTOR_HALF = 20        # actor half width (40 wide)
MSG_Y_START = -150
MSG_Y_STEP = -35

try:
    cursor.execute("SELECT Diagram_ID, Name FROM t_diagram WHERE Diagram_Type='Collaboration' ORDER BY Diagram_ID")
    diagrams = cursor.fetchall()
    print(f"Found {len(diagrams)} communication diagrams.\n")

    for did, dname in diagrams:
        # Objects placed on this diagram (only Actor / Object get rowed)
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
            print(f"  [{did}] {dname}: no rowable objects, skipped.")
            continue

        # Messages on this diagram, in sequence order
        cursor.execute("""
            SELECT Connector_ID, Start_Object_ID, End_Object_ID, SeqNo
            FROM t_connector WHERE DiagramID = ?
            ORDER BY SeqNo, Connector_ID
        """, (did,))
        msgs = cursor.fetchall()

        # Order: by first appearance in the message flow, then remaining by RectLeft
        order = []
        seen = set()
        for _cid, s, e, _sq in msgs:
            for oid in (s, e):
                if oid in placed and oid not in seen:
                    order.append(oid); seen.add(oid)
        for oid in sorted(placed, key=lambda o: rectleft[o]):
            if oid not in seen:
                order.append(oid); seen.add(oid)

        # Assign single-row positions
        centers = {}
        for i, oid in enumerate(order):
            center = FIRST_CENTER + i * STEP
            half = ACTOR_HALF if otype[oid] == 'Actor' else OBJ_HALF
            bottom = ACTOR_BOTTOM if otype[oid] == 'Actor' else OBJ_BOTTOM
            cursor.execute("""
                UPDATE t_diagramobjects
                SET RectTop=?, RectLeft=?, RectRight=?, RectBottom=?
                WHERE Diagram_ID=? AND Object_ID=?
            """, (TOP, center - half, center + half, bottom, did, oid))
            centers[oid] = center

        # Realign message label anchors to the new centers, stepping Y
        y = MSG_Y_START
        for cid, s, e, _sq in msgs:
            sx = centers.get(s)
            ex = centers.get(e)
            if sx is None or ex is None:
                continue
            if s == e:
                ex = sx + 60  # self message loop
            cursor.execute("""
                UPDATE t_connector SET PtStartX=?, PtStartY=?, PtEndX=?, PtEndY=?
                WHERE Connector_ID=?
            """, (sx, y, ex, y, cid))
            y += MSG_Y_STEP

        print(f"  [{did}] {dname}: {len(order)} objects rowed, {len(msgs)} messages realigned.")

    conn.commit()
    print("\nDONE. All communication diagrams re-laid out into a single horizontal row.")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
