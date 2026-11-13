import type { Meta, StoryObj } from '@storybook/react-vite'
// Sample data: the repo's demo flowchart (src/sample.mmd) and the made-up 'seq: login flow' sample.
import sample from '../sample.mmd?raw'
import { SAMPLES } from '../samples'
import { Home } from './Home'
import { Hero } from './Hero'
import './site.css'

const meta: Meta<typeof Home> = { title: 'Screens/Site', component: Home }
export default meta
type Story = StoryObj<typeof Home>

// The page's three states. `live` forces the gate so each story looks the same at any window size.
export const Desktop: Story = { args: { live: true } }

export const Phone: Story = {
  args: { live: false },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}

export const NoWebGL: Story = { args: { live: false } }

// The hero on its own, through the wrapper (poster, then the lazily loaded live scene fading in).
const Wrap = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="site" style={{ padding: 24, minHeight: 'auto' }}>
    <div className="site-wrap"><div className="site-note" style={{ textAlign: 'left' }}>sample data: {label}</div>{children}</div>
  </div>
)

export const HeroAutoplay: StoryObj<typeof Hero> = {
  render: () => <Wrap label="small flowchart (sample.mmd)"><Hero live source={sample} /></Wrap>,
}
export const HeroPicked3D: StoryObj<typeof Hero> = {
  render: () => <Wrap label="small flowchart (sample.mmd)"><Hero live source={sample} start="3d" autoplay={false} /></Wrap>,
}
export const HeroSequence: StoryObj<typeof Hero> = {
  render: () => <Wrap label="login sequence (made up, samples.ts 'seq: login flow')"><Hero live source={SAMPLES['seq: login flow']} /></Wrap>,
}
