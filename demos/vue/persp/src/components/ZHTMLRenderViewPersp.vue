<script lang="ts">
import { defineComponent } from 'vue';
import { ZHTMLRenderTarget } from 'zhtml';

export default defineComponent({
	name: 'ZHTMLRenderViewPersp',
	props: {
		render_target: {
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
			v-if="render_target"
			:data-render-target-uuid="render_target.uuid"
			data-render-target-type="scene"
			class="absolute left-0 top-0 w-full h-full"
		>
			<div
				:data-render-target-uuid="render_target.uuid"
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
