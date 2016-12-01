# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.
{
    'name': 'Epson ePOS',
    'version': '10.0.1.0.1',
    'category': 'POS',
    'summary': 'Epson ePOS',
    'author': 'Davide Corio, Odoo Community Association (OCA)',
    'website': 'http://www.odoo-community.org',
    'depends': [
        'point_of_sale',
        'pos_restaurant',
    ],
    'data': [
        'security.xml',
        'views/assets.xml',
        'views/account_view.xml',
        'views/pos_views.xml',
        'views/res_company.xml'
    ],
    'installable': True,
    'auto_install': False,
}
