import { Regex } from '@companion-module/base';

export default function	getConfigFields() {
	let self = this;

	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module controls Govee lights. See the HELP file for more information and how to get started.',
		},
		{
			type: 'checkbox',
			id: 'apitype',
			width: '12',
			label: 'Use Local API',
			tooltip: 'The lan api has to be enabled on the device through the app for this to work',
			default: false
		},
		{
			type: 'textinput',
			id: 'api_key',
			label: 'Govee API Key',
			width: 12,
			default: '',
			isVisibleExpression: '$(options:apitype) == false'
		},
		{
			type: 'dropdown',
			id: 'govee_device',
			label: 'Govee Device (Auto Detected)',
			width: 12,
			default: self.GOVEE_DEVICES[0].id,
			choices: self.GOVEE_DEVICES,
			isVisibleExpression: '$(options:apitype) == false'
		},
		{
			type: 'textinput',
			id: 'local_api_device_ip',
			label: 'Device IP',
			width: 12,
			default: '',
			tooltio: 'To assign multiple devices, separate them using commas, "ip_address1,ip_address2,..."',
			isVisibleExpression: '$(options:apitype) == true'
		},
		{
			type: 'checkbox',
			id: 'intervalEnabled',
			label: 'Enable Update Interval (Periodically request new information from the device)',
			width: 12,
			default: false
		},
		{
			type: 'number',
			id: 'intervalAmmount',
			label: 'How frequently to request data in ms. Default 60000ms = 1 minute. Minimum 500ms',
			width: 12,
			min: 500,
			default: 60000,
			isVisibleExpression: '$(options:intervalEnabled) === true'
		},
		{
			type: 'static-text',
			id: 'info2',
			label: 'Verbose Logging',
			width: 12,
			value: `
				<div class="alert alert-info">
					Enabling this option will put more detail in the log, which can be useful for troubleshooting purposes.
				</div>
			`
		},
		{
			type: 'checkbox',
			id: 'verbose',
			label: 'Enable Verbose Logging',
			default: false,
			width: 12
		},
	]
}