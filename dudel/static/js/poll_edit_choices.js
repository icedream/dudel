var times = [];
var dates = [];
var calendar;

$(document).ready(function() {
    calendar = $("#calendar");

    // Checkbox stuff
    $(".checkbox-cell :checkbox").on("click", updateCheckbox).on("click", function(e) {
        e.stopPropagation();
    });

    $(".checkbox-cell").on("click", function(e){
        var checkbox = $(this).find(":checkbox");
        checkbox.prop("checked", !checkbox.prop("checked"));
        updateCheckbox.call(checkbox);
    });

    $(".checkbox-cell :checkbox").each(updateCheckbox);

    // Checkbox all/none toggles
    $(".toggle").click(function() {
        // deselect or select
        var selected = $(this).hasClass("toggle-select");
        var cells;
        if($(this).hasClass("toggle-column")) {
            var index = $(this).closest("td").index() + 1;
            cells = $(this).closest("table").find("tr td:nth-child(" + index + ")");
        } else if($(this).hasClass("toggle-row")) {
            cells = $(this).closest("tr").find("td");
        } else {
            cells = $(this).closest("table").find("td");
        }
        updateCheckbox.call(cells.find(":checkbox").prop("checked", selected));
    });

    // Calendar stuff
    $(".calendar").each(function() {
        initCalendar($(this));
    });

    // Time slider
    initTimeSlider();

    // Time remove buttons
    $(".time-slots").on("click", ".time-remove-button", function() {
        removeTime($(this).val());
    });

    $(".calendar-list").on("click", ".date-remove-button", function() {
        removeDate($(this).attr("data-date"));
    });

    $("#date-time-form-content").hide();

    // Load data
    if($("#times").val()) times = $("#times").val().split(",");
    if($("#dates").val()) dates = $("#dates").val().split(",");
    updateDateTimeList();

});

/* ========================================================================== */
/* Checkbox stuff */

function updateCheckbox(e) {
    $(this).closest(".checkbox-cell").removeClass("no yes maybe").addClass($(this).prop("checked") ? "yes" : "no");
}

/* ========================================================================== */
/* Time and date stuff */

function updateDateTimeList() {
    $("#times").val(times.join());
    $("#dates").val(dates.join());

    $(".time-slots").html("");
    times.forEach(function(time) {
        $(".time-slots").append('<li><input type="button" class="btn btn-default time-remove-button" value="' + time + '" /></li> ');
    });

    $(".calendar-list").html("");
    dates.forEach(function(date) {
        var formatDate = moment(date).format("ddd D MMM");
        $(".calendar-list").append('<li><input type="button" class="btn btn-default date-remove-button" value="' + formatDate + '" data-date="' + date +'"/></li> ');
    });

    calendarSetDate(calendar.data("date"));
}

function addTime(time) {
    times.push(time);
    times = times.uniquify();
    updateDateTimeList();
}

function addDate(date) {
    dates.push(date);
    dates = dates.uniquify();
    updateDateTimeList();
}

function removeTime(time) {
    times.removeValue(time);
    updateDateTimeList();
}

function removeDate(date) {
    dates.removeValue(date);
    updateDateTimeList();
}

/* ========================================================================== */
/* Time Slider */

function initTimeSlider() {
    $("#time-slider").click(sliderPosition).mousemove(function(e) {
        if(e.which == 1) sliderPosition.call(this, e);
    });
    $("#time-minute, #time-hour").keyup(function() {
        var hour = $("#time-hour").val();
        var minute = $("#time-minute").val();
        if(!hour || !minute) return;
        setSliderPosition( parseInt(hour), parseInt(minute), true);
    }).focus(function(e) {
        $(this).select();
    }).mouseup(function(e) {
        e.preventDefault();
    });
    setSliderPosition(12, 0);

    // suppress initial animation
    setTimeout(function() {
        $(".time-slider-display .hour, .time-slider-display .minute").addClass("animated");
    }, 100);

    $("#time-add-button").click(function() {
        var hour = $("#time-hour").val();
        var minute = $("#time-minute").val();
        addTime(hour + ":" + minute);
        setSliderPosition(12, 0);
        $("#time-hour").focus();
        return false;
    });
}

function sliderPosition(e) {
    var offset = 8;
    var width = 384;
    var progress = (e.pageX - offset - $(this).offset().left) / width;
    progress = Math.min(1, Math.max(0, progress));
    var steps = 24 * 4;
    var step = Math.round(steps*progress);
    var hour = Math.floor(step/4);
    var minute = 15 * (step % 4);
    setSliderPosition(hour, minute);
}

function setSliderPosition(_hour, _minute, suppressValueUpdate) {
    var hour = (_hour + (_minute-(_minute%60))/60) % 24;
    // alert(hour + " // " + _hour);
    var minute = _minute % 60;

    var steps = 24 * 4 + 1;
    var offset = 8;
    var width = 384;

    var step = hour * 4 + minute/15;
    var pos = (step / (steps-1)) * width + offset;
    // $("#time-debug").text(step/4);
    $("#time-slider-knob").css("left", pos);

    $(".time-slider-display .hour").rotate(hour / 12 * 360 + minute / 60 / 12 * 360);
    $(".time-slider-display .minute").rotate(hour * 360 + minute / 60 * 360);

    if(!suppressValueUpdate || hour!=_hour || minute!=_minute) {
        $("#time-hour").val(hour);
        $("#time-minute").val(minute < 10 ? "0" + minute : minute);
    }
}

/* ========================================================================== */
/* Calendar */


function initCalendar(calendar) {
    var date = moment();
    calendarSetDate(date);

    $("#calendar-next-month").click(function() {
        calendarSetDate(calendar.data("date").add("months", 1));
        return false;
    });

    $("#calendar-prev-month").click(function() {
        calendarSetDate(calendar.data("date").subtract("months", 1));
        return false;
    });

    calendar.on("click", "button.day", function() {
        var date = calendar.data("date");
        date.date($(this).text());
        var datetime = date.format("YYYY-MM-DD");
        if(dates.contains(datetime)) {
            removeDate(datetime);
        } else {
            addDate(datetime);
        }
        return false;
    });
}

function calendarSetDate(date) {
    date = date.startOf("month"); // first day of the month
    calendar.data("date", date);
    updateMonth();
}

function updateMonth() {
    var date = calendar.data("date");

    calendar.find(".title").text(date.format("MMMM YYYY"));
    calendar.find(".week").remove();

    var week = [];
    var start = date.isoWeekday();
    var endDay = date.endOf("month").date();
    var end = Math.ceil( (endDay + start) / 7 ) * 7;
    for(var i = 1; i <= end; ++i) {
        var day = i - start;
        week.push(day >= 0 && day < endDay ? day+1 : 0);
        if(i%7 == 0) {
            makeWeek(week);
            week = [];
        }
    }
}

function makeWeek(week) {
    var tr = $('<tr class="week"></tr>');
    for(var i = 0; i < 7; ++i) {
        var btn = "";
        if(week[i] != 0) {
            var date = calendar.data("date");
            date.date(week[i]);
            var datetime = date.format("YYYY-MM-DD");
            // alert(datetime);
            var enabled = dates.contains(datetime);
            var past = date.isBefore(moment());
            var t = (past && !enabled ? 'span' : 'button');
            btn = '<' + t + ' class="day btn-xs ' + (enabled ? 'btn btn-success' : (past ? '' : 'btn btn-default')) + '">' + week[i] + '</' + t + '>';
        }
        tr.append($('<td>' + btn + '</td>'));
    }
    calendar.find("table").append(tr);
}