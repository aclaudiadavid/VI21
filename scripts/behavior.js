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
    //generate_parallel();
    //generate_stacked();
    all();
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
  var svg = d3.select("#parallel")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Extract the list of dimensions we want to keep in the plot
  //PROBLEMA
  dimensions = d3.keys(data[0]).filter(function(d) { return d != "Species" })

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
    .padding(1)
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
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.5)

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
  var anos_eleicoes = Object.keys(votes["PORTUGAL"]);
  var votos_portugal = votes["PORTUGAL"];

  var svg = d3.select("#grouped")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
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

    //var dt = stackedData(votos_portugal);

    svg.append("g")
    .selectAll("g")
    //.data(stackedData)
    .enter().append("g")
      .attr("fill", function(d) { return color(d.key); })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d) { return x(d.data.group); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width",x.bandwidth())

  //Title of X-Axis
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("x", width - margin.right)
  .attr("y", height + 25)
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

  //Title of LineChart
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("x", (margin.left + margin.right + width )/ 2)
  .attr("y", 0)
  .text("Portugal");  
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
        console.log(filteredMunicipalities)
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
  var name = d.toUpperCase();
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
      .text(function (d) {return keys[part] + " " + d[keys[part]];});
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
  .attr("y", height + 15)
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

  //Title of LineChart
  svg.append("text")
  .attr("text-anchor", "end")
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

  if (list.includes(d.properties.Concelho)) {
    list = list.filter((a) => a !== d.properties.Concelho)


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

  clear_line();

  const municipalitiesList = d3.select("#municipalities").selectAll("li").remove();
  list = [];
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
  .attr("y", height + 15)
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
