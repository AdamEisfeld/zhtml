import { ReactNode } from 'react';
import type { ZHTMLRenderTarget } from 'zhtml';

interface ZHTMLRenderViewPerspProps {
	renderTarget: ZHTMLRenderTarget;
	glContainerName?: string;
	className?: string;
	children?: ReactNode;
}

export function ZHTMLRenderViewPersp({
	renderTarget,
	glContainerName = 'gl_container_name',
	className,
	children,
}: ZHTMLRenderViewPerspProps) {
	return (
		<div className={className || 'absolute left-0 top-0 right-0 bottom-0'}>
			<div
				data-render-target-uuid={renderTarget.uuid}
				data-render-target-type="scene"
				className="absolute left-0 top-0 w-full h-full"
			>
				<div
					data-render-target-uuid={renderTarget.uuid}
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
