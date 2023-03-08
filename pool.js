/**
 * Created by Yueqi on 11/8/2016.
 */
var pool = function(){
    var pool_line = d3.svg.line()
        .defined(function(d){
            if (d.y < 0)
                return null;
            else
                return d
        })
        .x(function(d){
            return time_scale(d.x)
        })
        .y(function(d){
            return d.x*15/24/7/10
        });

    this.pool_line = pool_line;

    var svg = d3.select('#pool').append('svg')
        .attr('viewBox','0 0 '+(width+left)+' '+(value.length*20+20)).attr('width', '100%');

    var pool_scale = d3.scale.linear().domain([0, value.length]).range([0, value.length*20]);

    var pool_panel = svg.append('g').attr('transform','translate('+left+')');

    pool_panel.append('clipPath')
        .attr('id','pool_border')
        .append('rect')
        .attr('height', value.length*20)
        .attr('width',width);

    var pool = pool_panel.selectAll('pool')
        .data(value).enter().append('g');

    draw_pool(pool);
    pool.on('click', function(d, i){
            if (d.flag){
                if (threshold_mode.indexOf('ego') >= 0){
                    ref.change_ego(d);
                }
                d.flag = false;
            }
            else {
                d.flag = true;
                if (d3.event.shiftKey) {
                    var tmp = $(this);
                    while (tmp = tmp.prev()){
                        var d = d3.select(tmp[0]).datum();
                        if (d && 'flag' in d && d.flag == false){
                            d.flag = true;
                        }
                        else{
                            break
                        }
                    }
                }
            }
            contro.pool_selected()
        })
        .on('mouseover', function(d){
            contro.hover(d);
        });

    this.sort = function(){
        if (contro){
            pool.sort(contro.comparefunc)
                .transition()
                .duration(function(d){return d.flag?500:0})
                .attr('transform', function(d, i){
                    return 'translate(0,'+ pool_scale(i)+')'
                });
        }
    };

    this.redraw = function(){
        pool.select('path')
            .attr('d', function(d){
                return pool_line(d.line)
            });
    };

    this.goto = function(_in){
        pool.each(function(d,i){
            if (d == _in){
                $('#pool').scrollTop($('#pool svg').height() * i / value.length - $('#pool').height()/2);
            }
            return false
        })
    };

    this.updateVisibleLabel = function(){
        var top = $('#pool').scrollTop();
        var body = $('#pool').height();
        var height = $('#pool').find('svg').height();
        var visible = [value.length * top / height-1, value.length * (top+body) / height];
        pool.each(function(d, i){
            if (i< visible[1] && i>visible[0]){
                d.invisible = false
            }
            else{
                d.invisible = true
            }
        })
    };

    function draw_pool(base){
        base.append('path')
            //.attr('d', function(d){
            //    return pool_line(d.line)
            //})
            .attr('clip-path','url(#pool_border)')
            .attr('stroke', function(d){return "url(#style-"+d.id+")"})
            .attr('stroke-width', 30);

        //base.append('rect').attr('height',15)
        //    .attr('width', width)
        //    .attr('clip-path','url(#pool_border)')
        //    .attr('fill', function(d){return "url(#style-"+d.id+")"});
        //    //.attr('stroke-width', 30);

        base.append('line').attr("x1", 0).attr('x2', -left)
            .attr('transform','translate(0, 8)')
            .classed('bgcolor', true)
            .attr('stroke-width', 15);

        base.append('text')
            .text(function(d){return d.name})
            .attr('transform', 'translate('+[-10, 12]+')')
            .attr('text-anchor','end');

        base.append('rect')
            .classed('group', true)
            .attr('fill', 'none')
            .attr('x', -8)
            .attr('height',15)
            .attr('width', 3);

        //.attr('stroke-width', 30);
        $('.group').hide();
    }

    // the hover preview panel
    var hover_panel = d3.select('#hover').append('svg')
        .attr('viewBox','0 -30 '+(width+left)+' 65').attr('width', '100%')
        .append('g')
        .attr('transform','translate('+left+', -25)');

    this.highlight_list = function(){
        pool.select('path').attr('opacity', function(d){
            return d.flag ? 1: .7
        });
        pool.selectAll('.bgcolor').attr('stroke', function(d){
            return d.flag ? '#ffcc66': 'none'
        })
    };

    this.highlight=function(_in){
        pool.select('path').attr('opacity', function(d){
            return d.flag || (_in && d.id == _in.id) ? 1: .7
        });
        pool.selectAll('.bgcolor').attr('stroke', function(d){
            return _in && d.id == _in.id ? '#ff8066': d.flag?'#ffcc66':'none'
        });
    };

    this.unhighlight = function(){
        pool.select('path').attr('opacity', function(){
            //d.flag = false;
            return null
        });
        pool.selectAll('.bgcolor').attr('stroke', 'none')
    };

    //reset hover panel when the hovered obj is invisible
    $('#hover').hide();
    this.hover = function(obj){
        hover_panel.selectAll('*').remove();
        pool.each(function(d, i){
            if (i==0 || i==value.length-1)
                return true;
            if (obj.id == d.id){
                //update preview panel
                $(this.previousElementSibling).clone().appendTo($(hover_panel));
                $(this).clone().appendTo($(hover_panel));
                $(this.nextElementSibling).clone().appendTo($(hover_panel));
                hover_panel.selectAll('g')
                    .attr('transform', function(d,i){
                        return 'translate(0, '+20*i+')'
                    });

                var h = $('#hover svg').height();
                $('#hover').show();
                $('#hover').css({
                    top: 'calc('+(i -.5)*100.0 / value.length+'% - '+h/2+'px)'
                });
                return false
            }
        });
    };

    // the sorting area line
    pool_panel.selectAll('sorting_line').data([0,1]).enter()
        .append('line')
        .classed('sort_line', true)
        .attr('y1', 0)
        .attr('y2', value.length*20+20)
};