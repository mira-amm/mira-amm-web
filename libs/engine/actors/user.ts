import { createBrowserInspector } from '@statelyai/inspect'
import { userFlowMachine } from '@/engine/machines/user'
import { createActor } from 'xstate'

// https://stately.ai/docs/inspector
const { inspect } = createBrowserInspector({
 autoStart: false,
  // url: 'http://localhost:9870'
})

export const userFlowActor = createActor(
  userFlowMachine,
  process.env.NODE_ENV === 'development' && { inspect }
)
