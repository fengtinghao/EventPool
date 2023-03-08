/**
 * Created by Yueqi on 11/16/2016.
 */
var Overview = function(){
    // the overview snap, with mask on both directions
    var over_height = width*1.5;
    var overview_panel = d3.select('#overview').append('svg')
        .attr('viewBox','0 0 '+(width+40)+' '+over_height).attr('height', '100%')
        .on('click', function(){
            $('#pool').scrollTop((d3.mouse(this)[1] - time_mask.attr('height')/2) * $('#pool').find('svg').height()/ over_height);
        });

    var overview = overview_panel.append('g').selectAll('overview').data(value).enter().append('g');

    overview.append('circle')
        .attr('fill', '#ffcc66')
        .attr('visibility','hidden')
        .attr('r', 10)
        .attr('cx', width+10);

    overview.append('path')
        .attr('d', function(d){
            return poo.pool_line(d.line)
        })
        .attr('stroke', function(d){return "url(#style-"+d.id+")"})
        .attr('stroke-width', Math.max(2,over_height/value.length-3));

    overview.append('rect')
        .classed('group', true)
        .attr('fill', 'none')
        .attr('width', 20)
        .attr('x', width+20)
        .attr('height', Math.max(2,over_height/value.length-3));

    overview
        .on('mouseover', function(d){
            contro.hover(d);
        });

    $('.group').hide();

    var overview_pool_scale = d3.scale.linear().domain([0, value.length]).range([0, over_height]);

    // visible part of pool view mask
    var mask = overview_panel.append('g').attr('pointer-events','none').style('mix-blend-mode','darken');
    mask.append('rect').attr('fill','darkgray')
        .attr('opacity', .5)
        .attr('height',over_height).attr('width',width);

    var time_mask = mask.append('rect').attr('fill', 'white')
        .attr('height', over_height);

    var hover_mask = mask.append('g').attr('transform', 'translate(0,'+-overview_pool_scale(1.5)+')');
    hover_mask.append('rect')
        .attr('id','hovermask')
        .attr('fill', 'white')
        .attr('height', overview_pool_scale(3))
        .attr('width', width);

    // the label shadow
    overview_panel.append('g').attr('transform','translate('+[width/2, 0]+')')
        .attr('id','group_labels');


    this.highlight_list = function(){
        overview.select('circle').attr('visibility', function(d){
            return d.flag ? 'visible': 'hidden'
        });
    };

    this.unhighlight = function(){
        overview.select('circle').attr('visibility', function(d){
            d.flag = false;
            return 'hidden';
        });
    };

    this.highlight = function(d){
        overvie.highlight_list();
        overview.each(function(_d,i){
            if (d == _d){
                hover_mask.select('rect').attr('y', overview_pool_scale(i));
                return false
            }
        });
    };

    this.update_time_mask = function(){
        var begin = time_scale(0), end = time_scale(rank.length-1);

        hover_mask.select('rect').attr('width', width * width / (end-begin))
            .attr('x', (-begin) * width / (end-begin));

        time_mask
            .attr('width', width * width / (end-begin))
            .attr('x', (-begin) * width / (end-begin))
    };

    this.pool_view_changed = function(){
        var top = $('#pool').scrollTop();
        var body = $('#pool').height();
        var svg_height = $('#pool').find('svg').height();
        time_mask
            .attr('height', over_height * body / svg_height)
            .attr('y', over_height * top / svg_height)
    };

    this.sort = function(){
        if (contro){
            overview.sort(contro.comparefunc)
                .attr('transform', function(d, i){
                    return 'translate(0,'+ overview_pool_scale(i) +')'
                });

            //find the first and second in sort and find the middle
            var group_flag = contro.group_flag();
            if (group_flag != 'no'){
                var pos = {};
                for (var i = 0; i < groups[group_flag].labels.length; i++) {
                    pos[groups[group_flag].labels[i]] = {
                        max: -1,
                        min: 1000000
                    };
                }

                overview.each(function(d, i){
                    var g = d.group[group_flag];
                    if (g !== undefined){
                        if (i > pos[g].max){
                            pos[g].max = i
                        }
                        if (i < pos[g].min){
                            pos[g].min = i
                        }
                    }
                });

                d3.selectAll('#group_labels text')
                    .attr('y', function(d){
                        return overview_pool_scale((pos[d].max+pos[d].min)/2);
                    })
                    .style('font-size', function(d){
                        return Math.max(50, overview_pool_scale((pos[d].max - pos[d].min)/5))+'px';
                    })
            }
        }
    };

    $('#overview').onresize(function(){
        $('#toolbar')
            .css({
                height: $(this).offset().top,
                width: $(window).width() - $(this).offset().left,
                left: $(this).offset().left
            });

        $('.filter_tool').css({
            width: $('#overview svg').width() * width / (width+40)-100
        })
    });

    // the sorting area line
    overview_panel.selectAll('sorting_line').data([0,1]).enter()
        .append('line')
        //.classed('sort_line', true)
        .classed('sort_line_over', true)
        .attr('stroke','black')
        .attr('y1', 0)
        .attr('y2', over_height)
};