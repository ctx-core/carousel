import type { SvelteComponentTyped } from 'svelte'
export class Carousel extends SvelteComponentTyped<{
	loading?:boolean
	index?:number
	interval_period?:number
	transition_duration?:number
	translateX?:number
	is_touchstart?:number
	mousedown_clientX?:number
	mousemove_clientX?:number
	updating?:boolean
}> {}
