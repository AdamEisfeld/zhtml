<script lang="ts">
import { defineComponent } from 'vue';
import { ZHTMLRenderTarget } from 'zhtml';

export default defineComponent({
	name: 'ZHTMLRenderViewStereo',
	props: {
		leftRenderTarget: {
			type: Object as () => ZHTMLRenderTarget,
			required: true,
		},
		rightRenderTarget: {
			type: Object as () => ZHTMLRenderTarget,
			required: true,
		},
		glContainerName: {
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
			:data-render-target-uuid="leftRenderTarget.uuid"
			data-render-target-type="scene"
			class="absolute left-0 top-0 w-1/2 h-full"
		>
			<div
				:data-render-target-uuid="leftRenderTarget.uuid"
				data-render-target-type="camera"
			>
				<slot name="content" />
			</div>
		</div>
		<div
			:data-render-target-uuid="rightRenderTarget.uuid"
			data-render-target-type="scene"
			class="absolute right-0 top-0 w-1/2 h-full"
		>
			<div
				:data-render-target-uuid="rightRenderTarget.uuid"
				data-render-target-type="camera"
			>
				<slot name="content" />
			</div>
		</div>

		<div
			:name="glContainerName"
			class="absolute left-0 top-0 w-full h-full pointer-events-none"
		/>
	</div>
</template>
