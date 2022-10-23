# heat-control

This repo flips status of a GPIO switch on a Raspberry Pi according to a schedule stored in sqlite3.

It can be used for anything, but it was built to control lowering of temperature on a heating pump for it not to run during peak electricity cost hours.

It can support as many controls as there are GPIO pins, but currently there's one hard-coded to pin 7 (GPIO 4) named lower-temperature.

## Hardware

I've connected a relay PCB to the following pins:

* PCB S (signal) - RPi pin 7 (GPIO 4)
* PCB + (VCC) - RPi pin 2 (5V)
* PCB - (GND) - RPi pin 6 (GND)

The pins in the heating pump go into the NO pair on the relay PCB. NO means "normally open", so a low signal on GPIO 4 means the circuit is open (broken), and a high signal on GPIO 4 closes (connects) the circuit. 

Two pins in my heating pump can be assign to control one function, I chose "lowered nighttime temperature" and set it to lower A LOT (-40C). This means that when relay switches on, the heating pump goes into standby mode and only makes hot tap water. 

## API

#### GET http://raspberry.local:8000/control/lower-temperature

Returns current state of GPIO pin for the control lower-temperature

#### GET http://raspberry.local:8000/schedule/lower-temperature/current

Returns the currently desired state of the control lower-temperature based on the schedule (no explicit schedule = inactive)

#### GET http://localhost:8000/schedule/lower-temperature

Returns all current and future schedules for the control lower-temperature

#### POST http://heatcontrol.local:8000/schedule/lower-temperature

Inserts a schedule for the control lower-temperature.

Payload:
```
{
    "from": "2022-10-24 07:00:00:00.000",
    "to": "2022-10-24 11:00:00.000",
    "state": "1"
}
```

Times in local time. state can be 0 or 1.

## Prerequisites

* Node 16
* Sqlite3 (apt install -y sqlite3)

Note: npm install will take FOREVER on a Raspberry pi, since it has to be compiled from source. Just wait it out. 

Use the linux command screen to start this application and keep it running when you log out of ssh.
