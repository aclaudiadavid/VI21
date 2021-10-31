var map = "/data/ContinenteConcelhos.json"; //world view
var tvotes = "/data/resultados_eleicoes.json";

var map2;
var votes;

var width = 500;
var height = 600;

margin = { top: 20, right: 20, bottom: 20, left:40 };

Promise.all([d3.json(map), d3.json(tvotes)]).then(function (d) {
    map2 = d[0];
    votes = d[1];
    //console.log(votes);
    //generate_map();
    //generate_stacked();
    generate_line_chart();
    //addZoom();
  });

function generate_map() {
  var projection = d3
    .geoMercator()
    .scale(6000)
    .rotate([5, 5000])
    //.translate([width / 2, height / 2]);

  var geog = d3.geoPath().projection(projection);

  svg = d3.select("#map")
    .append("svg")
    .attr("width", 550)
    .attr("height", 850)

  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(map2, map2.objects.Concelhos).features)
    .join("path")
    .attr("class", "Concelho")
    .attr("d", geog)
    .on("mouseover", handleMouseOver)
    .on("mouseleave", handleMouseLeave)
    /*.attr("id", function (d, i) {
      return d.properties.name;
    })
    .append("title")
    .text(function (d) {
      return d.properties.name;
    })*/;
}

function generate_stacked() {

  //var concelhos = Object.keys(votes);
  //console.log(concelhos);
  var anos_eleicoes = Object.keys(votes["Portugal"]);
  var votos_portugal = votes["Portugal"];
  console.log(votos_portugal);

  var svg = d3.select("#stacked")
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

  var dt = stackedData(votos_portugal);


}

function generate_line_chart(){

  width = 500;

  height = 400;

  margin = { top: 20, right: 20, bottom :20, left: 40};


  var anos_eleicoes = Object.keys(votes["Cascais"]);
  var votos_concelho = Object.values(votes["Cascais"]);
  //console.log(votos_concelho);
  
  anos_eleicoes = anos_eleicoes.map(function(item){return parseInt(item,10);});

  console.log(anos_eleicoes);

  /*votos_PS = votos_concelho.filter(function(d) {
               console.log(d.PS);
  });*/

 /*line = d3
        .line()
        .defined(function (d) {
          return d.PS > 0;
        })
        .x((d) => d)
        .y((d) => y(d.PS));*/


  var svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x = d3
        .scaleLinear()
        .domain([1993,2017])
        .range([margin.left, width - margin.right]);

    y = d3
        .scaleLinear()
        .domain([0,100000])
        .range([height -margin.bottom, margin.top]);

    xAxis = (g) =>
        g.attr("transform", `translate(0,${height - margin.bottom})`)
            .call(
                d3
                    .axisBottom(x)
                    .tickFormat((x) => x)
                    .tickSizeOuter(0)
            );

    yAxis = (g) =>
        g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3
                    .axisLeft(y)
                    .tickFormat((x) => x));

    svg.append("g").call(xAxis);

    svg.append("g").call(yAxis);

    svg.append("path")
    .datum(votos_concelho)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", d3.line()
       .x((d, i) => x(parseInt(anos_eleicoes[i],10)))
       .y((d) => y(d.PS)));

       
     //Title of X-Axis
  svg.append("text")
     .attr("text-anchor", "end")
     .attr("x", width - margin.right)
     .attr("y", height + margin.top)
     .text("Anos de Eleições");

     //Title of Y-Axis
  svg.append("text")
     .attr("text-anchor", "end")
     .attr("transform", "rotate(-90)")
     .attr("y", -margin.left+20)
     .attr("x", -margin.top)
     .text("Nº de votos");
  
     //Title of LineChart
  svg.append("text")
     .attr("text-anchor", "end")
     .attr("x", (margin.left + margin.right + width )/ 2)
     .attr("y", 0)
     .text("Cascais");

}

function handleMouseOver(event, d) {
  map = d3.select("div#map").select("svg");

  map
    .selectAll("path")
    .filter(function (c) {
      if (d.properties.Concelho == c.properties.Concelho) {
        return c;
      }
    })
    .style("fill", "#fa624d");
}

function handleMouseLeave(event, d) {
  map = d3.select("div#map").select("svg");

  map
    .selectAll("path")
    .style("fill", "black");
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
