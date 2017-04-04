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

    print_xreport_epos: function() {
        debugger;
    },

    print_zreport_epos: function() {
        var self = this;
        var ip = this.pos_config.epson_printer_ip;
        var url = 'http://'+ip+this.pos_config.url;
        var builder = new epson.ePOSBuilder();
        var printer = new epson.ePOSPrint(url);

        var paper_type = this.pos_config.paper_width;
        var paper_width = 47; 
        if (paper_type == "54") {
        paper_width = 33;
        }
        
        
        debugger;
        builder.addTextLang('en');
        builder.addTextSmooth(1);
        builder.addFeedPosition(builder.FEED_CURRENT_TOF);
        builder.paper = builder.PAPER_RECEIPT;
        //builder.layout = { width: 580 };
        builder.addTextAlign(builder.ALIGN_CENTER);
        builder.addText('FISCAL Z REPORT');
        builder.addTextAlign(builder.ALIGN_LEFT);
        //CURRENCY
        var currency = this.pos_config.currency;
        var name = ' ';
        var spaces = new Array(paper_width-name.length-currency.length).join(' ');
        builder.addText(name+spaces+currency+'\n');
        // DAILY TOTAL
        var z_daily_total = parseFloat(this.pos_config.z_daily_total).toFixed(2);
        var name = 'DAILY TOTAL';
        var spaces = new Array(paper_width-name.length-z_daily_total.length).join(' ');
        builder.addText(name+spaces+z_daily_total+'\n');
        // GRAND TOTAL
        var z_grand_total = parseFloat(this.pos_config.z_grand_total).toFixed(2);
        var name = 'GRAND TOTAL';
        var spaces = new Array(paper_width-name.length-z_grand_total.length).join(' ');
        builder.addText(name+spaces+z_grand_total+'\n');
        // TOT. DISCOUNTS
        var tot_discounts = parseFloat(0).toFixed(2);
        var name = 'TOT. DISCOUNTS';
        var spaces = new Array(paper_width-name.length-tot_discounts.length).join(' ');
        builder.addText(name+spaces+tot_discounts+'\n');
        // TOT. SURCHARGES
        var tot_surcharges = parseFloat(0).toFixed(2);
        var name = 'TOT. SURCHARGES';
        var spaces = new Array(paper_width-name.length-tot_surcharges.length).join(' ');
        builder.addText(name+spaces+tot_surcharges+'\n');
        // TOT. CANCEL.
        var tot_cancel = parseFloat(0).toFixed(2);
        var name = 'TOT. CANCEL.';
        var spaces = new Array(paper_width-name.length-tot_cancel.length).join(' ');
        builder.addText(name+spaces+tot_cancel+'\n');
        // TOT. RETURNS
        var tot_returns = parseFloat(0).toFixed(2);
        var name = 'TOT. RETURNS';
        var spaces = new Array(paper_width-name.length-tot_returns.length).join(' ');
        builder.addText(name+spaces+tot_returns+'\n');
        // TOT. SEC. DEPOSIT
        var tot_sec_deposit = parseFloat(0).toFixed(2);
        var name = 'TOT. SEC. DEPOSIT';
        var spaces = new Array(paper_width-name.length-tot_sec_deposit.length).join(' ');
        builder.addText(name+spaces+tot_sec_deposit+'\n');
        // CNTERV. N. PAID
        var tot_cntervnpaid = parseFloat(0).toFixed(2);
        var name = 'CNTERV. N. PAID';
        var spaces = new Array(paper_width-name.length-tot_cntervnpaid.length).join(' ');
        builder.addText(name+spaces+tot_cntervnpaid+'\n');
        // FISCAL TICKETS NR.
        var tot_fiscalticketsnr = parseFloat(0).toFixed(2);
        var name = 'FISCAL TICKETS NR.';
        var spaces = new Array(paper_width-name.length-tot_fiscalticketsnr.length).join(' ');
        builder.addText(name+spaces+tot_fiscalticketsnr+'\n');
        // FISCAL MEM. PRINTS NR.
        var tot_fiscalmemprintsnr = parseFloat(0).toFixed(2);
        var name = 'FISCAL MEM. PRINTS NR.';
        var spaces = new Array(paper_width-name.length-tot_fiscalmemprintsnr.length).join(' ');
        builder.addText(name+spaces+tot_fiscalmemprintsnr+'\n');
        // NOT FISCAL TICKETS NR.
        var tot_notfiscalticketsnr = parseFloat(0).toFixed(2);
        var name = 'NOT FISCAL TICKETS NR.';
        var spaces = new Array(paper_width-name.length-tot_notfiscalticketsnr.length).join(' ');
        builder.addText(name+spaces+tot_notfiscalticketsnr+'\n');
        // CREDIT NOTE NR.
        var tot_creditnotenr = parseFloat(0).toFixed(2);
        var name = 'CREDIT NOTE NR.';
        var spaces = new Array(paper_width-name.length-tot_creditnotenr.length).join(' ');
        builder.addText(name+spaces+tot_creditnotenr+'\n');
        // CRED.NOTE DAILY
        var tot_crednotedaily = parseFloat(0).toFixed(2);
        var name = 'CRED.NOTE DAILY';
        var spaces = new Array(paper_width-name.length-tot_crednotedaily.length).join(' ');
        builder.addText(name+spaces+tot_crednotedaily+'\n');
        // CRED.NOTE PROGR
        var tot_crednoteprogr = parseFloat(0).toFixed(2);
        var name = 'CRED.NOTE PROGR';
        var spaces = new Array(paper_width-name.length-tot_crednoteprogr.length).join(' ');
        builder.addText(name+spaces+tot_crednoteprogr+'\n');
        // CLASS 2 DOCS NR.
        var tot_class2docsnr = parseFloat(0).toFixed(2);
        var name = 'CLASS 2 DOCS NR.';
        var spaces = new Array(paper_width-name.length-tot_class2docsnr.length).join(' ');
        builder.addText(name+spaces+tot_class2docsnr+'\n');
        // TOT. CL. 2 DOCS
        var tot_totcl2docs = parseFloat(0).toFixed(2);
        var name = 'TOT. CL. 2 DOCS';
        var spaces = new Array(paper_width-name.length-tot_totcl2docs.length).join(' ');
        builder.addText(name+spaces+tot_totcl2docs+'\n');
        // FISCAL ZEROINGS NR.
        var tot_fiscalzeroingsnr = parseFloat(0).toFixed(2);
        var name = 'TOT. CL. 2 DOCS';
        var spaces = new Array(paper_width-name.length-tot_fiscalzeroingsnr.length).join(' ');
        builder.addText(name+spaces+tot_fiscalzeroingsnr+'\n');
        // HARDWARE INIT. NR.
        var tot_hardwareinitnr = parseFloat(0).toFixed(2);
        var name = 'HARDWARE INIT. NR.';
        var spaces = new Array(paper_width-name.length-tot_hardwareinitnr.length).join(' ');
        builder.addText(name+spaces+tot_hardwareinitnr+'\n');
        // FISCAL CHECKSUM
        var tot_fiscalchecksum = parseFloat(0).toFixed(2);
        var name = 'FISCAL CHECKSUM';
        var spaces = new Array(paper_width-name.length-tot_fiscalchecksum.length).join(' ');
        builder.addText(name+spaces+tot_fiscalchecksum+'\n');
        builder.addText('\n\n');
        builder.addText('NOT FISCAL INFO\n');



        builder.addCut(builder.CUT_FEED);
        return printer.send(builder.toString());
    },

    on_confirmed: function() {
        var self = this;
        if (self.node.attrs.pos_print) {
            var action = self.node.attrs.print_action;
            self.load_pos_config().then(function(){
                // pos_utils.send(
                //     self.pos_config,
                //     action,
                //     self.get_xml_for_action(action)
                // ).then(function(){
                //     self.handle_post_action(action);
                // })
                self.get_xml_for_action(action);
                //self.handle_post_action(action);
                //})
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
        var self = this;

        if (action == 'printZReportEPOS') {
            return self.print_zreport_epos();
        }

        if (action == 'printXReportEPOS') {
            return self.print_zreport_epos();
        }

        return {
            'printZReportFP': z_xml,
            'printXReportFP': x_xml,
        }[action]
    },
    handle_post_action: function(action) {
        var self = this;
        if (action == 'printZReportFP' || action == 'printZReportEPOS') {
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
