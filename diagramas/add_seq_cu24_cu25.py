import sqlite3
import shutil
import uuid
import datetime
import os
import random

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_seq_cu24_cu25.qea")

print(f"Backing up {db_path} -> {backup_path} ...")
shutil.copyfile(db_path, backup_path)
print("Backup created.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def guid():
    return "{" + str(uuid.uuid4()).upper() + "}"

def now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def duid():
    return "DUID=%08X;" % random.randint(0, 0xFFFFFFFF)

PKG = 106  # Realizaciones_Diseno_Ciclo2

def label_pdata5(name):
    cx = max(40, int(len(name) * 6))
    return ("$LLB=;LLT=;LMT=CX=%d:CY=14:OX=0:OY=0:HDN=0:BLD=0:ITA=0:UND=0:"
            "CLR=-1:ALN=0:DIR=0:ROT=0;LMB=;LRT=;LRB=;IRHS=;ILHS=;" % cx)

def create_sequence_diagram(name, lifelines, messages):
    """lifelines: list of names in left-to-right order.
       messages: list of (label, src_idx, dst_idx, is_return)."""
    cursor.execute("SELECT Diagram_ID FROM t_diagram WHERE Name=? AND Diagram_Type='Sequence'", (name,))
    ex = cursor.fetchone()
    if ex:
        raise RuntimeError(f"{name} already exists (Diagram_ID={ex[0]}). Aborting.")

    cursor.execute("""
        INSERT INTO t_diagram
            (Package_ID, ParentID, Diagram_Type, Name, Version, Author, ShowDetails, Notes,
             AttPub, AttPri, AttPro, Orientation, cx, cy, Scale, CreatedDate, ModifiedDate,
             ShowForeign, ShowBorder, ShowPackageContents, PDATA, Locked, ea_guid, Swimlanes, StyleEx)
        VALUES (?, 0, 'Sequence', ?, '1.0', 'User', 0, NULL,
                1, 1, 1, 'P', 827, 1169, 100, ?, ?,
                0, 1, 1,
                'HideRel=0;ShowTags=0;ShowReqs=0;ShowCons=0;OpParams=1;ShowSN=0;ScalePI=0;PPgs.cx=1;PPgs.cy=1;PSize=9;ShowIcons=1;SuppCN=0;HideProps=0;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideEStereo=0;ShowRec=1;ShowRes=0;ShowShape=1;FormName=;',
                0, ?,
                'locked=false;orientation=0;width=0;inbar=false;names=false;color=-1;bold=false;fcol=0;tcol=-1;ofCol=-1;ufCol=-1;hl=1;ufh=0;hh=0;cls=0;bw=0;hli=0;bro=0;',
                'ExcludeRTF=0;DocAll=0;HideQuals=0;AttPkg=1;ShowTests=0;ShowMaint=0;SuppressFOC=1;MatrixActive=0;SwimlanesActive=1;KanbanActive=0;MatrixLineWidth=1;MatrixLineClr=0;MatrixLocked=0;TConnectorNotation=UML 2.1;TExplicitNavigability=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;SPT=1;MDGDgm=;STBLDgm=;ShowNotes=0;VisibleAttributeDetail=0;ShowOpRetType=1;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;SuppressedCompartments=;Theme=:119;SaveTag=E700E9D8;')
    """, (PKG, name, now(), now(), guid()))
    diagram_id = cursor.lastrowid

    # Create lifelines
    ids = []
    centers = []
    LEFT0, STEP, WIDTH = 100, 230, 120
    for i, ll_name in enumerate(lifelines):
        cursor.execute("""
            INSERT INTO t_object
                (Object_Type, Diagram_ID, Name, Version, Package_ID, NType, Complexity, Effort,
                 Backcolor, BorderStyle, BorderWidth, Fontcolor, Bordercolor,
                 CreatedDate, ModifiedDate, Status, Tagged, Scope, ea_guid, ParentID,
                 IsRoot, IsLeaf, IsSpec, IsActive)
            VALUES ('Sequence', 0, ?, '1.0', ?, 0, '1', 0,
                    0, 0, 0, 0, 0,
                    ?, ?, 'Proposed', 0, 'Public', ?, 0,
                    0, 0, 0, 0)
        """, (ll_name, PKG, now(), now(), guid()))
        oid = cursor.lastrowid
        ids.append(oid)
        left = LEFT0 + i * STEP
        right = left + WIDTH
        centers.append(left + WIDTH // 2)
        cursor.execute("""
            INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectTop, RectLeft, RectRight, RectBottom, Sequence, ObjectStyle)
            VALUES (?, ?, -50, ?, ?, -900, ?, ?)
        """, (diagram_id, oid, left, right, i + 1, duid()))

    # Create messages
    y = -135
    seq = 0
    for (label, s, d, is_return) in messages:
        seq += 1
        sx = centers[s]
        dx = centers[d] if d != s else centers[s] + 60  # self-message loops to the right
        pdata4 = '1' if is_return else None
        cursor.execute("""
            INSERT INTO t_connector
                (Name, Direction, Connector_Type, Start_Object_ID, End_Object_ID, SeqNo, DiagramID, ea_guid,
                 PtStartX, PtStartY, PtEndX, PtEndY, PDATA4, PDATA5,
                 RouteStyle, LineColor, SourceIsNavigable, DestIsNavigable, IsRoot, IsLeaf, SourceStyle, DestStyle)
            VALUES (?, 'Source -> Destination', 'Sequence', ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    0, -1, 0, 0, 0, 0,
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;',
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;')
        """, (label, ids[s], ids[d], seq, diagram_id, guid(),
              sx, y, dx, y, pdata4, label_pdata5(label)))
        y -= 35

    print(f"Created {name}: Diagram_ID={diagram_id}, {len(lifelines)} lifelines, {len(messages)} messages")
    return diagram_id

try:
    # ---- Seq_CU24 ----
    # lifelines indices: 0 Act, 1 B_Int, 2 C_Ctrl, 3 E_Doc, 4 E_Mat, 5 E_Esp
    cu24_lifelines = [
        'Aspirante a Docente',     # 0
        'IU_PostulacionDocente',   # 1
        'CTR_Docentes',            # 2
        'CE_Docente',              # 3
        'CE_Materia',              # 4
        'CE_Especialidad',         # 5
    ]
    cu24_messages = [
        ('1: + CompletarFormulario(datos, especialidad, areaId)', 0, 1, False),
        ('2: + ClicEnviarPostulacion()', 0, 1, False),
        ('3: + store(request)', 1, 2, False),
        ("4: + where('ci', ci)->orWhere('correo', correo)", 2, 3, False),
        ('5: + ResultadoValidacion', 3, 2, True),
        ('6: + findOrFail(area_id)', 2, 4, False),
        ('7: + DatosArea', 4, 2, True),
        ("8: + create(['estado' => 'Pendiente de Revision'])", 2, 3, False),
        ("9: + create(['docente_id' => id, 'nombre' => especialidad])", 2, 5, False),
        ('10: + RetornarExito()', 2, 1, True),
        ('11: + MostrarConfirmacionPostulacion()', 1, 0, True),
    ]
    create_sequence_diagram('Seq_CU24', cu24_lifelines, cu24_messages)

    # ---- Seq_CU25 ----
    # 0 Act, 1 B_Int, 2 C_Ctrl, 3 E_Doc, 4 E_Esp, 5 E_Mat, 6 E_Usu
    cu25_lifelines = [
        'Administrador / Coordinador',  # 0
        'IU_RevisionDocentes',          # 1
        'CTR_Docentes',                 # 2
        'CE_Docente',                   # 3
        'CE_Especialidad',              # 4
        'CE_Materia',                   # 5
        'CE_Usuario',                   # 6
    ]
    cu25_messages = [
        ('1: + SeleccionarPostulacion(docenteId)', 0, 1, False),
        ('2: + revisar(docenteId)', 1, 2, False),
        ('3: + findOrFail(docente_id)', 2, 3, False),
        ('4: + DatosDocente', 3, 2, True),
        ("5: + where('docente_id', docente_id)", 2, 4, False),
        ('6: + Especialidad', 4, 2, True),
        ('7: + findOrFail(area_id)', 2, 5, False),
        ('8: + DatosArea', 5, 2, True),
        ('8.1: + ValidarEspecialidadVsArea(especialidad, area.nombre)', 2, 2, False),
        ("9: + update(['estado' => 'Aceptado'])", 2, 3, False),
        ("10: + create(['rol' => 'Docente', 'activo' => true])", 2, 6, False),
        ('11: + ConfirmarAceptacion()', 2, 1, True),
        ('12: + MostrarDocenteAceptado()', 1, 0, True),
    ]
    create_sequence_diagram('Seq_CU25', cu25_lifelines, cu25_messages)

    conn.commit()
    print("\nDONE. Seq_CU24 and Seq_CU25 committed.")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
