;(function($, d3){
  var SvgCurve = function(options){
    var defaults = {
      width: 200,
      height: 220,
      points: null,
      className: [],
      values: null,
      selector: "body",
      offsetTop: 30,
      offsetBtm: 20,
      strokeColor: "#999",
      dotsColor: "#999",
      durationTime: 1000
    };
    options = $.extend(defaults, options);
    if (!isArrayFn(options.points) || !options.points.length ) {
        // throw new Error("传参数有误，points需要为数组形式，且不能为空！");
        console.log("曲线数据返回为空，请查看数据源。");
        return 
    }
    this.init(options);
    return this;
  };

  SvgCurve.prototype = { 
    init : function(option){
      var width = option.width;
      var height = option.height;
      var selector = option.selector;
      var offsetTop = option.offsetTop;
      var offsetBtm = option.offsetBtm;
      var strokeColor = option.strokeColor;
      var dotsColor = option.dotsColor;
      var points = option.points;
      var className = option.className;
      var values = option.values;
      var durationTime = option.durationTime;

      var svgWrap = d3.select(selector);
      var svg = d3.select(selector)
                  .append("svg")
                  .attr("width",width)
                  .attr("height", height);

      //画曲线
      var pointPos = this.getPointPos(option);
      var pathGroup = svg.append("g").attr("class", "g-path");
      var dotsGroup = svg.append("g").attr("class", "g-dots");
      var textGroup = svgWrap.append("div").attr("class", "g-text");
      
      var lineGenerator = d3.line().curve(d3.curveCardinal);

      var pathData = lineGenerator(pointPos);

      pathGroup.append("path")
          .attr("class", "path")
          .attr("d", pathData)
          .attr("fill", "transparent")
          .attr("stroke", strokeColor);

      dotsGroup.selectAll(".g-dots")
          .data(pointPos)
          .enter()
          .append("circle")
          .attr("class", "dots")
          .attr("cx", function(d) { return d[0] })
          .attr("cy", function(d) { return d[1] })
          .attr("r", 2)

      textGroup.selectAll(".g-text")
          .data(pointPos)
          .enter()
          .append("span")
          .data(values)
          .text(function(d) { return d })
          .data(className)
          .attr("class", function(d) { return d });

      //动画效果
      var path = pathGroup.selectAll("path");
      var dots = dotsGroup.selectAll("circle");
      var text = textGroup.selectAll("span");
      var totalLength = path.node().getTotalLength();

      path.attr("stroke-dasharray", totalLength + " " + totalLength)
          .attr("stroke-dashoffset", totalLength)
          .transition()
            .duration(durationTime)
            .ease(d3.easeLinear)
            .style("stroke-dashoffset", 0);

      text.data(pointPos)
          .attr("style", function(d){
            return  "left:" + d[0] + "px; top:" + d[1] + "px; opacity: 0;"
          })
          .transition()
            .duration(500)
            .delay(function(d,i){
              return i * durationTime/(points.length-1) - 100;
            })
            .attr("style", function(d){
              return  "left:" + d[0] + "px; top:" + (d[1]-5) + "px; opacity: 1"
            });

      dots.attr("fill", "transparent")
          .transition()
          .duration(0)
          .delay(function(d,i){
            return i * durationTime/(points.length-1);
          })
          .attr("fill", dotsColor);

    },
    getPointPos : function(option){
      var points = option.points,
          width = option.width,
          height = option.height,
          offsetTop = option.offsetTop,
          offsetBtm = option.offsetBtm;
      var postition = [];

      var ponitsSort = points.slice();
      ponitsSort.sort(function(a, b) {
        return a - b;
      });
      var max = ponitsSort[ponitsSort.length - 1];
      var min = ponitsSort[0];

      var offsetX = width / points.length / 2;
      var left = offsetX;

      for(var i = 0; i < points.length; i++){
        var posX, posY;
        postition[i] = [];
        posX = left;
        if(max === min){
          posY = (height - offsetTop - offsetBtm) / 2 + offsetTop ;
        }else{
          posY = (height - offsetTop - offsetBtm) / (max - min) * (max - points[i]) + offsetTop;
        }
        left += offsetX*2;
        postition[i].push(posX, posY);
      }
      return postition;
    },
    isSupportSvg: function(){
      // 检测是否支持svg
      var svgNS = "http://www.w3.org/2000/svg";
      var svg = (selector.namespaceURI === svgNS ? selector : null);
      try {
        if (!svg) {
          svg = document.createElementNS(svgNS, "svg");
          svg.setAttribute("version", "1.1");
          svg.setAttribute("width", width);
          svg.setAttribute("height", height);
          svg.setAttribute("id", "svg-curve");
        }
      } catch (e) {
        $(selector).html("<p>您当前浏览器不支持SVG，请下载<a href='http://se.360.cn/'>360浏览器</a>或<a href='http://zhushou.360.cn/detail/index/soft_id/21104'>Chrome</a>进行浏览。</p>");
        throw new Error("浏览器不支持SVG");
      }
    }
  }

  $.SvgCurve = function (options) {
      return new SvgCurve(options);
  }

  function isArrayFn(value){  
    if (typeof Array.isArray === "function") {  
        return Array.isArray(value);      
    }else{  
        return Object.prototype.toString.call(value) === "[object Array]";
    }  
  }

  if ("function" == typeof define && define.amd) {
      define(["jquery", "d3"], function(require, exports, module) {
          return SvgCurve;
      });
  }
  else {
      window.SvgCurve = SvgCurve;
  }
 
})(jQuery, d3);