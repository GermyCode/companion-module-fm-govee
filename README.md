# companion-module-fm-govee

The original module can be found at [Repository](https://github.com/bitfocus/companion-module-govee-lights)

This module lets you control most H series smart lights. [Supported Product Models](https://developer.govee.com/docs/support-product-model)

To install to companion, download a release, in companion under the modules tab click import module package, and select the downloaded package. Then in the connection info either make a new connection with that newly imported package or set the version to be the new version.

The original module uses the older Govee API which doesn't support newer devices. This module uses the newer Govee OpenAPI API, allowing you to control not only power, brightness, and color, but also customization for individual segments, all the different scenes wether it be dymanic scenes, diy scenes, or even user made snapshots. More features are listed in ./companion/HELP.md

I have only tested this module on lights that I have direct access to, which is not that many, but was able to test most functionalities. If you experience issues with the module, please let me know and I'll do my best to fix it. Please provide screenshots of the logs and a breif explanation on whats going on. Any feedback is appreciated.

 Ive been able to still control devices with LAN mode off and they work just fine, I'm thinking the LAN mode is for the LAN API, so as long as its connected to the same network it should be able to discover it. If you have an issue, it might be best to enable LAN mode.

Although I really only made this module for me and my devices, I might at some point reach out to companion or Govee and see if they'll do anything with this.
