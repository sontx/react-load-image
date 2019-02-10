import * as React from "react";
import classNames from "classnames";

export type Status = "pending" | "loading" | "loaded" | "failed";

export interface ImageLoaderProps  {
	src: string;
	srcSet?: string;
	/**
	 * Render children without a wrapper.
	 */
	pure?: boolean;
	wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
	className?: string;
	style?: React.CSSProperties;
	/**
	 * There are three children tags follow these order:
	 * 1. the image is loaded successfully and will be rendered here (usually an img tag).
	 * 2. the image is loading failed, this child tag will be shown.
	 * 3. the image is still loading or pending, this child tag will be shown.
	 */
	children?: React.ReactNode;
	onLoad?(event: React.SyntheticEvent<HTMLDivElement, Event>): void;
	onError?(event: React.SyntheticEvent<HTMLDivElement, Event>): void;
}

interface ImageLoaderState {
	status: Status;
}

export default class ImageLoader extends React.Component<ImageLoaderProps, ImageLoaderState> {
	private img: HTMLImageElement;

	constructor(props: ImageLoaderProps) {
		super(props);
		this.state = {status: props.src ? "loading" : "pending"};
		if (React.Children.count(props.children) !== 3)
			throw new Error("wrong # of children provided to ImageLoader");

		this.handleLoad = this.handleLoad.bind(this);
		this.handleError = this.handleError.bind(this);
	}

	private createLoader(): void {
		this.destroyLoader();  // We can only have one loader at a time.

		const img = new Image();
		img.onload = this.handleLoad;
		img.onerror = this.handleError;
		img.src = this.props.src;

		// if srcSet is not passed in then use src for srcset
		// Setting srcset to a non-string is a bad idea. E.g. img.srcset = undefined actually sets srcset to the string "undefined", causing a load failure)
		img.srcset = this.props.srcSet || this.props.src;
		this.img = img;
	}

	private destroyLoader(): void {
		if (this.img) {
			this.img.onload = null;
			this.img.onerror = null;
			this.img = null;
		}
	}

	private handleLoad(event): void {
		this.destroyLoader();
		this.setState({status: "loaded"});

		if (this.props.onLoad) this.props.onLoad(event);
	}

	private handleError(error): void {
		this.destroyLoader();
		this.setState({status: "failed"});

		if (this.props.onError) this.props.onError(error);
	}

	componentDidMount(): void {
		if (this.state.status === "loading") {
			this.createLoader();
		}
	}

	componentWillReceiveProps(nextProps): void {
		if (this.props.src !== nextProps.src) {
			this.setState({
				status: nextProps.src ? "loading" : "pending",
			});
		}
	}

	componentDidUpdate(): void {
		if (this.state.status === "loading" && !this.img) {
			this.createLoader();
		}
	}

	componentWillUnmount(): void {
		this.destroyLoader();
	}

	render(): React.ReactNode {
		const {src, srcSet, children, pure, className, style, wrapperProps} = this.props;
		const {status} = this.state;
		const childrenArray = React.Children.toArray(children);

		const extraClassName = classNames(`imageloader imageloader-${status}`, className);
		const extraProps = pure ? {style, className: extraClassName, ...wrapperProps} : {};
		const content = (
			<>
				{status === "loaded" && React.cloneElement(childrenArray[0] as React.ReactElement<any>, {src, srcSet, ...extraProps})}
				{status === "failed" && React.cloneElement(childrenArray[1] as React.ReactElement<any>, extraProps)}
				{(status === "loading" || status === "pending") && React.cloneElement(childrenArray[2] as React.ReactElement<any>, extraProps)}
			</>
		);

		return pure ? content : (
			<div {...wrapperProps} className={extraClassName} style={style}>
				{content}
			</div>
		);
	}
}
