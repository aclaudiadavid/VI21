var map = "/data/ContinenteConcelhos.json"; //world view
var tvotes = "/data/resultados_eleicoes.json";
var desemp = "/data/desempregados_inscritos.json"
var crime = "/data/crime_registado.json"
var estran = "/data/estrangeiros_residentes_percentagem.json"
var velho = "/data/indice_envelhecimento.json"
var edu = "/data/nivel_educacao.json"
var compra = "/data/poder_compra.json"


var map2;
var votes;

var width = 400;
var height = 200;

var attribute;
var attrPos = ["crime", "employed", "immigrants", "seniors", "education", "power"]
list = ["PORTUGAL"]
regions = []
margin = { top: 20, right: 20, bottom: 20, left: 40 };
let years = [2001,2009,2013, 2017]
year = 2009;
var selector = [year, year, year, year, "total", year]

function init() {
  d3.select("#all").on("click", all);
  d3.select("#clear").on("click", clear);
  search_bar()
}

Promise.all([d3.json(map), d3.json(tvotes), d3.json(crime),d3.json(desemp),d3.json(estran),d3.json(velho),d3.json(edu),d3.json(compra)]).then(function (d) {
    map2 = d[0];
    votes = {};
    votesRaw = {}
    for(i in d[1]) {
      votes[i.toUpperCase().replace(/\s+/g, '')] = d[1][i]
      votesRaw[i.toUpperCase().replace(/\s+/g, '')] = i;
    }
    parallel_values = d.slice(2)
    yearF()
    generate_map();
    generate_parallel();
    generate_stacked();
    all();
    addZoom();
  });

function yearF() {
  d3.select("#year").select("h2").remove()
  d3.select("#year").append("h2").attr("id", "year-h2").text(year)
}

function yearDown() {
  if(years.indexOf(year) != 0) {
    year = years[years.indexOf(year)-1]
  }

  yearF()
  generate_parallel()
  changeParallel()
  generate_bar();
}

function yearUp() {
  if(years.indexOf(year) != 3) {
    year = years[years.indexOf(year)+1]
  }

  yearF()
  generate_parallel()
  changeParallel()
  generate_bar()
}

function generate_map() {
  var projection = d3
    .geoMercator()
    .scale(6000)
    .rotate([5, 5000]);

  var geog = d3.geoPath().projection(projection);

  svg = d3.select("#map")
    .append("svg")
    .attr("width", 450)
    .attr("height", 690);

  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(map2, map2.objects.Concelhos).features)
    .join("path")
    .attr("class", "Concelho")
    .attr("d", geog)
    .attr("id", (d) => {
      regions.push(d.properties.Concelho.replace(/\s+/g, ''));
      return d.properties.Concelho.replace(/\s+/g, '');
    })
    .on("click", handleClick)
    .append("title")
    .text(function (d) {
      return votesRaw[d.properties.Concelho.replace(/\s+/g, '')];
    });
}

function generate_parallel() {
  d3.select("#parallel").select("svg").remove()

  data = getDataYear(year)

  var svg = d3.select("#parallel")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", "parallel-id")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Extract the list of dimensions we want to keep in the plot
  dimensions = Object.keys(data[0]).filter(function(d) { return d != "concelho" })

  // For each dimension, I build a linear scale. I store all in a y object
  var y = {}
  for (i in dimensions) {
    name = dimensions[i]
    y[name] = d3.scaleLinear()
      .domain( d3.extent(data, function(d) { return +d[name]; }) )
      .range([height, 0])
  }

  // Build the X scale -> it find the best position for each Y axis
  x = d3.scalePoint()
    .range([0, width])
    .domain(dimensions);

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function path(d) {
      return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
  }

  // Draw the lines
  svg
    .selectAll("myPath")
    .data(data)
    .enter().append("path")
    .attr("d",  path)
    .attr("id", (d) => {return d.concelho})
    .style("fill", "none")
    .style("stroke", () => {if (list.length != 0) {return "steelblue"} else {return "grey"}} )
    .style("opacity", 0.5)
    .append("title")
    .text(function (d) {
      return votesRaw[d.concelho];
    });

  // Draw the axis:
  svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    // I translate this element to its right position on the x axis
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
    // Add axis title
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; })
      .style("fill", "black")
}

function generate_stacked() {
  if(list.length == 0) {
    clearGroup();
  } else {
    d3.select("#grouped").select("svg").remove()

    var loc = list[0];
    var anos_eleicoes = Object.keys(votes["PORTUGAL"])
    var votos_portugal = []
    for(i in list) {
      votos_portugal.push(votes[list[i]]);
    }

    var svg = d3.select("#grouped")
      .append("svg")
      .attr("width", width + 100 + margin.left + margin.right)
      .attr("height", height + 20 + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // color palette = one color per subgroup
      /*var color = d3.scaleSequential(d3.interpolateInferno)
      .domain([0, width])*/

      var data = []
      /*for(i in votos_portugal) {
        for(j in anos_eleicoes) {
          total = votos_portugal[i][anos_eleicoes[j]]["total"];
          data.push({"loc": list[i], "ano": anos_eleicoes[j], "votos": (votos_portugal[i][anos_eleicoes[j]]["votos"]/total)*100, "abstencao": (votos_portugal[i][anos_eleicoes[j]]["abstencoes"]/total)*100})
        }
      }

      console.log(data)*/

      for(i in anos_eleicoes) {
        var d = {}
        d["ano"] = anos_eleicoes[i]
        for (j in votos_portugal) {
          total = votos_portugal[j][anos_eleicoes[i]]["total"]
          d[list[j]] = [0,(votos_portugal[j][anos_eleicoes[i]]["votos"]/total)*100]
          //d[list[j]] = [(votos_portugal[j][anos_eleicoes[i]]["votos"]/total)*100, 100]
        }

        data.push(d)
      }

      var subgroups = list;
      var groups = d3.map(data, function(d){return d.ano})

      var x = d3.scaleBand()
      .domain(anos_eleicoes)
      .range([0, width])
      .padding([0.2])

      var xSubgroup = d3.scaleBand()
      .domain(list)
      .range([0, x.bandwidth()])
      .padding([0.1])

      svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickSizeOuter(0));

      // Add Y axis
      var y = d3.scaleLinear()
      .domain([0, 100])
      .range([ height, 0 ]);

      svg.append("g")
      .call(d3.axisLeft(y));

      var stackedData = d3.stack()
      .keys(["votos", "abstencao"]);

      var dt = stackedData(data);

      //console.log(dt)

      // Show the bars
      // Show the bars
      svg.append("g")
        .selectAll("g")
        // Enter in data = loop group per group
        .data(data)
        .enter()
        .append("g")
        .attr("transform", function(d) {return "translate(" + x(d.ano) + ",0)"; })
        .selectAll("rect")
        .data(function(d) { return subgroups.map(function(key) {return {key: key, value: d[key]}; }); })
        .enter().append("rect")
        .attr("x", function(d) { return xSubgroup(d.key); })
        .attr("y", function(d) { return y(d.value[1]); })
        .attr("y0", function(d) {return y(d.value[0]);})
        .attr("width", xSubgroup.bandwidth())
        .attr("height", function(d) { return height - y(d.value[1]); })
        .attr("fill", function(d, i) { return d3.interpolateGnBu(((i+1)/list.length))})
        .append("title")
        .text(function (d) {
          return "votes: " + Math.round(d.value[1]*100)/100 + "%";
        });;


    //Title of X-Axis
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width - margin.right)
    .attr("y", height + 30)
    .style("font-size", "13px")
    .text("Election years");

    //Title of Y-Axis
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 10)
    .attr("x", -margin.top + 25)
    .style("font-size", "13px")
    .text("% of votes");

    //Title of stacked
    svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", (margin.left + margin.right + width)/ 2)
    .attr("y", 0)
    .attr("id", "grouped-title")
    .text("Voting participation per municipality");


    var spacing = 0; //espaçamento entre cada código de cor
    var l = list.length
    i = 1
    for (d in list) {
      svg.append("circle").attr("cx",width).attr("cy",height-140+spacing).attr("r", 5).style("fill",d3.interpolateGnBu(i/l))  //paints the corresponding color
      svg.append("text").attr("x", width+10).attr("y", height-140+spacing).text(votesRaw[list[d]]).style("font-size", "11px").attr("alignment-baseline","middle");  //writes the name of the party
      spacing+=20
      i++;
    }

    /*
    svg.append("circle").attr("cx",width + margin.left).attr("cy",height-140).attr("r", 5).style("fill", red);
    svg.append("text").attr("x", width).attr("y", height-140).text("Voting participation").style("font-size", "11px").attr("alignment-baseline","middle");
      */
  }
}

function generate_bar() {
  if(list.length == 0) {
    clearBar();
  } else {
    d3.select("#bar").select("svg").remove()

    var svg = d3.select("#bar")
      .append("svg")
      .attr("width", width + margin.left + margin.right + 50)
      .attr("height", height + margin.top + margin.bottom + 40)
      .attr("id", "bar-id")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var pX = []
    for (i in list) {
      pX.push(votesRaw[list[i]]);
    }
    if (document.getElementById('crime').checked) {
      attribute = "crime";
    } else if (document.getElementById('employed').checked) {
      attribute = "employed";
    } else if (document.getElementById('immigrants').checked) {
      attribute = "immigrants";
    } else if (document.getElementById('seniors').checked) {
      attribute = "seniors";
    } else if (document.getElementById('education').checked) {
      attribute = "education";
    } else if (document.getElementById('power').checked) {
      attribute = "power";
    } else {
      attribute = "none";
    }


    data_bar = []
    for (i in pX) {
      c = {}
      var value = 0
      c["concelho"] = pX[i];
      if(attribute == "education") {
        if(parallel_values[attrPos.indexOf(attribute)][pX[i]][year].total < 0) {
          value = 0
        } else {
          value = parallel_values[attrPos.indexOf(attribute)][pX[i]][year].total * 100
        }
      } else if(attribute != "none") {
        if(parallel_values[attrPos.indexOf(attribute)][pX[i]][year]<0) {
          value = 0
        } else {
          attribute=="employed"?value = parallel_values[attrPos.indexOf(attribute)][pX[i]][year]*100:0
          attribute=="seniors"?value = parallel_values[attrPos.indexOf(attribute)][pX[i]][year]/100:0
          attribute=="power"?value = parallel_values[attrPos.indexOf(attribute)][pX[i]][year]/100:0
          attribute=="crime"?value = parallel_values[attrPos.indexOf(attribute)][pX[i]][year]:0
          attribute=="immigrants"?value = parallel_values[attrPos.indexOf(attribute)][pX[i]][year]:0
        }
      }
      c[attribute] = value

      max = 0;
      part = ""
      for(j in votes[pX[i].toUpperCase().replace(/\s+/g, '')][year]) {
        if(votes[pX[i].toUpperCase().replace(/\s+/g, '')][year][j]> max && j!="total" && j!="votos" && j!="abstencao") {
          max = votes[pX[i].toUpperCase().replace(/\s+/g, '')][year][j]
          part=j
        }
      }
      c["votes"] = (max/votes[pX[i].toUpperCase().replace(/\s+/g, '')][year].votos)*100
      c["part"] = part

      data_bar.push(c)
    }

    var max = d3.max(data_bar, (d) => {
      if (d[attribute]) {
        return d[attribute]
      }
      return 1;
    })

    var x = d3.scaleBand()
      .domain(pX)
      .range([0, width-10])
      .padding([0.2]);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(15,-5)rotate(-25)")  //TODO isto nao esta nada centrado
      .style("text-anchor", "end");

    var y0 = d3.scaleLinear()
      .domain([0, 100])
      .range([ height, 0 ]);

    svg.append("g")
      .call(d3.axisLeft(y0));

    var y1 = d3.scaleLinear()
      .domain([0, max])
      .range([ height, 0 ]);


    svg.append("g")
      .attr("transform", "translate(" + (width-10) + " ,0)")
      .call(d3.axisRight(y1));
      
    svg.selectAll("bars")
      .data(data_bar)
      .enter()
      .append("rect")
        .attr("x", function(d) {return x(d.concelho); })
        .attr("y", (d) => {return y1(d[attribute])})
        .attr("width", x.bandwidth())
        .attr("height", function(d) {
          return height - y1(d[attribute])
        })
        .attr("fill", "#7ba3c6")
        .append("title")
        .text(function (d) {
          return attribute + ": " + d[attribute];
        });

    partidos_principais = ["PS", "PSD", "PAN", "BE", "PCP", "CDS-PP"];

    var colorScale1 = d3.scaleOrdinal()
    .domain(partidos_principais)
    .range(['#f63574','#f08a01','#0e6283', '#c90535', '#fad405', '#008bd6']);

    var colorScale2 = d3.scaleOrdinal()
    .domain([0,10])
    .range(['#16b311', '#ddb220', '#b14d14', '#ff0000', '#000000', '#af0f88', '#6d5b69', '#16d189', '#581845','#56ff00'])

    svg.selectAll("circle")
    .data(data_bar)
    .enter()
    .append("circle")
      .attr("cx", function(d) {return (x(d.concelho)+ (x.bandwidth()/2))})
      .attr("cy", (d) => {return y0(d["votes"])})
      .attr("r", ()=>{
        return list.length<6? 11-list.length:5;
      })
      .attr("height", function(d) {
        return height - y0(d[attribute]);
      })
      .attr("fill", function(d) {
        if(partidos_principais.includes(d.part)) {
          //console.
          return colorScale1(d.part);
        }else{
          return colorScale2(d.part);
        }
      })
      .append("title")
      .text(function (d) {
        return  d.part + ": " + Math.round(d["votes"]*100)/100;
      });


    //Title of X-Axis
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width + 20)
    .attr("y", height + 40)
    .style("font-size", "13px")
    .text("Municipalities");

    //Title of Y-Axis
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 10)
    .attr("x", -margin.top + 25)
    .style("font-size", "13px")
    .text("% of votes on winning party");

    //Title of Y1-Axis
    if (attribute == "crime") {
      svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", 450)
      .attr("x", -margin.top + 25)
      .style("font-size", "13px")
      .text("Crime Ratio");
    } else if (attribute == 'employed') {
      svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", 450)
      .attr("x", -margin.top + 25)
      .style("font-size", "13px")
      .text("% Employed");
    } else if (attribute == 'immigrants') {
      svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", 450)
      .attr("x", -margin.top + 25)
      .style("font-size", "13px")
      .text("% Immigrants");
    } else if (attribute == 'seniors') {
      svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", 450)
      .attr("x", -margin.top + 25)
      .style("font-size", "13px")
      .text("Ratio Seniors/100");
    } else if (attribute == 'education') {
      svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", 450)
      .attr("x", -margin.top + 25)
      .style("font-size", "13px")
      .text("% University Education");
    } else if (attribute == 'power') {
      svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", 450)
      .attr("x", -margin.top + 25)
      .style("font-size", "13px")
      .text("Purchasing Power");
    } else {

    }
  }
}

function search_bar() {
  const municipalitiesList = d3.select("#municipalities");
  const searchBar = document.getElementById('searchBar');

  searchBar.addEventListener('keyup', (e) => {
    const searchString = e.target.value.toUpperCase();

    const filteredMunicipalities = regions.filter((Concelho) => {
      if (Concelho.toUpperCase().includes(searchString.replace(/\s+/g, ''))) {
        return Concelho;
      }
    });

    for (i in filteredMunicipalities) {
      filteredMunicipalities[i] = votesRaw[filteredMunicipalities[i]];
    }

    municipalitiesList.selectAll("li").remove()

    if (searchString != "" && filteredMunicipalities.length < 5) {
      for (i in filteredMunicipalities) {
        var name = filteredMunicipalities[i]
        searchList(municipalitiesList, name)
      }
    }
  });
}

function searchList(municipalitiesList,name){
  municipalitiesList.append("li").append("a").on("click", function() {
    add(name)
  }).text(name);
}

function add(d) {
  var name = d.toUpperCase().replace(/\s+/g, '');
  if (list.includes(name)) {
    list.pop(name);

    d3.select("#"+name)
      .attr("fill", "black");
  } else {
    list.push(name);

    d3.select("#"+name)
      .attr("fill", "steelblue");
  }
  add_line_charts();
  changeParallel();
  generate_stacked();
  generate_bar();
}

function add_line_charts(){
  if (list.length == 0) {
    clear_line();
  } else {
    d3.select("#lineChart").selectAll("svg").remove()

    if (list.length != 0) {
      for (i in list) {
        generate_line_chart(list[i]);
      }
    }
  }
}

function generate_line_chart(concelho) {
  concelho = concelho.toUpperCase().replace(/\s+/g, '');
  var anos_eleicoes = Object.keys(votes[concelho]);
  var votos_concelho = Object.values(votes[concelho])

  var svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 180)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x = d3
      .scaleLinear()
      .domain([1993, 2017])
      .nice()
      .range([margin.left, width - margin.right]);

  y = d3
      .scaleLinear()
      .domain([0,100])
      .range([height - margin.bottom, margin.top]);

  xAxis = (g) =>
      g.attr("transform", `translate(0,${height - margin.bottom})`)
          .call(
              d3
              .axisBottom(x)
              .tickFormat((x) => x)
              .tickValues(d3.range(1993, 2018, 4))
          );
  yAxis = (g) =>
      g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3
                  .axisLeft(y)
                  .tickFormat((x) => x));

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);


// Palete de cores - 1 cor por cada partido politico principal

partidos_principais = ["PS", "PSD", "PAN", "BE", "PCP", "CDS-PP"];

var colorScale1 = d3.scaleOrdinal()
.domain(partidos_principais)
.range(['#f63574','#f08a01','#0e6283', '#c90535', '#fad405', '#008bd6']);


// Palete de cores secundária para partidos menores/coligações

var colorScale2 = d3.scaleOrdinal()
.domain([0,10])
.range(['#16b311', '#ddb220', '#b14d14', '#ff0000', '#000000', '#af0f88', '#6d5b69', '#16d189', '#581845','#56ff00'])

  keys = []
  for(i in anos_eleicoes) {
    for(part in votes[concelho][anos_eleicoes[i]]) {
      if (!(keys.includes(part))) {
        keys.push(part);
      }
    }
  }

  partidos_desenhados = {}
  //keys = ["PS", "PSD", "PAN", "BE", "PCP", "CDS-PP"];
  //comentar a linha de cima quando nao testar
  for (part in keys) {
    svg.append("path")
    .datum(votos_concelho)
    .attr("fill", "none")
    .attr("stroke", function(d) {if (partidos_principais.includes(keys[part])){return colorScale1(keys[part])}else return colorScale2(keys[part])})
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", d3.line()
      .x((d, i) => x(parseInt(anos_eleicoes[i],10)))
      .y((d) =>{
        if(d[keys[part]] != -1 && d[keys[part]] != null && keys[part] != "total" && keys[part] != "votos" && keys[part] != "abstencao" ) {
          if (keys[part] in partidos_desenhados == false){
            partidos_desenhados[keys[part]] = d[keys[part]]
          } else {
            partidos_desenhados[keys[part]] += d[keys[part]]
          }
          return y((d[keys[part]]/d.votos)*100);
        }
        else {return  y(0)}
      }))
    .append("title")
    .text(function () {return keys[part]});

    svg.selectAll("myCircles")
    .data(votos_concelho)
    .enter()
    .append("circle")
      .attr("fill", "black")
      .attr("stroke", "none")
      .attr("cx", function(d, i) { return x(parseInt(anos_eleicoes[i],10)) })
      .attr("cy", (d) =>{
        if(d[keys[part]] != -1 && d[keys[part]] != null && keys[part] != "total" && keys[part] != "votos" && keys[part] != "abstencao" ) {
          if (keys[part] in partidos_desenhados == false){
            partidos_desenhados[keys[part]] = d[keys[part]]
          } else {
            partidos_desenhados[keys[part]] += d[keys[part]]
          }
          return y((d[keys[part]]/d.votos)*100);
        }
        else {return  y(0)}
      })
      .attr("r", 1.5)
      .append("title")
      .text(function (d) {return keys[part] + " Votes: " + d[keys[part]];});
  }

  partidos_show = []
  let length = 0;
  for(i in partidos_desenhados) {
    length += 1;
  }

  if (length > 5) {
    length = 5
  }

  for(var j=0;j<length;j++) {
    max = 0;
    p = ""
    for (i in partidos_desenhados) {
      if (partidos_desenhados[i] > max) {
        p = i;
        max = partidos_desenhados[i];
      }
    }
    partidos_show.push(p);
    partidos_desenhados[p] = 0
  }

  //Title of X-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("x", width - margin.right)
  .attr("y", height + 10)
  .style("font-size", "13px")
  .text("Election years");

  //Title of Y-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("y", -margin.left + 49)
  .attr("x", -margin.top + 5)
  .style("font-size", "13px")
  .text("% of votes");

  //Title of LineChart
  svg.append("text")
  .attr("text-anchor", "middle")
  .attr("x", (margin.left + margin.right + width )/ 2)
  .attr("y", 0)
  .text(votesRaw[concelho]);


  var spacing = 0; //espaçamento entre cada código de cor

  for (part in partidos_show) {
    //Legend
    svg.append("circle").attr("cx",width-20).attr("cy",height-140+spacing).attr("r", 5).style("fill", function(d) {if (partidos_principais.includes(partidos_show[part])){ return colorScale1(partidos_show[part])}else return colorScale2(partidos_show[part])});  //paints the corresponding color
    svg.append("text").attr("x", width-10).attr("y", height-140+spacing).text(function(){return partidos_show[part]}).style("font-size", "11px").attr("alignment-baseline","middle");  //writes the name of the party
    spacing+=20

  }}

function handleClick(event, d) {
  name = d.properties.Concelho.replace(/\s+/g, '');

  if (list.includes("PORTUGAL")) {
    clear();
    handleClick(d);
  }

  if (list.includes(d.properties.Concelho.replace(/\s+/g, ''))) {
    list = list.filter((a) => a !== d.properties.Concelho.replace(/\s+/g, ''))


    d3.select("#"+name)
      .attr("fill", null);
  } else {
    list.push(name);

    d3.select("#"+name)
      .attr("fill", "steelblue");
  }
  add_line_charts();
  changeParallel();
  generate_stacked();
  generate_bar();
}


function changeParallel() {
  d3.select("#parallel-id")
  .selectAll("g")
  .selectAll("path")
  .transition()
  .style("stroke", "grey")
  .style("opacity", 0.1)

  for (i in list) {
    d3.select("#parallel-id")
    .selectAll("g")
    .selectAll("path")
    .filter((d) => {
      if(d != null) {
        return d["concelho"] == list[i]
      }
    })
    .transition()
    .style("stroke", "steelblue")
    .style('opacity', 1)
    .style("stroke-width", "3px")
  }
}

function all() {
  list = ["PORTUGAL"];

  d3.select("#map")
  .transition()
  .selectAll("path")
  .attr("fill", "steelblue");

  d3.select("#parallel-id")
  .selectAll("g")
  .selectAll("path")
  .transition()
  .style("stroke", "steelblue")
  .style("opacity", 0.5)

  add_line_charts();
  generate_stacked();
  generate_bar();
}

function clear() {
  d3.select("#map")
  .transition()
  .selectAll("path")
  .attr("fill", "black")

  d3.select("#parallel-id")
  .selectAll("g")
  .selectAll("path")
  .transition()
  .style("stroke", "grey")
  .style("opacity", 0.5)

  d3.select(".axis")
    .style("stroke", "black")

  clear_line();
  clearGroup();
  clearBar();

  const municipalitiesList = d3.select("#municipalities").selectAll("li").remove();
  list = [];
}

function clearBar() {
  d3.select("#bar").select("svg").remove()

  var svg = d3.select("#bar")
    .append("svg")
    .attr("width", width + margin.left + margin.right + 50)
    .attr("height", height + margin.top + margin.bottom + 40)
  .attr("id", "bar-id")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var check = document.getElementById(attribute)
  check!=null? check.checked=false:null

  var x = d3.scaleBand()
    .domain([])
    .range([0, width-10])
    .padding([0.2]);

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(15,-5)rotate(-25)")  //TODO isto nao esta nada centrado
    .style("text-anchor", "end");

  var y0 = d3.scaleLinear()
    .domain([0, 100])
    .range([ height, 0 ]);

  svg.append("g")
    .call(d3.axisLeft(y0));

  var y1 = d3.scaleLinear()
    .domain([0, 100])
    .range([ height, 0 ]);

  svg.append("g")
    .attr("transform", "translate(" + (width-10) + " ,0)")
    .call(d3.axisRight(y1));

  //Title of X-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("x", width + 20)
  .attr("y", height + 40)
  .style("font-size", "13px")
  .text("Municipalities");

  //Title of Y-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("y", -margin.left + 10)
  .attr("x", -margin.top + 25)
  .style("font-size", "13px")
  .text("% of votes on winning party");
}

function clear_line() {
  d3.select("#lineChart").selectAll("svg").remove();

  var svg = d3.select("#lineChart")
  .append("svg")
  .attr("width", width + margin.left + margin.right + 180)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x = d3
  .scaleLinear()
  .domain([1993, 2017])
  .nice()
  .range([margin.left, width - margin.right]);

  y = d3
  .scaleLinear()
  .domain([0,100])
  .range([height -margin.bottom, margin.top]);

  xAxis = (g) =>
  g.attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
          d3
          .axisBottom(x)
          .tickFormat((x) => x)
          .tickValues(d3.range(1993, 2018, 4))
      );
  yAxis = (g) =>
  g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3
              .axisLeft(y)
              .tickFormat((x) => x));

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  //Title of X-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("x", width - margin.right)
  .attr("y", height + 10)
  .style("font-size", "13px")
  .text("Election years");

  //Title of Y-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("y", -margin.left + 40)
  .attr("x", -margin.top)
  .style("font-size", "13px")
  .text("% of votes");
}

function clearGroup() {
  d3.select("#grouped").select("svg").remove()

  var svg = d3.select("#grouped")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + 20 + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    var x = d3.scaleBand()
    .domain(Object.keys(votes["PORTUGAL"]))
    .range([0, width])
    .padding([0.2])

    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0));

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([0, 100])
    .range([ height, 0 ]);

    svg.append("g")
    .call(d3.axisLeft(y));

  //Title of X-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("x", width - margin.right)
  .attr("y", height + 30)
  .style("font-size", "13px")
  .text("Election years");

  //Title of Y-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("y", -margin.left + 10)
  .attr("x", -margin.top + 25)
  .style("font-size", "13px")
  .text("% of votes");
}

function getDataYear(year) {
  var data = []

  for (i in votesRaw) {
    concelho = {}
    if(i != "PORTUGAL" && i != "CONTINENTE" && i != "NORTE" && i != "ÁREAMETROPOLITANADOPORTO" && i != "DOURO" && i != "TERRASDETRÁS-OS-MONTES" && i != "CENTRO" && i != "OESTE" && i != "REGIÃODEAVEIRO" && i != "REGIÃODECOIMBRA" && i != "REGIÃODELEIRIA" && i != "BEIRABAIXA" && i != "MÉDIOTEJO" && i != "BEIRASESERRADAESTRELA" && i != "ÁREAMETROPOLITANADELISBOA" && i != "ALENTEJO" && i != "ALENTEJOLITORAL" && i != "BAIXOALENTEJO" && i != "LEZÍRIADOTEJO" && i != "ALTOALENTEJO" && i != "ALENTEJOCENTRAL" && i != "ALGARVE" && i != "REGIÃOAUTÓNOMADOSAÇORES" && i != "ILHADESANTAMARIA" && i != "ILHADESÃOMIGUEL" && i != "ILHATERCEIRA" && i != "ILHAGRACIOSA" && i != "ILHADESÃOJORGE" && i != "ILHADOPICO" && i != "ILHADOFAIAL" && i != "ILHADASFLORES" && i != "ILHADOCORVO" && i != "REGIÃOAUTÓNOMADAMADEIRA" && i != "ILHADAMADEIRA" && i != "ILHADEPORTOSANTO") {
      c = votesRaw[i];
      concelho["concelho"] = i;
      if (parallel_values[0][c][year] != null) {
        concelho["Crime Ratio"] = parallel_values[0][c][year] != -1? parallel_values[0][c][year]:-0.1
      }
      if (parallel_values[1][c][year] != null) {
        concelho["% Employed"] = parallel_values[1][c][year] != -1?   parallel_values[1][c][year] * 100:-1
      }
      concelho["% Immigrants"] = parallel_values[2][c][year] != null? parallel_values[2][c][year]:-1
      concelho["Ratio Seniors/100"] = parallel_values[3][c][year] != null? parallel_values[3][c][year]/100:-1
      concelho["% Univ. Edu."] = parallel_values[4][c][year]["total"] != null? parallel_values[4][c][year]["total"]*100:-1
      concelho["Purch. Power"] = parallel_values[5][c][year] != null? parallel_values[5][c][year]/100:-1

      data.push(concelho)
    }
  }

  return data
}

function addZoom() {
  d3.select("#map")
    .selectAll("svg")
    .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed));
}

function zoomed({transform}) {
  d3.select("#map")
    .selectAll("svg")
    .selectAll("path")
    .attr("transform", transform);
}
