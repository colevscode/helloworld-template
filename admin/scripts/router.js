// router

App.router = Backbone.Router.extend({
    routes: {
        "": "rootHandler",
        "dashboard": "dashboardHandler",
        "databrowser": "databrowserHandler",
        "databrowser/:col": "databrowserColHandler",
        "users": "usersHandler",
        "users/:user": "usersUserHandler",
        "history": "historyHandler",
        "errors": "errorsHandler"
    },

    rootHandler: function() {
        var self = this;
        self.navigate("dashboard", {trigger: true, replace: true});
    },

    dashboardHandler: function(){
      App.helpers.toggleNav('#nav-dashboard');
      App.dashboard.renderLayout(); 
    },

    databrowserHandler: function(){
      App.helpers.toggleNav('#nav-databrowser');
      App.databrowser.renderLayout();
    },

    databrowserColHandler: function(col){
      App.helpers.toggleNav('#nav-databrowser');
      App.databrowser.renderLayout(col);
    },

    historyHandler: function(params){
      App.helpers.toggleNav('#nav-history');
      App.history.renderLayout();
    },

    usersHandler: function(){
      App.helpers.toggleNav("#nav-users");
      App.users.renderLayout();
    }

});