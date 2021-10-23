import pandas as pd
import json as json

a_pl = pd.read_excel("old/pordata_participacao_eleitoral.ods", sheet_name="Quadro")
a_93_pl = pd.read_excel("old/PORDATA_Votos-validos-por-partido-ou-coligacao--1993.ods", sheet_name="Quadro")
a_97_pl = pd.read_excel("old/PORDATA_Votos-validos-por-partido-ou-coligacao--1997.ods", sheet_name="Quadro")
a_01_pl = pd.read_excel("old/PORDATA_Votos-validos-por-partido-ou-coligacao--2001.ods", sheet_name="Quadro")
a_05_pl = pd.read_excel("old/PORDATA_Votos-validos-por-partido-coligacao-ou-independentes--2005.ods", sheet_name="Quadro")
a_09_pl = pd.read_excel("old/PORDATA_Votos-validos-por-partido-coligacao-ou-independentes--2009.ods", sheet_name="Quadro")
a_13_pl = pd.read_excel("old/PORDATA_Votos-validos-por-partido-coligacao-ou-independentes--2013.ods", sheet_name="Quadro")
a_17_pl = pd.read_excel("old/PORDATA_Votos-validos-por-partido-coligacao-ou-independentes--2017.ods", sheet_name="Quadro")

data_json = {}

a_pl.dropna(how="all", inplace=True)

for row_id, row in a_pl.iterrows():
    dic = row.to_dict()
    loc = row["Localidades"]
    if loc != ' ':
        data_json[loc] = {}

    for i in dic:
        if i != loc and i != 'Unnamed' and loc != ' ':
            if i in [1993,1997,2001,2005,2009,2013,2017]:
                data_json[loc][i] = {'total': dic[i]}

            elif i in  ["1993.1","1997.1","2001.1","2005.1","2009.1","2013.1","2017.1"]:
                num = int(float(i)//1)
                
                data_json[loc][num]['votos'] = dic[i]

            elif i in  ["1993.2","1997.2","2001.2","2005.2","2009.2","2013.2","2017.2"]:
                num = int(float(i)//1)
                
                data_json[loc][num]['abstencao'] = dic[i]
                
files = [a_93_pl, a_97_pl, a_01_pl, a_05_pl, a_09_pl, a_13_pl, a_17_pl]

year = 1993

for a in files:
    a.dropna(how="all", inplace=True)
    for row_id, row in a.iterrows():
        dic = row.to_dict()
        loc = row["Localidades"]

        for i in dic:
            if i != "Localidades" and 'Unnamed' not in i and loc != ' ' and i != 'Total':
                if dic[i] == 0:
                    data_json[loc][year][i] = -1
                else:
                    data_json[loc][year][i] = dic[i]
    year += 4
            

with open("resultados_eleicoes.json", 'w') as json_file:
    json.dump(data_json, json_file)
    