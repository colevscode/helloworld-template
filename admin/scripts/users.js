App.users = {}

App.users.model = Backbone.Model.extend({
  idAttribute:'_id',
  isAdmin: function(){
    return this.attributes['_groups'].indexOf('administrators') >= 0;
  }
})

App.users.collection = Backbone.Collection.extend({
  model: App.users.model,
  url: '/backlift/users'
})

App.users.mainview = Backbone.View.extend({
  template: $('#userlist-view').html(),
  el: '#content',

  initialize: function(options){
    this.collection = options.collection;
    this.listenTo(this.collection,'change',this.renderUsers);
    this.filter = false;
  },

  render: function(){
    this.$el.html(_.template(this.template));
    this.renderUsers();
  },

  renderUsers: function(){
    this.$el.find('#userlist').html('');
    cols = this.getFilteredUsers();
    _.each(cols,function(user){
      el = $('<tr class="useritem"></tr>')
      userview = new App.users.singleUserView({
        el: el,
        model: user
      }).render();
      $('#userlist').append(el);
    });
  },

  getFilteredUsers: function(){
    f = this.filter;
    if(f==false){
      col = this.collection.models;
    } else if(f['key']=='isadmin'){
      // isadmin is determined dynamically, so it needs to be another function
      col = this.collection.filter(function(item){
        isadmin = item.isAdmin().toString();
        return f['func'](isadmin, f['value']);
      })
    } else {
      // TODO: detect correct types for numbers and dates
      col = this.collection.filter(function(item){
        return f['func'](item.attributes[f['key']], f['value']);
      });
    }
    return col;
  },

  serializeFilter: function(){

    d = App.helpers.serializeForm('#userfilter');

    if(d['filter-key']=='nofilter'){
      return false;
    } else {
      return {
        'func': App.helpers.filterFunctions[d['filter-type']]['func'],
        'value': d['filter-value'],
        'key': d['filter-key']
      }
    }
  },

  createNewUser: function(){
    $('#createnewuser').button('loading');
    form = '#addnewuser';

    d = App.helpers.serializeForm(form);

    var col = this.collection;

    var validator = new App.helpers.formValidator(form);

      this.collection.create({
          "email": d['email'],
          "username": d['username'],
          "password": d['password']
        }, {
          wait: true,
          success: function(data){
            $('#createnewuser').button('reset');
            validator.clearErrors();
            // update if should be admin
            if(d['isadmin']){
              newuser = col.get(data.attributes['_id']);
              newuser.attributes._groups.push('administrators');
              newuser.save();
            }

            // clear things
            col.trigger('change');
            $('#addnewuser').modal('hide');
          },

          error: function(data, response){
            validator.clearErrors();
            $('#createnewuser').button('reset');
            err = JSON.parse(response.responseText);
            validator.serverValidate(err.form_errors);
        }
      });
  },

  doFilter: function(){
    this.filter = this.serializeFilter();
    this.renderUsers();
  },

  changeFilter: function(){
    val = $('#filter-key').val();
      if(val=='nofilter'){
        $('#filterfields').addClass('hidden');
        this.filter = this.serializeFilter();
        this.renderUsers();
      } else {
        $('#filterfields').removeClass('hidden');
      }
  },

  events: {

    "submit #userfilter": function(e){
      e.preventDefault();
      this.doFilter();
    },

    "change #filter-key": function(){
      this.changeFilter();
    },

    "submit #addnewuser form": function(e){
      e.preventDefault();
      this.createNewUser();
    }
  }

})

App.users.singleUserView = Backbone.View.extend({
  template: $('#useritem-view').html(),
  initialize: function(options){
    this.el = options.el;
    this.model = options.model;
  },

  render: function(){
    this.el.html(_.template(this.template,{user:this.model.attributes, isAdmin:this.model.isAdmin() }));
  },

  deleteUser: function(){
    var u = this;
      if(confirm('Are you sure you want to permanently delete user "'+u.model.attributes.username+'"?')){
        this.model.destroy({
          success: function(){
            $('#edituser-'+u.model.id).modal('hide');
            u.el.fadeOut('fast');
          },
          error: function(data,response){
            alert(response.responseText);
          }
        })
      }
  },

  editUser: function(){
    $('button.toggleedit').button('loading');
    form = '#edituser-'+this.model.id;
    validator = new App.helpers.formValidator(form);

    d = App.helpers.serializeForm(form);

    this.model.attributes.username = d['username'];
    this.model.attributes.email = d['email'];

    if(d['isadmin']){
      this.model.attributes._groups = 
        _.union(this.model.attributes._groups, ['administrators']);
    } else {
      this.model.attributes._groups = 
        _.without(this.model.attributes._groups, 'administrators');
    }

    var item = this;

    this.model.save(this.model.attributes,{

      success:function(data, response){
        $('button.toggleedit').button('reset');
        validator.clearErrors();

        $(form).on('hidden',item.render());
        $(form).modal('hide');

        // for some weird reason modal-backdrop wouldn't hide otherwise
        // TODO: come up with a proper fix
        $('.modal-backdrop').hide();
      },

      error: function(data, response){
        $('button.toggleedit').button('reset');
        validator.clearErrors();

        err = JSON.parse(response.responseText);
        validator.serverValidate(err.form_errors);
      }
    });
  },

  events: {
    "click .del": function(){ this.deleteUser(); },
    "submit .edituser form": function(e){ 
      e.preventDefault();
      this.editUser(); 
    }
  }
});

App.users.data = new App.users.collection(App.appUsers);

App.users.renderLayout = function(){

	new App.users.mainview({
        collection: App.users.data
    }).render();
}