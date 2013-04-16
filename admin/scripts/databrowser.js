/*
* Handles views and logic for browsing data collection of a backlift app
*
*/

App.databrowser = {};
App.databrowser.viewGen = new App.helpers.viewGen();


App.databrowser.collection = Backbone.Collection.extend({
  
  getModelKeys: function(){
    ret = []
    _.each(this.models,function(model){
      keys = Object.keys(model.attributes);
        _.each(keys, function(key){
          if(ret.indexOf(key)<0){
            ret.push(key);
          }
        });
      });
    return ret;
  },

  getName: function(){
    urlparts = this.url.split('/');
    return urlparts[urlparts.length-1];
  },

  deleteSelf: function(){
    var self = this;
    $.ajax(this.url,{'type':'DELETE', success: function(){
      delete App.adminData.collections[self.getName()];
      delete App.databrowser.collist[self.getName()];
      window.location.hash = '#databrowser'
    }});
  }

});

App.databrowser.mainview = Backbone.View.extend({
  el: '#content',
  template: $('#databrowser-view').html(),
  initialize: function(options){
    this.on('render', this.onRender);
    
    // two subviews
    this.nav = options.nav;
    this.content = options.content
    this.file = null;
  },
  
  render: function(){
    this.$el.html(_.template(this.template));
    return this.trigger('render'); 
  },

  onRender: function(){
    this.nav.setElement('#subnav').render();
    //this.nav.delegateEvents();
    if(this.content){
      this.content.setElement('#subcontent').render();
    }
  },

  checkImportField: function(){
    content = $('#importcontent').val();
    if(content==''){
      $('#jsonerror').closest('.control-group').removeClass('error')
      $('#jsonerror').html('');
    }
    if(content!=''){
      error = App.helpers.isJSON(content);
      if(error==''){
        $('#jsonerror').closest('.control-group').removeClass('error')
        $('#jsonerror').html('')
      } else {
        $('#jsonerror').closest('.control-group').addClass('error')
        $('#jsonerror').html(error);
      }
    }
  },

  readFile: function(file, callback){
    var ctx = this;
    var reader = new FileReader();
    reader.onload = (function(file){
      return function(e){
        res = e.target.result;
        if(res==''){
          res = 'empty'; // files with no content break import
        }
        callback(e.target.result, ctx)
      }
    })(file);

    reader.onprogress = function(e){
      if (e.lengthComputable) {
        var percentLoaded = Math.round((e.loaded / e.total) * 100);
        
        // Increase the progress bar length.
        if (percentLoaded < 100) {
          // TODO: implement something here
        }
      }
    }
    reader.readAsText(file)
  },

  previewFile: function(data, ctx){
    
    if(App.helpers.isJSON(data)==''){
      data = JSON.stringify(JSON.parse(data), null, ' ');
    }
    $('#importcontent').val(data)
    ctx.checkImportField();
    $('#filewarning').addClass('hidden');
  },

  importFile: function(content, ctx){
    var ctx = ctx || this;
    if(content==''){
      if(ctx.file!=null){
        ctx.readFile(ctx.file, ctx.importFile)
      } else {
        alert('Either choose file to import or type in JSON');
      }
    } else {
      error = App.helpers.isJSON(content)
      if(error==''){
        $.ajax('/backlift/data', {
          type: 'POST',
          contentType: 'application/json',
          data: content,
          success: function(data){
            window.location.reload();
          },
          error: function(data, responseText){
            alert('Something went wrong, please try again and make sure your data is valid JSON');
          }
        });
      } else {
        alert('Make sure file or content is valid JSON');
      }
    }
  },

  events: {
    'change input#importfile': function(e){
      var self = this;
      self.file = null;
      $('#importcontent').val('');
      self.checkImportField();
      if(e.target.files.length>0){
        file = e.target.files[0]
        self.file = file;
        if(file.size>1024*1024){
          $('#filewarning').removeClass('hidden');
          $('#importcontent').addClass('hidden');
        } else {
          $('#filewarning').addClass('hidden');
          $('#importcontent').removeClass('hidden');
          self.readFile(file,self.previewFile);
        }
      } else {
        $('#filewarning').addClass('hidden');
        $('#importcontent').removeClass('hidden');
      } 
    },

    'change #importcontent': function(){
      this.checkImportField();
    },

    'keyup #importcontent': function(){
      this.checkImportField();
    },

    'click #importbutton': function(){
      content = $('#importcontent').val();
      this.importFile(content);
    },

    'click #showpreview': function(){
      $('#filewarning').addClass('hidden');
      $('#importcontent').removeClass('hidden');
      this.readFile(file,this.previewFile);
    }
  }

});

App.databrowser.navview = Backbone.View.extend({
  template: $('#databrowser-nav').html(),
  initialize: function(options){
    
    this.collection = options.collection;

    for(c in this.collection){
      this.listenTo(this.collection[c], 'change', this.render);
    }

  },

  formatCollection: function(col){
    keys = Object.keys(col);
    ret = []
    for(k in keys){
      ret.push({
        name: keys[k],
        size: col[keys[k]].models.length
      })
    }
    return ret;
  },

  render: function(){
    this.$el.html(_.template(this.template, {params: this.formatCollection(this.collection)}))
  },

  createNewCollection: function(){
    var parent = this;
    formname = '#addnewcollection';
    colname = $(formname+' [name="name"]').val();
    coldata = '{}' //$(formname+' [name="data"]').val();

    // validate
    validator = new App.helpers.formValidator(formname);
    rules = [
      {field: 'name', func: App.helpers.notEmpty},
      {field: 'name', func: App.helpers.notInList(Object.keys(App.adminData.collections))}
     // {field: 'data', func: App.helpers.isJSON}
    ]

    validator.clearErrors();
    validator.clientValidate(rules);

    if(!validator.hasErrors){
      col = JSON.parse(coldata);
      url = '/backlift/data/'+colname

      $.post(url, null, function(data){
        if(Object.keys(data).length>0){
          newcol = new App.databrowser.collection([data]);
        } else {
          newcol = new App.databrowser.collection();
        }
        newcol.url = url;
        parent.collection[colname] = newcol;

        App.databrowser.collist[colname] = newcol;
        parent.listenTo(parent.collection[colname],'change',parent.render);

        admindata = {}
        _.each(Object.keys(col),function(item){
          admindata[item] = new Object();
        });
        App.adminData.collections = App.adminData.collections || {}
        App.adminData.collections[colname] = admindata;

        $('#addnewcollection').modal('hide');
        window.location.hash = '#databrowser/'+colname;
      });
    }
  },

  events: {
    "submit form#addnewcollection": function(e) { 
      e.preventDefault();
      this.createNewCollection(); 
    },

    "focus #addnewcollection [name='name']": function(){
      $('#addnewcollection button[type="submit"]').removeClass('hidden');
    }
  },
  
});

App.databrowser.docview = Backbone.View.extend({
  initialize: function(options){
    this.model = options.model;
  },
  render: function(){
    var m = this.model;
    this.$el.append(_.template($('#dataitem-view').html(),{params: m.toJSON()}));
  },

  deleteModel: function(e){
    id = $(e.target).data('id');
      col = this.model.collection;
      col.get(id).destroy();
      $(e.target).closest('.itemholder').fadeOut('fast',function(){
        col.trigger('change');
    })
  },

  events: {
    "click a.del": function(e){ this.deleteModel(e); }
  }
});

App.databrowser.colview = Backbone.View.extend({
  template: $('#databrowser-col').html(),

  initialize: function(options){
    this.collection = options.collection;

    this.filter = App.databrowser.viewGen('filter', App.databrowser.filterview, {
      collection: this.collection,
    });;
    
    this.filterRendered = false;

    this.listenTo(this.collection, 'change', this.renderItems)
    this.listenTo(this.filter, 'filter', this.renderItems)

  },

  render: function(){
    this.$el.html(_.template(this.template,{formplaceholder: this.formatPlaceholder()}));
    if(!this.filterRendered){
      this.filter.$el = $('#actions')
      this.filter.render().delegateEvents();
      this.filterRendered = true;
      this.filter.updateKeys()
    }
    this.renderItems();
  },

  renderItems: function(){
    this.$el.find('#itemlist').html('');
    var holder = this.$el.find('#itemlist')
    col = this.filterItems();
    holder.append('<p><span>Showing '+col.length+' documents:</span> <span class="pull-right" style="cursor: pointer; color: #aaa;"><a id="deleteall">Delete listed entries</a> | <a id="deletecol">Delete collection</a></span></p>')
    _.each(col, function(item){
      var view = new App.databrowser.docview({ model: item })
      
      var h = $('<div class="itemholder"></div>');
      holder.append(h);
      view.$el = h;
      view.delegateEvents()
      view.render()
    })

    // also, every time we render items, it's possible that schema has 
    // changed, thus update addnewdoc-placeholder
    $('#addnewdocument [name="data"]').val(this.formatPlaceholder());
  },
  
  deleteAll: function(){
    var collection = this.collection;
    var items = this.filterItems();
    if(confirm('Delete '+items.length+' item(s)?')){
      ids = _.map(items,function(item){ return item.attributes._id; });
      _.each(ids,function(id){
        collection.get(id).destroy({success:function(){
          collection.trigger('change');
        }});
      });
    }  
  },

  deleteCollection: function(){
    if(confirm('Are you absolutely sure you want to delete the entire collection?')){
      this.collection.deleteSelf();
    }
  },

  formatPlaceholder: function(){
    alldata = this.collection.getModelKeys();
    removable = ['_owner','id','_id','_modified','_created']
    coldata = _.difference(alldata, removable);
    if(coldata.length==0){
      return '{\n\n}'
    } else {
      ret = "{\n"
      _.each(coldata,function(key){
        ret += '  "'+key+'": "",\n';
      });
      ret = ret.slice(0,-2); // remove last comma
      ret+="\n}";
      return ret;
    }
  },

  createNewDocument: function(){
    var parent = this;
    form = '#addnewdocument';
    coldata = $(form+' [name="data"]').val();
      
    validator = new App.helpers.formValidator(form);
    rules = [
      {field: 'data', func: App.helpers.isJSON}
    ]

    validator.clearErrors();
    validator.clientValidate(rules);

    if(!validator.hasErrors){
      coldata = JSON.parse(coldata);
      
      this.collection.create(coldata);
      
      $('#addnewdocument').modal('hide');
      $('#addnewdocument').on('hidden',function(){
        $(form+' [name="data"]').val(parent.formatPlaceholder())
      });
    }
  },

  filterItems: function(){
    f = this.filter.filter;
    if(f==false){
      col = this.collection.models;
    } else {
      // TODO: detect correct types for numbers and dates
      col = this.collection.filter(function(item){
        return f['func'](item.attributes[f['key']], f['value']);
      });
    }
    return col;
  },

  events: {
    "click #deleteall": function(){ this.deleteAll(); },
    "submit #addnewdocument form": function(e){
      e.preventDefault(); 
      this.createNewDocument();
    },
    "click #deletecol": function(){ this.deleteCollection(); }
  },

})

App.databrowser.filterview = Backbone.View.extend({
  template: $('#filter-view').html(),
  initialize: function(options){
    this.collection = options.collection;
    this.filter = false;
    this.listenTo(this.collection,'load',this.render);
    this.listenTo(this.collection,'change', this.updateKeys);
  },

  render: function(){
    this.$el.html(_.template(this.template,{
      keys: this.collection.getModelKeys(),
      filters: App.helpers.filterFunctions
    }))
    return this;
  },

  serialize: function(){
    ret = this.$el.find('#filter-key').val();
    f = this.$el.find('#filter-type').val();
    val = this.$el.find('#filter-value').val();
    if(ret=='nofilter'){
      return false;
    } else {
      return {
        'func': App.helpers.filterFunctions[f]['func'],
        'value': val,
        'key':ret
      }
    }
  },

  updateKeys: function(){
    sel = this.$el.find('#filter-key')
    cur = sel.val()
    sel.empty();
    sel.append('<option value="nofilter">No filter</option>');
    _.each(this.collection.getModelKeys(), function(key){
      sel.append('<option value="'+key+'">'+key+'</option>');
    })
    sel.val(cur)

    if(sel.val()=='nofilter'){
      this.changeFilter();
    }

  },

  doFilter: function(){
    this.filter = this.serialize();
    this.trigger('filter');
  },

  changeFilter: function(){
    val = $('#filter-key').val();
    if(val=='nofilter'){
      $('#filterfields').addClass('hidden');
      this.trigger('filter');
    } else {
      $('#filterfields').removeClass('hidden');
    }
  },

  events: {
    "submit form": function(e){
      e.preventDefault();
      this.doFilter();
    },

    "change #filter-key": function(){
      this.changeFilter();
    },
  }
});

App.databrowser.collist = (function(cols){
  var ret = {}
  for(c in cols){
    ret[c] = new App.databrowser.collection();
    ret[c].url = '/backlift/data/'+c
  }
  _.each(ret,function(col){
    col.fetch({success:function(){
      col.trigger('load')
      col.trigger('change')
    }})
  })
  return ret
}(App.adminData.collections));

App.databrowser.renderLayout = function(col){
  var contentView = undefined
  if(col){
    var contentView = App.databrowser.viewGen('content', App.databrowser.colview, {
      collection: App.databrowser.collist[col],
    });
  }

  var navView = App.databrowser.viewGen('nav', App.databrowser.navview, {
    collection: App.databrowser.collist,
  });
  
  var mainView = App.databrowser.viewGen('main', App.databrowser.mainview, {
    nav: navView,
    content: contentView
  });

  mainView.render();

}