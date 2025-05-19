import type { Meta, StoryObj } from '@storybook/react'
import Terminal from './Terminal'

const meta = {
  title: '🕹 Admin/Terminal',
  component: Terminal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Terminal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
