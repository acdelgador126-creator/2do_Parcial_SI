import sqlite3
import shutil
import os

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_fix_com_arrows.qea")

print(f"Backing up {db_path} -> {backup_path} ...")
shutil.copyfile(db_path, backup_path)
print("Backup created.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

ROW_Y = -350          # vertical center of the object row (objects span -300..-400)
PAIR_OFFSET = 18      # vertical separation for multiple messages on the same pair
SELF_Y = -292         # self-message: small arrow just above the object

try:
    cursor.execute("SELECT Diagram_ID, Name FROM t_diagram WHERE Diagram_Type='Collaboration' ORDER BY Name")
    diagrams = cursor.fetchall()
    print(f"Adjusting message arrows on {len(diagrams)} communication diagrams.\n")

    for did, dname in diagrams:
        # object centers (X) from current placement
        cursor.execute("""
            SELECT do.Object_ID, (do.RectLeft + do.RectRight)/2
            FROM t_diagramobjects do JOIN t_object o ON o.Object_ID = do.Object_ID
            WHERE do.Diagram_ID = ? AND o.Object_Type IN ('Actor','Object')
        """, (did,))
        centers = {oid: cx for oid, cx in cursor.fetchall()}
        if not centers:
            continue

        cursor.execute("""
            SELECT Connector_ID, Start_Object_ID, End_Object_ID
            FROM t_connector WHERE DiagramID = ? ORDER BY SeqNo, Connector_ID
        """, (did,))
        msgs = cursor.fetchall()

        pair_count = {}
        for cid, s, e in msgs:
            sx = centers.get(s)
            ex = centers.get(e)
            if sx is None or ex is None:
                continue

            if s == e:
                # self message: short arrow just above the object
                cursor.execute(
                    "UPDATE t_connector SET PtStartX=?, PtStartY=?, PtEndX=?, PtEndY=? WHERE Connector_ID=?",
                    (sx - 22, SELF_Y, sx + 22, SELF_Y, cid))
                continue

            key = (min(s, e), max(s, e))
            k = pair_count.get(key, 0)
            pair_count[key] = k + 1
            # k=0 -> 0 ; k=1 -> +18 ; k=2 -> -18 ; k=3 -> +36 ; k=4 -> -36 ...
            if k == 0:
                dy = 0
            else:
                step = (k + 1) // 2
                dy = (PAIR_OFFSET * step) if (k % 2 == 1) else (-PAIR_OFFSET * step)
            y = ROW_Y + dy

            cursor.execute(
                "UPDATE t_connector SET PtStartX=?, PtStartY=?, PtEndX=?, PtEndY=? WHERE Connector_ID=?",
                (sx, y, ex, y, cid))

        print(f"  [{did}] {dname}: {len(msgs)} arrows anchored to the row.")

    conn.commit()
    print("\nDONE. Message arrows aligned to the object row on all communication diagrams.")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
