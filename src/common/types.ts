interface Control {
  name: string,
  pin: number
}

enum Status {
  inactive = 0,
  active = 1,
}

interface ControlStatus {
  control: Control,
  status: Status
}

interface ControlList {
  [key: string]: Control
}

export {
  Control,
  Status,
  ControlStatus,
  ControlList,
}
