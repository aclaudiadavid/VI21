var map = "/data/ContinenteConcelhos.json"; //world view
var tvotes = "/data/resultados_eleicoes.json";

var map2;
var votes;

var width = 400;
var height = 200;

list = []
regions = []
margin = { top: 20, right: 20, bottom: 20, left:40 };

function init() {
  d3.select("#all").on("click", all);
  d3.select("#clear").on("click", clear);
  search_bar()
}

Promise.all([d3.json(map), d3.json(tvotes)]).then(function (d) {
    map2 = d[0];
    votes = d[1];
    generate_map();
    //generate_stacked();
    generate_line_chart();
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
  console.log(d);
  if (list.includes(d)) {
    list.pop(d);

    d3.select("#"+d)
      .attr("fill", "black");
  } else {
    list.push(d);

    d3.select("#"+d)
      .attr("fill", "steelblue");
  }}

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

function generate_line_chart() {
  var anos_eleicoes = Object.keys(votes["Cascais"]);
  var votos_concelho = Object.values(votes["Cascais"]);

  var svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
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


  svg.append("path")
      .datum(votos_concelho)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", d3.line()
        .x((d, i) => x(parseInt(anos_eleicoes[i],10)))
        .y((d) => y((d.PS/d.votos)*100)));

}

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
}

function all() {
  list = regions;

  d3.select("#map")
  .transition()
  .selectAll("path")
  .attr("fill", "steelblue");
}

function clear() {
  d3.select("#map")
  .transition()
  .selectAll("path")
  .attr("fill", "black");

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
