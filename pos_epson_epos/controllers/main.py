# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.
import datetime
import os
import random
import json
from werkzeug.exceptions import BadRequest

from openerp.http import Controller, route, request
from openerp import fields
from openerp import exceptions

# from .printer import PrinterJobRunner
from .printer import EpsonPrinter


def get_file_name():
    """Return random xml file name."""
    # TODO Just a base implementation
    now = datetime.datetime.now()
    date_part = now.strftime('%Y%m%d%H%M%S')
    random_part = ''.join(random.choice('0123456789abcdef') for i in range(8))
    return 'Sco_{}_{}.xml'.format(date_part, random_part)


def get_default_path():
    """Return default path for storing XML files."""
    current_path = os.path.dirname(os.path.abspath(__file__))
    base = os.path.split(current_path)[0]
    path = os.path.join(base, 'xml')
    return path


# Init priter thread
# eposprint_thread = EposPrinter()
# eposprint_thread.push_task('printstatus')

class Proxy(Controller):
    """Proxy for POS ajax calls."""

    @route(
        '/pos_epson_epos/<string:action>',
        type='http',
        auth='none',
        cors='*',
        csrf=False)
    def handle_xml(self, action=None, **post):
        """Handle EPSON XML data.

        @param `pos_config`: the current POS config object
        @param `action`: what to do (NOT used right now)
        @param `post`: contain ajax request post data
        """
        # make sure we have proper rights here
        try:
            xml_data = post['xml_data']
        except KeyError:
            raise BadRequest('`xml_data` value missing!')

        if isinstance(xml_data, unicode):
            xml_data = xml_data.encode('utf-8')
        if post.get('receipt_action') == 'storefs':
            # write xml to fs path
            result = self.write_to_fs(xml_data,
                                      post['epson_xml_path'])
        else:
            # GO print!
            # XXX: ATM we do not care about the `action` since
            # we are producing final xml data on client side via JS.
            # So basically here we send the plain xml to the printer.

            # TODO: use thread with task queue
            # eposprint_thread.push_task('xml_receipt', xml_invoice)
            printer = EpsonPrinter(post['epson_printer_ip'])
            feedback = printer.send_plain(xml_data)
            result = {
                'success': True,
                'result': feedback,
            }
        return request.make_response(json.dumps(result))

    def write_to_fs(self, xml_data, path):
        """Write given `xml_data` to `path`."""
        if not os.path.isdir(path):
            error = """
                Bad Configuration: path '%s' does not exist!
                Check your POS configuration.
            """ % path
            return {
                'error': error,
                'success': False,
            }
        file_name = get_file_name()
        full_path = os.path.join(path, file_name)
        # JS XML comes without xml header
        header = '<?xml version="1.0" encoding="utf-8"?>\n'
        if not xml_data.strip().startswith('<?xml'):
            xml_data = header + xml_data
        with open(full_path, 'w') as fileob:
            fileob.write(xml_data)
        return {'success': True, 'result': 'ok'}

    @route(
        '/pos_epson_epos/zreport_update/<int:company_id>',
        type='http',
        auth='none',
        cors='*',
        csrf=False)
    def zreport_update_date(self, company_id=None):
        """Update last ZReport print date on the company."""
        company_model = request.env['res.company']
        if company_id:
            comp = company_model.sudo().browse(company_id)
            comp.write({
                'pos_zreport_print_date': fields.Date.today()
            })
            result = {'success': True, 'result': 'ok'}
        else:
            result = {'success': False, 'result': 'No company provided'}
        return request.make_response(json.dumps(result))
