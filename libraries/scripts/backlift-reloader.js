//  development-reloader.js
//  (c) 2013 Cole Krumbholz, SendSpree Inc.
//
//  This document may be used and distributed in accordance with 
//  the MIT license. You may obtain a copy of the license at 
//    http://www.opensource.org/licenses/mit-license.php
// 
//  This helper js file is for development use only. It can be 
//  deleted from the project when deploying to production.

(function(setup_pusher, setup_json2){

  // Backlift namespace
  var Backlift = this.Backlift;
  if (typeof Backlift === 'undefined') {
    Backlift = this.Backlift = {};
  }

  setup_pusher.call(Backlift);
  JSON2 = setup_json2();

  // Backlift.pusherInit:
  // create a new pusher channel 

  Backlift.pusherInit = function (channel, key) {
    if (typeof Backlift._pusherData === 'undefined') {
      Backlift._pusherData = {
        channels: {},
        pushers: {},
      }
    }
    if (typeof Backlift._pusherData.pushers[key] === 'undefined') {
      Backlift._pusherData.pushers[key] = new Backlift.Pusher(key);
    }
    var subStr = window.location.hostname.split('.')[0]+"_"+channel;
    var chanObj = Backlift._pusherData.pushers[key].subscribe(subStr);
    Backlift._pusherData.channels[channel] = chanObj;
  };


  // Backlift.pusherOn:
  // bind a function to be evaluated when a particular event 
  // occurs on a particular channel. The function should accept
  // one argument, the data object sent by pusher.

  Backlift.pusherOn = function (channel, evt, func, ctx) {
    Backlift._pusherData.channels[channel].bind(evt, function(data) {
      func.call(ctx, data);
    });    
  };


  Backlift._setBuildStatus = function(obj) {
    if (obj.percent || obj.color) {
        var style = 'left:-'+((100-obj.percent)||0)+'%;'
        style += 'background:'+(obj.color||'#aaffaa')
        var el = document.getElementById('_blr-progress-bar');
        el.setAttribute('style', style);        
        // console.log(el.getAttribute('style'));
    }
    if (obj.phase) {
        var el = document.getElementById('_blr-phase');
        el.textContent = el.innerText = obj.phase;
        // console.log(el.textContent || el.innerText);
    }
  };


  Backlift._checkBuildStatus = function() {
    var get_xhr = function(url, success, error) {
      var xmlDoc = null;
      var doit = function() {
          if ( xmlDoc.readyState != 4 ) return;
          if (Math.floor(xmlDoc.status/100)==4 || Math.floor(xmlDoc.status/100)==5) {
            error.call(undefined, xmlDoc);            
          } else {
            success.call(undefined, xmlDoc);
          }
      };
      if (typeof window.ActiveXObject != 'undefined' ) {
        var xmlDoc = new ActiveXObject("Microsoft.XMLHTTP");
        xmlDoc.onreadystatechange = doit;
      }
      else {
        var xmlDoc = new XMLHttpRequest();
        xmlDoc.onload = doit;
      }
      xmlDoc.open( "GET", url, true );
      xmlDoc.send( null );
    };

    get_xhr("/backlift/admin/meta", function(xhr) {
      Backlift._setBuildStatus({phase: "updated "+JSON2.parse(xhr.responseText).lastupdate+" ago", percent:100});
    }, function() {
      Backlift._setBuildStatus({phase: "error", color: "#FFDDDD"});
    });
  };


  // setup_tab:
  // Creates a tab at the bottom of the page to display app status

  (function setup_tab() {

    function appendHtml(el, str) {
      var div = document.createElement('div');
      div.innerHTML = str;
      while (div.children.length > 0) {
        el.appendChild(div.children[0]);
      }
    }    

    var parts = window.location.href.match(/^https?:\/\/(\w+-\w+)\.(\S+?\....).*$/);
    var found = parts.length === 3;
    var appid = found && parts[1];
    var rootdomain = found && parts[2].replace(/app/gi, "");

    var tabHTML = "\
      <style> \
        #_blr-feedback-tab { \
          color: #000; \
          font-size: 14px; \
          line-height: 14px; \
          padding:5px 5px 5px 5px; \
          border-top: #aaa 1px solid; \
          border-left: #aaa 1px solid; \
          border-right: #aaa 1px solid; \
          position:fixed; \
          bottom:0px; \
          right:30px; \
          -webkit-border-top-left-radius: 4px; \
          -webkit-border-top-right-radius: 4px; \
          -moz-border-radius-topleft: 4px; \
          -moz-border-radius-topright: 4px; \
          border-top-left-radius: 4px; \
          border-top-right-radius: 4px; \
          background: #ffffff; /* Old browsers */ \
          background: -moz-linear-gradient(top,  #ffffff 0%, #f6f6f6 47%, #ededed 100%); /* FF3.6+ */ \
          background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#ffffff), color-stop(47%,#f6f6f6), color-stop(100%,#ededed)); /* Chrome,Safari4+ */ \
          background: -webkit-linear-gradient(top,  #ffffff 0%,#f6f6f6 47%,#ededed 100%); /* Chrome10+,Safari5.1+ */ \
          background: -o-linear-gradient(top,  #ffffff 0%,#f6f6f6 47%,#ededed 100%); /* Opera 11.10+ */ \
          background: -ms-linear-gradient(top,  #ffffff 0%,#f6f6f6 47%,#ededed 100%); /* IE10+ */ \
          background: linear-gradient(to bottom,  #ffffff 0%,#f6f6f6 47%,#ededed 100%); /* W3C */ \
          filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#ffffff', endColorstr='#ededed',GradientType=0 ); /* IE6-9 */ \
        } \
        #_blr-adminlink { \
          margin-right: 2px; \
          font-family: helvetica,sans-serif; \
          text-decoration: none; \
        } \
        #_blr-progress { \
          bottom: -1px; \
          overflow: hidden; \
          width: 100px; \
          height: 12px; \
          display: inline-block; \
          border: #ccc 1px solid; \
          background: #fff; \
          position: relative; \
        } \
        #_blr-progress-bar { \
          left: -100%; \
          width: 100%; \
          height: 100%; \
          background: #AAffAA; \
          position: relative; \
        } \
        #_blr-phase { \
          text-align: center; \
          line-height: 1; \
          overflow: hidden; \
          font-size: 10px; \
          position: absolute; \
          height: 100%; \
          width: 100%; \
          bottom: 0px; \
          font-family: helvetica,sans-serif; \
        } \
      </style> \
      <div id='_blr-feedback-tab'> \
        <a href='//www."+rootdomain+"/backlift/singlesignon/"+appid+"' id='_blr-adminlink'>Admin</a> \
        <div id='_blr-progress'><div id='_blr-progress-bar'></div><div id='_blr-phase'></div></div> \
      </div>";

    // see http://dustindiaz.com/smallest-domready-ever
    function reddy(f){
      /in/.test(document.readyState)?setTimeout(function() {reddy.call(null, f)},100):f();
    };
    reddy(function() {
      appendHtml(document.body, tabHTML);
      Backlift._checkBuildStatus();
    });

  })();

})(
  function() {
    /*!
     * Pusher JavaScript Library v1.12.2
     * http://pusherapp.com/
     *
     * Copyright 2011, Pusher
     * Released under the MIT licence.
     */
    (function() {
      if (Function.prototype.scopedTo === void 0) Function.prototype.scopedTo = function(a, b) {
        var e = this;
        return function() {
          return e.apply(a, Array.prototype.slice.call(b || []).concat(Array.prototype.slice.call(arguments)))
        }
      };
      var c = function(a, b) {
        this.options = b || {};
        this.key = a;
        this.channels = new c.Channels;
        this.global_emitter = new c.EventsDispatcher;
        var e = this;
        this.checkAppKey();
        this.connection = new c.Connection(this.key, this.options);
        this.connection.bind("connected", function() {
          e.subscribeAll()
        }).bind("message", function(b) {
          var a = b.event.indexOf("pusher_internal:") === 0;
          if (b.channel) {
            var c;
            (c = e.channel(b.channel)) && c.emit(b.event, b.data)
          }
          a || e.global_emitter.emit(b.event, b.data)
        }).bind("disconnected", function() {
          e.channels.disconnect()
        }).bind("error", function(b) {
          c.warn("Error", b)
        });
        c.instances.push(this);
        c.isReady && e.connect()
      };
      c.instances = [];
      c.prototype = {
        channel: function(a) {
          return this.channels.find(a)
        },
        connect: function() {
          this.connection.connect()
        },
        disconnect: function() {
          this.connection.disconnect()
        },
        bind: function(a, b) {
          this.global_emitter.bind(a, b);
          return this
        },
        bind_all: function(a) {
          this.global_emitter.bind_all(a);
          return this
        },
        subscribeAll: function() {
          for (channelName in this.channels.channels) this.channels.channels.hasOwnProperty(channelName) && this.subscribe(channelName)
        },
        subscribe: function(a) {
          var b = this,
              e = this.channels.add(a, this);
          this.connection.state === "connected" && e.authorize(this.connection.socket_id, this.options, function(c, f) {
            c ? e.emit("pusher:subscription_error", f) : b.send_event("pusher:subscribe", {
              channel: a,
              auth: f.auth,
              channel_data: f.channel_data
            })
          });
          return e
        },
        unsubscribe: function(a) {
          this.channels.remove(a);
          this.connection.state === "connected" && this.send_event("pusher:unsubscribe", {
            channel: a
          })
        },
        send_event: function(a, b, e) {
          return this.connection.send_event(a, b, e)
        },
        checkAppKey: function() {
          (this.key === null || this.key === void 0) && c.warn("Warning", "You must pass your app key when you instantiate Pusher.")
        }
      };
      c.Util = {
        extend: function b(e, c) {
          for (var f in c) e[f] = c[f] && c[f].constructor && c[f].constructor === Object ? b(e[f] || {}, c[f]) : c[f];
          return e
        },
        stringify: function() {
          for (var b = ["Pusher"], e = 0; e < arguments.length; e++) typeof arguments[e] === "string" ? b.push(arguments[e]) : window.JSON == void 0 ? b.push(arguments[e].toString()) : b.push(JSON.stringify(arguments[e]));
          return b.join(" : ")
        },
        arrayIndexOf: function(b, e) {
          var c = Array.prototype.indexOf;
          if (b == null) return -1;
          if (c && b.indexOf === c) return b.indexOf(e);
          for (i = 0, l = b.length; i < l; i++) if (b[i] === e) return i;
          return -1
        }
      };
      c.debug = function() {
        c.log && c.log(c.Util.stringify.apply(this, arguments))
      };
      c.warn = function() {
        window.console && window.console.warn ? window.console.warn(c.Util.stringify.apply(this, arguments)) : c.log && c.log(c.Util.stringify.apply(this, arguments))
      };
      c.VERSION = "1.12.2";
      c.host = "ws.pusherapp.com";
      c.ws_port = 80;
      c.wss_port = 443;
      c.channel_auth_endpoint = "/pusher/auth";
      c.cdn_http = "http://js.pusher.com/";
      c.cdn_https = "https://d3dy5gmtp8yhk7.cloudfront.net/";
      c.dependency_suffix = ".min";
      c.channel_auth_transport = "ajax";
      c.activity_timeout = 12E4;
      c.pong_timeout = 3E4;
      c.isReady = !1;
      c.ready = function() {
        c.isReady = !0;
        for (var b = 0, e = c.instances.length; b < e; b++) c.instances[b].connect()
      };
      this.Pusher = c
    }).call(this);
 
    var Pusher = this.Pusher;
 
    (function() {
      function c() {
        this._callbacks = {}
      }
      function a(b) {
        this.callbacks = new c;
        this.global_callbacks = [];
        this.failThrough = b
      }
      c.prototype.get = function(b) {
        return this._callbacks[this._prefix(b)]
      };
      c.prototype.add = function(b, a) {
        var c = this._prefix(b);
        this._callbacks[c] = this._callbacks[c] || [];
        this._callbacks[c].push(a)
      };
      c.prototype.remove = function(b, a) {
        if (this.get(b)) {
          var c = Pusher.Util.arrayIndexOf(this.get(b), a);
          this._callbacks[this._prefix(b)].splice(c, 1)
        }
      };
      c.prototype._prefix = function(b) {
        return "_" + b
      };
      a.prototype.bind = function(b, a) {
        this.callbacks.add(b, a);
        return this
      };
      a.prototype.unbind = function(b, a) {
        this.callbacks.remove(b, a);
        return this
      };
      a.prototype.emit = function(b, a) {
        for (var c = 0; c < this.global_callbacks.length; c++) this.global_callbacks[c](b, a);
        var f = this.callbacks.get(b);
        if (f) for (c = 0; c < f.length; c++) f[c](a);
        else this.failThrough && this.failThrough(b, a);
        return this
      };
      a.prototype.bind_all = function(b) {
        this.global_callbacks.push(b);
        return this
      };
      this.Pusher.EventsDispatcher = a
    }).call(this);
 
 
    (function() {
      function c(b, a, c) {
        if (a[b] !== void 0) a[b](c)
      }
      function a(a, c, f) {
        b.EventsDispatcher.call(this);
        this.state = void 0;
        this.errors = [];
        this.stateActions = f;
        this.transitions = c;
        this.transition(a)
      }
      var b = this.Pusher;
      a.prototype.transition = function(a, g) {
        var f = this.state,
            h = this.stateActions;
        if (f && b.Util.arrayIndexOf(this.transitions[f], a) == -1) throw this.emit("invalid_transition_attempt", {
          oldState: f,
          newState: a
        }), Error("Invalid transition [" + f + " to " + a + "]");
        c(f + "Exit", h, g);
        c(f + "To" + (a.substr(0, 1).toUpperCase() + a.substr(1)), h, g);
        c(a + "Pre", h, g);
        this.state = a;
        this.emit("state_change", {
          oldState: f,
          newState: a
        });
        c(a + "Post", h, g)
      };
      a.prototype.is = function(b) {
        return this.state === b
      };
      a.prototype.isNot = function(b) {
        return this.state !== b
      };
      b.Util.extend(a.prototype, b.EventsDispatcher.prototype);
      this.Pusher.Machine = a
    }).call(this);
    (function() {
      var c = function() {
        var a = this;
        Pusher.EventsDispatcher.call(this);
        window.addEventListener !== void 0 && (window.addEventListener("online", function() {
          a.emit("online", null)
        }, !1), window.addEventListener("offline", function() {
          a.emit("offline", null)
        }, !1))
      };
      c.prototype.isOnLine = function() {
        return window.navigator.onLine === void 0 ? !0 : window.navigator.onLine
      };
      Pusher.Util.extend(c.prototype, Pusher.EventsDispatcher.prototype);
      this.Pusher.NetInfo = c
    }).call(this);
    (function() {
      function c(a) {
        a.connectionWait = 0;
        a.openTimeout = b.TransportType === "flash" ? 5E3 : 2E3;
        a.connectedTimeout = 2E3;
        a.connectionSecure = a.compulsorySecure;
        a.connectionAttempts = 0
      }
      function a(a, r) {
        function k() {
          d.connectionWait < s && (d.connectionWait += g);
          d.openTimeout < t && (d.openTimeout += f);
          d.connectedTimeout < u && (d.connectedTimeout += h);
          if (d.compulsorySecure !== !0) d.connectionSecure = !d.connectionSecure;
          d.connectionAttempts++
        }
        function m() {
          d._machine.transition("impermanentlyClosing")
        }
        function p() {
          d._activityTimer && clearTimeout(d._activityTimer);
          d._activityTimer = setTimeout(function() {
            d.send_event("pusher:ping", {});
            d._activityTimer = setTimeout(function() {
              d.socket.close()
            }, d.options.pong_timeout || b.pong_timeout)
          }, d.options.activity_timeout || b.activity_timeout)
        }
        function v() {
          var b = d.connectionWait;
          if (b === 0 && d.connectedAt) {
            var a = (new Date).getTime() - d.connectedAt;
            a < 1E3 && (b = 1E3 - a)
          }
          return b
        }
        function w() {
          d._machine.transition("open")
        }
        function x(b) {
          b = q(b);
          if (b !== void 0) if (b.event === "pusher:connection_established") d._machine.transition("connected", b.data.socket_id);
          else if (b.event === "pusher:error") {
            var a = b.data.code;
            d.emit("error", {
              type: "PusherError",
              data: {
                code: a,
                message: b.data.message
              }
            });
            a === 4E3 ? (d.compulsorySecure = !0, d.connectionSecure = !0, d.options.encrypted = !0, m()) : a < 4100 ? d._machine.transition("permanentlyClosing") : a < 4200 ? (d.connectionWait = 1E3, d._machine.transition("waiting")) : a < 4300 ? m() : d._machine.transition("permanentlyClosing")
          }
        }
        function y(a) {
          p();
          a = q(a);
          if (a !== void 0) {
            b.debug("Event recd", a);
            switch (a.event) {
            case "pusher:error":
              d.emit("error", {
                type: "PusherError",
                data: a.data
              });
              break;
            case "pusher:ping":
              d.send_event("pusher:pong", {})
            }
            d.emit("message", a)
          }
        }
        function q(b) {
          try {
            var a = JSON.parse(b.data);
            if (typeof a.data === "string") try {
              a.data = JSON.parse(a.data)
            } catch (c) {
              if (!(c instanceof SyntaxError)) throw c;
            }
            return a
          } catch (e) {
            d.emit("error", {
              type: "MessageParseError",
              error: e,
              data: b.data
            })
          }
        }
        function n() {
          d._machine.transition("waiting")
        }
        function o(b) {
          d.emit("error", {
            type: "WebSocketError",
            error: b
          })
        }
        function j(a, c) {
          var e = d.state;
          d.state = a;
          e !== a && (b.debug("State changed", e + " -> " + a), d.emit("state_change", {
            previous: e,
            current: a
          }), d.emit(a, c))
        }
        var d = this;
        b.EventsDispatcher.call(this);
        this.options = b.Util.extend({
          encrypted: !1
        }, r);
        this.netInfo = new b.NetInfo;
        this.netInfo.bind("online", function() {
          d._machine.is("waiting") && (d._machine.transition("connecting"), j("connecting"))
        });
        this.netInfo.bind("offline", function() {
          if (d._machine.is("connected")) d.socket.onclose = void 0, d.socket.onmessage = void 0, d.socket.onerror = void 0, d.socket.onopen = void 0, d.socket.close(), d.socket = void 0, d._machine.transition("waiting")
        });
        this._machine = new b.Machine("initialized", e, {
          initializedPre: function() {
            d.compulsorySecure = d.options.encrypted;
            d.key = a;
            d.socket = null;
            d.socket_id = null;
            d.state = "initialized"
          },
          waitingPre: function() {
            d.connectionWait > 0 && d.emit("connecting_in", d.connectionWait);
            d.netInfo.isOnLine() && d.connectionAttempts <= 4 ? j("connecting") : j("unavailable");
            if (d.netInfo.isOnLine()) d._waitingTimer = setTimeout(function() {
              d._machine.transition("connecting")
            }, v())
          },
          waitingExit: function() {
            clearTimeout(d._waitingTimer)
          },
          connectingPre: function() {
            if (d.netInfo.isOnLine() === !1) d._machine.transition("waiting"), j("unavailable");
            else {
              var a;
              a = b.ws_port;
              var c = "ws://";
              if (d.connectionSecure || document.location.protocol === "https:") a = b.wss_port, c = "wss://";
              a = c + b.host + ":" + a + "/app/" + d.key + "?protocol=5&client=js&version=" + b.VERSION + "&flash=" + (b.TransportType === "flash" ? "true" : "false");
              b.debug("Connecting", a);
              d.socket = new b.Transport(a);
              d.socket.onopen = w;
              d.socket.onclose = n;
              d.socket.onerror = o;
              d._connectingTimer = setTimeout(m, d.openTimeout)
            }
          },
          connectingExit: function() {
            clearTimeout(d._connectingTimer);
            d.socket.onopen = void 0
          },
          connectingToWaiting: function() {
            k()
          },
          connectingToImpermanentlyClosing: function() {
            k()
          },
          openPre: function() {
            d.socket.onmessage = x;
            d.socket.onerror = o;
            d.socket.onclose = n;
            d._openTimer = setTimeout(m, d.connectedTimeout)
          },
          openExit: function() {
            clearTimeout(d._openTimer);
            d.socket.onmessage = void 0
          },
          openToWaiting: function() {
            k()
          },
          openToImpermanentlyClosing: function() {
            k()
          },
          connectedPre: function(a) {
            d.socket_id = a;
            d.socket.onmessage = y;
            d.socket.onerror =
            o;
            d.socket.onclose = n;
            c(d);
            d.connectedAt = (new Date).getTime();
            p()
          },
          connectedPost: function() {
            j("connected")
          },
          connectedExit: function() {
            d._activityTimer && clearTimeout(d._activityTimer);
            j("disconnected")
          },
          impermanentlyClosingPost: function() {
            if (d.socket) d.socket.onclose = n, d.socket.close()
          },
          permanentlyClosingPost: function() {
            d.socket ? (d.socket.onclose = function() {
              c(d);
              d._machine.transition("permanentlyClosed")
            }, d.socket.close()) : (c(d), d._machine.transition("permanentlyClosed"))
          },
          failedPre: function() {
            j("failed");
            b.debug("WebSockets are not available in this browser.")
          },
          permanentlyClosedPost: function() {
            j("disconnected")
          }
        })
      }
      var b = this.Pusher,
          e = {
          initialized: ["waiting", "failed"],
          waiting: ["connecting", "permanentlyClosed"],
          connecting: ["open", "permanentlyClosing", "impermanentlyClosing", "waiting"],
          open: ["connected", "permanentlyClosing", "impermanentlyClosing", "waiting"],
          connected: ["permanentlyClosing", "waiting"],
          impermanentlyClosing: ["waiting", "permanentlyClosing"],
          permanentlyClosing: ["permanentlyClosed"],
          permanentlyClosed: ["waiting", "failed"],
          failed: ["permanentlyClosed"]
          },
          g = 2E3,
          f = 2E3,
          h = 2E3,
          s = 5 * g,
          t = 5 * f,
          u = 5 * h;
      a.prototype.connect = function() {
        !this._machine.is("failed") && !b.Transport ? this._machine.transition("failed") : this._machine.is("initialized") ? (c(this), this._machine.transition("waiting")) : this._machine.is("waiting") && this.netInfo.isOnLine() === !0 ? this._machine.transition("connecting") : this._machine.is("permanentlyClosed") && (c(this), this._machine.transition("waiting"))
      };
      a.prototype.send = function(a) {
        if (this._machine.is("connected")) {
          var b =
          this;
          setTimeout(function() {
            b.socket.send(a)
          }, 0);
          return !0
        } else
        return !1
      };
      a.prototype.send_event = function(a, c, e) {
        a = {
          event: a,
          data: c
        };
        e && (a.channel = e);
        b.debug("Event sent", a);
        return this.send(JSON.stringify(a))
      };
      a.prototype.disconnect = function() {
        this._machine.is("permanentlyClosed") || (this._machine.is("waiting") || this._machine.is("failed") ? this._machine.transition("permanentlyClosed") : this._machine.transition("permanentlyClosing"))
      };
      b.Util.extend(a.prototype, b.EventsDispatcher.prototype);
      this.Pusher.Connection =
      a
    }).call(this);
 
 
    (function() {
      Pusher.Channels = function() {
        this.channels = {}
      };
      Pusher.Channels.prototype = {
        add: function(a, b) {
          var c = this.find(a);
          c || (c = Pusher.Channel.factory(a, b), this.channels[a] = c);
          return c
        },
        find: function(a) {
          return this.channels[a]
        },
        remove: function(a) {
          delete this.channels[a]
        },
        disconnect: function() {
          for (var a in this.channels) this.channels[a].disconnect()
        }
      };
      Pusher.Channel = function(a, b) {
        var c = this;
        Pusher.EventsDispatcher.call(this, function(b) {
          Pusher.debug("No callbacks on " + a + " for " + b)
        });
        this.pusher = b;
        this.name =
        a;
        this.subscribed = !1;
        this.bind("pusher_internal:subscription_succeeded", function(a) {
          c.onSubscriptionSucceeded(a)
        })
      };
      Pusher.Channel.prototype = {
        init: function() {},
        disconnect: function() {
          this.subscribed = !1;
          this.emit("pusher_internal:disconnected")
        },
        onSubscriptionSucceeded: function() {
          this.subscribed = !0;
          this.emit("pusher:subscription_succeeded")
        },
        authorize: function(a, b, c) {
          return c(!1, {})
        },
        trigger: function(a, b) {
          return this.pusher.send_event(a, b, this.name)
        }
      };
      Pusher.Util.extend(Pusher.Channel.prototype, Pusher.EventsDispatcher.prototype);
      Pusher.Channel.PrivateChannel = {
        authorize: function(a, b, c) {
          var g = this;
          return (new Pusher.Channel.Authorizer(this, Pusher.channel_auth_transport, b)).authorize(a, function(a, b) {
            a || g.emit("pusher_internal:authorized", b);
            c(a, b)
          })
        }
      };
      Pusher.Channel.PresenceChannel = {
        init: function() {
          this.members = new c(this)
        },
        onSubscriptionSucceeded: function() {
          this.subscribed = !0
        }
      };
      var c = function(a) {
        var b = this,
            c = function() {
            this._members_map = {};
            this.count = 0;
            this.me = null
            };
        c.call(this);
        a.bind("pusher_internal:authorized", function(c) {
          var e =
          JSON.parse(c.channel_data);
          a.bind("pusher_internal:subscription_succeeded", function(c) {
            b._members_map = c.presence.hash;
            b.count = c.presence.count;
            b.me = b.get(e.user_id);
            a.emit("pusher:subscription_succeeded", b)
          })
        });
        a.bind("pusher_internal:member_added", function(c) {
          b.get(c.user_id) === null && b.count++;
          b._members_map[c.user_id] = c.user_info;
          a.emit("pusher:member_added", b.get(c.user_id))
        });
        a.bind("pusher_internal:member_removed", function(c) {
          var e = b.get(c.user_id);
          e && (delete b._members_map[c.user_id], b.count--, a.emit("pusher:member_removed", e))
        });
        a.bind("pusher_internal:disconnected", function() {
          c.call(b)
        })
      };
      c.prototype = {
        each: function(a) {
          for (var b in this._members_map) a(this.get(b))
        },
        get: function(a) {
          return this._members_map.hasOwnProperty(a) ? {
            id: a,
            info: this._members_map[a]
          } : null
        }
      };
      Pusher.Channel.factory = function(a, b) {
        var c = new Pusher.Channel(a, b);
        a.indexOf("private-") === 0 ? Pusher.Util.extend(c, Pusher.Channel.PrivateChannel) : a.indexOf("presence-") === 0 && (Pusher.Util.extend(c, Pusher.Channel.PrivateChannel), Pusher.Util.extend(c, Pusher.Channel.PresenceChannel));
        c.init();
        return c
      }
    }).call(this);
 
 
    (function() {
      Pusher.Channel.Authorizer = function(c, a, b) {
        this.channel = c;
        this.type = a;
        this.authOptions = (b || {}).auth || {}
      };
      Pusher.Channel.Authorizer.prototype = {
        composeQuery: function(c) {
          var c = "&socket_id=" + encodeURIComponent(c) + "&channel_name=" + encodeURIComponent(this.channel.name),
              a;
          for (a in this.authOptions.params) c += "&" + encodeURIComponent(a) + "=" + encodeURIComponent(this.authOptions.params[a]);
          return c
        },
        authorize: function(c, a) {
          return Pusher.authorizers[this.type].call(this, c, a)
        }
      };
      Pusher.auth_callbacks = {};
      Pusher.authorizers = {
        ajax: function(c, a) {
          var b;
          b = Pusher.XHR ? new Pusher.XHR : window.XMLHttpRequest ? new window.XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
          b.open("POST", Pusher.channel_auth_endpoint, !0);
          b.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
          for (var e in this.authOptions.headers) b.setRequestHeader(e, this.authOptions.headers[e]);
          b.onreadystatechange = function() {
            if (b.readyState == 4) if (b.status == 200) {
              var c, e = !1;
              try {
                c = JSON.parse(b.responseText), e = !0
              } catch (h) {
                a(!0, "JSON returned from webapp was invalid, yet status code was 200. Data was: " + b.responseText)
              }
              e && a(!1, c)
            } else Pusher.warn("Couldn't get auth info from your webapp", b.status), a(!0, b.status)
          };
          b.send(this.composeQuery(c));
          return b
        },
        jsonp: function(c, a) {
          this.authOptions.headers !== void 0 && Pusher.warn("Warn", "To send headers with the auth request, you must use AJAX, rather than JSONP.");
          var b = document.createElement("script");
          Pusher.auth_callbacks[this.channel.name] = function(b) {
            a(!1, b)
          };
          b.src = Pusher.channel_auth_endpoint + "?callback=" + encodeURIComponent("Pusher.auth_callbacks['" + this.channel.name + "']") + this.composeQuery(c);
          var e = document.getElementsByTagName("head")[0] || document.documentElement;
          e.insertBefore(b, e.firstChild)
        }
      }
    }).call(this);
 
 
    var _require = function() {
      function c(a, c) {
        document.addEventListener ? a.addEventListener("load", c, !1) : a.attachEvent("onreadystatechange", function() {
          (a.readyState == "loaded" || a.readyState == "complete") && c()
        })
      }
      function a(a, e) {
        var g = document.getElementsByTagName("head")[0],
            f = document.createElement("script");
        f.setAttribute("src", a);
        f.setAttribute("type", "text/javascript");
        f.setAttribute("async", !0);
        c(f, function() {
          e()
        });
        g.appendChild(f)
      }
      return function(b, c) {
        for (var g = 0, f = 0; f < b.length; f++) a(b[f], function() {
          b.length == ++g && setTimeout(c, 0)
        })
      }
    }();
 
 
    (function() {
      !window.WebSocket && window.MozWebSocket && (window.WebSocket = window.MozWebSocket);
      if (window.WebSocket) Pusher.Transport = window.WebSocket, Pusher.TransportType = "native";
      var c = (document.location.protocol == "http:" ? Pusher.cdn_http : Pusher.cdn_https) + Pusher.VERSION,
          a = [];
      window.JSON || a.push(c + "/json2" + Pusher.dependency_suffix + ".js");
      if (!window.WebSocket) window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = !0, a.push(c + "/flashfallback" + Pusher.dependency_suffix + ".js");
      var b = function() {
        return window.WebSocket ?
        function() {
          Pusher.ready()
        } : function() {
          window.WebSocket ? (Pusher.Transport = window.WebSocket, Pusher.TransportType = "flash", window.WEB_SOCKET_SWF_LOCATION = c + "/WebSocketMain.swf", WebSocket.__addTask(function() {
            Pusher.ready()
          }), WebSocket.__initialize()) : (Pusher.Transport = null, Pusher.TransportType = "none", Pusher.ready())
        }
      }(),
          e = function(a) {
          var b = function() {
            document.body ? a() : setTimeout(b, 0)
          };
          b()
          },
          g = function() {
          e(b)
          };
      a.length > 0 ? _require(a, g) : g()
    })();
  },
  function(){
  /* json2 */
  var JSON;if(!JSON){JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==="string"){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());
  return JSON;  
  }
);

// Main function, sets up callbacks for various pusher messages

(function() {

  // Enable pusher logging
  Backlift.Pusher.log = function(message) {
    // if (window.console && window.console.log) window.console.log(message);
  };

  Backlift.pusherInit('development', '25cdf614bbf9a547045b');

  Backlift.pusherOn('development', 'updated', function(data) {
    window.location.reload(true);
  });

  Backlift.pusherOn('development', 'updating', function(data) {
    Backlift._setBuildStatus(data);
  });

  Backlift.pusherOn('development', 'error', function(data) {
    Backlift._setBuildStatus({phase: "error", color: "#FFDDDD"});
  });
})();
