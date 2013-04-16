/*
* Handles views and collections for dashboard-view.
* 
* Basically, dashboard shows snapshot of app, containing recent 
* request-history, build errors, files and some misc data
*
* Template is in index.html and navigation in routes.js
*
*/

App.dashboard = {}

App.dashboard.mainView = Backbone.View.extend({
  collection: App.adminData,
    render: function(){
    $('#content').html(_.template($('#dashboard-template').html(),{model:this.collection}));
  }
});

App.dashboard.renderLayout = function(){
  var view = new App.dashboard.mainView();
  view.render();
}