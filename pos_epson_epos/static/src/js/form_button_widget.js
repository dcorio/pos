odoo.define('pos_epson_epos.pos_button_widget', function (require) {
"use strict";

var core = require('web.core');
var Model = require('web.Model');

// var framework = require('web.framework');
// var session = require('web.session');
// var utils = require('web.utils');
// var dom_utils = require('web.dom_utils');


var web_form_widgets = require('web.form_widgets');
var pos_utils = require('pos_epson_epos.utils');

var _t = core._t;
var QWeb = core.qweb;

var z_xml = '<printerFiscalReport>';
    z_xml += '<displayText operator="1" data="Chiusura fiscale" />';
    z_xml += '<printZReport operator="1" />';
    z_xml += '</printerFiscalReport>';

var x_xml = '<printerFiscalReport>';
    x_xml += '<displayText operator="1" data="Rapporto finanziario" />';
    x_xml += '<printXReport operator="" />';
    x_xml += '</printerFiscalReport>';


/*
We tried to create and use a brand new widget but it was not working.
Hence, this is the solution: we override the std button widget

If you provide a `pos_print` attribute to your button then the button
is used to print via Epson printer

es:

    <button name="print_x" type="button" string="Stampa rapporto finanziario"
                  pos_print="1" print_action="printXReport"
                  class="oe_highlight" icon="gtk-print"
                  />
*/

var POSWidgetButton = web_form_widgets.WidgetButton.include({

    on_confirmed: function() {
        var self = this;
        if (self.node.attrs.pos_print) {
            var action = self.node.attrs.print_action;
            self.load_pos_config().then(function(){
                pos_utils.send(
                    self.pos_config,
                    action,
                    self.get_xml_for_action(action)
                ).then(function(){
                    self.handle_post_action(action);
                })
            })
        } else {
            self._super.apply(self, arguments);
        }
    },
    load_pos_config: function () {
        var self = this;
        self.pos_config = false;
        var def = $.Deferred();
        var fields = self.fields_to_fetch;
        var model = new Model('pos.config').call(
            'read',
            [[self.view.datarecord.config_id[0]],
            [], self.view.dataset.context]
        ).then(function (data) {
            if (data.length) {
                self.pos_config = data[0];
                def.resolve();
            } else {
                def.resolve(null);
            }
        }).fail(function () {
            def.reject();
        });
        return def;
    },
    get_xml_for_action: function (action) {
        return {
            'printZReport': z_xml,
            'printXReport': x_xml,
        }[action]
    },
    handle_post_action: function(action) {
        var self = this;
        if (action == 'printZReport') {
            /*
                We must update last print date to prevent
                printing more than one the fiscal closure.
            */
            $.ajax({
                url: '/pos_epson_epos/zreport_update/' + self.pos_config.company_id[0],
                type: 'POST',
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    /* alert("Inviata con successo alla stampante"); */
                    console.log('ZReport update result:', data);
                    if (data.success) {
                        self.$el.fadeOut();
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert("Impossibile inviare:\n" + xhr.responseText);
                }
            })
        }
    }
});


return {
    POSWidgetButton: POSWidgetButton
};

});
