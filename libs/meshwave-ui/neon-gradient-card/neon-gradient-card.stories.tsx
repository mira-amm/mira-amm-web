import type { Meta, StoryObj } from '@storybook/react'
import { NeonGradientCard } from './neon-gradient-card'

const defaultChildren = (
  <div className="w-full h-auto overflow-hidden rounded-[calc(19px-3px)] bg-transparent">
    <img
      className="block w-full h-full object-cover m-0 p-0"
      src="https://raw.githubusercontent.com/mira-amm/mira-amm-web/refs/heads/main/libs/shared/assets/mira-github-repo-readme-banner.png"
      alt="Mira GitHub Repo README Banner"
    />
  </div>
)

const meta: Meta<typeof NeonGradientCard> = {
  title: '🌊 Meshwave UI/Neon Gradient Card',
  component: NeonGradientCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: defaultChildren,
    borderSize: 5,
    borderRadius: 20,
    neonColors: {
      firstColor: '#ff00aa',
      secondColor: '#00FFF1',
    },
    className: '',
  },
  argTypes: {
    'children': {
      control: false, // Disable control for this prop
    },
    'borderSize': {
      control: { type: 'number', min: 1, max: 20 },
    },
    'borderRadius': {
      control: { type: 'number', min: 0, max: 50 },
    },
    'neonColors': {
      control: 'object',
    },
    'neonColors.firstColor': {
      control: 'color',
    },
    'neonColors.secondColor': {
      control: 'color',
    },
    'className': {
      control: 'text',
    },
  },
}

export default meta

type Story = StoryObj<typeof NeonGradientCard>

export const Default: Story = {}
