;(function($, d3) {
  var D3Map = function(options) {
    var defaults = {
      mapWidth: 706,
      mapHeight: 566,
      showProvience: false,
      showCity: false,
      provinceColor: "#fff",
      borderColor: "#dce4e7",
      mouseOverColor: "#CAD2D3",
      selector: "body",
      geoJSON: null,
      change: $.noop,
      mapHover: function(obj) {
        return obj.name
      }
    };
    options = $.extend(defaults, options);
    if (!options.geoJSON) {
      throw new Error("miss param geoJSON");
    }
    this._init(options);
    return this;
  }
  
  //弹窗随鼠标移动
  D3Map.prototype._getTipPos = function(e) {
    var mouseX;
    var mouseY;
    var tipWidth = $('.map-tip').outerWidth();
    var tipHeight = $('.map-tip').outerHeight();
    if (e && e.pageX) {
      mouseX = e.pageX;
      mouseY = e.pageY;
    } else {
      mouseX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      mouseY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    var tipX = mouseX - tipWidth/2 < 0 ? 0 : mouseX - tipWidth/2;
    var tipY = mouseY - tipHeight - 10 < 0 ? mouseY + 10 : mouseY - tipHeight - 10;
    return [tipX, tipY];
  }
  
  D3Map.prototype._init = function(options) {
    var self = this;
    var mapWidth = options.mapWidth;
    var mapHeight = options.mapHeight;
    var showProvience = options.showProvience;
    var showCity = options.showCity;
    var provinceColor = options.provinceColor;
    var mouseOverColor = options.mouseOverColor;
    var selectedColor = options.selectedColor;
    var borderColor = options.borderColor;
    var fillColor = d3.scaleOrdinal(d3.schemeCategory20);
    var mapHover = options.mapHover;
    var selector = options.selector;
    var selectorEle = $(selector);
    var projection = d3.geoAlbers()
    .scale(mapWidth*1.1)
    .translate([mapWidth / 2, mapHeight / 2])
    .rotate([-105, 0])
    .center([0, 36])
    .parallels([27, 45]);
    var path = d3.geoPath(projection);
    var svg = d3.select(selector)
    .append("svg")
    .attr('width',mapWidth)
    .attr('height', mapHeight);

    /* 移动到svg外面 */
    $(document).bind("mouseover", function(e){
      if(selectorEle.has(e.target).length === 0){
        resetColor(options.prePath);
        tipHide();
      }
    });

    svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", borderColor)
    .on('mouseover', function(){
      resetColor(options.prePath);
      tipHide();
    });

    var gProvPath = svg.append("g")
    .attr("class", "g-path");

    var gNameText = svg.append("g")
    .attr("class", "g-text");

    var southsea = svg.append("g")
    .attr("class", "southsea")
    .attr("transform", "translate(" + (mapWidth - 64) + ", " + (mapHeight - 87) + "), scale(0.165)")
    .style("display", "block");
    
    var tipTimer = null;

    $(selector).on("GEOJSON_DONE", function(event, json) {
      gProvPath.selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("stroke", borderColor)
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .attr("data-type", function(data) {
        return data.properties.type;
      })
      .attr("data-id", function(data) {
        return data.id;
      })
      .attr("data-name", function(data) {
        return data.properties.name;
      })
      .attr("fill", function(data) {
        return provinceColor;
      })
      .on("mouseover", function(data) {
        var path = d3.select(this);
        var tagName = d3.event.fromElement ? d3.event.fromElement.tagName : '';
        if(options.cityId != data.id || tagName == 'rect'){
          options.prePath && resetColor(options.prePath);

          tipHover(data, path);

          options.prePath = path;
          options.cityId = data.id;
        }
      })
      .on("mouseout", function(data) {
        var path = d3.select(this);
        var className = d3.event.toElement ? d3.event.toElement.className:'';
        var tagName = d3.event.toElement ? d3.event.toElement.tagName:'';
        var toPro = d3.event.toElement ? d3.event.toElement.innerHTML:'';

        var curPro = data.properties.province;
        if(toPro != curPro && !(className != 'map-tip' || className != 'city-name' || tagName == 'rect') ){
          resetColor(options.prePath);
          tipHide();
        }
      });

      southsea.selectAll(".southsea")
      .data(json.southsea.geometry)
      .enter()
      .append("path")
      .attr("class", function(d){
        return d.type
      })
      .attr("d", function(d){
        return d.path;
      });

      var labelData;
      if(showCity){
        labelData = json.points;
      }else{
        labelData = json.features;
      }

      gNameText.selectAll(".place-label")
      .data(labelData)
      .enter().append("text")
      .attr("class", "place-label")
      .attr("transform", function(d) { 
        return "translate(" + projection(d.properties.cp) + ")"; 
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("cursor", "pointer")
      .text(function(d) {
        return d.properties.name;
      })
      .on("mouseover", function(data) {
        var path = d3.selectAll('path[data-id="' + data.id + '"]');
        var tagName = d3.event.toElement ? d3.event.toElement.tagName:'';
        if(options.cityId != data.id || tagName == 'rect'){
          options.prePath && resetColor(options.prePath);
          tipHover(data, path);
          options.prePath = path;
          options.cityId = data.id;
        }
      })
      .on("mouseout", function(data){
        var tagName = d3.event.toElement ? d3.event.toElement.tagName:'';
        if(tagName == 'rect'){
          options.prePath && resetColor(options.prePath);
          tipHide();
        }
      })

      if(showCity){
        svg.selectAll(".api-tip")
        .data(labelData)
        .enter()
        .append("path")
        .attr("class", function(d){
          var _provience = d.properties.province;
          var _level_number = window.nation_aqi_map[_provience]['quality_level']['level_number'];
          return "api-tip-"+ _level_number
        })
        .attr("data-mdtxt", "air-map-item")
        .attr("transform", function(d) { 
          var _x = projection(d.properties.cp)[0]-16;
          var _y = projection(d.properties.cp)[1]-50;
          return "translate(" + [_x, _y] + ") scale(0.8)"; 
        })
        .attr("text-anchor", "middle")
        .attr("cursor", "pointer")
        .attr("d", function(d){
          return "M 8,38 A 20,20 0 1 1 32,38 L 20 48 Z";
        })
        .on("click", function(d){
          var _provience = d.properties.province;
          if(_provience && window.nation_aqi_map){
          var _city_code = window.nation_aqi_map[_provience]['city_code'];
          window.open('/air/'+_city_code);
          }
        });

        svg.selectAll(".api-val")
        .data(labelData)
        .enter()
        .append("text")
        .attr("class", "api-val")
        .attr("transform", function(d) {
          var _x = projection(d.properties.cp)[0];
          var _y = projection(d.properties.cp)[1]-28;
          return "translate(" + [_x, _y] + ")"; 
        })
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none")
        .attr("fill", "#fff")
        .text(function(d){
          var _provience = d.properties.province;
          var _aqi = window.nation_aqi_map[_provience]['aqi'];
          return _aqi;
        })
      }
    });
    
    function tipHover(data, path){
      if(tipTimer){
      clearTimeout(tipTimer);
      }
      tipTimer = setTimeout(function(){
      showTips(data, path);
      }, 100);
    }

    function showTips(data, path){
      if(!showProvience) return
      var tipsEle = $(".map-tip", selectorEle);
      if (tipsEle.length == 0) {
        selectorEle.append('<div class="map-tip"></div');
      }
      tipsEle = $(".map-tip", selectorEle);
      var tipStr = mapHover(data.properties.province);
      tipsEle.html(tipStr);
      path.transition().attr("fill", mouseOverColor);
      var xy = projection(data.properties.cp);
      var top = xy[1];
      var left = xy[0];
      if( top < 185){
        tipsEle.css({
          left: left,
          top: top + 10,
          transform: "translate(-50%, 0)"
        }).show();
      }else{
        top = top - 20;
        tipsEle.css({
          left: left,
          top: top,
          transform: "translate(-50%, -100%)"
        }).show()
      }
    }

    function resetColor(path){
      path && path.transition().attr("fill", provinceColor);
    }
    function tipHide(){
      $(".map-tip", selectorEle).hide();
    }

    if ($.isPlainObject(options.geoJSON)) {
      $(selector).trigger("GEOJSON_DONE", options.geoJSON);
    } else {
      d3.json(options.geoJSON, function(json) {
        $(selector).trigger("GEOJSON_DONE", json);
      })
    }
  }
  
  $.D3Map = function (options) {
    return new D3Map(options);
  }
  
  if ("function" == typeof define && define.amd) {
    define(["jquery", "d3"], function(require, exports, module) {
      return D3Map;
    });
  } else {
    window.D3Map = D3Map;
  }
})(jQuery, d3);