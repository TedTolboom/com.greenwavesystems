# Greenwave Systems

This app adds support for devices made by [Greenwave Systems](http://www.greenwavesystems.com).

## Supported devices with most common parameters:
* Greenwave powernode-1
* Greenwave powernode-5 (UK version)
* Greenwave powernode-6

## Supported Languages:
* English
* Dutch

## NOTE:
For proper functioning of the device, the wheel on the powernode need to be set to 'black'.
If set to any other color or lock, the device will not respond to commands as initiated by Homey.

## Changelog:
### v1.1.2
**add support:**   
Powernode 5 (UK version)   
**update:**   
Powernode 1,6 - add polling intervals for each separate socket and its capabilities (re-pair of devices is needed)    

### v1.1.0 & v1.1.1 - (re-pair of devices is needed)
**update:**   
All devices - add ability to differentiate polling interval for all capabilities    
All devices - add power meter reset flow card  
All devices - update z-wave driver (1.1.8), code clean-up, minor fixes   
