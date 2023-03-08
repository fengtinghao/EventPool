/**
 * Created by Yueqi on 11/16/2016.
 */
//  the speed handles
var Reference = function(){
    //just two states: -1(low) and 1 (high)
    if (threshold_mode != 'general')
        return;

    var blnHide={'high':false,'low':false};
    var tmpHide={'high':'','low':''};
    var cut = 0;

    this.redraw = function(){
        // do nothing
        if (target =='rank' || target=='value'){
            handl.redraw();
        }
    };

    this.update_segment = function(){
        var high = $.map(rank, function(){return [0]});
        $.each(value, function(i,d){
            var pre = d.target[0] > cut? 1 : -1;
            if (target == 'rank'){
                pre = get_rank_relation_2(0, d.value[0], cut);
            }
            var seg = [[pre,[0,-1]]]; //the end is unknown
            if (pre == 1){
                high[0] += 1
            }
            for (var t=1; t< d.target.length; t++) {
                var relation = d.target[t] > cut? 1 : -1;
                if (target == 'rank'){
                    relation = get_rank_relation_2(t, d.value[t], cut);
                }
                if (relation != pre){
                    var pos = t;
                    if (target == 'value'){
                        pos = pos - intersection(cut, cut, d.value[t - 1], d.value[t]);
                    }
                    else if (target == 'rank'){
                        pos = pos - intersection(rank[t - 1][cut], rank[t][cut], d.value[t - 1], d.value[t]);
                    }
                    seg[seg.length-1][1][1] = pos;
                    seg.push([relation,[pos,-1]]);
                    pre = relation
                }
                if (relation == 1){
                    high[t] += 1
                }
            }
            d.segments = seg;
        });
        high[high.length-1] = high[high.length-2];
        //tim.update_histogram('high', $.map(rank, function(){return [value.length-cut]}));
        tim.update_histogram('high', high);
    };

    //create elements
    var parent = d3.select('#nav-parent');

    parent.selectAll('box').data([1,2]).enter()
        .append('input').attr('type',"text")
        .attr('id', function(d){return 'threshold_box'+d})
        .attr('name',"cut")
        .classed("text_field", true);

    parent.selectAll('box').data(['high','low']).enter()
        .append('input').attr('type','color')
        .attr('id', function(d){return d+'_box'})
        .attr('onchange',"color_change(this)")
        .attr('name',function(d){return d})
        .classed('selected_color',true);

    var btnHide=parent.selectAll('box').data(['high','low']).enter()
        .append('button')
        .attr('id',d=>d+'_hide')
        .style('margin-left','5px')

    
    btnHide.append('img')
        .attr('src','icon/openeye.png')
        .attr('width',15)
        .attr('height',15)
        .style('border-with','0px')

    btnHide.on('click',function(d){
        blnHide[d]=!blnHide[d];

        d3.select(this).select('img').attr('src',()=>blnHide[d]?'icon/closeeye.png':'icon/openeye.png')
        if(blnHide[d]){
            tmpHide[d]=contro.get_sort_mode();
            contro.filter_target_changed(d);
            contro.change_segment_filter(1,0);
        }else{
            contro.change_segment_filter(1,rank.length-1);
            contro.filter_target_changed(tmpHide[d]);
        }
    })

    this.update_threshold = function(c){
        if (c === undefined){
            //save current element to parent
            $('#nav-parent').append($('#main-nav').children());
            switch (target){
                case 'value':
                    c = rank[rank.length-1][Math.round(value.length/2)];
                    var text = ['higher than ', 'lower than '];
                    break;

                case 'rank':
                    c = 10;
                    var text = ['ranked above ', 'ranked below '];
                    break;

                case 'speed':
                case 'ratio':
                    c = 0;
                    var text = ['changed more than ', 'changed less than '];
                    break;

                case 'various':
                    c = 1;
                    var text = ['higher than ', 'lower than '];
                    break;
            }
            $('#main-nav').append($('#nav-head'));

            $('<li>')
            .append($('#high_box'))
                .append(text[0])
                .append($('#threshold_box1'))
                .append($('#high_hide'))
                .appendTo($('#main-nav'));

            $('<li>')
            .append($('#low_box'))
                .append(text[1])
                .append($('#threshold_box2'))
                .append($('#low_hide'))
                .appendTo($('#main-nav'));

            $('#nav-parent').empty();
        }
        cut = c;
        $('[name="cut"]').val(cut);
    };

    //////////////////////////////////////////////handle/////////////////////////////////////////////////////////
    var handle = function(){
        d3.select('#line svg')
            .append('path')
            .classed('refline',true)
            .classed('handle_line', true);

        d3.select('#line svg')
            .append('path')
            .classed('refline',true)
            .classed('handle_line_shadow', true)
            .call(d3.behavior.drag()
                .on('drag', function(){
                    var t_cut = lin.y_scale.invert(d3.event.y);
                    if (target == 'rank'){
                        var t = Math.max(0,Math.min(rank.length-1, Math.round(time_scale.invert(d3.event.x))));
                        t_cut = closet(t_cut, rank[t]);
                    }

                    ref.update_threshold(t_cut);
                    contro.threshold_changing();
                })
                .on('dragend', function(){
                    contro.threshold_changed();
                })
            );
        this.redraw = function(){
            d3.selectAll('.refline').attr('d', function(){
                if (target == 'rank'){
                    return lin.polyline($.map(rank, function(d){
                        return [d[cut]]
                    }))
                }
                else{
                    return d3.svg.line()
                        .x(function(d){
                            return d[0]
                        })
                        .y(function(d){
                            return d[1]
                        })([[0, lin.get_height(cut)],[width, lin.get_height(cut)]])
                }
            });
        }
    };
    var handl = new handle();
};