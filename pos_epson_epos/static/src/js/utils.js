odoo.define('pos_epson_epos.utils', function (require) {
    "use strict";

    var proxy_send = function(pos_config, action, xml) {
        console.log(pos_config);
        var url = '/pos_epson_epos/' + action;
        if (pos_config.proxy_ip) {
            url = pos_config.proxy_ip + url;
            console.log('using proxy ip', url);
        }
        return $.ajax({
            // proxy_ip will be localhost in most of the cases
    		url: url,
            type: 'POST',
            data: {
                xml_data: xml,
                epson_xml_path: pos_config.epson_xml_path,
                epson_printer_ip: pos_config.epson_printer_ip,
                receipt_action: pos_config.receipt_action
            },
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                /* alert("Inviata con successo alla stampante"); */
                console.log(data);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Impossibile inviare. Controllare il log:\n" + xhr.responseText);
            }
        })
    };

    function createXMLHttpRequest()
    {
        var xhr = null;
        if (window.XMLHttpRequest)
        {
            xhr = new XMLHttpRequest();
        }
        else if (window.ActiveXObject)
        {
            xhr = new ActiveXObject('Msxml2.XMLHTTP');
        }
        else
        {
            throw new Error('XMLHttpRequest is not supported');
        }
        return xhr;
    }

    var send = function (request) {
        var address = 'http://192.168.192.168/cgi-bin/epos/service.cgi?devid=local_printer&timeout=60000'
        var soap = '<?xml version="1.0" encoding="utf-8"?>'
            + '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">'
            + '<s:Body><epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">'
            + '<text>Hello&#10;</text>'
            + '<cut type="feed"/>'
            + '</epos-print>'
            + '</s:Body></s:Envelope>';
        var xhr = createXMLHttpRequest();
        xhr.open('POST', address, true);
        xhr.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
        xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT');
        xhr.setRequestHeader('SOAPAction', '""');
        xhr.send(soap);
    }

    return {
        send: send
    };
});
