# FM Govee Lights

This module controls Govee lights.

In order to control the lights over the network (i.e. with Companion), you will need to have them first configured via the Govee Home App. Then, in the Govee Home App, go to the Settings of the Device, and enable LAN Control.

You will also need to apply for an API key. This can be done with the Govee Home App as well.

Once you have enabled LAN control and have your API key, enter the API key into the module config, and click "Save". The module will auto-detect the Govee devices found on your network.

If your device is not found, you can manually enter its MAC address and Model number in the config.

*Note:* The Govee API has rate-limits. Up to 10 commands can be sent per minute. If you attempt to do more than this, you will get an error.

### Actions

* Turn device On
* Turn device Off
* Change device brightness
* Change device color, RGB and kelvin temperature
* Change segment brightness
* Change segment color, RGB (kelvin is not supproted by segments)

### Segment Control
* To specify what segments you want to change, use this formatting: '1,2,3,..'. They dont need to be consecutive. To change specific segments '1,3,6,10,..' or just '3' to change one segment

### Variables

* Last set power state
* Last set brightness level
* Last set color
* Min and max color temperatures
* Max segments

### Feedbacks

* Last set power state

### Presets

* 