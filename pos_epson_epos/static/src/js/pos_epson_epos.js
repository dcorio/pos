odoo.define('pos_epson_epos.pos_epson_epos', function (require) {
    "use strict";

    var chrome = require('point_of_sale.chrome');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var core = require('web.core');
    var _t = core._t;
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var pos_utils = require('pos_epson_epos.utils');
    var send = pos_utils.send;

    var updateDisplay = function(text, op) {
        var xml = '<printerCommand>';
        xml += '<displayText Ope="'+ op +'" Text="Totale: '+ text +'" />';
        xml += '</printerCommand>';
        return xml;
    };

    models.load_fields("pos.config",['receipt_header','receipt_footer'])

    screens.OrderWidget.include({
        update_summary: function(){
            var order = this.pos.get_order();
            if (!order.get_orderlines().length) {
                return;
            }
            var total = order ? order.get_total_with_tax() : 0;
            var taxes = order ? total - order.get_total_without_tax() : 0;

            this.el.querySelector('.summary .total > .value').textContent = this.format_currency(total);
            this.el.querySelector('.summary .total .subentry .value').textContent = this.format_currency(taxes);

            var xml = updateDisplay(this.format_currency_no_symbol(total).replace('.',','), 1);
            console.log('POS: call update_summary');
            var fiscalPrinter = new epson.fiscalPrint();
            var ip = this.pos.config.epson_printer_ip;
            var url = this.pos.config.url;
            fiscalPrinter.send('http://'+ip+url, xml);
        },

    });

    /*
     ReceiptScreenWidget extension:
        it uses the print_web hook to save the xml file if the create_epson_xml
        flag is set on the POS configuration
    */
    screens.ReceiptScreenWidget.include({

        print_web: function() {
            if (!this.pos.config.create_epson_xml) {
                this._super();
            } else {
                var order = this.pos.get_order()
                if(order.orderlines.length > 0){
                    var receipt = order.export_for_printing();
                    var ip = this.pos.config.epson_printer_ip;
                    var url = 'http://'+ip+this.pos.config.url;
                    if (this.pos.config.protocol == 'epsonfp') {
                        var printer = new epson.fiscalPrint();
                        var xml = this.printFiscalReceipt(receipt);
                        console.log('ePOS FP: call print_receipt');
                        printer.send(url, xml);
                    } else {
                        var printer = new epson.ePOSPrint(url);
                        var xml = this.printReceipt(receipt);
                        console.log('ePOS-Print: call print_receipt');
                        printer.send(xml);
                    }
                } else {
                    alert('Ordine vuoto!');
                }
            }
        },

        printRecItem: function(args) {
            var tag = '<printRecItem'
                + ' Text="' + (args.description || '') + '"'
                + ' Qty="' + (args.quantity.toString().replace('.',',') || '1') + '"'
                + ' UnitCost="' + (args.unitPrice.toString().replace('.',',') || '') + '"'
                + ' Dep="' + (args.department || '1') + '"'
                + ' Just="' + (args.justification || '1') + '"'
                + ' Ope="' + (args.operator || '1') + '"'
                + ' />';
            return tag;
        },

        /*
          Adds a discount to the last line.
        */
        printRecItemAdjustment: function(args) {
            var tag = '<printRecItemAdjustment'
                + ' Ope="' + (args.operator || '1') + '"'
                + ' Type="' + (args.adjustmentType || 0) + '"'
                + ' Text="' + (args.description || '' ) + '"'
                + ' Amount="' + (args.amount.toString().replace('.',',') || '') + '"'
                // + ' department="' + (args.department || '') + '"'
                + ' Just="' + (args.justification || '2') + '"'
                + ' />';
            return tag;
        },

        /*
          Prints a payment.
        */
        printRecTotal: function(args) {
            var tag = '<printRecMessage Ope="1" Text="ARRIVEDERCI E GRAZIE" Type="3" Index="1" Font="1" />';
            tag += '<printRecTotal'
                + ' Ope="' + (args.operator || '1') + '"'
                + ' Text="' + (args.description || 'Pagamento') + '"'
                + ' Amount="' + (args.payment.toString().replace('.',',') || '') + '"'
                + ' Type="' + (args.paymentType || '0') + '"'
                + ' Index="0"'
                + ' Just="2"'
                + ' />';
            return tag;
        },

        /*
          Prints a receipt
        */
        printFiscalReceipt: function(receipt) {
            var self = this;
            var xml = '';
            xml += '<printerFiscalReceipt><Printer Num="1" />'
            xml += '<beginFiscalReceipt operator="1" />';
            _.each(receipt.orderlines, function(l, i, list) {
                xml += self.printRecItem({
                    description: l.product_name,
                    quantity: l.quantity,
                    unitPrice: l.price,
                    operator: l.operator,
                });
                if (l.discount) {
                    xml += self.printRecItemAdjustment({
                        adjustmentType: 0,
                        description: 'Sconto ' + l.discount + '%',
                        amount: l.quantity * l.price - l.price_display,
                    });
                }
            });
            _.each(receipt.paymentlines, function(l, i, list) {
                xml += self.printRecTotal({
                    payment: l.amount,
                    paymentType: l.type,
                    description: l.journal.split('(')[0],
                });
            });
            xml += '<displayText Ope="1" Text="Arrivederci e Grazie" />';
            xml += '<endFiscalReceipt operator="1" />';
            xml += '</printerFiscalReceipt>';
            return xml;
        },

        printReceiptHeader: function(builder, receipt) {
            var self = this;
            var c = this.pos.company;
            builder.addTextAlign(builder.ALIGN_CENTER);
            builder.addTextStyle(false, false, true, builder.COLOR_1);
            builder.addTextDouble(true, true);
            builder.addText(c.name+'\n');
            builder.addTextStyle(false, false, false, builder.COLOR_1);
            builder.addTextDouble(false, false);
            if (c.pos_receipt_footer_1 != undefined) {
                builder.addText(c.pos_receipt_header_1+'\n');
            }
            if (c.pos_receipt_footer_2 != undefined) {
                builder.addText(c.pos_receipt_header_2+'\n');
            }
            builder.addTextAlign(builder.ALIGN_LEFT);
            builder.addText('\n\n');
            return builder;
        },

        printReceiptLine: function(builder, line) {
            var self = this;
            var c = this.pos.company;
            if (line.quantity > 1) {
                builder.addText('  '+line.quantity+' x '+this.format_currency_no_symbol(line.price)+'\n');
            }
            var name = line.product_name;
            if (line.discount > 0) {
                var price = this.format_currency_no_symbol(line.price*line.quantity);
                var spaces = new Array(33-name.length-price.length).join(' ');
                builder.addText(name+spaces+price+'\n');
                var disc_label = '  '+_t('Discount')+' '+line.discount+'%';
                var disc_amount = this.format_currency_no_symbol((line.price_with_tax-(line.price*line.quantity)));
                var spaces = new Array(33-disc_label.length-disc_amount.length).join(' ');
                builder.addText(disc_label+spaces+disc_amount+'\n');
            }
            else {
                var price = this.format_currency_no_symbol(line.price_with_tax);
                var spaces = new Array(33-name.length-price.length).join(' ');
                builder.addText(name+spaces+price+'\n');
            }            
            return builder
        },

        printReceiptFooter: function(builder, receipt) {
            var self = this;
            var c = this.pos.company;
            builder.addTextAlign(builder.ALIGN_CENTER);
            if (c.pos_receipt_footer_1 != undefined) {
                builder.addText(c.pos_receipt_footer_1+'\n');
            }
            if (c.pos_receipt_footer_2 != undefined) {
                builder.addText(c.pos_receipt_footer_2+'\n');
            }
            builder.addTextAlign(builder.ALIGN_LEFT);
            builder.addText('\n\n');
            return builder;
        },

        printReceiptTotal: function(builder, receipt) {
            var self = this;
            var c = this.pos.company;
            var total_label = _('Total')+' '+receipt.currency.symbol+':';
            var total_amount = this.format_currency_no_symbol(receipt.total_with_tax);
            var spaces = new Array(33-total_label.length-total_amount.length).join(' ');
            builder.addText('\n');
            builder.addTextStyle(false, false, true, builder.COLOR_1);
            builder.addText(total_label+spaces+total_amount+'\n');
            builder.addTextStyle(false, false, false, builder.COLOR_1);
            return builder;
        },
        printReceiptChange: function(builder, receipt) {
            var self = this;
            var c = this.pos.company;
            var change_label = _t('Change:');
            var change_amount = this.format_currency_no_symbol(receipt.change);
            var spaces = new Array(33-change_label.length-change_amount.length).join(' ');
            builder.addText(change_label+spaces+change_amount+'\n');
            return builder;
        },

        printPaymentLine: function(builder, line) {
            var self = this;
            var c = this.pos.company;
            var journal = '  '+line.journal+':';
            var amount = this.format_currency_no_symbol(line.amount);
            var spaces = new Array(33-line.journal.length-amount.length).join(' ');
            builder.addText(line.journal+spaces+amount+'\n');
            return builder
        },


        printReceipt: function(receipt) {
            var self = this;
            var builder = new epson.ePOSBuilder();

            // 'en' == alphanumeric
            builder.addTextLang('en');
            builder.addTextSmooth(1);
            builder.addFeedPosition(builder.FEED_CURRENT_TOF);
            builder.paper = builder.PAPER_RECEIPT;
            builder.layout = { width: 580 };
            builder = self.printReceiptHeader(builder, receipt);
            _.each(receipt.orderlines, function(l, i, list) {
                self.printReceiptLine(builder, l);
            });
            builder = self.printReceiptTotal(builder, receipt);
            _.each(receipt.paymentlines, function(l, i, list) {
                self.printPaymentLine(builder, l);
            });
            builder = self.printReceiptChange(builder, receipt);
            builder.addText('\n');
            builder.addText(receipt.date.localestring+'\n');
            builder.addText(receipt.name+'\n');
            builder.addText('\n');
            builder = self.printReceiptFooter(builder, receipt);
            //builder.addCut(builder.CUT_FEED);
            return builder.toString();
        },

    });

    models.load_fields("res.users",['pos_operator_id'])
    models.Orderline = models.Orderline.extend({
        export_for_printing: function(){
            return {
                quantity:           this.get_quantity(),
                unit_name:          this.get_unit().name,
                price:              this.get_unit_display_price(),
                discount:           this.get_discount(),
                product_name:       this.get_product().display_name,
                price_display :     this.get_display_price(),
                price_with_tax :    this.get_price_with_tax(),
                price_without_tax:  this.get_price_without_tax(),
                tax:                this.get_tax(),
                product_description:      this.get_product().description,
                product_description_sale: this.get_product().description_sale,
                operator:           this.get_operator().pos_operator_id,
            };
        },
        get_operator: function(){
            return this.pos.user
        },
    });


});
