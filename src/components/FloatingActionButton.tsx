const FloatingActionButton = ({
	disabled,
	onClick,
	className,
	children
} : {
	disabled: boolean | undefined;
	onClick: () => void;
	className: string;
	children: React.ReactNode;
}) => 
	<button
		className={className}
		disabled={disabled}
		onClick={() => onClick()}
		style={{
			position: 'fixed',
			right: '1em',
			bottom: '1em',
			borderRadius: '50%',
			width: '4em',
			height: '4em'
		}}
	>
		{children}
	</button>;

export default FloatingActionButton;