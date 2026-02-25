<script lang="ts">
import { defineComponent } from 'vue';
import { ZHTMLRenderTarget } from 'zhtml';

export default defineComponent({
	name: 'ZHTMLRenderViewStereo',
	props: {
		left_render_target: {
			type: Object as () => ZHTMLRenderTarget,
			required: true,
		},
		right_render_target: {
			type: Object as () => ZHTMLRenderTarget,
			required: true,
		},
		gl_container_name: {
			type: String,
			default: 'gl_container_name',
		},
	},
	setup() {
		return {};
	},
});
</script>

<template>
	<div class="absolute left-0 top-0 right-0 bottom-0">
		<div
			:data-render-target-uuid="left_render_target.uuid"
			data-render-target-type="scene"
			class="absolute left-0 top-0 w-1/2 h-full"
		>
			<div
				:data-render-target-uuid="left_render_target.uuid"
				data-render-target-type="camera"
			>
				<slot name="content" />
			</div>
		</div>
		<div
			:data-render-target-uuid="right_render_target.uuid"
			data-render-target-type="scene"
			class="absolute right-0 top-0 w-1/2 h-full"
		>
			<div
				:data-render-target-uuid="right_render_target.uuid"
				data-render-target-type="camera"
			>
				<slot name="content" />
			</div>
		</div>

		<div
			:name="gl_container_name"
			class="absolute left-0 top-0 w-full h-full pointer-events-none"
		/>
	</div>
</template>
