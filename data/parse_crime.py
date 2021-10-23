import pandas as pd
import json as json

a_pl = pd.read_excel("old/pordata_crime_registado.ods", sheet_name="Quadro")
pt_crime = {}
data_json = {}

a_pl.dropna(how="all", inplace=True)

for row_id, row in a_pl.iterrows():
    dic = row.to_dict()
    loc = row["Localidades"]
    if loc != ' ':
        if loc == 'Portugal':
            pt_crime = dic
        data_json[loc] = {}

    avg = 0
    for i in dic:
        if i != loc and i != 'Unnamed' and loc != ' ':
            if i in [1993,2001,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020]:
                if dic[i] == 0:
                    data_json[loc][i] = -1
                else:
                    avg += dic[i]
                    data_json[loc][i] = dic[i] / pt_crime[i]
    avg = avg//14
    if loc != ' ':
        data_json[loc]['avg_years'] = avg       

with open("crime_registado.json", 'w') as json_file:
    json.dump(data_json, json_file)