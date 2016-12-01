# -*- coding: utf-8 -*-

"""
Script for testing Epson printer connection.

Run:

    # python test_printer.py $PRINTER_IP
"""

# TEST MESSAGES
FISCALRECEIPT = """
<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
<s:Body>
    <printerFiscalReceipt>
        <beginFiscalReceipt operator="1" />
        <Printer Num="1" />
        <printRecItem Text="Aggiunta panna TEST" Qty="1" UnitCost="0,01" Dep="1" Just="1" Ope="1" />
        <printRecMessage Ope="1" Text="ARRIVEDERCI E GRAZIE" Type="3" Index="1" Font="1" />
        <printRecTotal Ope="1" Text="Contanti " Amount="0,01" Type="0" Index="0" Just="2" />
        <displayText Ope="1" Text="Arrivederci e Grazie" />
        <endFiscalReceipt operator="1" />
    </printerFiscalReceipt>
</s:Body>
</s:Envelope>
"""

XREPORT = """
<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
<s:Body>
    <printerFiscalReport>
        <displayText operator="1" data="Rapporto finanziario TEST" />
        <printXReport operator="1" />
    </printerFiscalReport>
</s:Body>
</s:Envelope>
"""

ZREPORT = """
<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
<s:Body>
    <printerFiscalReport>
        <displayText operator="1" data="Chiusura fiscale TEST" />
        <printZReport operator="1" />
    </printerFiscalReport>
</s:Body>
</s:Envelope>
"""

COMMANDS = {
    'fiscalreceipt': FISCALRECEIPT,
    'xreport': XREPORT,
    'zreport': ZREPORT
}


if __name__ == '__main__':
    import sys
    # make sure we can make relative imports
    from os import path
    sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

    from printer import EpsonPrinter

    printer_address = sys.argv[1]
    printer = EpsonPrinter(printer_address)
    print printer.status()
    print printer.print_status()

    try:
        msg_key = sys.argv[2]
        print printer.send_plain(COMMANDS[msg_key])
    except:
        pass
