import type { Meta, StoryObj } from '@storybook/react'
import {NavbarDemo} from './navbar-demo'

const meta = {
  title: 'aceternity-ui/ResizableNavbar',
  component: NavbarDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NavbarDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
