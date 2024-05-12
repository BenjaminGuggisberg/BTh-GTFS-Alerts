import csv
import pyproj

# LV95 nach WGS84 Transformer erstellen
lv95_to_wgs84 = pyproj.Transformer.from_crs("EPSG:2056", "EPSG:4326")

# Pfad zum Eingabe- und Ausgabedateien definieren
input_file = 'server/Haltekante.csv'
output_file = 'server/Haltekante_new.csv'

# Header der ausgewählten Spalten
selected_columns = ['Nummer', 'BetrieblicheBezeichnung', 'Gueltigkeit_BeginnGueltigkeit', 'E', 'N', 'H']

# Funktion zur Umwandlung von LV95-Koordinaten in WGS84-Koordinaten
def convert_to_wgs84(easting, northing):
    lon, lat = lv95_to_wgs84.transform(easting, northing)
    return lat, lon

# CSV einlesen und neue Datei schreiben
with open(input_file, mode='r', encoding='utf-8') as infile, \
     open(output_file, mode='w', encoding='utf-8', newline='') as outfile:
    reader = csv.DictReader(infile, delimiter=',')
    writer = csv.DictWriter(outfile, fieldnames=selected_columns)
    
    # Header schreiben
    writer.writeheader()
    
    # Zeilen verarbeiten
    for row in reader:
        # LV95-Koordinaten in WGS84 umwandeln
        wgs84_lat, wgs84_lon = convert_to_wgs84(float(row['E']), float(row['N']))
        
        # Neue Zeile mit ausgewählten Spalten und umgewandelten Koordinaten erstellen
        new_row = {
            'Nummer': row['Nummer'],
            'BetrieblicheBezeichnung': row['BetrieblicheBezeichnung'],
            'Gueltigkeit_BeginnGueltigkeit': row['Gueltigkeit_BeginnGueltigkeit'],
            'E': wgs84_lon,
            'N': wgs84_lat,
            'H': row['H']
        }
        
        # Neue Zeile in die Ausgabedatei schreiben
        writer.writerow(new_row)

print("Conversion completed successfully.")
