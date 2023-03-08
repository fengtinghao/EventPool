/**
 * Created by Yueqi on 11/16/2016.
 */
//    all control functions other than the reference segments calculation
var Control = function(){
    var styles = d3.select('#style').append('defs').selectAll('style').data(value).enter()
        .append('linearGradient')
        .attr('id', function(d){return 'style-'+ d.id})
        .classed('style',true)
        .each(function(d){
            d.style = this;
        });

    //////////////// zooming functions////////////////////////
    this.zoomed = function(){
        ref.redraw();
        poo.redraw();
        lin.redraw();
        overvie.update_time_mask();
    };

    //always sorting as the exclude area is changed
    this.zoom_end = function(){
        sort();
    };

    ///////////////// scroll /////////////////////////////////
    $('#pool').scroll(function(){
        $('#hover').hide();
        scroll_end();
    });

    function scroll_end(){
        overvie.pool_view_changed();
        poo.updateVisibleLabel();
        lin.updateInvisibleLines();
    }

    ///////////////////// sorting window ////////////////////
    this.sort_window_changed = function(){
        sort();
    };

    this.sort = sort;

    ///////////////////// threshold /////////////////////////
    this.threshold_changing = function(){
        //d3.select('#linechart_wrap')
        //    .attr('cursor', 'normal')
        //    .attr('pointer-events','none');
        ref.redraw();
        ref.update_segment();

        //finish touch
        //close the last segment
        for (var j= 0,l=value.length; j<l;j++){
            var seg = value[j].segments;
            seg[seg.length-1][1][1] = rank.length - 1;

            //remove very very short segments for ego and rank
            if (target == 'value' || target == 'rank'){
                var i=0;
                while (i<seg.length-2){
                    if (seg[i+1][1][1]-seg[i+1][1][0] < 0.0001 && seg[i][0] == seg[i+2][0]){
                        seg[i][1][1] = seg[i+2][1][1];
                        seg.splice(i+1,2);
                    }
                    else{
                        i++
                    }
                }
            }
        }
        //update the style and sort score
        var tmp = 100/(rank.length - 1);
        //
        //if (!!window.chrome && !!window.chrome.webstore){
        //    //use concat
        //    var n = '';
        //    for (var j = 0, len2 = value.length; j < len2; j++) {
        //        var d = value[j];
        //        n +='<linearGradient id="style-'+ d.id +'" class="style">';
        //        for (var i = 0, len = d.segments.length; i < len; i++) {
        //            var s = d.segments[i];
        //            n += '<stop offset="';
        //            n += s[1][0]*tmp;
        //            n += '%" class="';
        //            n += i2text(s[0]);
        //            n += '"></stop><stop offset="';
        //            n += s[1][1]*tmp;
        //            n += '%" class="';
        //            n += i2text(s[0]);
        //            n += '"></stop>'
        //        };
        //        n += '</linearGradient>';
        //    }
        //    $('#style defs').html(n);
        //}
        ////else if (/constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification)){
        ////styles.each(function(t){
        ////    s = d3.select(this);
        ////    s.selectAll('*').remove();
        ////    var stops = s.selectAll('stop').data(t.segments).enter();
        ////
        ////    stops.append('stop')
        ////        .attr('offset', function(d){
        ////            return d[1][0]*tmp+'%'
        ////        })
        ////        .attr('class', function(d){
        ////            return i2text(d[0])
        ////        });
        ////
        ////    stops.insert('stop')
        ////        .attr('offset', function(d){
        ////            return d[1][1]*tmp+'%'
        ////        })
        ////        .attr('class', function(d){
        ////            return i2text(d[0])
        ////        });
        ////});
        //// }
        //else{
        //    ////user join
        //    //var n = [];
        //    //for (var j = 0, len2 = value.length; j < len2; j++) {
        //    //    var d = value[j];
        //    //    n.push('<linearGradient id="style-'+ d.id +'" class="style">');
        //    //    for (var i = 0, len = d.segments.length; i < len; i++) {
        //    //        var s = d.segments[i];
        //    //        n.push('<stop offset="');
        //    //        n.push(s[1][0]*tmp);
        //    //        n.push('%" class="');
        //    //        n.push(i2text(s[0]));
        //    //        n.push('"></stop><stop offset="');
        //    //        n.push(s[1][1]*tmp);
        //    //        n.push('%" class="');
        //    //        n.push(i2text(s[0]));
        //    //        n.push('"></stop>')
        //    //    };
        //    //    n.push('</linearGradient>');
        //    //}
        //    //$('#style defs').html(n.join(''));

        styles.each(function(t){
            var s = d3.select(this);
            s.selectAll('*').remove();
            var stops = s.selectAll('stop').data(t.segments).enter();

            stops.append('stop')
                .attr('offset', function(d){
                    return d[1][0]*tmp+'%'
                })
                .attr('class', function(d){
                    return i2text(d[0])
                });

            stops.insert('stop')
                .attr('offset', function(d){
                    return d[1][1]*tmp+'%'
                })
                .attr('class', function(d){
                    return i2text(d[0])
                });
        });

        update_exclude_style();
    };

    this.threshold_changed = function(){
		$( "#input_slider").hide();
        if (!('target' in value[0]) && threshold_mode.indexOf('general')>=0){
            update_target();
        }
        this.threshold_changing();
        sort();
        if (contro)
            contro.brush_end();
    };

    ////////////////////// hover ////////////////////////////
    this.hover_flag = true;
    this.hover = function(d){
        if (!this.hover_flag)
            return;

        //highlight the hover obj
        lin.highlight(d);
        poo.highlight(d);
        overvie.highlight(d);
        if (d.invisible){
            //change the position of hover panel
            $('#hovermask').show();
            poo.hover(d);
        }
        else{
            $('#hover').hide();
            $('#hovermask').hide();
        }
        d3.selectAll('.group_label').style('background-color', function(g){
            return d.group[group_flag] == g ? 'yellow': null
        })

    };

    //called when user turn off highlight
    function unhighlight(){
        //$.each(value, function(i,d){
        //    d.flag = false;
        //})
        lin.unhighlight();
        poo.unhighlight();
        overvie.unhighlight();

        d3.selectAll('.group_label').style('background-color', null);
        $('#hover').hide();
        if (contro)
            contro.hover_flag = true
    }
    $('#lightup').click(function(){
        lin.clean_brush();
        unhighlight()
    });

    ////////////////////// hightlight ////////////////////////
    // batch selection and highlight, only works on the visible objs
    this.highlight = function(list){
        lin.highlight(list);
        poo.highlight(list);
    };


    //////////////////sorting ///////////////////////////////
    // sort threshold hosted in each reference class/////////
    this.change_segment_filter = function(source, d){
        var v = Math.round(d*100)/100;
        segment_filter[filter_mode][source] = v;
        if (filter_mode == 'all'){
            //change all
            segment_filter.low[source] = v;
            segment_filter.mid[source] = v;
            segment_filter.high[source] = v;
        }
        update_exclude_style();
        contro.brush_end();
    };

    this.get_sort_mode = function(){
        return sort_mode
    };

    this.change_sort_mode = function(m){
        if (!m) m = 'high';
        $('#sort_target button').removeClass('mid_bg high_bg low_bg').addClass(m+'_bg');
        sort_mode = m;

        $('input[type="color"]').val(function(){
            var m = $(this).attr('name');
            return m == sort_mode ? color_selected[m]:color[m]
        });

        update_color();
        sort();
    };

    function update_color(){
        //change colors in menu
        var t = JSON.parse(JSON.stringify(color));
        t[sort_mode] = color_selected[sort_mode];

        $.each(t, function(k,c){
            $('#'+k+'_bg').text('.'+k+'_bg{' +
                'background-color:'+c+';' +
                'fill:'+c+';' +
                'stroke:'+c+';' +
                '}');

            $('#'+k+'_style').text('.'+k+'{stop-color:'+c+'}');
        });
    }
    this.update_color = update_color;

    var sort_mode = 'mid';
    var segment_filter = {all:[0, rank.length], low:[0, rank.length],mid:[0, rank.length],high:[0, rank.length]};
    this.segment_filter = function(){
        return segment_filter
    };

    function sort(){
        var mode = $('#speed_sort_mode').val();
        if (mode == 'total'){
            $('#sort_mode_option').hide()
        }
        else{
            $('#sort_mode_option').show()
        }

        switch (mode){
            case 'length': update_sorting_score(); break;
            case 'seg': updata_sorting_score_seg(); break;
            case 'total': updata_sorting_score_all(); break;
        }

        if (group_flag != 'no'){
            update_group_score();
        }

        poo.sort();
        overvie.sort();
        $('#pool').scrollTop(0);
        $('#hover').hide();
        scroll_end();
    }

    var group_score;
    this.comparefunc = function(b, a){
        if (threshold_mode == 'ego_general'){
            if (ref.get_ego_name() == a.name)
                return 1;
            if (ref.get_ego_name() == b.name)
                return -1;
        }
        if (group_flag != 'no'){
            return group_score[a.group[group_flag]] > group_score[b.group[group_flag]] ? 1:
                group_score[a.group[group_flag]] < group_score[b.group[group_flag]]? -1:
                a.sort.win > b.sort.win ? 1: a.sort.win < b.sort.win ? -1 :
                    a.sort.vis > b.sort.vis ? 1: a.sort.vis < b.sort.vis ? -1 :
                        a.sort.all > b.sort.all ? 1: a.sort.all < b.sort.all ? -1 :
                            -(a.group[group_flag]+'-'+a.name).localeCompare((b.group[group_flag]+'-'+b.name));
        }
        else
            return  a.sort.win > b.sort.win ? 1: a.sort.win < b.sort.win ? -1 :
                a.sort.vis > b.sort.vis ? 1: a.sort.vis < b.sort.vis ? -1 :
                    a.sort.all > b.sort.all ? 1: a.sort.all < b.sort.all ? -1 : a.name.localeCompare(b.name);
    };

    function get_interplate_value(list, pos){
        var f = Math.floor(pos);
        return list[f] + (list[Math.ceil(pos)] - list[f]) * (pos-f);
    }

    function updata_sorting_score_all(){
        // var sort_window = tim.sort_window.area();
        if ($('#sort_window').is(':visible')){
            var sort_window = tim.sort_window.area();
        }
        else{
            var sort_window = [0,0];
        }
        var visible_window = [time_scale.invert(0), time_scale.invert(width)];
        $.each(value, function(i,d){
            //stable ranking
            var score = {
                win: get_interplate_value(d.value, sort_window[1]) - get_interplate_value(d.value, sort_window[0]),
                vis: get_interplate_value(d.value, visible_window[1]) - get_interplate_value(d.value, visible_window[0]),
                all: d.value[rank.length-1] - d.value[0]
            };
            var flag = sort_mode == 'low'? -1:1;
            d.sort = {
                win:score.win*flag,
                vis:score.vis*flag,
                all:score.all*flag
            }
        });
    }

    var group_flag = 'no';
    this.group_flag = function(){
        return group_flag;
    };

    this.change_group_mode = function(_in){
        group_flag = _in?_in:$('#group_select').val();
        $('#group_labels').empty();

        if (group_flag == 'no'){
            $('.group').hide();
        }
        else{
            var group = groups[group_flag];
            d3.selectAll('#overview .group, #pool .group').attr('fill', function(d){
                return group.colors(d.group[group_flag]);
            });

            d3.select('#group_labels')
            .selectAll('labels')
            .data(group.labels)
            .enter()
            .append('text')
            .text(function(d){return d});

            update_group_score();
            $('.group').show();
        }
        sort();
    };

    function update_group_score(){
        //group_average
        var group = groups[group_flag].labels;
        var score = {};
        var count = {};
        $.each(group, function(i,d){
            score[d] = 0;
            count[d] = 0
        });

        $.each(value, function(i,d){
            score[d.group[group_flag]] += d.sort.win*1000000 + d.sort.vis+ d.sort.all/1000000;
            count[d.group[group_flag]] += 1;
        });

        $.each(group, function(i,d){
            score[d] /= count[d]
        });
        group_score = score;
    }

    function updata_sorting_score_seg(){
        // var sort_window = tim.sort_window.area();
        if ($('#sort_window').is(':visible')){
            var sort_window = tim.sort_window.area();
        }
        else{
            var sort_window = [0,0];
        }

        var visible_window = [time_scale.invert(0), time_scale.invert(width)];
        $.each(value, function(i,d){
            //stable ranking
            var score = {
                win:0,vis:0,all:0
            };
            $.each(d.segments, function(i,s) {
                if (i2text(s[0]) != sort_mode)
                    return;
                var seg_length = s[1][1] - s[1][0];
                //check if filtered
                if (seg_length < segment_filter[sort_mode][0] || seg_length > segment_filter[sort_mode][1])
                    return;

                // basing on target, check the near timestep to speed up
                var begin = Math.floor(s[1][0]),end = Math.ceil(s[1][1]);
                for (var j=begin; j<end; j++){
                    score.all += d.target[j]
                }

                //socre in the visible window
                var t1 = Math.round(Math.max(begin, visible_window[0]));
                var t2 = Math.round(Math.min(end, visible_window[1]));
                if (t1 < t2){
                    for (var j=t1; j<t2; j++){
                        score.vis += d.target[j]
                    }
                }
                //add the part within the sorting window
                var t1 = Math.round(Math.max(begin, sort_window[0]));
                var t2 = Math.round(Math.min(end, sort_window[1]));
                if (t1 < t2){
                    for (var j=t1; j<t2; j++){
                        score.win += d.target[j]
                    }
                }
            });
            var flag = sort_mode == 'low'? -1:1;
            d.sort = {
                win:score.win * flag,
                vis:score.vis * flag,
                all:score.all * flag
            }
        });
    }

    function update_sorting_score(){
        // update sorting score
        // sorting rule:
        // 1, exclude the filtered segments
        // 2, sort within the sorting window
        // 3, sorting overview
        // 4. consider only area in the visible (zoomed)
        // 5. if all equal, add id

        if ($('#sort_window').is(':visible')){
            var sort_window = tim.sort_window.area();
        }
        else{
            var sort_window = [0,0];
        }

        var visible_window = [time_scale.invert(0), time_scale.invert(width)];
        $.each(value, function(i,d){
            //stable ranking
            var score = {
                win:0,vis:0,all:0
            };
            $.each(d.segments, function(i,s) {
                //if (s[1][1] < visible_window[0] || s[1][0] > visible_window[1])
                //    return;
                if (i2text(s[0]) != sort_mode)
                    return;
                var seg_length = s[1][1] - s[1][0];
                //check if filtered
                if (seg_length < segment_filter[sort_mode][0] || seg_length > segment_filter[sort_mode][1])
                    return;

                //var begin = Math.max(s[1][0], visible_window[0])*1.0,
                //    end = Math.min(s[1][1], visible_window[1])*1.0;

                var begin = s[1][0],end = s[1][1];

                //score for whole length
                score.all += end-begin;

                //socre in the visible window
                var t1 = Math.max(begin, visible_window[0]);
                var t2 = Math.min(end, visible_window[1]);
                if (t1 < t2){
                    score.vis += t2-t1
                }

                //add the part within the sorting window
                var t1 = Math.max(begin, sort_window[0]);
                var t2 = Math.min(end, sort_window[1]);
                if (t1 < t2){
                    score.win += t2-t1;
                }
            });
            d.sort = score
        });
    }

    var filter_mode = 'all';
    this.get_filter_mode = function(){
        return filter_mode;
    }
    this.filter_target_changed = function(m){
        if (m)
            filter_mode = m;
        //restore the filter on the new mode.
        $('#filter_target button').removeClass('mid_bg high_bg low_bg')
        if (filter_mode == 'all'){
            $('#filter_target button :nth-child(1)').text('All')
        }
        else{
            $('#filter_target button :nth-child(1)').text('');
            $('#filter_target button').addClass(filter_mode+'_bg');
        }
        filte.redraw();
        update_exclude_style();
        sort();
    };

    function update_exclude_style(){

        styles.selectAll('stop'+(filter_mode =='all'? '':'.'+filter_mode)).classed('exclude', function(d){
            var l = d[1][1] - d[1][0];
            return l <  segment_filter[filter_mode][0] || l > segment_filter[filter_mode][1]
        })
    }

    var i2text = function(d){
        return d>0?'high':d<0?'low':'mid';
    };

    ///////////////// brush  ////////////////////////////////
    var brush_mode = 'all';
    this.menu = contextMenu().items('all', 'high', 'mid', 'low');

    function contextMenu() {
        var height,
            width,
            margin = 0.1, // fraction of width
            items = [],
            rescale = false,
            style = {
                'rect': {
                    'mouseout': {
                        'fill': 'rgb(244,244,244)',
                        'stroke': 'white',
                        'stroke-width': '1px'
                    },
                    'mouseover': {
                        'fill': 'rgb(200,200,200)'
                    }
                },
                'text': {
                    'fill': 'steelblue',
                    'font-size': '13'
                }
            };

        function menu() {
            if (extent[0][0] == extent[1][0])
                return;

            var y = lin.y_scale(extent[1][1]), x = time_scale(extent[0][0]);

            scaleItems();

            // Draw the menu
            d3.select('#line svg')
                .append('g').attr('class', 'context-menu')
                .selectAll('tmp')
                .data(items).enter()
                .append('g').attr('class', 'menu-entry')
                .style({'cursor': 'pointer'})
                .on('mouseover', function(){
                    d3.select(this).select('rect').style(style.rect.mouseover) })
                .on('mouseout', function(){
                    d3.select(this).select('rect').style(style.rect.mouseout) });

            d3.selectAll('.menu-entry')
                .append('rect')
                .attr('x', x)
                .attr('y', function(d, i){ return y + (i * height); })
                .attr('width', width)
                .attr('height', height)
                .style(style.rect.mouseout);

            d3.selectAll('.menu-entry')
                .append('rect')
                .attr('fill', function(d){
                    if (d== 'all'){
                        return 'black'
                    }
                    else return color[d]
                })
                .attr('x', x)
                .on('click', function(d){
                    brush_mode = d;
                    d3.selectAll('.extent')
                        .attr('stroke', brush_mode == 'all'? 'black': color[brush_mode]);
                    contro.brush_end();
                })
                .attr('y', function(d, i){ return y + (i * height); })
                .attr('height', height)
                .attr('width', width);

            // Other interactions
            d3.select('body')
                .on('click', function() {
                    d3.select('.context-menu').remove();
                });

        }

        menu.items = function(e) {
            if (!arguments.length) return items;
            for (i in arguments) items.push(arguments[i]);
            rescale = true;
            return menu;
        };

        // Automatically set width, height, and margin;
        function scaleItems() {
            if (rescale) {
                d3.select('svg').selectAll('tmp')
                    .data(items).enter()
                    .append('text')
                    .text(function(d){ return d; })
                    .style(style.text)
                    .attr('x', -1000)
                    .attr('y', -1000)
                    .attr('class', 'tmp');
                var z = d3.selectAll('.tmp')[0]
                    .map(function(x){ return x.getBBox(); });
                width = d3.max(z.map(function(x){ return x.width; }));
                margin = margin * width;
                width =  width + 2 * margin;
                height = d3.max(z.map(function(x){ return x.height + margin / 2; }));

                // cleanup
                d3.selectAll('.tmp').remove();
                rescale = false;
            }
        }
        return menu;
    }

    var extent = null;

    this.clean_extent = function(){
        extent = null;
    };

    this.brush_end = function (ext){
        if (ext != null)
            extent = ext;
        if (extent == null)
            return;

        unhighlight();
        var l = [];
        $.each(value, function(i,c){
            $.each(c.segments, function(j,s){
                var t = i2text(s[0]);
                if (brush_mode == 'all' || t == brush_mode){
                    if (s[1][1] - s[1][0] <= segment_filter[t][1] && s[1][1] - s[1][0] >= segment_filter[t][0]){
                        if (s[1][1] >= extent[0][0] && s[1][0] <= extent[1][0]){
                            for (var i=Math.ceil(Math.max(s[1][0], extent[0][0])); i<Math.floor(Math.min(s[1][1], extent[1][0])); i++){
                                if (c.value[i] <= extent[1][1] && c.value[i] >= extent[0][1]){
                                    c.flag = true;
                                    l.push(c);
                                    return false
                                }
                            }
                        }
                    }
                }
            })
        });
        if (l.length > 0){
            lin.highlight_list(l);
            poo.highlight_list();
            overvie.highlight()
        }
    };

    this.pool_selected = function(){
        var l = [];
        $.each(value, function(i,c){
            if (c.flag){
                l.push(c);
            }
        });
        if (l.length > 0){
            lin.highlight_list(l);
            poo.highlight_list();
        }
        else{
            lin.unhighlight();
            poo.unhighlight();
        }
        overvie.highlight()
    };

    ///////////////// initial ///////////////////////////////
    $('#down').onresize(function(){
        var pos = $('#overview').find('svg').position();
        var size = $('#overview').find('svg').width();
        tim.on_resize();

        $('#seg_filter').css({
            top: pos.top - size+'px',
            left: pos.left,
            width:size+'px',
            height:size+'px'
        })
    });

    //initial segment style
    this.change_sort_mode();


    //var filter = d3.select('#style').append('defs').append('filter')
    //        .attr('id','shadow_style')
    //        .attr('x', 0)
    //        .attr('y', 0)
    //        .attr('width', '200%')
    //        .attr('height', '200%');
    //filter.append('feOffset').attr('result','offOut').attr('in','SourceAlpha').attr('dx',0).attr('dy',0);
    //filter.append('feGaussianBlur').attr('result','blurOut').attr('in','offOut').attr('stdDeviation',4);
    //filter.append('feBlend').attr('in','SourceGraphic').attr('in2','blurOut').attr('mode','normal')
    //
    // save a style pointer to object to save search time
};