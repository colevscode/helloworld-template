App.history = {}

App.history.view = Backbone.View.extend({
  el: '#content',
  template: $('#history-view').html(),
  initialize: function(options){
    this.collection = options.collection;
  },

  render: function(){
    this.$el.html(_.template(this.template));
    this.renderItems();
  },

  renderItems: function(){
    h = parseInt($('#history-timerange').val());
    items = this.getHistory(this.collection.toJSON(), this.getMinDate(h));

    tableview = _.template($('#history-tableview').html(), {params: items});
    this.$el.find('#tableview').html(tableview);

  },

  events: {
    "submit #history-filter": function(e){
      e.preventDefault();
      this.renderItems();
    }
  },

  getMinDate: function(h){
    if(h===0){
      return false;
    }
    now = new Date();
    d = new Date(Date.UTC(
      now.getFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours()-h,
      now.getUTCMinutes()))
    return d;
  },

  parseDateFromHistory: function(c){
    datestring = c.split(' ').slice(0,3);
    date = datestring[0].split('/');
    time = datestring[1].split(':');
    y = parseInt("20"+date[2]);
    m = parseInt(date[1])-1; // months = 0-11
    d = parseInt(date[0]);
    h = parseInt(time[0]);
    mi = parseInt(time[1]);

    return new Date(Date.UTC(y,m,d,h,mi));
  },

  getHistory: function(col, mindt){
    items = _.map(col, function(c){ return Object.keys(c)[0] })

    if(!mindt){
      return items;
    }
    var parent = this;

    items = _.filter(items,function(c){
      date = parent.parseDateFromHistory(c);
      return date>mindt;
    });
    return items;
  }
})

App.history.renderLayout = function(){
  var view = new App.history.view({
    collection: new Backbone.Collection(App.adminData._history)
  }).render();
}