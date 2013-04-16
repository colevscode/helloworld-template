/*
* Initiates the admin app, once all necessary files have been loaded
*/

$(function(){

  App.helpers.checkLogin(function(){
    // not logged in
    window.location = '/admin/login.html?_next=/admin';
  }, function(){

    //logged in, run app
    $('#app-username').text(App.current_user.username);
    $('#app-appname').text(App.adminData._id);

    App.adminData.collections = App.adminData.collections || {}

    new App.router();
    Backbone.history.start({pushState: false, root: 'dashboard'}); 

    $('body').removeClass('hidden');
  });
   
});
