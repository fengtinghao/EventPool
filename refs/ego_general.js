/**
 * Created by Yueqi on 3/21/2017.
 */
/**
 * Created by Yueqi on 11/16/2016.
 */
var Ego_Reference = function(){
    if (threshold_mode != 'ego_general')
        return;

    var blnHide={'high':false,'mid':false,'low':false};
    var tmpHide={'high':'','mid':'','low':''};
    var cut = [-0.1, 0.1];
    var ego = value[value.length-1];

    this.get_ego_name = function(){
        return ego.name;
    }

    this.update_segment = function(){
        var sum = [$.map(rank, function(){return [0]}),$.map(rank, function(){return [0]}),
            $.map(rank, function(){return [0]}),$.map(rank, function(){return [0]})];

        $.each(value, function(i,d){
            var pre = d.target[0]-ego.target[0] > cut[1]? 1 : d.target[0]-ego.target[0] < cut[0] ? -1 : 0;
            if (target == 'rank'){
                pre = get_rank_relation_3(0, d.value[0], [Math.max(0,Math.min(value.length-1, cut[0]+ego_rank[0])), Math.max(0,Math.min(value.length-1,cut[1]+ego_rank[0]))]);
            }
            var seg = [[pre,[0,-1]]]; //the end is unknown
            for (i=0; i<=pre; i++){
                sum[i][0] += 1
            }
            for (var t=1; t< d.target.length; t++) {
                var relation = d.target[t]-ego.target[t] > cut[1]? 1 : d.target[t]-ego.target[t] > cut[0] ? 0: -1;
                if (target == 'rank'){
                    relation = get_rank_relation_3(t, d.value[t], [ Math.max(0,Math.min(value.length-1,cut[0]+ego_rank[t])),  Math.max(0,Math.min(value.length-1,cut[1]+ego_rank[t]))]);
                }
                if (relation != pre) {
                    var pos = t;
                    if (target == 'value' || target == 'rank') {
                        var up_line = target == 'value' ? [cut[1]+ego.value[t-1], cut[1]+ego.value[t]] :
                                [rank[t - 1][ Math.max(0,Math.min(value.length-1,cut[0]+ego_rank[t-1]))], rank[t][ Math.max(0,Math.min(value.length-1,cut[0]+ego_rank[t]))]],
                            low_line = target == 'value' ? [ego.value[t-1]+cut[0], ego.value[t] + cut[0]] :
                                [rank[t - 1][ Math.max(0,Math.min(value.length-1,cut[1]+ego_rank[t-1]))], rank[t][ Math.max(0,Math.min(value.length-1,cut[1]+ego_rank[t]))]];

                        var inter = [];
                        if (relation + pre >= 0) {
                            inter.push(pos - intersection(up_line[0], up_line[1], d.value[t - 1], d.value[t]));
                        }
                        if (relation + pre <= 0) {
                            inter.push(pos - intersection(low_line[0], low_line[1], d.value[t - 1], d.value[t]));
                        }
                        inter.sort();
                        if (inter.length == 2) {
                            seg[seg.length - 1][1][1] = inter[0];
                            seg.push([0, inter]); //must go through the mid state.
                            seg.push([relation, [inter[1], -1]]);
                        }
                        else {
                            seg[seg.length - 1][1][1] = inter[0];
                            seg.push([relation, [inter[0], -1]]);
                        }
                    }
                    else {
                        seg[seg.length - 1][1][1] = t;
                        seg.push([relation, [t, -1]]);
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

    $('#main-nav').append('<li> <span class="base_bg legend_bar"></span> Focal: <input id="search"> </li>');
    //a searching box to change ego
    $( "#search" ).autocomplete({
        select: function( event, ui ) {
            ref.change_ego(ui.item.value);
            $(this).val(ui.item.label);
            return false
        },
        focus: function( event, ui ) {
            $(this).val(ui.item.label);
        },
        source: $.map(value, function(d){
            return [{
                label: d.name,
                value: d
            }]
        })
    });
    $('#search').val(value[value.length-1].name);

    var legend = d3.select('#main-nav').selectAll('legend').data(['mid','high','low']).enter().append('li');
    //legend.append('span').attr('class', function(d){return d+'_bg'}).classed('legend_bar', true);
    legend
        //.append('span').html(function(d){
        //    return '<input type="radio" onclick="contro.change_sort_mode(\''+d+'\')" name="sort" '+(d=='high'?'checked':'')+'/>'
        //})
        .append('span').html(function(d){
            return '<input type="color" onchange="color_change(this)" name="'+d+'" class="selected_color"/>'
        })
        .append('span').html(function(d){
            switch (d){
                //case 'base': return '';break;
                case 'high': return '<input type="text" name="cut_high" class="text_field"> above the focal';break;
                case 'low': return '<input type="text" name="cut_low" class="text_field"> below the focal';break;
                case 'mid': return 'similar to the focal';break;
            }
        });
    
    var btnHide=legend.append('button')
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

    var ego_line = d3.select('#line svg').append('path')
        .attr('fill', 'none')
        .attr('pointer-events', 'none')
        .attr('stroke', 'yellow')
        .attr('stroke-width', 2);

    this.redraw = function(){
        ego_line.attr('d', lin.polyline(ego.value));
        if (target =='rank' || target=='value'){
            handl.redraw();
        }
    };

    var ego_rank = $.map(ego.value, function(d,i){
        return [rank[i].indexOf(d)];
    });

    function change_ego(d){
        ego = d;
        d3.selectAll('#down .base_bg').classed('base_bg', false);
        d3.selectAll('#down [stroke="url(#style-'+ ego.id+')"]').classed('base_bg', true);

        $('#search').val(ego.name);

        ego_rank = $.map(ego.value, function(d,i){
            return [rank[i].indexOf(d)];
        });

        update_slider_setting();
        contro.threshold_changed();

    };
    d3.selectAll('#down [stroke="url(#style-'+ ego.id+')"]').classed('base_bg', true);
    this.change_ego = change_ego;

    function to_label_value(d){
        return Math.round((d=='cut_low'?-cut[0]:cut[1])*100)/100
    }

    this.update_threshold = function(c, name){
        if (c === undefined){
            // set initial value
            switch (target){
                case 'value': var mid=rank[rank.length-1];
                    var range = mid[0]/2 - mid[value.length-2]/2;
                    c = [-range/2, range/2]; break;
                case 'rank': c = [-10, 10]; break;
                case 'speed': c = [-1, 1]; break;
                case 'ratio': c = [-0.1, 0.1]; break;
                case 'various': c = [-1, 1]; break;
            }
            cut = c;
        }
        else{
            if (name == 'cut_low'){
                cut[0] = -c
            }
            else{
                cut[1] = c
            }
        }
        $('.text_field').val(function() {
            return to_label_value($(this).attr('name'));
        });
    };

    $('.text_field').val(function() {
        return to_label_value($(this).attr('name'));
    });

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
                    var t = Math.max(0,Math.min(rank.length-1, Math.round(time_scale.invert(d3.event.x))));
                    if (target == 'rank'){
                        t_cut = closet(t_cut, rank[t])-ego_rank[t];
                    }
                    else{
                        t_cut -= ego.value[t];
                    }

                    if ((d == 0 && t_cut > 0) || (d==1 && t_cut < 0))
                        return;

                    ref.update_threshold(Math.abs(t_cut), d == 0? 'cut_low' : 'cut_high');
                    contro.threshold_changing();
                })
                .on('dragend', function(){
                    contro.threshold_changed();
                })
            );


        this.redraw = function(){
            if (target == 'rank'){
                d3.selectAll('.refline').attr('d', function(c){
                    if (target == 'rank'){
                        return lin.polyline($.map(rank, function(d, i){
                            return [d[Math.min(value.length-1, Math.max(0, cut[c] + ego_rank[i]))]]
                        }))
                    }
                })
            }
            else {
                d3.selectAll('.refline').attr('d', function (c) {
                    return lin.polyline($.map(ego.value, function (d) {
                        return [d + cut[c]]
                    }))
                })
            }
        }
    };
    var handl = new handle();
};