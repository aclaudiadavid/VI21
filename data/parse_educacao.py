import pandas as pd
import json as json

pop_anos = pd.read_json("resultados_eleicoes.json")

a_pl = pd.read_excel("old/pordata-edu-97-10.ods", sheet_name="Quadro")
b_pl = pd.read_excel("old/pordata-edu-11-15.ods", sheet_name="Quadro")
c_pl = pd.read_excel("old/pordata-edu-16-20.ods", sheet_name="Quadro")

files = [b_pl, c_pl]

data_json = {}

a_pl.dropna(how="all", inplace=True)
b_pl.dropna(how="all", inplace=True)
c_pl.dropna(how="all", inplace=True)


for row_id, row in a_pl.iterrows():
    dic = row.to_dict()
    loc = row["Localidades"]
    if loc != ' ':
        data_json[loc] = {}

    for i in dic:
        if i != loc and i != 'Unnamed' and loc != ' ':
            if dic[i] == 0:
                dic[i] = -1

            if i in [1993,1996,2001,2009,2010,2017] and i in pop_anos[loc]:

                data_json[loc][i] = {'total': dic[i] / pop_anos[loc][i]["total"]}

            elif  i in [1993,1996,2001,2009,2010,2017]:

                data_json[loc][i] = {'total': dic[i]}

            elif i in  ["1993.1","1996.1","2001.1","2009.1","2010.1"]:
                num = int(float(i)//1)

                data_json[loc][num]['bacharlato'] = dic[i]

            elif i in  ["1993.2","1996.2","2001.2","2009.2","2010.2"]:
                num = int(float(i)//1)

                data_json[loc][num]['licenciatura'] = dic[i]

            elif i in  ["1993.3","1996.3","2001.3","2009.3","2010.3"]:
                num = int(float(i)//1)

                data_json[loc][num]['cese'] = dic[i]
            elif i in  ["1993.4","1996.4","2001.4","2009.4","2010.4"]:
                num = int(float(i)//1)

                data_json[loc][num]['comp-formacao'] = dic[i]
            elif i in  ["1993.5","1996.5","2001.5","2009.5","2010.5"]:
                num = int(float(i)//1)

                data_json[loc][num]['licenciatura-1C'] = dic[i]
            elif i in  ["1993.6","1996.6","2001.6","2009.6","2010.6"]:
                num = int(float(i)//1)

                data_json[loc][num]['mestrado-in'] = dic[i]
            elif i in  ["1993.7","1996.7","2001.7","2009.7","2010.7"]:
                num = int(float(i)//1)

                data_json[loc][num]['mestrado'] = dic[i]
            elif i in  ["1993.8","1996.8","2001.8","2009.8","2010.8"]:
                num = int(float(i)//1)

                data_json[loc][num]['esp'] = dic[i]
            elif i in  ["1993.9","1996.9","2001.9","2009.9","2010.9"]:
                num = int(float(i)//1)

                data_json[loc][num]['doutoramento'] = dic[i]

for a in files:
    for row_id, row in a.iterrows():
        dic = row.to_dict()
        loc = dic["Localidades"]

        for i in dic:
            if i != "Localidades" and 'Unnamed' not in str(i) and loc != ' ' and loc != "nan" and loc != None and i != None and pd.isnull(loc) == False:
                year = int(float(i)//1)
                if dic[i] == 0:
                    dic[i] = -1
                if i == year and i in pop_anos[loc]:
                    data_json[loc][i] = {'total': dic[i] / pop_anos[loc][i]["total"]}
                elif i==year:
                    data_json[loc][i] = {'total': dic[i]}
                elif i == str(year) + ".1":
                    data_json[loc][year]['bacharlato'] = dic[i]
                elif i == str(year) + ".2":
                    data_json[loc][year]['licenciatura'] = dic[i]
                elif i == str(year) + ".3":
                    data_json[loc][year]['cese'] = dic[i]
                elif i == str(year) + ".4":
                    data_json[loc][year]['comp-formacao'] = dic[i]
                elif i == str(year) + ".5":
                    data_json[loc][year]['licenciatura-1C'] = dic[i]
                elif i == str(year) + ".6":
                    data_json[loc][year]['mestrado-in'] = dic[i]
                elif i == str(year) + ".7":
                    data_json[loc][year]['mestrado'] = dic[i]
                elif i == str(year) + ".8":
                    data_json[loc][year]['esp'] = dic[i]
                elif i == str(year) + ".9":
                    data_json[loc][year]['doutoramento'] = dic[i]


with open("nivel_educacao.json", 'w') as json_file:
    json.dump(data_json, json_file)
