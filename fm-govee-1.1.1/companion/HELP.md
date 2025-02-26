# FM Govee Lights

This module controls Govee lights.

In order to control the lights over the network (i.e. with Companion), you will need to have them first configured via the Govee Home App. Then, in the Govee Home App, go to the Settings of the Device, and enable LAN Control.

You will also need to apply for an API key. This can be done with the Govee Home App as well.

Once you have enabled LAN control and have your API key, enter the API key into the module config, and click "Save". The module will auto-detect the Govee devices found on your network.

If your device is not found, you can manually enter its MAC address and Model number in the config.

*Note:* The Govee API has rate-limits. Up to 10000 commands can be sent per day. If you attempt to do more than this, you will get an error.

For snapshots and scenes, you have to make them in the govee app first then they will show up here to use.

### Actions

* Turn device on, off, toggle
* Change device brightness
* Change device color, RGB and kelvin temperature
* Gradient toggle to make a gradient between segments
* Change segment brightness
* Change segment color, RGB (kelvin is not supproted by segments)
* Change Snapshots
* Change scenes, dynamic and DIY
* Refresh device to get new snapshots or scenes, or just to refresh device info
* Get debug info, for debugging purposes, use only if you know what you are doing

### Segment Control
* To specify what segments you want to change, use this formatting: '0,1,2,..'. They dont need to be consecutive. To change specific segments '0,1,6,10,..' or just '3' to change one segment

### Variables

* Device mac
* Device model
* Device name
* Last set power state
* Last set brightness level
* Last set color
* Min and Max color temperatures
* Max segments
* Current snapshot
* Current dynamic and DIY scenes

### Feedbacks

* Last set power state

### Presets

*