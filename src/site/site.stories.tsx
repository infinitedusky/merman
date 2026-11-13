import type { Meta, StoryObj } from '@storybook/react-vite'
import sample from '../sample.mmd?raw'
import { SAMPLES } from '../samples'
import { Home } from './Home'
import { HeroScene } from './HeroScene'
import './site.css'

const meta: Meta<typeof Home> = { title: 'Screens/Site', component: Home }
export default meta
type Story = StoryObj<typeof Home>

export const Desktop: Story = {}

export const Phone: Story = {
  args: { poster: true },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}

export const NoWebGL: Story = { args: { poster: true } }

// Hero on its own, for the scene's states.
const Wrap = ({ children }: { children: React.ReactNode }) => <div className="site" style={{ padding: 24, minHeight: 'auto' }}><div className="site-wrap">{children}</div></div>

export const HeroAutoplay: StoryObj<typeof HeroScene> = {
  render: () => <Wrap><HeroScene source={sample} /></Wrap>,
}
export const HeroPicked3D: StoryObj<typeof HeroScene> = {
  render: () => <Wrap><HeroScene source={sample} start="3d" autoplay={false} /></Wrap>,
}
export const HeroSequence: StoryObj<typeof HeroScene> = {
  render: () => <Wrap><HeroScene source={SAMPLES['seq: login flow']} /></Wrap>,
}
