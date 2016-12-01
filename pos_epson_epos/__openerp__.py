# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.
{
    'name': 'Epson Fiscal Print',
    'version': '0.1',
    'category': 'POS',
    'summary': 'Epson Fiscal Print',
    'author': 'abstract',
    'description': """
    This module generates Epson compatible XML files from the "Print receipt"
    button of the point of sale UI.
    """,
    'website': 'http://www.abstract.it',
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
