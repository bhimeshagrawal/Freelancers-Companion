$(window).scroll(function() {
    if($(window).scrollTop() + $(window).height() > "10px") {
         $("nav").addClass("border-b")
    }
    else{
        $("nav").removeClass("border-b")
    }
 });