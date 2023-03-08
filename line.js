/**
 * Created by Yueqi on 11/8/2016.
 */
var line = function(bottom, top){
    //axis
    var height = width/3;
    var y_scale = d3.scale.linear().range([height, 0]).domain([bottom, top]);
    this.y_scale = y_scale;
    var left_panel = d3.select('#line_axis').append('svg')
        .attr('viewBox','0 0 '+left+' '+height).attr('width', '100%')
        .append('g')
        .attr('transform','translate('+left+',0)');

    function zoom(){
        axis_panel.call(y_axis);
        lin.redraw();
        ref.redraw();
    }

    var zoom_panel = left_panel.append('rect').attr('height', height).attr('width', left).attr('x', -left)
        .attr('opacity',0)
        .call(d3.behavior.zoom().y(y_scale).on('zoom', zoom));

    var axis_label = left_panel.append('g')
        .attr('transform','translate('+[-50, height/2]+')');

    axis_label.append('g')
        .attr('transform','rotate(-90)')
        .append('text').text(title)
        .attr('text-anchor','middle')
        .attr('fill', 'gray');

    var y_axis = d3.svg.axis().scale(y_scale).orient('left').tickFormat(d=>title=='gdp per capita (thousand)'?d/1000:d);
    var axis_panel = left_panel.append('g').attr('pointer-events','none');
    axis_panel.call(y_axis);

    // the polylines function
    var polyline = d3.svg.line()
        .defined(function(d){
            if (typeof(d) == "number"){
                return d
            }
            if (d.y < 0)
                return null;
            else
                return d
        })
        .x(function(d,i){
            if (typeof(d) == "number")
                return time_scale(i);
            else
                return time_scale(d.x);
        })
        .y(function(d){
            if (typeof(d) == "number")
                return y_scale(d)
            else
                return y_scale(d.y);
        });

    this.polyline = polyline;
    this.get_height = function(d){
        return y_scale(d);
    };

    this.get_value = function(dy){
        return y_scale.invert(dy) - y_scale.invert(0);
    }

    var svg = d3.select('#line').append('svg')
        .attr('viewBox','0 0 '+width+' '+height)
        .attr('width', '100%')
        .append('g')
        .attr('id','linechart_wrap');

    var obj = svg.append('g')
        .attr('id','base')
        .style('isolation','isolate')
        .selectAll('lines')
        .data(value).enter()
        .append('path')
        .classed('obj',true)
        //.style('mix-blend-mode','darken')
        .attr('stroke-width', 3)
        .attr('d', function(d){
            return polyline(d.line)
        })
        .on('mouseover', function(d){
            contro.hover(d)
        })
        .attr('stroke', function(d){return "url(#style-"+d.id+")"});

    var brush = d3.svg.brush()
        .x(time_scale)
        .y(y_scale)
        .on('brushend', function(){
            if (contro){
                contro.brush_end(brush.extent());
            }
        });

    var shadow = svg.append('g').attr('id','shadow').attr('pointer-events','none');
    //var shadow2 = svg.append('g').attr('id','shadow2').attr('pointer-events','none');

    var light = svg.append('g').attr('id','light').style('isolation','isolate');

    var brush_panel = svg.append("g")
        .attr("class", "brush").call(brush);

    var special_light = svg.append('g').attr('id','special_light');

    // brush_panel.selectAll('.extent').on('contextmenu', function(){
    //     d3.event.preventDefault();
    //     if (contro){
    //         contro.menu(d3.mouse(this)[0], d3.mouse(this)[1]);
    //     }
    // });

    brush_panel.selectAll('.background')
        .attr('height', height*1000);

    brush_panel.selectAll('.extent')
        .attr('stroke', 'black');

    //brush_toggle();

    this.redraw = function(){
        d3.selectAll('#line .obj').attr('d', function(d){return polyline(d.line)});

        //the brush
        brush.extent(brush.extent());
        brush_panel.call(brush);
    };
//aa
    this.updateInvisibleLines = function(){
        //obj.style('stroke-width', function(d){return d.invisible?.3:3})
        obj.style('stroke-width', 1)
    };

    //add to the highlight layer
    this.highlight_list = function(list){
        this.unhighlight();
        d3.select('#base').attr('opacity', .7);

        shadow.selectAll('npath').data(list).enter().append('path')
            .classed('obj',true)
            .attr('d', function(d){return polyline(d.line)});

        //shadow2.selectAll('npath').data(list).enter().append('path')
        //    .classed('obj',true)
        //    .attr('d', function(d){return polyline(d.value)});

        light.selectAll('npath').data(list).enter().append('path')
            .classed('obj',true)
            .on('mouseover', function(d){
                contro.hover(d)
            })
            .attr('d', function(d){return polyline(d.line)})
            .attr('stroke', function(d){return "url(#style-"+d.id+")"});
    };

    this.highlight = function(_in){
        d3.select('#base').attr('opacity', .7);
        special_light.html('');
        special_light.append('path').datum(_in).classed('obj',true)
            .attr('d', function(d){return polyline(d.line)});
        special_light.append('path').datum(_in).classed('obj',true)
            .attr('stroke', function(d){return "url(#style-"+d.id+")"})
            .attr('d', function(d){return polyline(d.line)})
            .on('click', function(d){
                if (d.flag){
                    if (threshold_mode.indexOf('ego') >= 0){
                        ref.change_ego(d);
                    }
                    d.flag = false;
                }
                else d.flag = true;
                contro.pool_selected()
            })
            .on('mouseout', function(){
                special_light.html('');
            });
    };

    this.clean_brush = function(){
        d3.select(".brush").call(brush.clear());
    };

    this.unhighlight = function(){
        d3.select('#base').attr('opacity', null);
        shadow.html('');
        light.html('');
        special_light.html('');
    };

    $('#up').onresize(function(){
        height = $('#line').height() / $('#line').width() * width;
        y_scale.range([height, 0]);
        zoom();
        zoom_panel.attr('height', height);
        axis_label.attr('transform','translate('+[-50, height/2]+')');

        d3.select('#line_axis svg')
            .attr('viewBox','0 0 '+left+' '+height);
        d3.select('#line svg')
            .attr('viewBox','0 0 '+width+' '+height)
    });

    // the sorting area line
    svg.selectAll('sorting_line').data([0,1]).enter()
        .append('line')
        .classed('sort_line', true)
        .attr('y1', 0)
        .attr('y2', width)
};