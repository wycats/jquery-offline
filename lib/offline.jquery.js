(function($) {

  var prefix = "offline.jquery:",
    mostRecent = null,
    requesting = {};

  // Allow the user to explicitly turn off localStorage
  // before loading this plugin
  if (typeof $.support.localStorage === "undefined") {
    $.support.localStorage = !!window.localStorage;
  }

  // modified getJSON which uses ifModified: true
  function getJSON(url, data, fn) {
    if (jQuery.isFunction(data)) {
      fn = data;
      data = null;
    }

    requestingKey = url + "?" + data;
    if (requestingKey[requestingKey]) {
      return false;
    }

    requesting[requestingKey] = true;

    return jQuery.ajax({
      type: "GET",
      url: url,
      data: data,
      success: function(data, text) {
        requesting[requestingKey] = false;
        fn(data, text);
      },
      dataType: "json",
      ifModified: true
    });
  }

  if ($.support.localStorage) {
    // If localStorage is available, define jQuery.retrieveJSON
    // and jQuery.clearJSON to operate in terms of the offline
    // cache
    // If the user comes online, run the most recent request
    // that was queued due to the user being offline
    $(window).bind("online", function() {
      if (mostRecent) {
        mostRecent();
      }
    });

    // If the user goes offline, hide any loading bar
    // the user may have created
    $(window).bind("offline", function() {
      jQuery.event.trigger("ajaxStop");
    });

    $.retrieveJSON = function(url, data, fn) {
      // allow jQuery.retrieveJSON(url, fn)
      if ($.isFunction(data)) {
        fn = data;
        data = {};
      }

      // get a String value for the data passed in, and then
      // use it to calculate a cache key
      var param = $.param(data),
        text = localStorage[prefix + url + ":" + param];

      // create a function that will make an Ajax request and
      // store the result in the cache. This function will be
      // deferred until later if the user is offline
      function getData() {
        getJSON(url, param, function(json, status) {
          localStorage[prefix + url + ":" + param] = JSON.stringify(json);
          fn(json, status);
        });
      }

      // If there is anything in the cache, call the callback
      // right away, with the "cached" status string
      if( text ) {
        var response = fn( $.parseJSON(text), "cached" );
        if( response === false ) return false;
      }

      // If the user is online, make the Ajax request right away;
      // otherwise, make it the most recent callback so it will
      // get triggered when the user comes online
      if (window.navigator.onLine) {
        getData();
      } else {
        mostRecent = getData;
      }
    };

    // jQuery.clearJSON is simply a wrapper around deleting the
    // localStorage for a URL/data pair
    $.clearJSON = function(url, data) {
      var param = $.param(data || {});
      delete localStorage[prefix + url + ":" + param];
    };
  } else {
    // If localStorage is unavailable, just make all requests
    // regular Ajax requests.
    $.retrieveJSON = getJSON;
    $.clearJSON = $.noop;
  }

})(jQuery);
