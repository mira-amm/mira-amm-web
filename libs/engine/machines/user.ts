// github.com/darrylhebbes/awesome_xstate?tab=readme-ov-file
import { setup } from "xstate"

export enum UserStates {
  IDLE = 'idle',
  MENU = 'menu',
  HELP = 'help',
  CLEAR = 'clear',
  NOTES = 'notes',
  TIMER = 'timer',
  GAME = 'game',
  LOGOUT = 'logout',
}

export enum UserEvents {
  LOGIN = 'LOGIN',
  HELP = 'HELP',
  CLEAR = 'CLEAR',
  NOTES = 'NOTES',
  TIMER = 'TIMER',
  GAME = 'GAME',
  LOGOUT = 'LOGOUT',
  ESCAPE = 'ESCAPE',
}

export const userFlowMachine = setup({
types:{
  events: {} as Event,
}
}).createMachine({
  id: 'userFlow',
  initial: UserStates.IDLE,
  states: {
    [UserStates.IDLE]: {
      on: { [UserEvents.LOGIN]: UserStates.MENU },
    },
    [UserStates.MENU]: {
      on: {
        [UserEvents.HELP]: UserStates.HELP,
        [UserEvents.CLEAR]: UserStates.CLEAR,
        [UserEvents.NOTES]: UserStates.NOTES,
        [UserEvents.TIMER]: UserStates.TIMER,
        [UserEvents.GAME]: UserStates.GAME,
        [UserEvents.LOGOUT]: UserStates.LOGOUT,
      },
    },
    [UserStates.HELP]: {
      on: { [UserEvents.CLEAR]: UserStates.CLEAR },
    },
    [UserStates.CLEAR]: {},
    [UserStates.NOTES]: {
      on: { [UserEvents.ESCAPE]: UserStates.MENU },
    },
    [UserStates.TIMER]: {
      on: { [UserEvents.ESCAPE]: UserStates.MENU },
    },
    [UserStates.GAME]: {
      on: { [UserEvents.ESCAPE]: UserStates.MENU },
    },
    [UserStates.LOGOUT]: {
      always: UserStates.IDLE,
    },
  },
});
