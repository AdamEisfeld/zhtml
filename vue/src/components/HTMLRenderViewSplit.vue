<script lang="ts">
import { defineComponent } from 'vue';
import { ZHTMLRenderTarget } from 'zhtml';

export default defineComponent({
  name: 'HTMLRenderViewSplit',
  props: {
    render_target: {
      type: ZHTMLRenderTarget,
      default: null,
    },
    left_render_target: {
      type: ZHTMLRenderTarget,
      default: null,
    },
    right_render_target: {
      type: ZHTMLRenderTarget,
      default: null,
    },
    gl_container_name: {
      type: String,
      default: 'gl_container_name',
    },
    is_split_enabled: {
      type: Boolean,
      default: true,
    },
  },
  setup() {
    return {};
  },
});
</script>

<template>
  <div class="absolute left-0 top-0 right-0 bottom-0">
    <template v-if="is_split_enabled && left_render_target && right_render_target">
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
    </template>
    <template v-else-if="render_target">
      <div
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
    </template>

    <div
      :name="gl_container_name"
      class="absolute left-0 top-0 w-full h-full pointer-events-none"
    />
  </div>
</template>
