import requests

url = 'https://stm-test.odpch.ch/gtfs/alerts-json/consolidated/?format=JSON'
headers = {'Authorization': 'eyJvcmciOiI2M2Q4ODhiMDNmZmRmODAwMDEzMDIwODkiLCJpZCI6IjJiNTk5OWQ2NjAxNDQzM2I4ZTY1NDc5ODU5MGI4NGM0IiwiaCI6Im11cm11cjEyOCJ9'}

try:
    response = requests.get(url, headers=headers)
    if response.status_code == 200:  
        data = response.json()
        print(data)  
    else:
        print(f"Error: {response.status_code}")  # Fehlermeldung für nicht erfolgreiche Antwort
except requests.exceptions.RequestException as e:
    print("Error:", e)  # Fehlermeldung für Ausnahmen bei der Anforderung



# import requests

# def osm_query(stop_id):
#     overpass_url = "http://overpass-api.de/api/interpreter"
#     overpass_query = f"""
#         [out:json];
#         node["public_transport"="platform"]["ref"="{stop_id}"];
#         out;
#     """

#     response = requests.get(overpass_url, params={'data': overpass_query})
#     data = response.json()
#     return data

# stop_id = "86afd19c-cf0f-52a4-95f7-8157d0bb0de9"
# result = osm_query(stop_id)
# print(result)
