<script lang="ts">
import { html_style_ } from 'ctx-core/html'
import { onMount, onDestroy } from 'svelte'
export let loading = true
export let index = 0
export let interval_period = 10000
export let transition_duration = 500
export let translateX = 0
export let is_touchstart = false
export let mousedown_clientX = 0
export let mousemove_clientX = 0
export let updating = false
let Carousel_node:HTMLDivElement, background_image_interval:NodeJS.Timer|null, items_node:HTMLDivElement
/** @type {number} */
let Carousel_node_width//region
$: Carousel_node_width = Carousel_node && parseFloat(getComputedStyle(Carousel_node).width)//endregion
/** @type {number} */
let items_node_height//region
$: items_node_height = items_node && parseFloat(getComputedStyle(items_node).height)//endregion
$: Carousel_node_width && items_node_height && resize_items()
/** @type {string} */
let items_style//region
$: items_style =
	html_style_({
		width: `${Carousel_node_width * items_length_()}px`,
		transition: updating ? `${transition_duration}ms ease-out` : 0,
		transform: translateX ? `translate(${translateX}px)` : '',
	})//endregion
onMount(()=>{
	loading = true
	setTimeout(()=>{
		setInterval_background_image()
		resize_items()
		loading = false
	})
})
onDestroy(clearInterval_background_image)
/*
	Using reactive blocks results in a glitch
		when transitioning from first to last_index_ & last_index_ to first slides.
	Factory Functions fix the overflow glitch.
*/
function items_length_() {
	return items_node?.children.length
}
function last_index_() {
	return items_length_() - 1
}
function previous_index_() {
	return index ? index - 1 : last_index_()
}
function next_idx_() {
	return (index < last_index_()) ? index + 1 : 0
}
function resize_items() {
	for (let i = 0; i < items_length_(); i++) {
		const left_px = left_px_(i)
		const item = items_node.children[i]
		const style = {
			position: 'absolute',
			top: 0,
			left: `${left_px}px`,
			height: `${items_node_height}px`,
			width: `${Carousel_node_width}px`,
			'z-index': 1,
		}
		Object.assign(item.style, style)
	}
}
function next() {
	setTimeout(()=>{
		const transition_index = (index + 1) % items_length_()
		set_index(transition_index)
	})
}
function prev() {
	setTimeout(()=>{
		const items_length = items_length_()
		const transition_index = (items_length + index - 1) % items_length
		set_index(transition_index)
	})
}
function clearInterval_background_image() {
	if (background_image_interval) {
		clearInterval(background_image_interval)
	}
	background_image_interval = null
}
function setInterval_background_image() {
	clearInterval_background_image()
	background_image_interval = setInterval(()=>next(), interval_period)
}
function set_index(transition_index:number) {
	clearInterval_background_image()
	updating = true
	setTimeout(()=>{
		translateX = -1 * left_px_(transition_index)
		setTimeout(()=>{
			if (!updating) {
				return
			}
			updating = false
			setTimeout(()=>{
				index = transition_index
				resize_items()
				translateX = 0
				setInterval_background_image()
			}, 0)
		}, transition_duration)
	}, 100)
}
function onresize_window(_event:MouseEvent) {
	Carousel_node = Carousel_node
	items_node = items_node
}
function onmousedown_window(event:MouseEvent) {
	const { top, left, width } = Carousel_node.getBoundingClientRect()
	const { clientX, clientY } = event
	const active =
		clientY >= top
		&& clientY <= (top + items_node_height)
		&& clientX >= left
		&& clientX <= (left + width)
	if (active) {
		is_touchstart = true
		mousedown_clientX = clientX - translateX
		updating = false
	}
}
function onmousemove_window(event:MouseEvent|Touch) {
	if (!is_touchstart) return
	const { clientX } = event
	translateX = clientX - mousedown_clientX
	mousemove_clientX = clientX
}
function ontouchstart_window(event) {
	onmousedown_window(event.changedTouches[0])
}
function ontouchmove_window(event:TouchEvent) {
	onmousemove_window(event.changedTouches[0])
}
function ontouchend_window(event:TouchEvent) {
	onmouseup_window(event.changedTouches[0])
}
function ontouchleave_window(event) {
	onmouseup_window(event.changedTouches[0])
}
function ontouchcancel_window(event) {
	onmouseup_window(event.changedTouches[0])
}
function onmouseup_window(event:MouseEvent|Touch) {
	if (!is_touchstart) return
	const { clientX } = event
	const diff_clientX = clientX - mousedown_clientX
	is_touchstart = false
	mousedown_clientX = 0
	mousemove_clientX = 0
	if (diff_clientX > 0) {
		translateX = diff_clientX
		prev()
	} else if (diff_clientX < 0) {
		translateX = diff_clientX
		next()
	} else {
		translateX = 0
	}
}
function left_px_(i) {
	return (
		i == index
		? 0
		: i == previous_index_()
			? -Carousel_node_width
			: i == next_idx_()
				? Carousel_node_width
				: Carousel_node_width * (i - index)
	)
}
</script>

<svelte:window
	on:resize={onresize_window}
	on:touchstart={ontouchstart_window}
	on:touchmove={ontouchmove_window}
	on:touchend={ontouchend_window}
	on:touchleave={ontouchleave_window}
	on:touchcancel={ontouchcancel_window}
	on:mousedown={onmousedown_window}
	on:mousemove={onmousemove_window}
	on:mouseup={onmouseup_window}
></svelte:window>

<div
	bind:this={Carousel_node}
	class="Carousel {$$props.class||''}"
	class:loading
	class:updating
	class:is_touchstart
>
	<div class="prev button" on:click={prev}>
		<slot name="prev"></slot>
	</div>
	<div class="next button" on:click={next}>
		<slot name="next"></slot>
	</div>
	<div bind:this={items_node} class="items" style="{items_style}">
		<slot></slot>
	</div>
</div>

<style>
.Carousel {
	width: 100%;
	height: 100%;
	position: absolute;
}
.Carousel.loading > .items {
	visibility: hidden;
}
.Carousel.is_touchstart .button {
	cursor: auto;
}
.Carousel.is_touchstart > .items {
	cursor: grabbing;
}
.Carousel > .items {
	width: 100%;
	height: 100%;
	overflow: visible;
	display: flex;
	flex-direction: row;
}
:global(.Carousel .button) {
	display: block;
	position: absolute;
	top: calc(50% - 2.5rem);
	width: 5rem;
	height: 5rem;
	opacity: 0.4;
}
@media (max-width: 768px) {
	:global(.Carousel .button) {
		height: 3rem;
		width: 3rem;
	}
}
:global(.Carousel .button:hover) {
	opacity: 0.8;
}
:global(.Carousel .button.prev) {
	left: 0;
	z-index: 2;
}
:global(.Carousel .button.next) {
	right: 0;
	z-index: 2;
}
:global(.Carousel svg) {
	width: 100%;
	height: 100%;
}
</style>
