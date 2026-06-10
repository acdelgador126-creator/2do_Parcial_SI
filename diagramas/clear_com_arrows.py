import sqlite3
import shutil
import os

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_clear_com_arrows.qea")

print(f"Backing up {db_path} -> {backup_path} ...")
shutil.copyfile(db_path, backup_path)
print("Backup created.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT Diagram_ID, Name FROM t_diagram WHERE Diagram_Type='Collaboration' ORDER BY Name")
    diagrams = cursor.fetchall()
    total = 0
    for did, dname in diagrams:
        cursor.execute("""
            UPDATE t_connector
            SET PtStartX=0, PtStartY=0, PtEndX=0, PtEndY=0
            WHERE DiagramID=?
        """, (did,))
        total += cursor.rowcount
        print(f"  [{did}] {dname}: {cursor.rowcount} arrows reset to auto-route.")

    conn.commit()
    print(f"\nDONE. Cleared fixed coordinates on {total} message arrows across {len(diagrams)} diagrams.")
    print("EA will now auto-route them along the links; you can drag/curve each by hand.")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
