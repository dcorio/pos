# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.

import os
from openerp import models, fields, api


RECEIPT_ACTION_OPTIONS = [
    ('storefs', 'Store to FS'),
    ('printit', 'Print it'),
]
EPSON_PROTOCOL = [
    ('epsonfp', 'Epson FP'),
    ('eposprint', 'ePOS-Print'),
]


class PosConfig(models.Model):
    _inherit = "pos.config"

    @api.multi
    def _get_z_daily_total(self):
        amount = 0
        for pos in self:
            for session in self.session_ids:
                if session.state == 'closed':
                    start_at = fields.Date.from_string(session.start_at[:10])
                    today = fields.Date.from_string(
                        fields.Date.context_today(self))
                    if today == start_at:
                        for statement in session.statement_ids:
                            amount += statement.balance_end
            pos.z_daily_total = amount

    @api.multi
    def _get_z_grand_total(self):
        amount = 0
        for pos in self:
            for session in self.session_ids:
                if session.state == 'closed':
                    for statement in session.statement_ids:
                        amount += statement.balance_end
            pos.z_daily_total = amount

    create_epson_xml = fields.Boolean('Create Epson XML')
    protocol = fields.Selection(
        string='EPSON Protocol',
        selection=EPSON_PROTOCOL,
        help='XML Dialect/Protocol used by the Printer.'
    )
    url = fields.Char('URL')
    receipt_action = fields.Selection(
        string='Epson receipt action',
        selection=RECEIPT_ACTION_OPTIONS,
        help='Choose what to do with the XML receipt.'
    )
    epson_xml_path = fields.Char(
        'Epson XML Path',
        help='This directory will store the XML files for the Epson printer.'
    )
    epson_printer_ip = fields.Char(
        'Epson printer IP',
    )
    paper_width = fields.Selection(
        [('54', '54 mm'), ('83', '83 mm')],
        string='Paper Width'
    )

    currency = fields.Char('Currency Name', related='currency_id.name')
    z_daily_total = fields.Float('Z Daily Total', compute='_get_z_daily_total')
    z_grand_total = fields.Float('Z Grand Total', compute='_get_z_grand_total')

    @api.onchange('protocol')
    def onchange_protocol(self):
        if self.protocol == 'epsonfp':
            self.url = '/cgi-bin/fpmate.cgi?devid=local_printer&timeout=10000'
        else:
            self.url = '/cgi-bin/epos/service.cgi?devid=local_printer&timeout=60000'


class PosSession(models.Model):
    _inherit = "pos.session"

    pos_can_print_zreport = fields.Boolean(
        string='Can print ZReport',
        readonly=True,
        compute='_compute_pos_can_print_zreport',
        help='If true you will be allowed to print Z report.'
    )

    protocol = fields.Selection(related='config_id.protocol')

    @api.depends('config_id.company_id.pos_zreport_print_date')
    def _compute_pos_can_print_zreport(self):
        """Check current company zrepor print date."""
        for item in self:
            company = item.config_id.company_id
            item.pos_can_print_zreport = \
                company.pos_zreport_print_date == fields.Date.today()


class ResUsers(models.Model):
    _inherit = 'res.users'

    pos_operator_id = fields.Char('Operatore POS')


class RestaurantPrinter(models.Model):
    _inherit = 'restaurant.printer'

    epos_printer = fields.Boolean('ePOS Printer')
    epos_url = fields.Char(
        'URL',
        default='/cgi-bin/epos/service.cgi?devid=local_printer&timeout=60000')
