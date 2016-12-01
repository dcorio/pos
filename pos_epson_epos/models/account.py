# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.
from openerp import models, fields


class AccountJournal(models.Model):
    _inherit = 'account.journal'

    pos_journal_name = fields.Char('Name on PoS')