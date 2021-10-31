var map = "/data/ContinenteConcelhos.json"; //world view
var tvotes = "/data/resultados_eleicoes.json";

var map2;
var votes;

var width = 500;
var height = 600;

list = []
regions = []
margin = { top: 20, right: 20, bottom: 20, left:40 };

function init() {
  d3.select("#all").on("click", all);
  d3.select("#clear").on("click", clear);
}

Promise.all([d3.json(map)]).then(function (map) {
    map2 = map[0];
    generate_map();
    search_bar();
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
  votes = d3.json(tvotes);
  var svg = d3.select("#stacked")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
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
