# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.

from openerp import models, fields


class ResCompany(models.Model):
    _inherit = 'res.company'

    pos_zreport_print_date = fields.Date(
        string='Last fiscal closure date',
        help=('Represent the last date when the ZReport has been printed. '
              'If you do not see the button for printing it '
              'check this date.')
    )
    pos_receipt_header_1 = fields.Text('Custom Receipt Header 1')
    pos_receipt_header_2 = fields.Text('Custom Receipt Header 2')
    pos_receipt_footer_1 = fields.Text('Custom Receipt Footer 1')
    pos_receipt_footer_2 = fields.Text('Custom Receipt Footer 2')
