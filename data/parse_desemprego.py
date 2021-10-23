import pandas as pd
import json as json

pop_anos = pd.read_json("resultados_eleicoes.json")

a_pl = pd.read_excel("old/pordata_desempregados_inscritos.ods", sheet_name="Quadro")


data_json = {}

a_pl.dropna(how="all", inplace=True)

for row_id, row in a_pl.iterrows():
    dic = row.to_dict()
    loc = row["Localidades"]
    if loc != ' ':
        data_json[loc] = {}

    for i in dic:
        if i != loc and i != 'Unnamed' and loc != ' ':
            if i in [1997,2001,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020] and i in pop_anos[loc]:
                if dic[i] == 0:
                    data_json[loc][i] = -1
                else:
                    data_json[loc][i] = 1- dic[i] / pop_anos[loc][i]["total"]

with open("desempregados_inscritos.json", 'w') as json_file:
    json.dump(data_json, json_file)