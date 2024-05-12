from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from typing import List
import psycopg2


app = FastAPI()

# CORS (Cross-Origin Resource Sharing) Konfiguration, um Anfragen von localhost:3000 zu ermöglichen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization"],
)

# Verbindungsinformationen zur Datenbank
dbname = 'ServiceAlerts'
user = 'postgres'
password = 'postgres'
host = 'localhost'
port = '5433'

@app.get("/api/data")
async def get_data():
    try:
        # Weiterleiten der Anfrage an die API-URL
        response = requests.get(
            'https://odpch-api.clients.liip.ch/gtfs-sa-int/?format=JSON',
            # 'https://stm-test.odpch.ch/gtfs/alerts-json/consolidated/?format=JSON',
            headers={'Authorization': 'eyJvcmciOiI2M2Q4ODhiMDNmZmRmODAwMDEzMDIwODkiLCJpZCI6IjJiNTk5OWQ2NjAxNDQzM2I4ZTY1NDc5ODU5MGI4NGM0IiwiaCI6Im11cm11cjEyOCJ9'}
        )
        data = response.json()
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


def get_service_point_info_from_db(parent_sloid_strings: List[str]):
    try:
        # Verbindung zur Datenbank herstellen
        connection = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port
        )

        # Cursor erstellen, um Abfragen auszuführen
        cursor = connection.cursor()

        # Daten für jeden parentSloidServicePoint abrufen
        results = {}
        for parent_sloid in parent_sloid_strings:
            cursor.execute("SELECT * FROM nodes WHERE parentSloidServicePoint = %s", (parent_sloid,))
            rows = cursor.fetchall()
            results[parent_sloid] = rows

        # Verbindung schließen
        cursor.close()
        connection.close()

        return results

    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/service_point_info")
async def get_service_point_info(parent_sloid_strings: List[str]):
    try:
        service_point_info_dict = get_service_point_info_from_db(parent_sloid_strings)
        return service_point_info_dict

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))












# _________________________ Endpoint mit xlsx Datei | nicht performant aufgrund Dateigrösse ________________________-


# class ServicePointInfo(BaseModel):
#     trafficPointElementType: str
#     wgs84East: float
#     wgs84North: float
#     height: float
#     parentSloidServicePoint: int
#     designationOfficial: str
#     servicePointBusinessOrganisationDescriptionDe: str

# def get_service_point_info_from_excel(sloid_strings: List[str]):
#     try:
#         # Excel-Datei einlesen
#         excel_file = "C:/Users/benjg/Desktop/BTh-react/sbbalerts/server/Nodes.xlsx"
#         data = pd.read_excel(excel_file)

#         # Filtern der Daten, um nur Zeilen zu behalten, die den gewünschten parentSloidServicePoint enthalten
#         filtered_data = data[data['parentSloidServicePoint'].isin(sloid_strings)]

#         # Auswahl der gewünschten Spalten
#         selected_columns = ['trafficPointElementType', 'wgs84East', 'wgs84North', 'height', 'designationOfficial', 'servicePointBusinessOrganisationDescriptionDe']

#         # Konvertierung der gefilterten Daten in ein Dictionary
#         service_point_info_dict = filtered_data[selected_columns].to_dict(orient='index')

#         # Rückgabe des Response-Body
#         return {"service_point_info": service_point_info_dict}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))



# @app.post("/api/service_point_info")
# async def get_service_point_info(sloid_strings: List[str]):
#     try:
#         service_point_info_dict = get_service_point_info_from_excel(sloid_strings)
#         return service_point_info_dict

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


