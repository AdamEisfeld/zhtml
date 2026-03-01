import { ReactNode } from 'react';
import type { ZHTMLRenderTarget } from 'zhtml';

interface ZHTMLRenderViewStereoProps {
	leftRenderTarget: ZHTMLRenderTarget;
	rightRenderTarget: ZHTMLRenderTarget;
	glContainerName?: string;
	className?: string;
	children?: ReactNode;
}

export function ZHTMLRenderViewStereo({
	leftRenderTarget,
	rightRenderTarget,
	glContainerName = 'gl_container_name',
	className,
	children,
}: ZHTMLRenderViewStereoProps) {
	return (
		<div className={className || 'absolute left-0 top-0 right-0 bottom-0'}>
			<div
				data-render-target-uuid={leftRenderTarget.uuid}
				data-render-target-type="scene"
				className="absolute left-0 top-0 w-1/2 h-full"
			>
				<div
					data-render-target-uuid={leftRenderTarget.uuid}
					data-render-target-type="camera"
					className="pointer-events-none user-select-none"
				>
					{children}
				</div>
			</div>
			<div
				data-render-target-uuid={rightRenderTarget.uuid}
				data-render-target-type="scene"
				className="absolute right-0 top-0 w-1/2 h-full"
			>
				<div
					data-render-target-uuid={rightRenderTarget.uuid}
					data-render-target-type="camera"
					className="pointer-events-none user-select-none"
				>
					{children}
				</div>
			</div>

			<div
				// @ts-expect-error name is valid for querySelector
				name={glContainerName}
				className="absolute left-0 top-0 w-full h-full pointer-events-none"
			/>
		</div>
	);
}
