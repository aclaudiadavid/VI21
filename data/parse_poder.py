import pandas as pd
import json as json

a_pl = pd.read_excel("old/pordata_proporcao_poder_compra.ods", sheet_name="Quadro")

data_json = {}

a_pl.dropna(how="all", inplace=True)

for row_id, row in a_pl.iterrows():
    dic = row.to_dict()
    loc = row["Localidades"]
    if loc != ' ':
        data_json[loc] = {}

    for i in dic:
        if i != loc and i != 'Unnamed' and loc != ' ':
            if i in [1993,2000,2002,2007,2009,2011,2013,2015,2017]:
                if dic[i] == 0:
                    data_json[loc][i] = -1
                else:
                    data_json[loc][i] = dic[i]
            

with open("poder_compra.json", 'w') as json_file:
    json.dump(data_json, json_file)
    