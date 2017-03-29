'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');
const endpointInterval = {};

// http://products.z-wavealliance.org/products/716

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		onoff: {
			command_class: 'COMMAND_CLASS_SWITCH_BINARY',
			command_get: 'SWITCH_BINARY_GET',
			command_set: 'SWITCH_BINARY_SET',
			command_set_parser: value => ({
				'Switch Value': value,
			}),
			command_report: 'SWITCH_BINARY_REPORT',
			command_report_parser: report => report.Value === 'on/enable',
			pollInterval: 'poll_interval_onoff',
		},

		measure_power: {
			command_class: 'COMMAND_CLASS_METER',
			command_get: 'METER_GET',
			command_get_cb: false,
			command_get_parser: () => ({
				Properties1: {
					Scale: 2,
				},
			}),
			command_report: 'METER_REPORT',
			command_report_parser: report => {
				if (report &&
					report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2.Scale === 2) {
					return report['Meter Value (Parsed)'];
				}
				return null;
			},
			pollInterval: 'poll_interval_meter',
		},

		meter_power: {
			command_class: 'COMMAND_CLASS_METER',
			command_get: 'METER_GET',
			command_get_cb: false,
			command_get_parser: () => ({
				Properties1: {
					Scale: 0,
				},
			}),
			command_report: 'METER_REPORT',
			command_report_parser: report => {
				if (report &&
					report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2.Scale === 0) {
					return report['Meter Value (Parsed)'];
				}
				return null;
			},
			pollInterval: 'poll_interval_measure',
		},
	},

	beforeInit: (token, callback) => {
		const node = module.exports.nodes[token];
		if (node) {
			module.exports.getSettings(node.device_data, (err, settings) => {
				if (err) return console.error('error retrieving settings for device', err);

				if (settings.zw_node_id.indexOf('.') < 0 && !endpointInterval.hasOwnProperty(token)) {
					endpointInterval[token] = {};
					for (var i = 1; i <= 5; i++) {
						endpointInterval[token][i] = [];
						if (settings['endpoint_interval_onoff_' + i]) setEndpointInterval('onoff', i, settings['endpoint_interval_onoff_' + i], token);
						if (settings['endpoint_interval_measure_' + i]) setEndpointInterval('measure', i, settings['endpoint_interval_measure_' + i], token);
						if (settings['endpoint_interval_meter_' + i]) setEndpointInterval('meter', i, settings['endpoint_interval_meter_' + i], token);
					}
				}
			});
		}

		// Initiate the device
		return callback();
	},

	settings: {
		0: {
			index: 0,
			size: 1,
		},
		1: {
			index: 1,
			size: 1,
			signed: false,
		},
		endpoint_interval_onoff_1: (newValue, oldValue, deviceData) => setEndpointInterval('onoff', 1, newValue, deviceData.token),
		endpoint_interval_measure_1: (newValue, oldValue, deviceData) => setEndpointInterval('measure', 1, newValue, deviceData.token),
		endpoint_interval_meter_1: (newValue, oldValue, deviceData) => setEndpointInterval('meter', 1, newValue, deviceData.token),
		endpoint_interval_onoff_2: (newValue, oldValue, deviceData) => setEndpointInterval('onoff', 2, newValue, deviceData.token),
		endpoint_interval_measure_2: (newValue, oldValue, deviceData) => setEndpointInterval('measure', 2, newValue, deviceData.token),
		endpoint_interval_meter_2: (newValue, oldValue, deviceData) => setEndpointInterval('meter', 1, newValue, deviceData.token),
		endpoint_interval_onoff_3: (newValue, oldValue, deviceData) => setEndpointInterval('onoff', 3, newValue, deviceData.token),
		endpoint_interval_measure_3: (newValue, oldValue, deviceData) => setEndpointInterval('measure', 3, newValue, deviceData.token),
		endpoint_interval_meter_3: (newValue, oldValue, deviceData) => setEndpointInterval('meter', 3, newValue, deviceData.token),
		endpoint_interval_onoff_4: (newValue, oldValue, deviceData) => setEndpointInterval('onoff', 4, newValue, deviceData.token),
		endpoint_interval_measure_4: (newValue, oldValue, deviceData) => setEndpointInterval('measure', 4, newValue, deviceData.token),
		endpoint_interval_meter_4: (newValue, oldValue, deviceData) => setEndpointInterval('meter', 4, newValue, deviceData.token),
		endpoint_interval_onoff_5: (newValue, oldValue, deviceData) => setEndpointInterval('onoff', 5, newValue, deviceData.token),
		endpoint_interval_measure_5: (newValue, oldValue, deviceData) => setEndpointInterval('measure', 5, newValue, deviceData.token),
		endpoint_interval_meter_5: (newValue, oldValue, deviceData) => setEndpointInterval('meter', 5, newValue, deviceData.token),
	},
});

Homey.manager('flow').on('action.PN5_reset_meter', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	if (typeof node.instance.CommandClass.COMMAND_CLASS_METER !== 'undefined') {
		node.instance.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
			if (err) return callback(err);
			if (result === 'TRANSMIT_COMPLETE_OK') return callback(null, true);
			return callback('unknown_response');
		});
	} else return callback('unknown_error');
});

function setEndpointInterval(capability, multiChannel, value, token) {
	const node = module.exports.nodes[token];

	if (endpointInterval[token][multiChannel][capability]) {
		clearInterval(endpointInterval[token][multiChannel][capability]);
		endpointInterval[token][multiChannel][capability] = null
	}

	if (value === 0) return;

	switch (capability) {
		case 'onoff':
			{
				if (typeof node.instance.MultiChannelNodes[multiChannel].CommandClass.COMMAND_CLASS_SWITCH_BINARY !== "undefined") {
					endpointInterval[token][multiChannel].onoff = setInterval(() => {
						module.exports._debug('polling: MultiChannelNode[' + multiChannel + '].' + capability);
						node.instance.MultiChannelNodes[multiChannel].CommandClass.COMMAND_CLASS_SWITCH_BINARY.SWITCH_BINARY_GET({});
					}, value * 1000);
				}
			}
			break;

		case 'measure':
			{
				if (typeof node.instance.MultiChannelNodes[multiChannel].CommandClass.COMMAND_CLASS_METER !== "undefined") {
					endpointInterval[token][multiChannel].measure = setInterval(() => {
						module.exports._debug('polling: MultiChannelNode[' + multiChannel + '].' + capability);
						node.instance.MultiChannelNodes[multiChannel].CommandClass.COMMAND_CLASS_METER.METER_GET({
							Properties1: {
								Scale: 2,
							},
						});
					}, value * 1000);
				}
			}
			break;

		case 'meter':
			{
				if (typeof node.instance.MultiChannelNodes[multiChannel].CommandClass.COMMAND_CLASS_METER !== "undefined") {
					endpointInterval[token][multiChannel].meter = setInterval(() => {
						module.exports._debug('polling: MultiChannelNode[' + multiChannel + '].' + capability);
						node.instance.MultiChannelNodes[multiChannel].CommandClass.COMMAND_CLASS_METER.METER_GET({
							Properties1: {
								Scale: 0,
							},
						});
					}, value * 1000);
				}
			}
			break;
	}
}
