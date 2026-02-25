import { ReactNode } from 'react';
import type { ZHTMLRenderTarget } from 'zhtml';

interface ZHTMLRenderViewOrthoProps {
	renderTarget: ZHTMLRenderTarget;
	glContainerName?: string;
	className?: string;
	children?: ReactNode;
}

export function ZHTMLRenderViewOrtho({
	renderTarget,
	glContainerName = 'gl_container_name',
	className,
	children,
}: ZHTMLRenderViewOrthoProps) {
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
