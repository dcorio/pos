=========================
Epson printer integration
=========================

This module allows using Epson fiscal printers from within Odoo POS.

********
Features
********

POS frontend:

* update summary of current bill on the printer
* print receipt with printer
* possibility to write xml files for receipts to FS

POS backend:

* buttons to print ZReport ("Chiusura fiscale") and XReport ("Stampa rapporto finanziario")

.. warning::
   ZReport button is visible only to users in the group `Chiusura Fiscale (ZReport)`

*************
Configuration
*************

Ogni postazione POS (`pos.config`) deve avere questi parametri.

Per la stampa:

* `Indirizzo IP`: "http(s)://localhost"
* `Scontrino XML Epson FP`: enabled
* `Epson receipt action`: "Print it"
* `Epson printer IP`: ip della stampante nella rete del PC locale

Per la scrittura su FS

* `Indirizzo IP`: "http(s)://localhost"
* `Scontrino XML Epson FP`: enabled
* `Epson receipt action`: "Store to FS"
* `Cartella Epson XML`: path assoluto del PC locale nel quale salvare gli XML

=================
Technical details
=================

**********
Javascript
**********

* `/static/src/js/pos_epson_epos.js` hooks into POS widget to:

    - proxy calls to the printer via `proxy_ip` field on pos.config (usually localhost)
    - create xml to send to the printer

* `/static/src/js/form_button_widget.js` overrides button widget to allow defining specific buttons for printing Z/Xreport


***********
Controllers
***********

Defined in `controllers/main.py`:

* `/pos_epson_epos/<string:action>`

Receives POS calls and send xml to the printer or write it into FS (path defined by `epson_xml_path`)

* `/pos_epson_epos/zreport_update/<int:company_id>`

Called by the button for ZReport to set the last ZReport date on the company.
You should not be able to print more than one ZReport per day.


****************
Epson connection
****************

`controllers.printer.EpsonPrinter` is responsible for sending/receiving data to/from the printer.

To test the connection you can do::

    # cd path/to/pos_epson_epos/controllers
    # python test_printer.py $PRINTER_IP

If the printer is connected then you will see the output of its status.


*****
Debug
*****

Attivare l'inspector di Chrome e controllare che:

1. controllare che non ci siano errori JS in generale
2. quando si aggiunge qualcosa al conto si veda nel log `POS: call update_summary`
3. nel log delle chiamate XHR compaia la relativa chiamata a `http://{ip proxy o doman}/pos_epson_epos/update_summary`
4. la response di tale chiamata deve contenere un dizionario con chiave `@success: true` con relativa serie di metadati

Fatti i precedenti controlli, per verificare la stampa:

1. andare a schermata di stampa
2. nel log delle chiamate XHR compaia la relativa chiamata a `http://{ip proxy o doman}/pos_epson_epos/print_receipt`
3. la response di tale chiamata deve contenere un dizionario con chiave `@success: true` con relativa serie di metadati


**********
Epson Docs
**********

Official Epson docs is "ePOS Fiscal Print Solution Development Guide (for Europe)"

available here https://download.epson-biz.com/modules/pos/index.php?page=doc&dcat=26

The version used to develop this module as of v1 is attached in this module as `ePOS_Fiscal_Print_Solution_Development_Guide_Rev_O.pdf`.


=======
Roadmap
=======

TODO
