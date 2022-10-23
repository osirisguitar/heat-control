interface Control {
  name: string,
  pin?: number
}

enum State {
  inactive = 0,
  active = 1,
}

interface ControlState {
  control: Control,
  state: State
}

interface ControlList {
  [key: string]: Control
}

interface Schedule {
  id?: number,
  from: string,
  to: string,
  state: State
}

interface ControlSchedule {
  controlName: string,
  schedule: Schedule,
}

export {
  Control,
  State,
  ControlState,
  ControlList,
  Schedule,
  ControlSchedule,
}
