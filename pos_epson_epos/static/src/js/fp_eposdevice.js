(function(window) {
	var varsocket = null;
	var msgGenerator = null;
	var deviceInfo = null;
	var connectCallback = null;
	var SOCKET_EVENT_NAME = "message";
	var CONNECT_RESULT_OK = "OK";
	var CONNECT_RESULT_ERROR_PARAMETER = "ERROR_PARAMETER";
	var CONNECT_RESULT_ERROR_TIMEOUT = "ERROR_TIMEOUT";
	var ERROR_SYSTEM_ERROR = "SYSTEM_ERROR";
	var ERROR_PARAM_ERROR = "PARAM_ERROR";
	var adminInfo = "";
	var locationInfo = "";
	function ePOSDevice() {
		this.DEVICE_TYPE_SCANNER = "type_scanner";
		this.DEVICE_TYPE_KEYBOARD = "type_keyboard";
		this.CLIENT_DRIVER_SCANNER = "Scanner";
		this.CLIENT_DRIVER_KEYBOARD = "Keyboard";
		this.ERROR_DEVICE_OPEN_ERROR = "DEVICE_OPEN_ERROR";
		this.ERROR_DEVICE_CLOSE_ERROR = "DEVICE_CLOSE_ERROR";
		this.ERROR_DEVICE_NOT_OPEN = "DEVICE_NOT_OPEN";
		this.ERROR_DEVICE_IN_USE = "DEVICE_IN_USE";
		this.SEQUENCE_INIT_PARAM = 1;
		console.log('constructor (varsocket = ' + varsocket + ')');
		deviceInfo = new clientDeviceInfo();
		msgGenerator = new clientMessageGenerator();
		adminInfo = "";
		locationInfo = "";
		isConnected = false;
		this.sequence = 0;
		this.ipAdress = "";
		this.port = "";
		this.onerror = null;
		this.ondisconnect = null;
		this.init();
		var ePDev = this;

		window.onbeforeunload = function() {
			if (varsocket != null) {
				ePDev.disconnect();
			}
		};
		/*
		window.onpagehide = function() {
		//window.onblur = function() {
			if (varsocket != null) {
				console.log('page hide (varsocket = ' + varsocket + ')');
				ePDev.disconnect();
				console.log('after disconnect (varsocket = ' + varsocket + ')');
			}
		};
		*/
	}
	ePOSDevice.prototype = {
		init : function() {
			deviceInfo = new clientDeviceInfo();
			this.ipAdress = "";
			this.port = "";
		},
		connect : function(ipAdress, port, callback) {
			this.ipAdress = ipAdress;
			this.port = port;
			var self = this;
			if (varsocket != null) {
				this.disconnect();
			}
			connectCallback = callback;
			var url = 'ws://' + ipAdress + ':' + port + '/connect';
			varsocket = new WebSocket(url);
			console.log('connect (varsocket = ' + varsocket + ')');

		    varsocket.onopen = function(ev) {
		        console.log('CONNECTED');
		        isConnected = true;
		        connectCallback("OK");
		    };
		    varsocket.onclose = function(ev) {
		        console.log('DISCONNECTED');
		        isConnected = false;
		        connectCallback("close");
		    };
		    varsocket.onmessage = function(ev) {
		    	console.log('MESSAGE');
		    	var recvData = JSON.parse(ev.data);
		    	/* Handle protocol responses and device input */
		    	var SOCKET_COMMAND_OPENDEVICE = "open_device";
		    	var SOCKET_COMMAND_CLOSEDEVICE = "close_device";
		    	var SOCKET_COMMAND_DATA = "device_data";
		    	var SOCKET_COMMAND_ERROR = "error";
		    	var SOCKET_RESULT_OK = "OK";
		    	if (recvData == null) {
		    		return
		    	}

		    	var header = recvData[0];
				switch (header) {
		    	case SOCKET_COMMAND_OPENDEVICE:
		    		socketCommandOpenDevice(recvData);
		    		break;
		    	case SOCKET_COMMAND_CLOSEDEVICE:
		    		socketCommandCloseDevice(recvData);
		    		break;
		    	case SOCKET_COMMAND_DATA:
		    		socketCommandData(recvData);
		    		break;
		    	case SOCKET_COMMAND_ERROR:
		    		socketCommandError(recvData);
		    		break;
		    	default:
		    		break
		    	}
		    	function socketCommandOpenDevice(recvData) {
					var deviceID = "";
					try {
						deviceID = recvData[1];
						var code = recvData[2];
						if (recvData.length > 4) {
							if (recvData[4] != "") {
								self.recievedDataId = recvData[4]
							}
						}
						var driverObj = null;
						if (code == SOCKET_RESULT_OK) {
							console.log("OK per open_device");
							var driverObj = deviceInfo
									.getClientDriverObj(deviceID)
						}
						var callback = deviceInfo
								.getResultCallback(deviceID);
						if (callback != null) {
							callback(driverObj, code)
						}
						if (code != SOCKET_RESULT_OK) {
							console.log("ERR per open_device");
							if (varsocket != null) {
								console.log("close socket on ERR");
							}
							deviceInfo
									.removeClientDeviceInfo(deviceID)
						}
		    		} catch (e) {
		    			var exception = e.message;
		    			console.log("EXCEPTION " + exception);
		    			if (self.onerror != null) {
		    				self.onerror("0", deviceID,
		    						ERROR_SYSTEM_ERROR, null)
		    			}
		    		}
		    		return
		    	}
		    	function socketCommandCloseDevice(recvData) {
					var deviceID = "";
					try {
						deviceID = recvData[1];
						var code = recvData[2];
						if (recvData.length > 4) {
							if (recvData[4] != "") {
								self.recievedDataId = recvData[4]
							}
						}
						var callback = deviceInfo
								.getResultCallback(deviceID);
						if (callback != null) {
							callback(code)
						}
						if (code == SOCKET_RESULT_OK) {
							deviceInfo
									.removeClientDeviceInfo(deviceID)
						}
					} catch (e) {
						if (self.onerror != null) {
							self.onerror("0", deviceID,
									ERROR_SYSTEM_ERROR, null)
						}
					}
					return
		    	}
		    	function socketCommandData(recvData) {
					var sq = "";
					var deviceID = "";
					try {
						sq = recvData[1];
						deviceID = recvData[2];
						var data = recvData[3];
						if (recvData.length > 4) {
							if (recvData[4] != "") {
								self.recievedDataId = recvData[4]
							}
						}
						if (deviceInfo
								.getClientDeviceInfo(deviceID).isCrypto) {
							var strData = ePosC.bfDecrypt(data);
							data = JSON.parse(strData)
						}
						var drvObj = deviceInfo
								.getClientDeviceInfo(deviceID).driverObj;
						var method = "client_" + data.type;
						try {
							try {
								eval("drvObj." + method
										+ "(data, sq)")
							} catch (e) {
								eval("drvObj." + data.type
										+ "(data, sq)")
							}
						} catch (e) {
							throw new Error("")
						}
					} catch (e) {
						if (self.onerror != null) {
							self.onerror(sq, deviceID,
									ERROR_SYSTEM_ERROR, null)
						}
					}
					return
		    	}
		    	function socketCommandError(recvData) {
		    		var sq = "";
		    		var deviceID = "";
		    		try {
		    		} catch (e) {
		    			console.log("EXCEPTION " + e.message);
		    			if (self.onerror != null) {
		    				self.onerror(sq, deviceID,
		    						ERROR_SYSTEM_ERROR, null)
		    			}
		    		}
		    		return
		    	}
		    	function initConnectCallback() {
		    		connectCallback = null;
		    		return
		    	}
		    };
		    varsocket.onerror = function(ev) {
		    	console.log('ERROR' + ev.data);
		    	varsocket.close();
		    	document.getElementById('customer_id').blur();
		    };
		},
		disconnect : function() {
			if (varsocket != null) {
				console.log("close socket!!!");
				varsocket.close();
				varsocket = null;
			}
			this.init();
			return (true)
		},
		isConnected : function() {
			return isConnected
		},
		createDevice : function(deviceID, deviceType, isCrypto, callback) {
			try {
				var isCrypto = false;
				var isBuffer = null;
				if (deviceInfo.isExsitClientDeviceInfo(deviceID)) {
					throw new Error(this.ERROR_DEVICE_IN_USE)
				}
				if (varsocket == null) {
					throw new Error(ERROR_SYSTEM_ERROR)
				}
				var driverClass = "";
				switch (deviceType) {
				case this.DEVICE_TYPE_SCANNER:
					console.log("deviceType SCANNER");
					driverClass = this.CLIENT_DRIVER_SCANNER;
					break;
				case this.DEVICE_TYPE_KEYBOARD:
					console.log("deviceType KEYBOARD");
					driverClass = this.CLIENT_DRIVER_KEYBOARD;
					break;
				default:
					break;
				}
				var func = eval(driverClass);
				if (typeof (func) != "function") {
					throw new Error(ERROR_PARAM_ERROR)
				}
				var driverObj = new func(this, deviceID);

				deviceInfo.addClientDeviceInfo(deviceID, isCrypto, driverObj,
						callback);
				var command = msgGenerator.getOpenDevice(deviceID, null, {
					type : deviceType,
					crypto : isCrypto
				});
				var jsonCommand = JSON.stringify(command)
				varsocket.send(jsonCommand)
			} catch (e) {
				var exception = e.message;
				if ((exception == null) || (exception == "")) {
					exception = this.ERROR_DEVICE_OPEN_ERROR
				}
				console.log("EXCEPTION " + exception)
				if (callback != null) {
					callback(null, exception)
				}
			}
			return
		},
		deleteDevice : function(driverObject, callback) {
			try {
				if (varsocket == null) {
					throw new Error(ERROR_SYSTEM_ERROR)
				}
				var devStruct = deviceInfo
				.getClientDeviceInfoByDriverObj(driverObject);
				if (devStruct == null) {
					throw new Error(this.ERROR_DEVICE_NOT_OPEN)
				}
				deviceInfo.setResultCallback(devStruct.deviceID, callback);
				var command = msgGenerator.getCloseDevice(devStruct.deviceID,
						null, {});
				varsocket.send(SOCKET_EVENT_NAME, command)
			} catch (e) {
				var exception = e.message;
				if ((exception == null) || (exception == "")) {
					exception = this.ERROR_DEVICE_CLOSE_ERROR;
				}
				if (callback != null) {
					callback(exception);
				}
			}
		},
	};
	function clientDeviceInfo() {
		this.clientDevStructList = null;
		this.init()
	}
	clientDeviceInfo.prototype = {
		init : function() {
			this.clientDevStructList = new Array()
		},
		addClientDeviceInfo : function(deviceID, isCrypto, driverObj, callback) {
			var clientDevStruct = new clientDeviceStruct(deviceID, isCrypto,
					driverObj, callback);
			this.clientDevStructList[deviceID] = clientDevStruct
		},
		getClientDeviceInfo : function(deviceID) {
			for ( var i in this.clientDevStructList) {
				if (this.clientDevStructList[i].deviceID == deviceID) {
					return this.clientDevStructList[i]
				}
			}
			return null
		},
		getClientDeviceInfoByDriverObj : function(driverObj) {
			for ( var i in this.clientDevStructList) {
				console.log(i);
				console.log(this.clientDevStructList[i].driverObj);
				if (this.clientDevStructList[i].driverObj == driverObj) {
					return this.clientDevStructList[i]
				}
			}
			return null
		},
		getClientDriverObj : function(deviceID) {
			return this.getClientDeviceInfo(deviceID).driverObj
		},
		setResultCallback : function(deviceID, callback) {
			var devStruct = this.getClientDeviceInfo(deviceID);
			devStruct.resultCallback = callback;
			this.removeClientDeviceInfo(deviceID);
			this.addClientDeviceInfo(devStruct.deviceID, devStruct.isCrypto,
					devStruct.driverObj, callback);
			return;
		},
		getResultCallback : function(deviceID) {
			var callback = null;
			var devStruct = this.getClientDeviceInfo(deviceID);
			if (devStruct != null) {
				callback = devStruct.resultCallback
			}
			return callback
		},
		removeClientDeviceInfo : function(deviceID) {
			for ( var i in this.clientDevStructList) {
				if (this.clientDevStructList[i].deviceID == deviceID) {
					delete this.clientDevStructList[i];
					return
				}
			}
		},
		isExsitClientDeviceInfo : function(deviceID) {
			var ret = true;
			if (this.clientDevStructList[deviceID] == null) {
				ret = false
			}
			return ret
		}
	};
	function clientDeviceStruct(deviceID, isCrypto, driverObj, resultCallback) {
		this.deviceID = deviceID;
		this.isCrypto = isCrypto;
		this.driverObj = driverObj;
		this.resultCallback = resultCallback
	}
	function clientMessageGenerator() {
	}
	clientMessageGenerator.prototype = {
		getOpenDevice : function(deviceID, code, data) {
			var message = "";
			if (code == null) {
				message = [ "open_device", deviceID, data ]
			} else {
				message = [ "open_device", deviceID, code, data ]
			}
			return message
		},
		getCloseDevice : function(deviceID, code, data) {
			var message = "";
			if (code == null) {
				message = [ "close_device", deviceID, data ]
			} else {
				message = [ "close_device", deviceID, code, data ]
			}
			return message
		},
		getDeviceData : function(sq, deviceID, data, cryptoObj) {
			var message = "";
			if (cryptoObj == null) {
				message = [ "device_data", sq, deviceID, data ]
			} else {
				var encryptData = cryptoObj.bfEncrypt(JSON.stringify(data));
				message = [ "device_data", sq, deviceID, encryptData ]
			}
			return message
		},
		getConnect : function(data) {
			return [ "connect", data ]
		},
		getDataAck : function(data) {
			return [ "ack", data ]
		},
		getError : function(sq, deviceID, code) {
			return [ "error", sq, deviceID, code ]
		}
	};
	function Scanner(ePosDevObj, deviceID) {
		this.ePosDevObj = ePosDevObj;
		this.deviceID = deviceID;
		this.init()
	}
	Scanner.prototype = {
		init : function() {
		},
		client_ondata : function(data) {
			try {
				if (this.ondata == null) {
					return
				}
				this.ondata(data);
			} catch (e) {
				console.log(e.message);
			}
			var command = msgGenerator.getDataAck("dummy");
			var jsonCommand = JSON.stringify(command)
			varsocket.send(jsonCommand)
			return
		},
	};

	window.epsonlib = {
		ePOSDevice : ePOSDevice
	}
})(window);