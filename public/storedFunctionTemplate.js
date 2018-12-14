(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['storedFunction'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p class=\"stored-function\" data-equation=\""
    + alias4(((helper = (helper = helpers.func || (depth0 != null ? depth0.func : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"func","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.func || (depth0 != null ? depth0.func : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"func","hash":{},"data":data}) : helper)))
    + "</p>";
},"useData":true});
})();