/**
 * Created by Yueqi on 11/15/2016.
 */
// the time axis, sorting window and exclude windows
var TimePanel = function(time_axis){
    var height = 60;

    //the time axis
    var svg = d3.selectAll('#time').append('svg')
        .attr('viewBox','0 0 '+(width+left)*1.1+' '+height)
        .attr('width','110%');

    //on resize
    this.on_resize = function(){
        var t_w = width / $('#line').width();
        var h = 60 * t_w;
        histogram.attr('transform','scale(1,'+ t_w+')');
        zoom_panel.attr('transform','scale(1,'+ t_w+')');
        d3.select('#time svg').attr('viewBox','0 0 '+(width+left)*1.1+' '+ h);
        sort_window.resize(h*25/60);
        //time_axis_label.attr('y', h)
    };

    // svg = svg.append('g').attr('transform','translate('+left+',0)');
    var svgStack = svg.append('g').attr('transform','translate('+left+',25)');
    var svgLabel=svg.append('g').attr('transform',`translate(${left},0)`);
    var visible_window = [0, rank.length];
    var zoom = d3.behavior.zoom()
        .x(time_scale)
        .scaleExtent([1, 10])
        .on('zoomend', function(){
            visible_window = [time_scale.invert(0), time_scale.invert(width)];
            if($('#sort_toggle').is(':checked')){
                contro.zoom_end();
            }
        })
        .on('zoom', function(){
            //redraw the time panel
            zoom.translate(panLimit());

            time_axis_panel.call(time_axis);
            sort_window.align();
            d3.select('#time_sum_low').attr('x', time_scale(0))
                .attr('width', time_scale(rank.length)-time_scale(0));

            d3.selectAll('.time_sum').each(function(d){
                if (d.length > 10){
                    d3.select(this).attr('d', linefunc)
                }
            });

            contro.zoomed();
        });

    var panExtent = time_scale.domain();
    function panLimit() {
        var divisor = width / ((time_scale.domain()[1]-time_scale.domain()[0])*zoom.scale()),
            minX = -(((time_scale.domain()[0]-time_scale.domain()[1])*zoom.scale())+(panExtent[1]-(panExtent[1]-(width/divisor)))),
            maxX = -(((time_scale.domain()[0]-time_scale.domain()[1]))+(panExtent[1]-panExtent[0]))*divisor*zoom.scale(),

            tx = time_scale.domain()[0] < panExtent[0] ?
                minX :
                time_scale.domain()[1] > panExtent[1] ?
                    maxX :
                    zoom.translate()[0];

        return [tx, 0];
    }

    var zoom_panel = svgStack.append('rect')
        .attr('fill','white')
        .attr('width', width)
        .attr('height', height-30)
        .call(zoom);

    svgStack.append('text')
        .attr('transform','translate(-8,10)')
        .attr('text-anchor','end')
        .attr('alignment-baseline','hanging')
        .attr('fill','gray')
        .text('Hisgogram')

    var time_axis_panel = svgLabel.append('g').style('font-size','12px');

    var histogram = svgStack.append('g')
        .attr('pointer-events','none')
        .attr('clip-path','url(#time_border)');

    var clipPath = histogram.append('clipPath')
        .attr('id','time_border')
        .append('rect')
        .attr('height', 30)
        .attr('width',width);

    histogram.append('rect')
        .datum('low')
        .attr('class', function(d){
            return d+'_bg time_sum';
        })
        .attr('id','time_sum_low')
        .attr('fill', function(d){return color[d]})
        .attr('height', height)
        .attr('width',width);

    histogram.selectAll('path').data(['mid','high']).enter()
        .append('path')
        .attr('class', function(d){
            return d+'_bg time_sum';
        })
        .attr('id', function(d){return 'time_sum_'+d})
        .attr('fill', function(d){return color[d]});

    time_axis_panel.call(time_axis);

    var time_axis_panel_1=svgStack.append('g').attr('transform','translate(0,35)');
    time_axis_panel_1.call(time_axis);
    time_axis_panel_1.selectAll('text').remove();

    //var time_axis_label = svg.append('text').text('Year').attr('x', width/2)
    //    .attr('fill', 'gray');

    //the area vertical brush for exclude
    var AreaBrush = function(base ,type){
        var area = [0,0];
        this.area = function(){
            if (!$('#sort_window_toggle').hasClass('img_disable'))
                return area;
            else
                return [0,0]
        };
        var type = type; //sort, exclude

        var svg = base.append('g');
        var bar = svg.append('line')
            // .attr('y',0)
            .attr('stroke-width', 30)
            .classed('timeline_handles', true)
            .call(d3.behavior.drag()
                .on('dragend', function(){
                    contro.sort_window_changed();
                })
                .on('drag', function(){
                    // while not extend the visible area
                    var tmp = time_scale.invert(d3.event.dx)-time_scale.invert(0);
                    area = [Math.max(0, Math.max(visible_window[0], area[0] + tmp)),
                        Math.min(rank.length-1, Math.min(area[1] + tmp, visible_window[1]))];
                    redraw_reference_line();
                }));

        var handle = svg.selectAll('handle').data([0,1]).enter()
            .append('g')
            .classed('timeline_handles', true)
            .call(d3.behavior.drag()
                .on('dragend', function(){
                    contro.sort_window_changed();
                })
                .on('drag', function(i){
                    // while not extend the visible area
                    if (d3.event.x < 0 || d3.event.x > width)
                        return;
                    var tmp = Math.max(Math.min(rank.length-1, time_scale.invert(d3.event.x)), 0);
                    //keep left and right handles in order
                    if ((i==0 && tmp >area[1]) || (i==1 && tmp<area[0]))
                        return;
                    //change sorting window
                    area[i] = tmp;
                    d3.select(this).select('text').text(tick_func(Math.round(tmp)));

                    redraw_reference_line();
                }));

        handle.append('text')
        // .attr('y', 9)
            .attr('x',d=>3*(2*d-1))
            .attr('font-size', 10)
            .attr('text-anchor',d=>d==1?'start':'end')
            .attr('dominant-baseline','hanging');
        // handle.append('path')
        //     .attr('d', function(i) {
        //         var shape = [[0, 8], [0, 150], [40*(i==1?1:-1), 150]];
        //         return d3.svg.line()
        //             .x(function (d) {
        //                 return d[0]
        //             })
        //             .y(function (d) {
        //                 return d[1]
        //             })(shape)
        //     });
        const arc=d3.svg.arc()
            .startAngle(d=>d==1?0:Math.PI)
            .endAngle(d=>d==1?Math.PI:2*Math.PI)
            .innerRadius(0)
            .outerRadius(10);
        function pathHandle(e){
            var x=2*e-1;
            var y=15;
            return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) +
            "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) +
            "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
        }
        handle.append('path')
            .attr("stroke", "#000")
            // .attr("fill", 'white')
            // .attr('transform',d=>'translate(0,0)')
            // .attr('d',arc);
            .attr('d',pathHandle)

        handle.append('line')
            .attr('stroke','darkgray')
            .attr('stroke-width',2)
            .attr('y1',-2)
            .attr('y2',35)

        this.align = function(){
            handle.each(function(d){
                if (time_scale(area[d]) < 0){
                    area[d] = time_scale.invert(0)
                }
                else if(time_scale(area[d]) > width){
                    area[d] = time_scale.invert(width)
                }
            });
            //sorting view
            redraw_reference_line();
        };

        function redraw_reference_line(){
            handle.attr('transform', function(d){return'translate('+ time_scale(area[d]) +',0)'});
            handle.select('text').text(function(d){return tick_func(Math.round(area[d]))});
            bar.attr('x1', time_scale(area[0]))
                .attr('x2', time_scale(area[1]));

            d3.selectAll('.sort_line')
                .attr('x1', function(d){
                    return time_scale(area[d])
                })
                .attr('x2', function(d){
                    return time_scale(area[d])
                });

            var begin = time_scale(0), end = time_scale(rank.length-1);
            d3.selectAll('.sort_line_over')
                .attr('x1', function(d){
                    return (time_scale(area[d])-begin) * width / (end-begin)
                })
                .attr('x2', function(d){
                    return (time_scale(area[d])-begin) * width / (end-begin)
                })
        }

        this.resize = function(h){
            bar.attr('transform','translate(0,'+(h-11)+')');
        };

        this.destroy = function(){
            svg.remove();
        }
    };

    //the sort handle
    var sort_window = new AreaBrush(svgStack.append('g').attr('id', 'sort_window'), 'sort');
    this.sort_window = sort_window;

    //histogram background
    var linefunc = d3.svg.line()
        .interpolate('step-before')
        .x(function(d,i){
            if (i==0)
                return time_scale(0);
            if (i==rank.length)
                return time_scale(rank.length-1);
            return time_scale(i)
        })
        .y(function(d, i){
            if (i == 0)
                return 0;
            if (i == rank.length)
                return 0;
            return height * d / value.length
        });

    this.update_histogram = function(type, his){
        his.unshift(0);
        his.push(0);
        d3.selectAll('#time_sum_'+type).datum(his).attr('d', linefunc)
    }
};