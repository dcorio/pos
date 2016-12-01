# -*- coding: utf-8 -*-
import logging
import time
import httplib


from threading import Thread, Lock
from Queue import Queue

import xmltodict

_logger = logging.getLogger(__name__)

# workaround https://bugs.launchpad.net/openobject-server/+bug/947231
# related to http://bugs.python.org/issue7980
# from datetime import datetime
# datetime.strptime('2012-01-01', '%Y-%m-%d')


SM_TEMPLATE = """<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
<s:Body>
%s
</s:Body>
</s:Envelope>
"""

DEFAULT_ADDRESS = 'localhost:8000'

# test requests
# https://gist.github.com/huyng/814831


class EpsonPrinter(object):
    """Epson printer connector."""

    def __init__(self, address):
        self.address = address

    def _get(self, SoapMessage):
        webservice = httplib.HTTP(self.address)
        webservice.putrequest("POST", "/cgi-bin/fpmate.cgi?devid=local_printer&timeout=10000")
        webservice.putheader("Host", self.address)
        webservice.putheader("User-Agent", "Python post")
        webservice.putheader("Content-type", "text/xml; charset=utf-8")
        webservice.putheader("Content-length", "%d" % len(SoapMessage))
        webservice.putheader("SOAPAction", "\"\"")
        webservice.endheaders()
        webservice.send(SoapMessage)
        # get the response
        statuscode, statusmessage, header = webservice.getreply()
        _logger.info("Response: %s, %s" % (statuscode, statusmessage))
        _logger.info("headers: %s" % (header))
        ret = xmltodict.parse(webservice.getfile().read())
        if not ret.get('soapenv:Envelope'):
            # something wrong here, we are not talking
            # to printer' webservices
            print ret['html']['body']['h1']
            return ret['html']['body']['h1']
        return ret['soapenv:Envelope']['soapenv:Body']['response']

    def status(self):
        msg = """
        <printerCommand>
        <queryPrinterStatus operator="1" />
        </printerCommand>
        """
        return self._get(SM_TEMPLATE % msg)

    def send_plain(self, xml_data):
        return self._get(SM_TEMPLATE % xml_data)

    def _printNormal(self, txt, op='1', font='1'):
        return (
            '<printNormal operator="{}" '
            'font="{}" data="{}" />'
        ).format(op, font, txt)

    def printerNonFiscal(self, txt):
        msg = """
        <printerNonFiscal>
            <beginNonFiscal operator="1" />
            {}
            <endNonFiscal operator="1" />
        </printerNonFiscal>
        """.format(txt)
        return self._get(SM_TEMPLATE % msg)

    def print_status(self):
        txt = self._printNormal('\nODOO:\n{}\n'.format('TEST'))
        txt = self._printNormal('\nFiscal Printer:\n{}\n'.format(self.address))
        return self.printerNonFiscal(txt)


class PrinterJobRunner(Thread):
    """Thread item to handle printer task queue."""

    def __init__(self):
        Thread.__init__(self)
        self.queue = Queue()
        self.lock = Lock()
        self.status = {'status': 'connecting', 'messages': []}

    def push_task(self, task, data=None):
        """Add task to job queue."""
        self.lockedstart()
        self.queue.put((time.time(), task, data))

    def lockedstart(self):
        """Handle thread lock."""
        with self.lock:
            if not self.isAlive():
                self.daemon = True
                self.start()

    def set_status(self, status, message=None):
        """Set job runner status."""
        if status == self.status['status']:
            if message is not None and message != self.status['messages'][-1]:
                self.status['messages'].append(message)
        else:
            self.status['status'] = status
            if message:
                self.status['messages'] = [message]
            else:
                self.status['messages'] = []

        if status == 'error' and message:
            _logger.error('Epos Print Error: ' + message)
        elif status == 'disconnected' and message:
            _logger.info('Disconnected Epos Print: %s', message)

    def get_status(self):
        """Return thread status."""
        self.lockedstart()
        return self.status

    def get_device(self, address=None):
        """Retrieve device."""
        address = address or DEFAULT_ADDRESS
        devobj = EpsonPrinter(address)
        _logger.info(devobj.status())
        device_status = devobj.status()
        if device_status['@success'] == 'true':
            device_cpu = device_status['addInfo']['cpuRel']
            msg = 'Connected to cpuRel {} @ {}'.format(device_cpu, address)
            self.set_status('connected', msg)
        return devobj

    def run(self):
        """Execute the job."""
        device = None

        while True:  # barcodes loop
            if not device:
                time.sleep(5)   # wait until a suitable device is plugged
                printer = self.get_device()
                if not printer:
                    continue
            try:
                timestamp, task, data = self.queue.get(True)
                if task == 'printstatus':
                    printer.print_status()
                elif timestamp >= time.time() - 1 * 60 * 60:
                    handler = getattr(device, task, device.send_plain)
                    handler(data)
            except Exception as err:
                self.set_status('error', str(err))
