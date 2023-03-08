/**
 * Created by Yueqi on 1/17/2017.
 */

var filter_tool = function (){

    var base = d3.select('#vis_filter').append('svg')
        .attr('viewBox','0 0 300 180')
        .attr('width', '100%');

    var width = 300, height = 180;
    var pow = 4;
    var domain = rank.length-1;
    var x = d3.scale.linear().domain([0, domain]).range([0,width]);
    var y = d3.scale.linear().domain([0, Math.pow(domain ,pow)]).range([height, 0]);

    var dat = d3.range(10).map(function(i){
        var step = domain*i/9;
        return [x(step), y(Math.pow(domain - step,pow))]
    });
    dat.push([0, height]);
    base.append('defs').append('clipPath').attr('id','segment_mask')
        .append('path')
        .datum(dat)
        .attr('d', d3.svg.line()
            .x(function(d) { return d[0]; })
            .y(function(d) { return d[1]; }));

    var mask = base.selectAll('range').data([2, 1, 0]).enter().append('rect')
        .attr('clip-path','url(#segment_mask)')
        .attr('fill', function(d){return d==1? 'lightgrey':'white'})
        .attr('width', width);

    dat.push([0,0]);
    base.append('path').datum(dat)
        .attr('fill','none')
        .attr('stroke','black')
        .attr('stroke-width', 2)
        .attr('d', d3.svg.line()
            .x(function(d) { return d[0]; })
            .y(function(d) { return d[1]; }));

    function drag(d, n){
        if (contro)
            contro.change_segment_filter(d, n);
        redraw();
    };

    function dragend(){
        if (contro)
            contro.sort();
    }

    var handle_layer = base.selectAll('handles').data(['high','mid','low','all']).enter().append('g')
        .attr('class', function(d){return 'filter_handle_'+(d=='all'?'active':'inactive')});

    handle_layer.selectAll('handle').data([0,1]).enter().append('line')
        .attr('x1',0).attr('x2', width)
        .attr('class', function(){
            var t = d3.select(this.parentNode).datum();
            return (t==''?'all':t) +'_bg';
        })
        .call(d3.behavior.drag()
            .on('drag', function(d){
                var pos = d3.event.y;
                if (pos < 0 || pos > height)
                    return;
                var n = domain - Math.pow(y.invert(pos), 1.0/pow);
                drag(d, n);
            })
            .on('dragend', dragend)
        );

    function redraw(){
        var range = [0, domain];

        if (contro){
            var t = contro.get_filter_mode();
            range = contro.segment_filter()[t==''?'low':t];
            handle_layer.attr('class', function(d){return 'filter_handle_'+(d==t?'active':'inactive')});
        }

        handle_layer.each(function(m){
            var r = contro?contro.segment_filter()[m]:range;
            d3.select(this).selectAll('line').attr('transform', function(d){
                return 'translate('+[0, y(Math.pow(domain - r[d], pow))]+')'
            });
        });

        mask.attr('height', function(d){
            if (d == 2) return height;
            return y(Math.pow(domain - range[d], pow));
        });

        $('.slider[name=min]').slider( "value", range[0]);
        $('.slider[name=max]').slider( "value", range[1]);

        // $('.slider_label[name=min]').text(range[0]);
        // $('.slider_label[name=max]').text(range[1]);
        $('.slider_label[name=min]').val(range[0])
            .on('keyup', function(e){
                if(e.keyCode == 13) {
                    var v = Number($(this).val());
                    if (isNaN(v))
                        return;
                    drag(0, v);
                }
            });
        $('.slider_label[name=max]').val(range[1])
            .on('keyup', function(e){
                if(e.keyCode == 13) {
                    var v = Number($(this).val());
                    if (isNaN(v))
                        return;
                    drag(1, v);
                }
            });

        range[0]== 0 ? $('.slider_label[name=min]').find('span').hide() : $('.slider_label[name=min]').find('span').show();
        range[1]== domain ? $('.slider_label[name=max]').find('span').hide() : $('.slider_label[name=max]').find('span').show()
    }
    this.redraw = redraw;

    this.toggle_filter_end = function(d){
        drag(d, d==0?0:domain);
        dragend();
    };

    $('.slider').slider({
        min:0,
        step:0.1,
        max: domain,
        slide: function(){
            var v = $(this).slider( "value" );
            if ($(this).attr('name') == 'min'){
                drag(0, v);
            }
            else{
                drag(1, v);
            }
        },
        stop: function(){
            dragend();
        }
    });
    $('.slider[name=min]').slider( "value", 0);
    $('.slider[name=max]').slider( "value",domain);

    redraw();
}