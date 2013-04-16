// Bunch of helper functions for the admin app

App.helpers = {}

App.helpers.isJSON = function(str){
  try{
    JSON.parse(str)
  } catch(e){
    return 'Make sure you entered valid JSON, <a href="http://jsonlint.com/">www.jsonlint.com</a>';
  }
  return '';
}

App.helpers.notEmpty = function(str){
  if(str==''){
    return "Can't be empty";
  }
  return '';
}

App.helpers.notInList = function(list, str){
  ret = function(str){
    if(list.indexOf(str)>=0){
      return "Already exists";
    } else {
      return '';
    }
  }
  return ret;
}

App.helpers.filterFunctions = {
    "equal": {
      "sym":"is",
      "func": function(a,b){ return a==b; }
    },
    "isnot": {
      "sym":"is not",
      "func": function(a,b){ return a!=b; }
    },
   /* "lt": {
      "sym":"<",
      "func": function(a,b){ return a<b; }
    },
    "gt": {
      "sym":">",
      "func": function(a,b){return a>b; }
    },*/
    "contains": {
      "sym":"contains",
      "func": function(a,b){ return a.indexOf(b)>=0; }
    },
    "notcontain": {
      "sym":"not contain",
      "func": function(a,b){ return a.indexOf(b)<0; }
    }
}

App.helpers.toggleNav = function(selector){
  $('#mainnav .active').removeClass('active');
  $(selector).addClass('active');
}

App.helpers.serializeForm = function(form){
  ret = {}
  _.each($(form+' :input'), function(item){
    name = $(item).attr('name');
    if(name!=undefined){
      v = $(item).attr('type') == 'checkbox' ? $(item).is(':checked') : $(item).val();
      ret[name] = v;
    }
  })
  return ret;
}


App.helpers.formValidator = function(form){
  this.form = form;
  this.hasErrors = false;
  var self = this;

  this.clientValidate = function(rules){
    self.hasErrors = false;
    _.each(rules, function(rule){
      field = $(self.form+' [name="'+rule['field']+'"]')
      value = field.val();
      error = rule['func'](value);
      if(error!=''){
        self.setError(field, error);
      }
    });
  },

  this.serverValidate = function(errors){
    _.each(Object.keys(errors), function(key){
      field = $(self.form+' [name="'+key+'"]');
      msg = errors[key].join(', ');
      self.setError(field, msg);
    });
  },

  this.clearErrors = function(){
    this.hasErrors = false;
    $(form+' .control-group').removeClass('error')
    $(form+' .control-group label.control-label').html('')
  }

  this.setError = function(field, msg){
    group = field.closest('.control-group');
    group.find('.control-label').append(msg+' ');
    group.addClass('error');
    self.hasErrors = true;
  }

  return this;
}

App.helpers.checkLogin = function(login, success){
  if(!App.current_user || App.current_user._groups.indexOf('administrators')<0){
    login();
  } else {
    success();
  }
}

App.helpers.viewGen = function(){
  var views = {};
  ret = function(key, func, args){
    if(views.hasOwnProperty(key)){
      views[key].close();
    }
    var v = new func(args);
    views[key] = v;
    return v;
  }
  return ret;
}

Backbone.View.prototype.close = function() {
  $(this.el).unbind();
}
