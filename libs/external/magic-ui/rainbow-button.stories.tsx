import type { Meta, StoryObj } from '@storybook/react'
import {RainbowButton} from './rainbow-button'

const meta = {
  title: 'magic-ui/RainbowButton',
  component: RainbowButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RainbowButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
