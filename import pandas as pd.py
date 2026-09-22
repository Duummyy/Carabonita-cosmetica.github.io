import pandas as pd
import os

def diagnostico_y_creacion():
    # --- CAMBIA ESTO SI ES NECESARIO ---
    nombre_archivo = "contratos_nuevos_feb.xlsx" 
    # -----------------------------------

    print("--- INICIANDO DIAGNÓSTICO ---")
    print(f"1. Carpeta actual: {os.getcwd()}")
    
    # Ver si el archivo existe físicamente
    archivos_en_carpeta = os.listdir()
    if nombre_archivo in archivos_en_carpeta:
        print(f"2. ✅ Archivo '{nombre_archivo}' ENCONTRADO.")
    else:
        print(f"2. ❌ ERROR: No veo el archivo '{nombre_archivo}' aquí.")
        print(f"   Archivos que SÍ veo: {archivos_en_carpeta}")
        return

    try:
        # Intentar leer el Excel
        df = pd.read_excel(nombre_archivo)
        print("3. ✅ Archivo leído correctamente.")
        
        # Ver las columnas
        columnas = [str(c).strip() for c in df.columns]
        print(f"4. Columnas que detecto: {columnas}")

        # Buscar la columna del proyecto (flexible con el nombre)
        col_proyecto = None
        for c in columnas:
            if "proy" in c.lower() or "proj" in c.lower():
                col_proyecto = c
                break
        
        if col_proyecto:
            print(f"5. 🎯 Columna identificada: '{col_proyecto}'")
            proyectos = df[col_proyecto].dropna().unique()
            print(f"6. Intentando crear {len(proyectos)} carpetas...")
            
            for p in proyectos:
                nombre = str(p).strip()
                if not os.path.exists(nombre):
                    os.makedirs(nombre)
                    print(f"   + Carpeta creada: {nombre}")
                else:
                    print(f"   = La carpeta '{nombre}' ya existía.")
            print("\n✨ ¡PROCESO TERMINADO CON ÉXITO! ✨")
        else:
            print("5. ❌ ERROR: No encontré ninguna columna que se parezca a 'Project' o 'Proyect'.")

    except Exception as e:
        print(f"❌ ERROR CRÍTICO: {e}")
        print("\n💡 Tip: Si el error dice 'openpyxl', escribe 'pip install openpyxl' en tu terminal.")

if __name__ == "__main__":
    diagnostico_y_creacion()