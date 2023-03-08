/**
 * Created by Yueqi on 3/20/2017.
 */

Split(['#up', '#down'], {
    direction: 'vertical',
    sizes: [32, 68],
    gutterSize: 4
});

d3.selectAll('.gutter-vertical').remove();

//the space for labels and axis ticks
var left = 200, width = 1000;
var value, rank, style, tim, lin, poo, overvie, contro, ref, filte, time_scale;
/////////////////configures ////////////////////////////////
var color = {
    high:'#7ebe33',
    mid:'#9cc2e3',
    low:'#e94c09',
};

var color_selected = {
    high:'#7ebe33',
    mid:'#9cc2e3',
    low:'#e94c09',
};

function toggle_sort_window(){
    $('#sort_window_toggle').toggleClass('img_disable');
    $('#sort_window').toggle();
    $('.sort_line').toggle();
    $('.sort_line_over').toggle();
    contro.sort_window_changed();
}

function toggle_sort(){
    if($('#sort_toggle').is(':checked')){
        $('#sort_target button').prop('disabled', false);
        if (contro){
            contro.sort();
        };
    }
    else {
        $('#sort_target button').prop('disabled', true);
    }
}

function brush_toggle(){
    $('#brush_toggle').toggleClass('button_enable');
    $('.brush').toggle();

    if (!$('#brush_toggle').hasClass('button_enable')){
        lin.clean_brush();
        contro.clean_extent();
        $('.brush').hide();
    }
}

function color_change(d){
    var t = $(d).attr('name'), v = $(d).val();
    if (contro.get_sort_mode() == t){
        color_selected[t] = v;
        color[t] = d3.rgb(v).brighter(2).toString();
    }
    else{
        color[t] = v;
        color_selected[t] = d3.rgb(v).darker(2).toString();
    }
    contro.update_color();
}

function toggle_(){

    $('#vis_filter').toggle();
}

function update_target(){
    //smooth window margin
    target = $('select[name="threshold_mode"]').val();

    $('#step_wrap').hide();

    ref.update_threshold();

    if (target =='rank' || target=='value'){
        $('.refline').show();
        $('#sort_target_option').hide()
    }
    else{
        $('.refline').hide();
        $('#sort_target_option').show()
    }
    switch (target){
        case 'speed':
            $('#step_wrap').show();
            var margin = Math.floor(Number($('#speed_smooth_window').val())/2);
            $.each(value, function(i,d){
                var speed = $.map(d.value, function(t, i){
                    return i+1==d.value.length?null:[d.value[i+1]-t]
                });
                if (margin == 0){
                    d.target = speed;
                }
                else{
                    d.target = $.map(speed, function(t,i){
                        if (i<=margin || i> speed.length-margin-1)
                            return [t];
                        else{
                            var sum = 0;
                            for (var j=-margin; j<=margin; j++){
                                sum += speed[j+i] * (margin - Math.abs(j)+1)
                            }
                            return [sum / (margin+1)/(margin+1)];
                        }
                    });
                }
            });break;

        case 'ratio':
            $.each(value, function(i,d){
                d.target = $.map(d.value, function(t, i){
                    return i+1==d.value.length?null:[d.value[i+1]/t-1]*100
                })
            });break;

        case 'various':
            var margin = Math.ceil(Number($('#speed_smooth_window').val())/2);
            $('#step_wrap').show();
            $.each(value, function(i,d){
                var tmp = $.map(d.value, function(t, i){
                    return [math.var(d.value.slice(Math.max(0,i-margin), Math.min(d.value.length-1,i+margin)))];
                });
                tmp.shift();
                d.target = tmp
            });break;

        case 'value':
            $.each(value, function(i,d){
                var valid = $.map(d.value, function(t){
                    return d<-900? null: [t]
                });
                var aver = math.sum(valid) / valid.length;
                d.target = $.map(d.value, function(d){return d<-900? aver: [d]});
            });break;

        case 'rank':
            $.each(value, function(i,d){
                d.target = d.value;
            });break;
    }
    update_slider_setting();
    if (contro){
        contro.threshold_changed();
    }
}

function update_slider_setting(){
    //reset the value slider as the max and min value possible
    if (target == 'rank'){
        var min = 1;
        var max = value.length
    }
    else{
        var all = $.map(value, function(d){return d.target});
        var max = math.max(all);
        var min = math.min(all);
    }
    if (threshold_mode.indexOf('ego') >= 0){
        max = Math.max(max, Math.abs(min));
        min = 0
    };

    if (!(target == 'rank' || target == 'value')){
        max = Math.pow(max, 0.25);
        min = Math.pow(Math.abs(min), 0.25) * (min<0?-1:1);
    }

    $("#input_slider").attr('max', max);
    $("#input_slider").attr('min', min);

    $( "#input_slider").empty().hide();
    $( "#input_slider").append('<div></div>');
    $( "#input_slider div").slider({
        orientation: "vertical",
        range: "min",
        step:(max-min)/200,
        min: min,
        max: max,
        value: 0,
        slide: function( event, ui ) {
            var max = $(this).slider('option', 'max');
            var min = $(this).slider('option', 'min');

            if (target == 'value'){
                var y = ui.value;
            }
            else if (target == 'rank'){
                var y = Math.round(ui.value)-1;
            }
            else{
                var y = Math.pow(Math.abs(ui.value), 4) * (ui.value<0?-1:1);
            }

            ref.update_threshold(y, $( "#input_slider" ).attr( "name"));
            contro.threshold_changing();
        },
        stop: function( event, ui ) {
            $( "#input_slider").hide();
            contro.threshold_changed();
        }
    });
}

function after_data_load(bottom, top){
    if (threshold_mode == 'ego_general'){
        //add average line to dataset
        var data = $.map(d3.range(value[0].value.length), function(d){
            var sum= [];
            for (var i=0; i< value.length; i++){
                if (value[i].value[d] > -900)
                    sum.push(value[i].value[d])
            }
            return [math.sum(sum) /sum.length];
        });

        value.push({
            id: value.length+1,
            group: 0,
            sort: 0,
            sum: {},
            segments: [],
            style: null,
            name: ' Average',
            value: data
        });
    }

    $.each(value, function(i,d){
        if (d.value[d.value.length-1] < 0){
            d.value[d.value.length-1] = 0
        }
        if (d.value[0] < 0){
            d.value[0] = 0
        }

        d.flag = false;
        d.id = i,
            d.sort = 0,
            d.sum = {},
            d.segments =[],
            d.line = $.map(d.value, function(d, i){
                return [{x:i, y:d}]
            })
    });

    rank = $.map(d3.range(0, value[0].value.length), function(y){
        return [$.map(value, function(d){
            if (d < -900){
                return null
            }
            return [d.value[y]]
        }).sort(function(a,b){return b-a})]
    });

    time_scale = d3.scale.linear().domain([0, rank.length-1]).range([0, width]);

    //a searching box to change ego
    $( "#goto" ).autocomplete({
        position: {
            my: "left top",
            at: "left bottom"
        },
        select: function( event, ui ) {
            var d = ui.item.value;
            poo.goto(d);
            d.flag = true;
            contro.pool_selected();
            this.value = ui.item.label;
            return false
        },
        focus: function( event, ui ) {
            $(this).val(ui.item.label);
            return false
        },
        source: $.map(value, function(d){
            return [{
                label: d.name,
                value: d
            }]
        })
    });
    //
    //inital control handles
    //control it by change included file
    lin = new line(bottom, top);
    poo = new pool();
    overvie = new Overview();
    //if(data_source=='pm'){
    //    tim = new TimePanel(d3.svg.axis()
    //        .tickValues(Object.keys(tick_value))
    //        .tickFormat(function(d){return tick_value[d]})
    //        .scale(time_scale)
    //        .orient('down'));
    //}
    //else{
    //    tim = new TimePanel(d3.svg.axis()
    //        .tickFormat(tick_func)
    //        .scale(time_scale)
    //        .orient('down'));
    //}

    tim = new TimePanel(d3.svg.axis()
        .tickFormat(tick_func)
        .scale(time_scale)
        .orient('down'));

    switch (threshold_mode){
        case 'general':ref = new Reference();break;
        case 'general2':ref = new Reference2();break;
        case 'ego_general':ref = new Ego_Reference();break;
    }

    filte = new filter_tool();
    contro = new Control();
    contro.threshold_changed();
    contro.zoomed();

    after_initial();

    $('.text_field').on('click', function(){
        reset_input_slider(this);
        $('#input_slider').css({
            top: $(this)[0].getBoundingClientRect().bottom,
            left: $(this)[0].getBoundingClientRect().left
        }).show();
    })
    .on('keyup', function(e){
        if(e.keyCode == 13) {
            var v = Number($(this).val());
            if (isNaN(v))
                return;
            reset_input_slider(this);
            ref.update_threshold(v, $(this).attr('name'));
            contro.threshold_changed();
        }
    })
    $('#hover').show();
    $('#main-nav').show();
    $('#toolbar').show();
    toggle_sort_window();
}

function reset_input_slider(d){
    var v = Number($(d).val());
    if (isNaN(v))
        v = 0;

    var name = $(d).attr('name');
    $( "#input_slider" ).attr( "name", name);
    if (target == 'rank' || target == 'value'){
        $( "#input_slider .ui-slider" ).slider( "option", "value", v );
    }
    else{
        if (v > 0){
            $( "#input_slider .ui-slider" ).slider( "option", "value", Math.pow(v, 0.25) );
        }
        else{
            $( "#input_slider .ui-slider" ).slider( "option", "value", -Math.pow(-v, 0.25) );
        }
    }


    //if (threshold_mode == 'general2'){
    //    if (name == 'cut_low')
    //        $( "#input_slider .ui-slider" ).slider( "option", {
    //            max: Number($('.text_field[name="cut_high"]').val()),
    //            min: Number($('#input_slider').attr('min'))
    //        });
    //    else
    //        $( "#input_slider .ui-slider" ).slider( "option", {
    //            min: Number($('.text_field[name="cut_low"]').val()),
    //            max: Number($('#input_slider').attr('max'))
    //        });
    //}
}

// sharing function for ranking threshold
// find the index of the closet value to the input in an array
function closet(number, array){
    if (number >= array[0])
        return 0;
    if (number <= array[array.length-1])
        return array.length-1;
    for (var i=0; i<array.length-1; i++){
        if ((array[i] - number)*(array[i+1]-number)<=0){
            break
        }
    }
    return Math.abs(array[i] - number) > Math.abs(array[i+1] - number) ? i+1: i;
}
//relation mode: low: -1, mid: 0, up: 1
function get_rank_relation_2(t, v, cut){
    return rank[t][cut] > v? -1: 1
}

function get_rank_relation_3(t, v, cut){
    return rank[t][cut[1]] > v? -1: rank[t][cut[0]]<v ? 1 : 0
}

document.oncontextmenu = function(e){
    e.preventDefault();
    if (contro){
        // console.log(e);
        contro.menu();
    }
};

function intersection(a1,a2,b1,b2){
    if (a2 == b2){
        return 0;
    }
    if (a1 == b1){
        return 1;
    }
    var tmp = Math.abs((a1-b1)/(a2-b2));
    return 1 / (tmp+1)
}

var groups = null;
var tick_func = null;
if (data_source == 'le'){
    var l = [
        'South Asia',
        'Europe & Central Asia',
        'Middle East & North Africa',
        'Sub-Saharan Africa',
        'America',
        'East Asia & Pacific'
    ];

    groups ={
        continent:{
            labels: l,
            colors: d3.scale.category10().domain(l)
        }
    };

    $('.unit').text(' years');
    var unit = 'yr';
    title = 'Life Expectancy';
    d3.json('le.json', function(raw){
        value = $.map(raw, function(d, i){
            return {
                name: d.name,
                value: d.data,
                group: {continent:d.continent}
            }
        });
        tick_func = function(d){return d+1900};
        $('#group_select')
            .append('<option value="continent">Continent</option>');

        after_data_load(-2, 95);
    });
}
else if (data_source=='ppp'){
    var l = [
        'South Asia',
        'Europe & Central Asia',
        'Middle East & North Africa',
        'Sub-Saharan Africa',
        'America',
        'East Asia & Pacific'
    ];

    groups ={
        continent:{
            labels: l,
            colors: d3.scale.category10().domain(l)
        }
    };

    $('.unit').text(' years');
    var unit = 'yr';
    title = 'gdp per capita (thousand)';
    d3.json('ppp.json', function(raw){
        value = $.map(raw, function(d, i){
            return {
                name: d.name,
                value: d.data,
                group: {continent:d.continent}
            }
        });
        tick_func = function(d){return d+1900};
        $('#group_select')
            .append('<option value="continent">Continent</option>');

        after_data_load(0, 50000);
    });
}
else if (data_source == 'a2'){
    var l = [
        'Health Care',
        'Finance',
        'Energy',
        'Capital Goods',
        'Technology',
        'Transportation',
        'Public Utilities',
        'Consumer Services',
        'Consumer Non-Durables',
        'Basic Industries',
        'Miscellaneous',
        'Consumer Durables'
    ];

    groups ={
        sector: {
            labels: l,
            colors: d3.scale.category10().domain(l)
        }
    };
    $('.unit').text(' days');
    var unit = 'day';
    title = 'NASDAQ';
    d3.json('capital_filter.json', function(data){
        value = $.map(data, function (d, i) {
            var v = $.map(d.data, function(t){
                return [(Number(t)-Number(d.data[0]))/Number(d.data[0])+1]
            });
            return {
                name: d.name,
                value: v,
                group: {sector: d.sector}
            }
        });
        tick_func = function(d){
            return data[0].date[d]
        };
        $('#group_select')
            .append('<option value="sector">Sector</option>')

        after_data_load(0, 2);
    })
}
else if (data_source == 'pm'){
    var year = ['2008','2009','2010','2011','2012','2013','2014','2015','2016'],
        month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    var color = {
        high: '#f9e1de',
        mid: '#bab7e5',
        low: "#cce8cd"
    };

    var color_selected = {
        high: '#bf1a02',
        mid: '#615da3',
        low: "#94e298"
    };

    groups = {
        year:
        {
            labels: year,
            colors: d3.scale.category10().domain(year)
        },
        month:
        {
            labels: month,
            colors: d3.scale.category10().domain(month)
        }
    };

    $('.unit').text(' hours');
    var unit = 'hour';
    title = 'Beijing PM2.5';
    d3.json('beijing_air.json', function(data){
        value = $.map(data, function (d) {
            if (d.name.slice(d.name.length-2) == '17')
                return null;

            if (d.value.length < 24*7){
                return null
            }
            if (math.max(d.value)<0){
                return null
            }
            return {
                name: d.name,
                value: d.value,
                group: {
                    year:'20'+d.name.slice(d.name.length-2),
                    month: month[Number(d.name.slice(0,d.name.indexOf('/')))-1]
                },
            }
        });

        var week = ['Mon','Tue','Wed','Thus','Fri','Sat','Sun'];
        tick_func = function(d){
            return week[Math.floor(d / 24)] + ' ' + d%24+':00';
        };

        $('#group_select')
            .append('<option value="year">Year</option>')
            .append('<option value="month">Month</option>');

        after_data_load(0, 700);
    })
}
else if (data_source == 'ra'){
    title = 'Twitter with keyword "Rally"';

    after_initial = function(){
        $('#group_select option[value="group"]').prop('selected',true);
        contro.change_group_mode('group');
        $('#main-nav select option[value="value"]').prop('selected',true);
        update_target();
        ref.update_threshold(0.3);
        contro.threshold_changed();
    };

    d3.json('twitter_data.json', function(data){
        groups ={
            group: {
                labels: ['state','country'],
                colors: d3.scale.category10().domain(['state','country'])
            }
        };

        value = $.map(data, function (d) {
            if (d.name == '')
                return;

            var base = math.max(d.data);
            if (base < 6)
                return;

            var v = [];
            for ( var i=3; i< d.data.length; i+= 7){
                v.push(math.sum(d.data.slice(i,i+7)))
            }

            base = math.max(v);
            var v = $.map(v, function(t){
                return [t/base]
            });

            return {
                name: d.name +'-'+ base,
                value: v,
                group: {group: d.country}
            }
        });
        tick_func = function(d){
            var date = new Date(new Date(2016, 0).setDate(d*7+3));
            return (date.getMonth()+1)+'/'+date.getDate();
        };
        $('#group_select')
            .append('<option value="group">Level</option>')

        after_data_load(0, 1);
    })
}