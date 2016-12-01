odoo.define('pos_epson_epos.orderprinter', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var Session = require('web.Session');
    var models = require('point_of_sale.models');
    var _t = core._t;

    var QWeb = core.qweb;
    var mixins = core.mixins;

    var Printer = core.Class.extend(mixins.PropertiesMixin,{
        init: function(parent,options){
            mixins.PropertiesMixin.init.call(this,parent);
            options = options || {};
            var url = options.url || 'http://localhost:8069';
            this.connection = new Session(undefined,url, { use_cors: true});
            this.host       = url;
            this.receipt_queue = [];
        },
        print: function(receipt){
            var self = this;
            if(receipt){
                this.receipt_queue.push(receipt);
            }
            function send_printing_job(){
                if(self.receipt_queue.length > 0){
                    var r = self.receipt_queue.shift();
                    self.connection.rpc('/hw_proxy/print_xml_receipt',{receipt: r},{timeout: 5000})
                        .then(function(){
                            send_printing_job();
                        },function(){
                            self.receipt_queue.unshift(r);
                        });
                }
            }
            send_printing_job();
        },
    });

    models.load_models({
    model: 'restaurant.printer',
    fields: ['name','proxy_ip','product_categories_ids','epos_printer', 'epos_url'],
    domain: null,
    loaded: function(self,printers){
        var active_printers = {};
        for (var i = 0; i < self.config.printer_ids.length; i++) {
            active_printers[self.config.printer_ids[i]] = true;
        }

        self.printers = [];
        self.printers_categories = {}; // list of product categories that belong to
                                       // one or more order printer

        for(var i = 0; i < printers.length; i++){
            if(active_printers[printers[i].id]){
                var printer = new Printer(self,{url:'http://'+printers[i].proxy_ip+':8069'});
                printer.config = printers[i];
                self.printers.push(printer);

                for (var j = 0; j < printer.config.product_categories_ids.length; j++) {
                    self.printers_categories[printer.config.product_categories_ids[j]] = true;
                }
            }
        }
        self.printers_categories = _.keys(self.printers_categories);
        self.config.iface_printers = !!self.printers.length;
    },
    });

    models.Order = models.Order.extend({
        printChanges: function(){
            var printers = this.pos.printers;
            for(var i = 0; i < printers.length; i++){
                var changes = this.computeChanges(printers[i].config.product_categories_ids);
                if ( changes['new'].length > 0 || changes['cancelled'].length > 0){
                    var receipt = QWeb.render('OrderChangeReceipt',{changes:changes, widget:this});
                    if (!printers[i].config.epos_printer) {
                        printers[i].print(receipt);
                    } else {
                        debugger;
                        var self = this;
                        var url = 'http://'+printers[i].config.proxy_ip+printers[i].config.epos_url;
                        var printer = new epson.ePOSPrint(url);
                        var builder = new epson.ePOSBuilder();
                        builder.addTextLang('en');
                        builder.addTextStyle(false, false, true, builder.COLOR_1);
                        builder.addText(this.name+'\n');
                        builder.addText(_t('Floor')+': '+this.table.floor.name+'\n');
                        builder.addText(_t('Table')+': '+this.table.name+'\n');
                        builder.addText(new Array(33).join('-')+'\n\n');
                        if (changes.new.length > 0) {
                            builder.addText('['+_t('New')+']\n');
                            _.each(changes.new, function(l, i, list) {
                                builder.addText('  '+l.qty+' x '+l.name+'\n');
                                if (l.note) {
                                    builder.addText('   '+l.note+'\n');
                                }
                            });
                        }
                        if (changes.cancelled.length > 0) {
                            builder.addText('['+_t('Cancelled')+']\n');
                            _.each(changes.cancelled, function(l, i, list) {
                                builder.addText('  '+l.qty+' x '+l.name+'\n');
                            });
                        }
                        builder.addText('\n\n\n');
                        builder.addFeedPosition(builder.FEED_PEELING);
                        printer.send(builder.toString());
                    }
                }
            }
        },
    });

});
