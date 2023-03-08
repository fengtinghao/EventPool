/**
 * Created by Yueqi on 3/21/2017.
 */
/**
 * Created by Yueqi on 11/16/2016.
 */
var Reference2 = function(){
    if (threshold_mode != 'general2')
        return;

    var blnHide={'high':false,'mid':false,'low':false};
    var tmpHide={'high':'','mid':'','low':''};
    var cut = [-0.1, 0.1];
    this.redraw = function(){
        // do nothing
        if (target =='rank' || target=='value'){
            handl.redraw();
        }
    };

    this.update_segment = function(){
        var sum = [$.map(rank, function(){return [0]}),$.map(rank, function(){return [0]}),
            $.map(rank, function(){return [0]}),$.map(rank, function(){return [0]})];

        $.each(value, function(i,d){
            var pre = d.target[0] > cut[1]? 1 : d.target[0] < cut[0] ? -1 : 0;
            if (target == 'rank'){
                pre = get_rank_relation_3(0, d.value[0], cut);
            }
            var seg = [[pre,[0,-1]]]; //the end is unknown
            for (i=0; i<=pre; i++){
                sum[i][0] += 1
            }

            for (var t=1; t< d.target.length; t++) {
                var relation = d.target[t] > cut[1]? 1 : d.target[t] > cut[0] ? 0: -1;
                if (target == 'rank'){
                    relation = get_rank_relation_3(t, d.value[t], cut);
                }
                if (relation != pre){
                    var pos = t;
                    if (target == 'value' || target == 'rank'){
                        var up_line = target == 'value' ? [cut[1], cut[1]] : [rank[t - 1][cut[0]], rank[t][cut[0]]],
                            low_line = target == 'value' ? [cut[0], cut[0]] : [rank[t - 1][cut[1]], rank[t][cut[1]]];
                        var inter = [];
                        if (relation + pre >= 0){
                            inter.push(pos-intersection(up_line[0], up_line[1], d.value[t - 1], d.value[t]));
                        }
                        if (relation + pre <= 0){
                            inter.push(pos-intersection(low_line[0], low_line[1], d.value[t - 1], d.value[t]));
                        }
                        inter.sort();
                        if (inter.length == 2){
                            seg[seg.length-1][1][1] = inter[0];
                            seg.push([0,inter]); //must go through the mid state.
                            seg.push([relation, [inter[1], -1]]);
                        }
                        else{
                            seg[seg.length-1][1][1] = inter[0];
                            seg.push([relation, [inter[0], -1]]);
                        }
                    }
                    else{
                        seg[seg.length-1][1][1] = pos;
                        seg.push([relation,[pos,-1]]);
                    }
                    pre = relation
                }
                for (i=0; i<=relation; i++){
                    sum[i][t] += 1
                }
            }
            d.segments = seg;
        });

        tim.update_histogram('mid', sum[0]);
        tim.update_histogram('high',sum[1]);
    };

    ////////////////////////////////////////////utility functions///////////////////////////////////////////
    // var legend = d3.select('#main-nav').selectAll('legend').data(['low','mid','high']).enter().append('li');
    // //legend.append('span').attr('class', function(d){return d+'_bg'}).classed('legend_bar', true);
    //
    // //initial legend
    // legend
    //     .append('span').html(function(d){
    //     switch (d){
    //         case 'high':
    //             return '<input type="color" onchange="color_change(this)" name="'+d+'" class="selected_color"/>'
    //                 +'><input type="text" name="cut_high" class="text_field">';
    //         case 'low':
    //             return '<input type="color" onchange="color_change(this)" name="'+d+'" class="selected_color"/>'+
    //                 '<<input type="text" name="cut_low" class="text_field">';
    //         case 'mid':
    //             return '<input type="text" name="cut_low" class="text_field"> ' +
    //                 '<<input type="color" onchange="color_change(this)" name="'+d+'" class="selected_color"/>'
    //                 +'<<input type="text" name="cut_high" class="text_field">'
    //     }
    // });

    //create elements
    var parent = d3.select('#nav-parent');

    parent.selectAll('box').data(['cut_low','cut_low','cut_high','cut_high']).enter()
        .append('input').attr('type',"text")
        .attr('id', function(d,i){return 'threshold_box_'+d+'_'+(i%2+1)})
        .attr('name',function(d){return d})
        .classed("text_field", true);

    parent.selectAll('box').data(['high','mid','low']).enter()
        .append('input').attr('type','color')
        .attr('id', function(d){return d+'_box'})
        .attr('onchange',"color_change(this)")
        .attr('name',function(d){return d})
        .classed('selected_color',true);

    var btnHide=parent.selectAll('box').data(['high','mid','low']).enter()
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

    this.update_threshold = function(c, name){
        if (c === undefined){
            $('#nav-parent').append($('#main-nav').children());
            switch (target){
                case 'value':
                    var mid = rank[Math.round(rank.length/2)];
                    c = [mid[Math.round(value.length/1.5)], mid[Math.round(value.length/3)]];
                    var text = ['higher than ', 'between ', 'lower than '];
                    break;
                case 'rank':
                    c = [10, 20];
                    var text = ['ranked below ', 'ranked between ', 'ranked above '];
                    break;
                case 'speed':
                    c = [-1, 1];
                    var text = ['changes more than ', 'changes between ', 'changes less than '];
                    break;
                case 'ratio':
                    c = [-0.1, 0.1];
                    var text = ['changes more than ', 'changes between ', 'changes less than '];                    break;
                case 'various':
                    c = [1, 2];
                    var text = ['higher than ', 'between ', 'lower than '];
                    break;
            }
            $('#main-nav').append($('#nav-head'));

            if (target == 'rank'){
                $('<li>').append($('#low_box'))
                    .append(text[0])
                    .append($('#threshold_box_cut_high_1'))
                    .append($('#low_hide'))
                    .appendTo($('#main-nav'));
            }
            else{
                $('<li>').append($('#high_box'))
                    .append(text[0])
                    .append($('#threshold_box_cut_high_1'))
                    .append($('#high_hide'))
                    .appendTo($('#main-nav'));
            }

            $('<li>').append($('#mid_box'))
                .append(text[1])
                .append($('#threshold_box_cut_low_2'))
                .append(' and ')
                .append($('#threshold_box_cut_high_2'))
                .append($('#mid_hide'))
                .appendTo($('#main-nav'));

            if (target == 'rank'){
                $('<li>').append($('#high_box'))
                    .append(text[2])
                    .append($('#threshold_box_cut_low_1'))
                    .append($('#high_hide'))
                    .appendTo($('#main-nav'));
            }
            else{
                $('<li>').append($('#low_box'))
                    .append(text[2])
                    .append($('#threshold_box_cut_low_1'))
                    .append($('#low_hide'))
                    .appendTo($('#main-nav'));
            }

            $('#nav-parent').empty();

            cut = c;
        }
        else{
            if (name == 'cut_low'){
                if (c<cut[1]){
                    cut[0] = c
                }
                else{
                    cut[0] = cut[1]
                }
            }
            else if (name == 'cut_high'){
                if (c>cut[0]){
                    cut[1] = c
                }
                else{
                    cut[1] = cut[0]
                }
            }
        }
        $('[name="cut_low"]').val(cut[0]);
        $('[name="cut_high"]').val(cut[1]);
    };

    $('[name="cut_low"]').val(cut[0]);
    $('[name="cut_high"]').val(cut[1]);

    ////////////////////////////////////////////handles/////////////////////////////////////////////////////////
    // the handles for value and rank
    var handle = function(){
        d3.select('#line svg').selectAll('border').data([0,1]).enter()
            .append('path')
            .classed('refline',true)
            .classed('handle_line', true);

        d3.select('#line svg').selectAll('border').data([0,1]).enter()
            .append('path')
            .classed('refline',true)
            .classed('handle_line_shadow', true)
            .classed('handle_line', true)
            .call(d3.behavior.drag()
                .on('drag', function(d){

                    var t_cut = lin.y_scale.invert(d3.event.y);
                    if (target == 'rank'){
                        var t = Math.max(0,Math.min(rank.length-1, Math.round(time_scale.invert(d3.event.x))));
                        t_cut = closet(t_cut, rank[t]);
                    }

                    if ((d == 0 && t_cut > cut[1]) || (d==1 && t_cut < cut[0]))
                        return;

                    ref.update_threshold(t_cut, d == 0? 'cut_low' : 'cut_high');
                    contro.threshold_changing();
                })
                .on('dragend', function(){
                    contro.threshold_changed();
                })
            );


        this.redraw = function(){
            d3.selectAll('.refline').attr('d', function(c){
                if (target == 'rank'){
                    return lin.polyline($.map(rank, function(d){
                        return [d[cut[c]]]
                    }))
                }
                else{
                    return d3.svg.line()
                        .x(function(d){
                            return d[0]
                        })
                        .y(function(d){
                            return d[1]
                        })([[0, lin.get_height(cut[c])],[width, lin.get_height(cut[c])]])
                }
            });
        }
    };
    var handl = new handle()
};