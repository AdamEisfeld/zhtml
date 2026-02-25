<script lang="ts">
import { defineComponent } from 'vue';
import { ZHTMLRenderTarget } from 'zhtml';

export default defineComponent({
	name: 'ZHTMLRenderViewPersp',
	props: {
		renderTarget: {
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
			v-if="renderTarget"
			:data-render-target-uuid="renderTarget.uuid"
			data-render-target-type="scene"
			class="absolute left-0 top-0 w-full h-full"
		>
			<div
				:data-render-target-uuid="renderTarget.uuid"
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
