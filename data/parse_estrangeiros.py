import pandas as pd
import json as json

a_pl = pd.read_excel("old/pordata_estrangeiros_residentes_percentagem.ods", sheet_name="Quadro")

data_json = {}

a_pl.dropna(how="all", inplace=True)

for row_id, row in a_pl.iterrows():
    dic = row.to_dict()
    loc = row["Localidades"]
    if loc != ' ':
        data_json[loc] = {}

    for i in dic:
        if i != loc and i != 'Unnamed' and loc != ' ':
            if i in [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020]:
                data_json[loc][i] = dic[i]
            

with open("estrangeiros_residentes_percentagem.json", 'w') as json_file:
    json.dump(data_json, json_file)
    