<script>
import { onMount, onDestroy } from 'svelte'
import { assign } from '@ctx-core/object'
import { _style } from '@ctx-core/html'
export let loading = true
export let index = 0
export let interval_period = 10000
export let transition_duration = 500
export let translateX = 0
export let is_touchstart = false
export let mousedown_clientX = null
export let mousemove_clientX = null
export let updating = null
let Carousel_node, background_image_interval, items_node
let Carousel_node_width//region
$: Carousel_node_width =
	Carousel_node && parseFloat(getComputedStyle(Carousel_node).width)//endregion
let items_node_height//region
$: items_node_height = items_node && parseFloat(getComputedStyle(items_node).height)//endregion
$: Carousel_node_width && items_node_height && resize_items()
let items_style//region
$: items_style =
	_style({
		width: `${Carousel_node_width * _items_length()}px`,
		transition: updating ? `${transition_duration}ms ease-out` : 0,
		transform: translateX ? `translate(${translateX}px)` : '',
	})//endregion
onMount(() => {
	loading = true
	setTimeout(() => {
		setInterval_background_image()
		resize_items()
		loading = false
	})
})
onDestroy(clearInterval_background_image)
/*
	Using reactive blocks results in a glitch
		when transitioning from first to _last & _last to first slides.
	Factory Functions fix the overflow glitch.
*/
function _items_length() {
	return items_node && items_node.children.length
}
function _last_index() {
	return _items_length() - 1
}
function _previous_index() {
	return index ? index - 1 : _last_index()
}
function _next_idx() {
	return (index < _last_index()) ? index + 1 : 0
}
function resize_items() {
	for (let i = 0; i < _items_length(); i++) {
		const px__left = _left_px(i)
		const item = items_node.children[i]
		const style = {
			position: 'absolute',
			top: 0,
			left: `${px__left}px`,
			height: `${items_node_height}px`,
			width: `${Carousel_node_width}px`,
			'z-index': 1,
		}
		assign(item.style, style)
	}
}
function next() {
	setTimeout(() => {
		const index__transition = (index + 1) % _items_length()
		set_index(index__transition)
	})
}
function prev() {
	setTimeout(() => {
		const length__items = _items_length()
		const index__transition = (length__items + index - 1) % length__items
		set_index(index__transition)
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
	background_image_interval = setInterval(
		() => {
			next(items_node)
		},
		interval_period)
}
function set_index(index__transition) {
	clearInterval_background_image()
	updating = true
	setTimeout(() => {
		translateX = -1 * _left_px(index__transition)
		setTimeout(() => {
			if (!updating) {
				return
			}
			updating = false
			setTimeout(() => {
				index = index__transition
				resize_items()
				translateX = 0
				setInterval_background_image()
			}, 0)
		}, transition_duration)
	}, 100)
}
function onresize_window(event) {
	Carousel_node = Carousel_node
	items_node = items_node
}
function onmousedown_window(event) {
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
function onmousemove_window(event) {
	if (!is_touchstart) return
	const { clientX } = event
	translateX = clientX - mousedown_clientX
	mousemove_clientX = clientX
}
function ontouchstart_window(event) {
	onmousedown_window(event.changedTouches[0])
}
function ontouchmove_window(event) {
	onmousemove_window(event.changedTouches[0])
}
function ontouchend_window(event) {
	onmouseup_window(event.changedTouches[0], items_node)
}
function ontouchleave_window(event) {
	onmouseup_window(event.changedTouches[0], items_node)
}
function ontouchcancel_window(event) {
	onmouseup_window(event.changedTouches[0], items_node)
}
function onmouseup_window(event) {
	if (!is_touchstart) return
	const { clientX } = event
	const clientX__diff = clientX - mousedown_clientX
	is_touchstart = false
	mousedown_clientX = null
	mousemove_clientX = null
	if (clientX__diff > 0) {
		translateX = clientX__diff
		prev()
	} else if (clientX__diff < 0) {
		translateX = clientX__diff
		next()
	} else {
		translateX = 0
	}
}
function _left_px(i) {
	return (
		i == index
		? 0
		: i == _previous_index()
			? -Carousel_node_width
			: i == _next_idx()
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
	class:loading="{loading}"
	class:updating="{updating}"
	class:is_touchstart="{is_touchstart}"
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
