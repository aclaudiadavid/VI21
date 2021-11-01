var map = "/data/ContinenteConcelhos.json"; //world view
var tvotes = "/data/resultados_eleicoes.json";

var map2;
var votes;

var width = 400;
var height = 200;

list = []
regions = []
margin = { top: 20, right: 20, bottom: 20, left: 40 };

function init() {
  d3.select("#all").on("click", all);
  d3.select("#clear").on("click", clear);
  search_bar()
}

Promise.all([d3.json(map), d3.json(tvotes)]).then(function (d) {
    map2 = d[0];
    votes = {};
    votesRaw = {}
    for(i in d[1]) {
      votes[i.toUpperCase().replace(/\s+/g, '')] = d[1][i]
      votesRaw[i.toUpperCase().replace(/\s+/g, '')] = i;
    }
    generate_map();
    //generate_stacked();
    addZoom();
  });

function generate_map() {
  var projection = d3
    .geoMercator()
    .scale(6000)
    .rotate([5, 5000]);

  var geog = d3.geoPath().projection(projection);

  svg = d3.select("#map")
    .append("svg")
    .attr("width", 470)
    .attr("height", 700);

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
      return d.properties.Concelho;
    });
}

function search_bar() {
  const municipalitiesList = d3.select("#municipalities");
  const searchBar = document.getElementById('searchBar');

  searchBar.addEventListener('keyup', (e) => {
    const searchString = e.target.value.toUpperCase();

    const filteredMunicipalities = regions.filter((Concelho) => {
      return (Concelho.toUpperCase().includes(searchString.replace(/\s+/g, '')));
    });

    municipalitiesList.selectAll("li").remove()

    if (searchString != "" && filteredMunicipalities.length < 5) {
      for (i in filteredMunicipalities) {
        municipalitiesList.append("li").append("a").on("click", () => add(filteredMunicipalities[i])).text(filteredMunicipalities[i]);
      }
    }
  });
}

function add(d) {
  if (list.includes(d)) {
    list.pop(d);

    d3.select("#"+d)
      .attr("fill", "black");
  } else {
    list.push(d);

    d3.select("#"+d)
      .attr("fill", "steelblue");
  }
  add_line_charts();
}

function generate_stacked() {

  //var concelhos = Object.keys(votes);
  //console.log(concelhos);
  var anos_eleicoes = Object.keys(votes["Portugal"]);
  var votos_portugal = votes["Portugal"];
  console.log(votos_portugal);

  var svg = d3.select("#stacked")
    .append("svg")
    .attr("width", width - 50 + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    var x = d3.scaleBand()
    .domain(anos_eleicoes)
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

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
    .domain(["votos", "abstencao"])
    .range(['#e41a1c','#377eb8']);

    var stackedData = d3.stack()
    .keys(["votos", "abstencao"]);

    var dt = stackedData(votos_portugal);
}

function add_line_charts(){
  d3.select("#lineChart").selectAll("svg").remove()

  if (list.length != 0) {
    for (i in list) {
      generate_line_chart(list[i]);
    }
  }
}

function generate_line_chart(concelho) {
  concelho = concelho.replace(/\s+/g, '');
  var anos_eleicoes = Object.keys(votes[concelho]);
  var votos_concelho = Object.values(votes[concelho])
  console.log(votos_concelho);


  var svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 100)
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


// Palete de cores - 1 cor por cada partido politico
var colorScale = d3.scaleOrdinal()
.domain(["PS", "PSD", "PAN", "BE", "PCP", "CDS-PP"])
.range(['#f63574','#f08a01','#0e6283', '#c90535', '#fad405', '#008bd6']);

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
    .attr("stroke", function(d) {return colorScale(keys[part])})
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", d3.line()
      .x((d, i) => x(parseInt(anos_eleicoes[i],10)))
      .y((d) =>{
        if(d[keys[part]] != -1 && d[keys[part]] != null && keys[part] != "total" && keys[part] != "votos" && keys[part] != "abstencao" ) {
          //console.log(keys[part])
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
    .text(function () {return keys[part]});  //To do: adicionar circulos invisiveis nos pontos, e meter partido+número absoluto de votos
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
  .attr("x", width - margin.right - 0)
  .attr("y", height + margin.top)
  .text("Election years");

  //Title of Y-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("y", -margin.left+30)
  .attr("x", -margin.top)
  .text("% of votes");

  //Title of LineChart
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("x", (margin.left + margin.right + width )/ 2)
  .attr("y", 0)
  .text(votesRaw[concelho]);


  var spacing = 0;
  for (part in partidos_show) {
    svg.append("circle").attr("cx",width-20).attr("cy",height-200+spacing).attr("r", 6).style("fill", function(d) {return colorScale(partidos_show[part])});  //paints the corresponding color
    svg.append("text").attr("x", width).attr("y", height-200+spacing).text(function(){ return partidos_show[part] }).style("font-size", "15px").attr("alignment-baseline","middle");  //writes the name of the party
    spacing+=20

  }}

function handleClick(event, d) {
  name = d.properties.Concelho.replace(/\s+/g, '');

  if (list.includes(d.properties.Concelho)) {
    list.pop(d.properties.Concelho);

    d3.select("#"+name)
      .attr("fill", null);
  } else {
    list.push(d.properties.Concelho);

    d3.select("#"+name)
      .attr("fill", "steelblue");
  }

  add_line_charts();
}

function all() {
  list = ["PORTUGAL"];

  d3.select("#map")
  .transition()
  .selectAll("path")
  .attr("fill", "steelblue");

  add_line_charts();
}

function clear() {
  d3.select("#map")
  .transition()
  .selectAll("path")
  .attr("fill", "black");

  d3.select("#lineChart").selectAll("svg").remove()

  const municipalitiesList = d3.select("#municipalities").selectAll("li").remove();
  list = [];
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
